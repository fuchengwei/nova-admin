import { request } from '@/utils/request';
import type { R } from '@/types/api';

export interface DeptTreeNode {
  id: number;
  parentId: number;
  name: string;
  code?: string;
  leader?: string;
  phone?: string;
  email?: string;
  sort: number;
  status: number;
  createTime?: string;
  children?: DeptTreeNode[];
}

export interface DeptCreateRequest {
  parentId: number;
  name: string;
  code?: string;
  leader?: string;
  phone?: string;
  email?: string;
  sort?: number;
  status?: number;
}

export interface DeptUpdateRequest extends DeptCreateRequest {
  id: number;
}

/** 获取部门树 */
export const getDeptTree = () =>
  request<R<DeptTreeNode[]>>({ url: '/system/dept/tree', method: 'GET' });

/** 获取排除某节点的部门树 */
export const getDeptTreeExclude = (id: number) =>
  request<R<DeptTreeNode[]>>({ url: `/system/dept/tree/exclude/${id}`, method: 'GET' });

/** 创建部门 */
export const createDept = (data: DeptCreateRequest) =>
  request<R<void>>({ url: '/system/dept', method: 'POST', data });

/** 更新部门 */
export const updateDept = (data: DeptUpdateRequest) =>
  request<R<void>>({ url: '/system/dept', method: 'PUT', data });

/** 删除部门 */
export const deleteDept = (id: number) =>
  request<R<void>>({ url: `/system/dept/${id}`, method: 'DELETE' });
