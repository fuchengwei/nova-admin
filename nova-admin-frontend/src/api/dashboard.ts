import { request } from '@/utils/request';
import type { R } from '@/types/api';

export type DashboardRange = '7d' | '30d';

export interface DashboardSection<T> {
  available: boolean;
  data: T;
}

export interface DashboardStats {
  userCount: number;
  roleCount: number;
  deptCount: number;
  fileCount: number;
  jobCount: number;
}

export interface DashboardTrendPoint {
  date: string;
  loginCount: number;
  operationCount: number;
}

export interface DashboardRuntime {
  appName: string;
  version: string;
  online: boolean;
  onlineUserCount: number;
  cpuUsage?: number;
  memoryUsage?: number;
  jvmUsage?: number;
}

export interface DashboardActivity {
  type: 'LOGIN' | 'OPERATION';
  account?: string;
  summary?: string;
  occurredAt?: string;
  status?: number;
}

export interface DashboardOverview {
  stats: DashboardSection<DashboardStats>;
  trend: DashboardSection<DashboardTrendPoint[]>;
  runtime: DashboardSection<DashboardRuntime>;
  activities: DashboardSection<DashboardActivity[]>;
  updatedAt: string;
}

export const getDashboardOverview = (range: DashboardRange) =>
  request<R<DashboardOverview>>({ url: '/dashboard/overview', method: 'GET', params: { range } });
