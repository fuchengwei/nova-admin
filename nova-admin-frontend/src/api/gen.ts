import { request } from '@/utils/request';
import type { R } from '@/types/api';

export interface GenTable {
  tableName: string;
  tableComment?: string;
}

export function listGenTables() {
  return request<R<GenTable[]>>({ url: '/tool/gen/tables', method: 'GET' });
}

export function previewGen(tableName: string) {
  return request<R<Record<string, string>>>({ url: '/tool/gen/preview/' + tableName, method: 'GET' });
}

export function downloadGen(tableName: string) {
  return request({ url: '/tool/gen/download/' + tableName, method: 'GET', responseType: 'blob' });
}
