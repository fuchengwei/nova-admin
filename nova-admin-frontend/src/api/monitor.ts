import request from '@/utils/request';
import type { R } from '@/types/common';

export interface ServerInfo {
  cpu: { cpuNum: number; sys: number; used: number; free: number };
  mem: { total: number; used: number; free: number; usage: number };
  jvm: { name: string; version: string; home: string; total: number; used: number; free: number; usage: number; startTime: string; runTime: string; inputArgs: string };
  sys: { computerName: string; computerIp: string; osName: string; osArch: string; userDir: string };
  disks: Array<{ dirName: string; sysTypeName: string; typeName: string; total: number; used: number; free: number; usage: number }>;
}

export interface OnlineUser {
  tokenKey: string;
  username: string;
  nickname: string;
  deptId?: number;
  loginIp?: string;
  loginTime?: string;
}

export interface CacheInfo {
  commandStats: Array<{ name: string; value: string }>;
  server: { version?: string; mode?: string; os?: string; uptime?: string; usedMemoryHuman?: string; maxMemoryHuman?: string; connectedClients?: string; maxmemoryPolicy?: string };
  dbSize: number;
}

export function getServerInfo() {
  return request.get<R<ServerInfo>>('/monitor/server');
}

export function getOnlineUsers() {
  return request.get<R<OnlineUser[]>>('/monitor/online');
}

export function getCacheInfo() {
  return request.get<R<CacheInfo>>('/monitor/cache');
}
