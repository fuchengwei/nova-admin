import { request } from '@/utils/request';
import type { R } from '@/types/api';

export interface ServerInfo {
  cpu: { cpuNum: number; sys: number; used: number; free: number };
  mem: { total: number; used: number; free: number; usage: number };
  jvm: {
    name: string;
    version: string;
    home: string;
    total: number;
    used: number;
    free: number;
    usage: number;
    startTime: string;
    runTime: string;
    inputArgs: string;
  };
  sys: {
    computerName: string;
    computerIp: string;
    osName: string;
    osArch: string;
    userDir: string;
  };
  disks: Array<{
    dirName: string;
    sysTypeName: string;
    typeName: string;
    total: number;
    used: number;
    free: number;
    usage: number;
  }>;
}

export interface OnlineUser {
  tokenKey: string;
  account: string;
  nickname: string;
  deptId?: number;
  loginIp?: string;
  loginTime?: string;
}

export interface CacheInfo {
  commandStats: Array<{ name: string; value: string }>;
  server: {
    version?: string;
    mode?: string;
    os?: string;
    uptime?: string;
    usedMemoryHuman?: string;
    maxMemoryHuman?: string;
    connectedClients?: string;
    maxmemoryPolicy?: string;
  };
  dbSize: number;
}

export function getServerInfo() {
  return request<R<ServerInfo>>({ url: '/monitor/server', method: 'GET' });
}
export function getOnlineUsers() {
  return request<R<OnlineUser[]>>({ url: '/monitor/online', method: 'GET' });
}
export function getCacheInfo() {
  return request<R<CacheInfo>>({ url: '/monitor/cache', method: 'GET' });
}
