import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface FileRecord {
  id: string;
  name: string;
  originalName?: string;
  url: string;
  size?: number;
  contentType?: string;
  storageType?: string;
  bucket?: string;
  objectKey?: string;
  uploaderId?: string;
  createTime?: string;
}

export const getFilePage = (params: any) =>
  request<R<PageResult<FileRecord>>>({ url: '/infra/file/page', method: 'GET', params });

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request<R<FileRecord>>({ url: '/infra/file/upload', method: 'POST', data: formData });
};

export const deleteFile = (id: string) =>
  request<R<void>>({ url: `/infra/file/${id}`, method: 'DELETE' });
