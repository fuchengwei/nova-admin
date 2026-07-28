import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAppStore } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import i18n from '@/i18n';
import { message } from '@/utils/message';
import type { R, LoginResult } from '@/types/api';

const TOKEN_KEY = 'nova_access_token';
const REFRESH_KEY = 'nova_refresh_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function showError(content: string): void {
  message.error(content);
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const getApiBaseUrl = () => API_BASE_URL;
export const setToken = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

/** 扩展 axios 配置：标记跳过鉴权刷新 / 标记已刷新重试 */
declare module 'axios' {
  interface AxiosRequestConfig {
    /** 跳过 401 自动刷新（refresh 请求自身使用，避免递归） */
    skipAuthRefresh?: boolean;
    /** 标记请求已通过 refresh 重试，防止 401 死循环 */
    authRefreshed?: boolean;
  }
}

// ===== 可配置项：登录页路径 + 提示文案（值为 i18n key 或纯文本均可） =====
export interface HttpRequestConfig {
  /** 登录页路径 */
  loginPath: string;
  /** 身份认证过期提示（请求未携带 Token 时） */
  authExpiredMessage: string;
  /** 刷新失败提示（携带了 Token 但刷新失败 / 无 Refresh Token 时） */
  refreshFailedMessage: string;
  /** 无权限提示 */
  forbiddenMessage: string;
  /** 服务异常提示 */
  serverErrorMessage: string;
}

const httpConfig: HttpRequestConfig = {
  loginPath: '/login',
  authExpiredMessage: 'request.authExpired',
  refreshFailedMessage: 'request.refreshFailed',
  forbiddenMessage: 'request.forbidden',
  serverErrorMessage: 'request.serverError',
};

/** 配置全局 HTTP 行为（登录路径 / 提示文案等），可在应用启动时覆盖默认值 */
export function configureHttp(partial: Partial<HttpRequestConfig>): void {
  Object.assign(httpConfig, partial);
}

/** 读取文案：值为 i18n key 时翻译，否则原样返回 */
function resolveText(value: string): string {
  return i18n.exists(value) ? i18n.t(value) : value;
}

const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

service.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locale = useAppStore.getState().locale;
  config.headers['Accept-Language'] = locale;
  return config;
});

// ===== 401 无感刷新：并发请求只刷新一次，其余排队等待重试 =====
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** 刷新完成后，唤醒所有排队等待的请求 */
function flushPendingQueue(token: string | null, error: unknown | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  pendingQueue = [];
}

/** 判断响应是否为鉴权失败：code === 401 且 success === false */
function isAuthError(body: R<unknown> | undefined): boolean {
  if (!body) return false;
  const failed = body.success === false || (body.success === undefined && body.code !== 0);
  return body.code === 401 && failed;
}

/** 判断原始请求是否携带了 Token（优先检查请求头，回退到本地存储） */
function requestHadToken(config: AxiosRequestConfig | undefined): boolean {
  const headers = config?.headers;
  if (headers instanceof AxiosHeaders) {
    if (headers.get('Authorization')) return true;
  } else if (headers && typeof headers === 'object') {
    if ((headers as Record<string, unknown>).Authorization) return true;
  }
  return !!getToken();
}

/** 强制登出：清除本地凭证 + 提示 + 跳转登录页（时间窗内防重入，避免并发重复提示） */
let lastForceLogoutAt = 0;
const FORCE_LOGOUT_INTERVAL = 2000;
function forceLogout(reason: 'noToken' | 'refreshFailed'): void {
  const now = Date.now();
  if (now - lastForceLogoutAt < FORCE_LOGOUT_INTERVAL) return;
  lastForceLogoutAt = now;

  const text =
    reason === 'noToken' ? httpConfig.authExpiredMessage : httpConfig.refreshFailedMessage;
  showError(resolveText(text));

  clearTokens();
  useUserStore.getState().reset();

  const { loginPath } = httpConfig;
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  if (!window.location.pathname.startsWith(loginPath)) {
    window.location.href = `${loginPath}?redirect=${redirect}`;
  }
}

