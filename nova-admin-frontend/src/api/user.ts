import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface UserRecord {
  id: number;
  username: string;
  nickname?: string;
  realName?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender?: number;
  deptId?: number;
  deptName?: string;
  superAdmin?: number;
  status?: number;
  lastLoginTime?: string;
  lastLoginIp?: string;
  createTime?: string;
  roleIds?: number[];
}

export interface UserCreateRequest {
  username: string;
  password: string;
  nickname?: string;
  realName?: string;
  email?: string;
  phone?: string;
  gender?: number;
  deptId?: number;
  status: number;
  roleIds?: number[];
}

export interface UserUpdateRequest extends Partial<Omit<UserCreateRequest, 'password'>> {
  id: number;
  password?: string;
}

export interface UserPageParams {
  current?: number;
  size?: number;
  username?: string;
  nickname?: string;
  phone?: string;
  status?: number;
  deptId?: number;
}

export const getUserPage = (params: UserPageParams) =>
  request<R<PageResult<UserRecord>>>({ url: '/system/user/page', method: 'GET', params });

export const createUser = (data: UserCreateRequest) =>
  request<R<void>>({ url: '/system/user', method: 'POST', data });

export const updateUser = (data: UserUpdateRequest) =>
  request<R<void>>({ url: '/system/user', method: 'PUT', data });

export const deleteUser = (id: number) =>
  request<R<void>>({ url: `/system/user/${id}`, method: 'DELETE' });

export const resetPassword = (id: number, password: string) =>
  request<R<void>>({ url: `/system/user/${id}/reset-password`, method: 'PUT', data: { password } });

export const updateUserStatus = (id: number, status: number) =>
  request<R<void>>({ url: `/system/user/${id}/status`, method: 'PUT', data: { status } });
