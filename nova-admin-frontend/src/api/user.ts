import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface UserRecord {
  id: string;
  account: string;
  nickname?: string;
  realName?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender?: number;
  deptId?: string;
  deptName?: string;
  superAdmin?: number;
  status?: number;
  lastLoginTime?: string;
  lastLoginIp?: string;
  createTime?: string;
  roleIds?: string[];
}

export interface UserCreateRequest {
  password: string;
  nickname?: string;
  realName?: string;
  email?: string;
  phone?: string;
  gender?: number;
  deptId?: string;
  status: number;
  roleIds?: string[];
}

export interface UserUpdateRequest extends Partial<Omit<UserCreateRequest, 'password'>> {
  id: string;
  password?: string;
}

export interface UserPageParams {
  current?: number;
  size?: number;
  account?: string;
  nickname?: string;
  phone?: string;
  status?: number;
  deptId?: string;
}

export interface UserImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export const getUserPage = (params: UserPageParams) =>
  request<R<PageResult<UserRecord>>>({ url: '/system/user/page', method: 'GET', params });

export const createUser = (data: UserCreateRequest) =>
  request<R<string>>({ url: '/system/user', method: 'POST', data });

export const updateUser = (data: UserUpdateRequest) =>
  request<R<void>>({ url: '/system/user', method: 'PUT', data });

export const deleteUser = (id: string) =>
  request<R<void>>({ url: `/system/user/${id}`, method: 'DELETE' });

export const resetPassword = (id: string, password: string) =>
  request<R<void>>({ url: `/system/user/${id}/reset-password`, method: 'PUT', data: { password } });

export const updateUserStatus = (id: string, status: number) =>
  request<R<void>>({ url: `/system/user/${id}/status`, method: 'PUT', data: { status } });

export const exportUsers = (params: UserPageParams) =>
  request<Blob>({ url: '/system/user/export', method: 'GET', params, responseType: 'blob' });

export const getUserImportTemplate = () =>
  request<Blob>({ url: '/system/user/import-template', method: 'GET', responseType: 'blob' });

export const importUsers = (file: File) => {
  const data = new FormData();
  data.append('file', file);
  return request<R<UserImportResult>>({ url: '/system/user/import', method: 'POST', data });
};
