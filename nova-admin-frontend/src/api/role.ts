import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  dataScope: number;
  sort: number;
  status: number;
  createTime?: string;
  menuIds?: string[];
}

export interface RoleCreateRequest {
  name: string;
  code: string;
  description?: string;
  dataScope: number;
  sort?: number;
  status: number;
  menuIds?: string[];
}

export interface RoleUpdateRequest extends RoleCreateRequest {
  id: string;
}

export interface RolePageParams {
  current?: number;
  size?: number;
  name?: string;
  code?: string;
  status?: number;
}

export const getRolePage = (params: RolePageParams) =>
  request<R<PageResult<RoleRecord>>>({ url: '/system/role/page', method: 'GET', params });

export const getAllRoles = () =>
  request<R<RoleRecord[]>>({ url: '/system/role/all', method: 'GET' });

export const getRoleDetail = (id: string) =>
  request<R<RoleRecord>>({ url: `/system/role/${id}`, method: 'GET' });

export const createRole = (data: RoleCreateRequest) =>
  request<R<string>>({ url: '/system/role', method: 'POST', data });

export const updateRole = (data: RoleUpdateRequest) =>
  request<R<void>>({ url: '/system/role', method: 'PUT', data });

export const deleteRole = (id: string) =>
  request<R<void>>({ url: `/system/role/${id}`, method: 'DELETE' });