/** 使用 Refresh Token 刷新凭证（标记 skipAuthRefresh 避免递归） */
function doRefresh(refreshTokenValue: string): Promise<string> {
  return service
    .request<unknown, R<LoginResult>>({
      url: '/auth/refresh',
      method: 'POST',
      data: { refreshToken: refreshTokenValue },
      skipAuthRefresh: true,
    })
    .then((res) => {
      if (res.code === 0 && res.data?.accessToken) {
        setToken(res.data.accessToken, res.data.refreshToken);
        return res.data.accessToken;
      }
      throw new Error('Refresh token response invalid');
    });
}

/** 重试原始请求（请求拦截器会自动带上新 Token；标记 authRefreshed 防止死循环） */
function retryRequest(config: AxiosRequestConfig): Promise<unknown> {
  return service.request({ ...config, authRefreshed: true });
}

/**
 * 处理 401 鉴权失败：
 * 1. 请求未携带 Token → 直接降级（提示认证过期 + 跳转登录页）
 * 2. 携带了 Token 且有 Refresh Token → 无感刷新，成功后重试原请求
 * 3. 携带了 Token 但无 Refresh Token / 刷新失败 → 降级（提示失效 + 跳转登录页）
 * 多个请求同时 401 时，仅发起一次刷新，其余排队等待重试。
 */
function handleUnauthorized(config: AxiosRequestConfig | undefined): Promise<unknown> {
  if (!config) {
    forceLogout('noToken');
    return Promise.reject(new Error('Request config missing'));
  }

  const hadToken = requestHadToken(config);
  const refreshTokenValue = getRefreshToken();

  // 请求未携带 Token：直接降级
  if (!hadToken) {
    forceLogout('noToken');
    return Promise.reject(new Error('Authentication required'));
  }

  // 携带了 Token 但无可用 Refresh Token：降级
  if (!refreshTokenValue) {
    forceLogout('refreshFailed');
    return Promise.reject(new Error('No refresh token available'));
  }

  // 已有刷新进行中：排队等待，刷新成功后重试
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    }).then(() => retryRequest(config));
  }

  // 发起刷新
  isRefreshing = true;
  return doRefresh(refreshTokenValue)
    .then((newToken) => {
      isRefreshing = false;
      flushPendingQueue(newToken, null);
      return retryRequest(config);
    })
    .catch((err: unknown) => {
      isRefreshing = false;
      flushPendingQueue(null, err);
      forceLogout('refreshFailed');
      return Promise.reject(err);
    });
}

service.interceptors.response.use(
  (response) => {
    const body = response.data as R<unknown>;
    const config = response.config;

    // 业务层 401（HTTP 200 但 code === 401 且 success === false）
    if (isAuthError(body)) {
      if (!config.skipAuthRefresh && !config.authRefreshed) {
        return handleUnauthorized(config);
      }
      // 已刷新过仍返回 401 或为 refresh 请求自身：直接降级
      forceLogout('refreshFailed');
      return Promise.reject(new Error('Authentication failed after refresh'));
    }
    return response.data;
  },
  (error) => {
    const config = error?.config as AxiosRequestConfig | undefined;
    const status = error?.response?.status;
    const body = error?.response?.data as R<unknown> | undefined;
    const code = body?.code;
    const msg = body?.msg || error?.message;

    // 鉴权失败（HTTP 401 或业务 code 401）
    if (status === 401 || isAuthError(body)) {
      if (!config?.skipAuthRefresh && !config?.authRefreshed) {
        return handleUnauthorized(config);
      }
      forceLogout('refreshFailed');
      return Promise.reject(error);
    }

    if (status === 403 || code === 403) {
      showError(resolveText(httpConfig.forbiddenMessage));
    } else if (code && code !== 0) {
      showError(msg);
    } else if (status >= 500) {
      showError(resolveText(httpConfig.serverErrorMessage));
    }
    return Promise.reject(error);
  },
);

export const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  service.request<unknown, T>(config);

export default service;
