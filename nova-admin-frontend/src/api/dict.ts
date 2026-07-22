import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface DictTypeRecord {
  id: number;
  type: string;
  name: string;
  description?: string;
  status: number;
  createTime?: string;
}

export interface DictDataRecord {
  id: number;
  typeId: number;
  label: string;
  value: string;
  cssClass?: string;
  sort: number;
  status: number;
  defaultFlag: number;
  createTime?: string;
}

export interface DictTypeCreateRequest {
  type: string;
  name: string;
  description?: string;
  status: number;
}

export interface DictTypeUpdateRequest extends DictTypeCreateRequest {
  id: number;
}

export interface DictDataCreateRequest {
  typeId: number;
  label: string;
  value: string;
  cssClass?: string;
  sort?: number;
  status: number;
  defaultFlag?: number;
}

export interface DictDataUpdateRequest extends DictDataCreateRequest {
  id: number;
}

export const getDictTypePage = (params: any) =>
  request<R<PageResult<DictTypeRecord>>>({ url: '/system/dict-type/page', method: 'GET', params });

export const getDictDataByType = (type: string) =>
  request<R<DictDataRecord[]>>({ url: `/system/dict-type/data/${type}`, method: 'GET' });

export const createDictType = (data: DictTypeCreateRequest) =>
  request<R<void>>({ url: '/system/dict-type', method: 'POST', data });

export const updateDictType = (data: DictTypeUpdateRequest) =>
  request<R<void>>({ url: '/system/dict-type', method: 'PUT', data });

export const deleteDictType = (id: number) =>
  request<R<void>>({ url: `/system/dict-type/${id}`, method: 'DELETE' });

export const getDictDataPage = (params: any) =>
  request<R<PageResult<DictDataRecord>>>({ url: '/system/dict-data/page', method: 'GET', params });

export const createDictData = (data: DictDataCreateRequest) =>
  request<R<void>>({ url: '/system/dict-data', method: 'POST', data });

export const updateDictData = (data: DictDataUpdateRequest) =>
  request<R<void>>({ url: '/system/dict-data', method: 'PUT', data });

export const deleteDictData = (id: number) =>
  request<R<void>>({ url: `/system/dict-data/${id}`, method: 'DELETE' });
