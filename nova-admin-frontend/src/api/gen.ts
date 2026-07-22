import request from '@/utils/request';
import type { R } from '@/types/common';

export interface GenTable {
  tableName: string;
  tableComment?: string;
}

export function listGenTables() {
  return request.get<R<GenTable[]>>('/tool/gen/tables');
}

export function previewGen(tableName: string) {
  return request.get<R<Record<string, string>>>('/tool/gen/preview/' + tableName);
}

export function downloadGen(tableName: string) {
  return request.get('/tool/gen/download/' + tableName, { responseType: 'blob' });
}
