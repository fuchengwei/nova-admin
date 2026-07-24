import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress, Tabs, Tag } from 'antd';
import {
  ProDescriptions,
  ProTable,
  type ProColumns,
} from '@ant-design/pro-components';
import { getServerInfo, getOnlineUsers, getCacheInfo } from '@/api/monitor';
import type { CacheInfo, OnlineUser, ServerInfo } from '@/api/monitor';

const usageStatus = (v: number) => (v > 80 ? 'exception' : v > 60 ? 'normal' : 'success');

export default function ServerMonitorPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [cache, setCache] = useState<CacheInfo | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, o, c] = await Promise.all([getServerInfo(), getOnlineUsers(), getCacheInfo()]);
      setServer(s.data);
      setOnline(o.data ?? []);
      setCache(c.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onlineColumns: ProColumns<OnlineUser>[] = [
    { title: t('monitor.account'), dataIndex: 'account', key: 'account' },
    { title: t('monitor.nickname'), dataIndex: 'nickname', key: 'nickname' },
    { title: t('monitor.deptId'), dataIndex: 'deptId', key: 'deptId', render: (v) => v ?? '-' },
    { title: t('monitor.loginIp'), dataIndex: 'loginIp', key: 'loginIp', render: (v) => v ?? '-' },
    { title: t('monitor.loginTime'), dataIndex: 'loginTime', key: 'loginTime', render: (v) => v ?? '-' },
  ];

  const diskColumns: ProColumns<ServerInfo['disks'][number]>[] = [
    { title: t('monitor.diskPath'), dataIndex: 'dirName', key: 'dirName' },
    { title: t('monitor.diskType'), dataIndex: 'sysTypeName', key: 'sysTypeName' },
    { title: t('monitor.total'), dataIndex: 'total', key: 'total', render: (v) => `${v} GB` },
    { title: t('monitor.used'), dataIndex: 'used', key: 'used', render: (v) => `${v} GB` },
    { title: t('monitor.free'), dataIndex: 'free', key: 'free', render: (v) => `${v} GB` },
    {
      title: t('monitor.usage'),
      dataIndex: 'usage',
      key: 'usage',
      render: (v) => <Progress percent={Math.round(v as number)} status={usageStatus(v as number)} />,
    },
  ];

  const cmdColumns: ProColumns<CacheInfo['commandStats'][number]>[] = [
    { title: t('monitor.cmd'), dataIndex: 'name', key: 'name' },
    { title: t('monitor.calls'), dataIndex: 'value', key: 'value' },
  ];

  return (
    <div className="h-full overflow-auto p-4">
      <Tabs
        defaultActiveKey="server"
        items={[
          {
            key: 'server',
            label: t('monitor.tabServer'),
            children: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ProDescriptions<ServerInfo>
                  title={t('monitor.cpu')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    { title: t('monitor.cpuNum'), dataIndex: 'cpu.cpuNum', render: (_, r) => r.cpu?.cpuNum },
                    { title: t('monitor.cpuSys'), dataIndex: 'cpu.sys', render: (_, r) => `${r.cpu?.sys}%` },
                    { title: t('monitor.cpuUsed'), dataIndex: 'cpu.used', render: (_, r) => `${r.cpu?.used}%` },
                  ]}
                />
                {server && (
                  <Progress percent={Math.round(server.cpu.used)} status={usageStatus(server.cpu.used)} />
                )}

                <ProDescriptions<ServerInfo>
                  title={t('monitor.mem')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    { title: t('monitor.total'), dataIndex: 'mem.total', render: (_, r) => `${r.mem?.total} GB` },
                    { title: t('monitor.used'), dataIndex: 'mem.used', render: (_, r) => `${r.mem?.used} GB` },
                    { title: t('monitor.free'), dataIndex: 'mem.free', render: (_, r) => `${r.mem?.free} GB` },
                  ]}
                />
                {server && (
                  <Progress percent={Math.round(server.mem.usage)} status={usageStatus(server.mem.usage)} />
                )}

                <ProDescriptions<ServerInfo>
                  title={t('monitor.jvm')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    { title: t('monitor.jvmName'), dataIndex: 'jvm.name', render: (_, r) => r.jvm?.name },
                    { title: t('monitor.jvmVersion'), dataIndex: 'jvm.version', render: (_, r) => r.jvm?.version },
                    { title: t('monitor.jvmUsed'), dataIndex: 'jvm.used', render: (_, r) => `${r.jvm?.used} GB` },
                    { title: t('monitor.jvmStartTime'), dataIndex: 'jvm.startTime', render: (_, r) => r.jvm?.startTime },
                    { title: t('monitor.jvmRunTime'), dataIndex: 'jvm.runTime', render: (_, r) => r.jvm?.runTime },
                  ]}
                />
                {server && (
                  <Progress percent={Math.round(server.jvm.usage)} status={usageStatus(server.jvm.usage)} />
                )}

                <ProDescriptions<ServerInfo>
                  title={t('monitor.sysInfo')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    { title: t('monitor.computerName'), dataIndex: 'sys.computerName', render: (_, r) => r.sys?.computerName },
                    { title: t('monitor.computerIp'), dataIndex: 'sys.computerIp', render: (_, r) => r.sys?.computerIp },
                    { title: t('monitor.osName'), dataIndex: 'sys.osName', render: (_, r) => r.sys?.osName },
                    { title: t('monitor.osArch'), dataIndex: 'sys.osArch', render: (_, r) => r.sys?.osArch },
                    { title: t('monitor.userDir'), dataIndex: 'sys.userDir', render: (_, r) => r.sys?.userDir },
                  ]}
                />

                <div className="lg:col-span-2">
                  <ProTable<ServerInfo['disks'][number]>
                  headerTitle={t('monitor.disk')}
                  loading={loading}
                  rowKey="dirName"
                  size="small"
                  search={false}
                  options={false}
                  pagination={false}
                  columns={diskColumns}
                    dataSource={server?.disks ?? []}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'online',
            label: t('monitor.tabOnline'),
            children: (
              <ProTable<OnlineUser>
                rowKey="tokenKey"
                loading={loading}
                size="small"
                search={false}
                options={false}
                pagination={{ pageSize: 10 }}
                columns={onlineColumns}
                dataSource={online}
              />
            ),
          },
          {
            key: 'cache',
            label: t('monitor.tabCache'),
            children: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ProDescriptions<CacheInfo>
                  title={t('monitor.cacheBase')}
                  loading={loading}
                  dataSource={cache ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    { title: t('monitor.cacheVersion'), dataIndex: 'server.version', render: (_, r) => r.server?.version },
                    { title: t('monitor.cacheMode'), dataIndex: 'server.mode', render: (_, r) => r.server?.mode },
                    { title: t('monitor.cacheOs'), dataIndex: 'server.os', render: (_, r) => r.server?.os },
                    { title: t('monitor.cacheUptime'), dataIndex: 'server.uptime', render: (_, r) => `${r.server?.uptime} d` },
                    { title: t('monitor.cacheUsedMem'), dataIndex: 'server.usedMemoryHuman', render: (_, r) => r.server?.usedMemoryHuman },
                    { title: t('monitor.cacheMaxMem'), dataIndex: 'server.maxMemoryHuman', render: (_, r) => r.server?.maxMemoryHuman },
                    { title: t('monitor.cacheClients'), dataIndex: 'server.connectedClients', render: (_, r) => r.server?.connectedClients },
                    { title: t('monitor.cachePolicy'), dataIndex: 'server.maxmemoryPolicy', render: (_, r) => <Tag>{r.server?.maxmemoryPolicy}</Tag> },
                    { title: t('monitor.cacheDbSize'), dataIndex: 'dbSize', render: (_, r) => r.dbSize },
                  ]}
                />
                <ProTable<CacheInfo['commandStats'][number]>
                  headerTitle={t('monitor.cacheCmds')}
                  loading={loading}
                  rowKey="name"
                  size="small"
                  search={false}
                  options={false}
                  pagination={{ pageSize: 8 }}
                  columns={cmdColumns}
                  dataSource={cache?.commandStats ?? []}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
