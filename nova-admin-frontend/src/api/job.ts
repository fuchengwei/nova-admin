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

export const JOB_LOG_STATUS = {
  FAILED: 0,
  SUCCESS: 1,
  SKIPPED: 2,
} as const;

export const JOB_TRIGGER_TYPE = {
  CRON: 'CRON',
  MANUAL: 'MANUAL',
} as const;

export interface JobLogRecord {
  id: string;
  jobId: string;
  jobName?: string;
  jobGroup?: string;
  invokeTarget?: string;
  triggerType?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
  costMs?: number;
  errorMsg?: string;
  createTime?: string;
}

export interface JobLogPageQuery {
  current?: number;
  size?: number;
  jobId?: string;
  jobName?: string;
  jobGroup?: string;
  triggerType?: string;
  status?: number;
  createTimeStart?: string;
  createTimeEnd?: string;
}

export function getJobPage(params: JobPageQuery) {
  return request<R<PageResult<SysJob>>>({ url: '/monitor/job/page', method: 'GET', params });
}

export function getJob(id: string) {
  return request<R<SysJob>>({ url: `/monitor/job/${id}`, method: 'GET' });
}

export function getJobLogPage(params: JobLogPageQuery) {
  return request<R<PageResult<JobLogRecord>>>({
    url: '/monitor/job/log/page',
    method: 'GET',
    params,
  });
}

export function getJobLog(id: string) {
  return request<R<JobLogRecord>>({ url: `/monitor/job/log/${id}`, method: 'GET' });
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
