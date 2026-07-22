import request from '@/utils/request';
import type { PageResult } from '@/types/common';
import type { R } from '@/types/common';

export interface SysJob {
  id?: number;
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
  return request.get<R<PageResult<SysJob>>>('/monitor/job/page', { params });
}

export function getJob(id: number) {
  return request.get<R<SysJob>>(`/monitor/job/${id}`);
}

export function createJob(data: SysJob) {
  return request.post<R<number>>('/monitor/job', data);
}

export function updateJob(data: SysJob) {
  return request.put<R<void>>('/monitor/job', data);
}

export function deleteJob(id: number) {
  return request.delete<R<void>>(`/monitor/job/${id}`);
}

export function pauseJob(id: number) {
  return request.put<R<void>>(`/monitor/job/pause/${id}`);
}

export function resumeJob(id: number) {
  return request.put<R<void>>(`/monitor/job/resume/${id}`);
}

export function runJob(id: number) {
  return request.put<R<void>>(`/monitor/job/run/${id}`);
}
