/** 后端统一响应 */
export interface R<T> {
  code: number;
  msg: string;
  data: T;
  ts: number;
}

/** 分页响应 */
export interface PageResult<T> {
  total: number;
  current: number;
  size: number;
  pages: number;
  records: T[];
}

/** 登录响应 */
export interface LoginResult {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  deptId?: number;
  deptName?: string;
  roles: string[];
  permissions: string[];
}

export interface MenuInfo {
  id: number;
  parentId: number;
  name: string;
  type: 'M' | 'C' | 'F';
  perms?: string;
  path?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  sort: number;
  visible: number;
  status: number;
  keepAlive?: number;
  alwaysShow?: number;
  children?: MenuInfo[];
}

export interface CaptchaResult {
  captchaKey: string;
  captchaImage: string;
  expireSeconds: number;
}
