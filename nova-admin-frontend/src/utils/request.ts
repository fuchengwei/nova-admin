import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAppStore } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import type { R } from '@/types/api';

const TOKEN_KEY = 'nova_access_token';
const REFRESH_KEY = 'nova_refresh_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    const body: R<unknown> | undefined = error?.response?.data;
    const code = body?.code;
    const msg = body?.msg || error.message;

    if (status === 401 || code === 401) {
      message.error('登录已过期，请重新登录');
      clearTokens();
      useUserStore.getState().reset();
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${redirect}`;
      }
    } else if (status === 403 || code === 403) {
      message.error('没有访问权限');
    } else if (code && code !== 0) {
      message.error(msg);
    } else if (status >= 500) {
      message.error('服务异常，请稍后重试');
    }
    return Promise.reject(error);
  },
);

export const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  service.request<unknown, T>(config);

export default service;
