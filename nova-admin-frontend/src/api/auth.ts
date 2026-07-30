import { request, setAuthExpiryFeedbackSuppressed, setToken } from '@/utils/request';
import type { R, CaptchaResult, LoginResult, UserInfo, MenuInfo } from '@/types/api';

export interface UserSession {
  accessJti: string;
  loginIp?: string;
  loginTime?: number;
  userAgent?: string;
  current: boolean;
}

/** 获取图形验证码 */
export const getCaptcha = () => request<R<CaptchaResult>>({ url: '/auth/captcha', method: 'GET' });

/** 登录 */
export async function login(payload: {
  account: string;
  password: string;
  captchaKey?: string;
  captchaCode?: string;
}) {
  const res = await request<R<LoginResult>>({
    url: '/auth/login',
    method: 'POST',
    data: payload,
  });
  if (res.code === 0 && res.data) {
    setToken(res.data.accessToken, res.data.refreshToken);
    setAuthExpiryFeedbackSuppressed(false);
  }
  return res;
}

/** 注销 */
export const logout = () => request<R<void>>({ url: '/auth/logout', method: 'POST' });

/** 刷新 Token */
export const refreshToken = (refreshToken: string) =>
  request<R<LoginResult>>({ url: '/auth/refresh', method: 'POST', data: { refreshToken } });

/** 获取当前用户信息 */
export const getUserInfo = () => request<R<UserInfo>>({ url: '/system/user/me', method: 'GET' });

/** 获取当前用户菜单 */
export const getUserMenus = () =>
  request<R<MenuInfo[]>>({ url: '/system/menu/routers', method: 'GET' });

/** 获取当前用户的登录会话 */
export const getUserSessions = () =>
  request<R<UserSession[]>>({ url: '/auth/sessions', method: 'GET' });

/** 退出指定的其他登录会话 */
export const revokeUserSession = (accessJti: string) =>
  request<R<void>>({ url: `/auth/sessions/${accessJti}`, method: 'DELETE' });

/** 退出当前用户的其他登录会话 */
export const revokeOtherUserSessions = () =>
  request<R<void>>({ url: '/auth/sessions/revoke-others', method: 'POST' });

/** 健康检查 */
export const ping = () =>
  request<R<{ app: string; version: string; ts: string }>>({
    url: '/public/ping',
    method: 'GET',
  });
