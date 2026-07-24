import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface OperationLogRecord {
  id: number;
  module?: string;
  action?: string;
  description?: string;
  requestMethod?: string;
  requestUrl?: string;
  javaMethod?: string;
  userId?: number;
  account?: string;
  ip?: string;
  costMs?: number;
  status?: number;
  errorMsg?: string;
  createTime?: string;
}

export interface LoginLogRecord {
  id: number;
  account?: string;
  ip?: string;
  os?: string;
  browser?: string;
  status?: number;
  msg?: string;
  loginTime?: string;
}

export const getOperationLogPage = (params: any) =>
  request<R<PageResult<OperationLogRecord>>>({
    url: '/system/operation-log/page',
    method: 'GET',
    params,
  });

export const cleanOperationLog = () =>
  request<R<void>>({ url: '/system/operation-log/clean', method: 'DELETE' });

export const getLoginLogPage = (params: any) =>
  request<R<PageResult<LoginLogRecord>>>({ url: '/system/login-log/page', method: 'GET', params });

export const cleanLoginLog = () =>
  request<R<void>>({ url: '/system/login-log/clean', method: 'DELETE' });
