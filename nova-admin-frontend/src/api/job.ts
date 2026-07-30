import { request } from '@/utils/request';
import type { R, PageResult } from '@/types/api';

export interface SysJob {
  id?: string;
  jobName: string;
  jobGroup?: string;
  invokeTarget: string;
  cronExpression: string;
  status?: number;
  misfirePolicy?: string;
  concurrent?: number;
  remark?: string;
  createTime?: string;
}

export interface JobPageQuery {
  current?: number;
  size?: number;
  jobName?: string;
  status?: number;
  jobGroup?: string;
}

export function getJobPage(params: JobPageQuery) {
  return request<R<PageResult<SysJob>>>({ url: '/monitor/job/page', method: 'GET', params });
}

export function getJob(id: string) {
  return request<R<SysJob>>({ url: `/monitor/job/${id}`, method: 'GET' });
}

export function createJob(data: SysJob) {
  return request<R<string>>({ url: '/monitor/job', method: 'POST', data });
}

export function updateJob(data: SysJob) {
  return request<R<void>>({ url: '/monitor/job', method: 'PUT', data });
}

export function deleteJob(id: string) {
  return request<R<void>>({ url: `/monitor/job/${id}`, method: 'DELETE' });
}

export function pauseJob(id: string) {
  return request<R<void>>({ url: `/monitor/job/pause/${id}`, method: 'PUT' });
}

export function resumeJob(id: string) {
  return request<R<void>>({ url: `/monitor/job/resume/${id}`, method: 'PUT' });
}

export function runJob(id: string) {
  return request<R<void>>({ url: `/monitor/job/run/${id}`, method: 'PUT' });
}
