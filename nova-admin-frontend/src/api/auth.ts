import { request, setToken } from '@/utils/request';
import type { R, CaptchaResult, LoginResult, UserInfo, MenuInfo } from '@/types/api';

/** 获取图形验证码 */
export const getCaptcha = () => request<R<CaptchaResult>>({ url: '/auth/captcha', method: 'GET' });

/** 登录 */
export async function login(payload: {
  username: string;
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
  }
  return res;
}

/** 注销 */
export const logout = () => request<R<void>>({ url: '/auth/logout', method: 'POST' });

/** 获取当前用户信息 */
export const getUserInfo = () => request<R<UserInfo>>({ url: '/system/user/me', method: 'GET' });

/** 获取当前用户菜单 */
export const getUserMenus = () => request<R<MenuInfo[]>>({ url: '/system/menu/routers', method: 'GET' });

/** 健康检查 */
export const ping = () => request<R<{ app: string; version: string; ts: string }>>({
  url: '/public/ping',
  method: 'GET',
});
