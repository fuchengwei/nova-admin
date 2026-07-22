import { request } from '@/utils/request';
import type { R } from '@/types/api';
import type { MenuInfo } from '@/types/api';

export interface MenuCreateRequest {
  parentId: number;
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
  id: number;
}

export const getMenuTree = () =>
  request<R<MenuInfo[]>>({ url: '/system/menu/tree', method: 'GET' });

export const createMenu = (data: MenuCreateRequest) =>
  request<R<void>>({ url: '/system/menu', method: 'POST', data });

export const updateMenu = (data: MenuUpdateRequest) =>
  request<R<void>>({ url: '/system/menu', method: 'PUT', data });

export const deleteMenu = (id: number) =>
  request<R<void>>({ url: `/system/menu/${id}`, method: 'DELETE' });
