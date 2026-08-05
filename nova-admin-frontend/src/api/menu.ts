import { request } from '@/utils/request';
import type { R } from '@/types/api';
import type { MenuInfo } from '@/types/api';

export interface ApiPermissionEndpoint {
  method: string;
  path: string;
  summary?: string;
}

export interface ApiPermissionRecord {
  permission: string;
  name: string;
  status: 'REGISTERED' | 'SYNCABLE';
  endpoints: ApiPermissionEndpoint[];
  publicAccess: boolean;
  roleIds: string[];
  userIds: string[];
}

export interface ApiPermissionUserOption {
  id: string;
  label: string;
}

export interface MenuCreateRequest {
  parentId: string;
  name: string;
  type: 'M' | 'C' | 'F';
  perms?: string;
  path?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  sort?: number;
  visible?: number;
  status?: number;
  keepAlive?: number;
  alwaysShow?: number;
}

export interface MenuUpdateRequest extends MenuCreateRequest {
  id: string;
}

export const getMenuTree = () =>
  request<R<MenuInfo[]>>({ url: '/system/menu/tree', method: 'GET' });

export const createMenu = (data: MenuCreateRequest) =>
  request<R<string>>({ url: '/system/menu', method: 'POST', data });

export const updateMenu = (data: MenuUpdateRequest) =>
  request<R<void>>({ url: '/system/menu', method: 'PUT', data });

export const deleteMenu = (id: string) =>
  request<R<void>>({ url: `/system/menu/${id}`, method: 'DELETE' });

export const getApiPermissions = () =>
  request<R<ApiPermissionRecord[]>>({ url: '/system/menu/api-permissions', method: 'GET' });

export const syncApiPermissions = (permissions: string[] = []) =>
  request<R<number>>({
    url: '/system/menu/api-permissions/sync',
    method: 'POST',
    data: { permissions },
  });

export const getApiPermissionUsers = () =>
  request<R<ApiPermissionUserOption[]>>({
    url: '/system/menu/api-permissions/users',
    method: 'GET',
  });

export const updateApiPermissionAccess = (data: {
  permission: string;
  publicAccess: boolean;
  roleIds: string[];
  userIds: string[];
}) => request<R<void>>({ url: '/system/menu/api-permissions/access', method: 'PUT', data });
