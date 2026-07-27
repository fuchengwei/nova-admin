import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface OperationLogRecord {
  id: string;
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
  id: string;
  account?: string;
  ip?: string;
  os?: string;
  browser?: string;
  status?: number;
  msg?: string;
  loginTime?: string;
}

export interface OperationLogPageQuery {
  current?: number;
  size?: number;
  module?: string;
  action?: string;
  account?: string;
  status?: number;
}

export interface LoginLogPageQuery {
  current?: number;
  size?: number;
  account?: string;
  status?: number;
}

export const getOperationLogPage = (params: OperationLogPageQuery) =>
  request<R<PageResult<OperationLogRecord>>>({
    url: '/system/operation-log/page',
    method: 'GET',
    params,
  });

export const cleanOperationLog = () =>
  request<R<void>>({ url: '/system/operation-log/clean', method: 'DELETE' });

export const getLoginLogPage = (params: LoginLogPageQuery) =>
  request<R<PageResult<LoginLogRecord>>>({ url: '/system/login-log/page', method: 'GET', params });

export const cleanLoginLog = () =>
  request<R<void>>({ url: '/system/login-log/clean', method: 'DELETE' });
