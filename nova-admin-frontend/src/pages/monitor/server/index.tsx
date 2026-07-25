import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress, Tabs, Tag } from 'antd';
import { ProDescriptions, ProTable, type ProColumns } from '@ant-design/pro-components';
import { getServerInfo, getOnlineUsers, getCacheInfo } from '@/api/monitor';
import type { CacheInfo, OnlineUser, ServerInfo } from '@/api/monitor';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

const usageStatus = (v: number) => (v > 80 ? 'exception' : v > 60 ? 'normal' : 'success');

const formatWithUnit = (value: unknown, suffix: string) =>
  isEmptyDisplayValue(value) ? '-' : `${value}${suffix}`;

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
    {
      title: t('monitor.account'),
      dataIndex: 'account',
      key: 'account',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.nickname'),
      dataIndex: 'nickname',
      key: 'nickname',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.deptId'),
      dataIndex: 'deptId',
      key: 'deptId',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.loginIp'),
      dataIndex: 'loginIp',
      key: 'loginIp',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.loginTime'),
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (value) => displayText(value),
    },
  ];

  const diskColumns: ProColumns<ServerInfo['disks'][number]>[] = [
    {
      title: t('monitor.diskPath'),
      dataIndex: 'dirName',
      key: 'dirName',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.diskType'),
      dataIndex: 'sysTypeName',
      key: 'sysTypeName',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.total'),
      dataIndex: 'total',
      key: 'total',
      render: (value) => formatWithUnit(value, ' GB'),
    },
    {
      title: t('monitor.used'),
      dataIndex: 'used',
      key: 'used',
      render: (value) => formatWithUnit(value, ' GB'),
    },
    {
      title: t('monitor.free'),
      dataIndex: 'free',
      key: 'free',
      render: (value) => formatWithUnit(value, ' GB'),
    },
    {
      title: t('monitor.usage'),
      dataIndex: 'usage',
      key: 'usage',
      render: (value) =>
        isEmptyDisplayValue(value) ? (
          '-'
        ) : (
          <Progress percent={Math.round(value as number)} status={usageStatus(value as number)} />
        ),
    },
  ];

  const cmdColumns: ProColumns<CacheInfo['commandStats'][number]>[] = [
    {
      title: t('monitor.cmd'),
      dataIndex: 'name',
      key: 'name',
      render: (value) => displayText(value),
    },
    {
      title: t('monitor.calls'),
      dataIndex: 'value',
      key: 'value',
      render: (value) => displayText(value),
    },
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
                    {
                      title: t('monitor.cpuNum'),
                      dataIndex: 'cpu.cpuNum',
                      render: (_, record) => displayText(record.cpu?.cpuNum),
                    },
                    {
                      title: t('monitor.cpuSys'),
                      dataIndex: 'cpu.sys',
                      render: (_, record) => formatWithUnit(record.cpu?.sys, '%'),
                    },
                    {
                      title: t('monitor.cpuUsed'),
                      dataIndex: 'cpu.used',
                      render: (_, record) => formatWithUnit(record.cpu?.used, '%'),
                    },
                  ]}
                />
                {server && (
                  <Progress
                    percent={Math.round(server.cpu.used)}
                    status={usageStatus(server.cpu.used)}
                  />
                )}

                <ProDescriptions<ServerInfo>
                  title={t('monitor.mem')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    {
                      title: t('monitor.total'),
                      dataIndex: 'mem.total',
                      render: (_, record) => formatWithUnit(record.mem?.total, ' GB'),
                    },
                    {
                      title: t('monitor.used'),
                      dataIndex: 'mem.used',
                      render: (_, record) => formatWithUnit(record.mem?.used, ' GB'),
                    },
                    {
                      title: t('monitor.free'),
                      dataIndex: 'mem.free',
                      render: (_, record) => formatWithUnit(record.mem?.free, ' GB'),
                    },
                  ]}
                />
                {server && (
                  <Progress
                    percent={Math.round(server.mem.usage)}
                    status={usageStatus(server.mem.usage)}
                  />
                )}

                <ProDescriptions<ServerInfo>
                  title={t('monitor.jvm')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    {
                      title: t('monitor.jvmName'),
                      dataIndex: 'jvm.name',
                      render: (_, record) => displayText(record.jvm?.name),
                    },
                    {
                      title: t('monitor.jvmVersion'),
                      dataIndex: 'jvm.version',
                      render: (_, record) => displayText(record.jvm?.version),
                    },
                    {
                      title: t('monitor.jvmUsed'),
                      dataIndex: 'jvm.used',
                      render: (_, record) => formatWithUnit(record.jvm?.used, ' GB'),
                    },
                    {
                      title: t('monitor.jvmStartTime'),
                      dataIndex: 'jvm.startTime',
                      render: (_, record) => displayText(record.jvm?.startTime),
                    },
                    {
                      title: t('monitor.jvmRunTime'),
                      dataIndex: 'jvm.runTime',
                      render: (_, record) => displayText(record.jvm?.runTime),
                    },
                  ]}
                />
                {server && (
                  <Progress
                    percent={Math.round(server.jvm.usage)}
                    status={usageStatus(server.jvm.usage)}
                  />
                )}

                <ProDescriptions<ServerInfo>
                  title={t('monitor.sysInfo')}
                  loading={loading}
                  dataSource={server ?? undefined}
                  column={1}
                  size="small"
                  columns={[
                    {
                      title: t('monitor.computerName'),
                      dataIndex: 'sys.computerName',
                      render: (_, record) => displayText(record.sys?.computerName),
                    },
                    {
                      title: t('monitor.computerIp'),
                      dataIndex: 'sys.computerIp',
                      render: (_, record) => displayText(record.sys?.computerIp),
                    },
                    {
                      title: t('monitor.osName'),
                      dataIndex: 'sys.osName',
                      render: (_, record) => displayText(record.sys?.osName),
                    },
                    {
                      title: t('monitor.osArch'),
                      dataIndex: 'sys.osArch',
                      render: (_, record) => displayText(record.sys?.osArch),
                    },
                    {
                      title: t('monitor.userDir'),
                      dataIndex: 'sys.userDir',
                      render: (_, record) => displayText(record.sys?.userDir),
                    },
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
                    {
                      title: t('monitor.cacheVersion'),
                      dataIndex: 'server.version',
                      render: (_, record) => displayText(record.server?.version),
                    },
                    {
                      title: t('monitor.cacheMode'),
                      dataIndex: 'server.mode',
                      render: (_, record) => displayText(record.server?.mode),
                    },
                    {
                      title: t('monitor.cacheOs'),
                      dataIndex: 'server.os',
                      render: (_, record) => displayText(record.server?.os),
                    },
                    {
                      title: t('monitor.cacheUptime'),
                      dataIndex: 'server.uptime',
                      render: (_, record) => formatWithUnit(record.server?.uptime, ' d'),
                    },
                    {
                      title: t('monitor.cacheUsedMem'),
                      dataIndex: 'server.usedMemoryHuman',
                      render: (_, record) => displayText(record.server?.usedMemoryHuman),
                    },
                    {
                      title: t('monitor.cacheMaxMem'),
                      dataIndex: 'server.maxMemoryHuman',
                      render: (_, record) => displayText(record.server?.maxMemoryHuman),
                    },
                    {
                      title: t('monitor.cacheClients'),
                      dataIndex: 'server.connectedClients',
                      render: (_, record) => displayText(record.server?.connectedClients),
                    },
                    {
                      title: t('monitor.cachePolicy'),
                      dataIndex: 'server.maxmemoryPolicy',
                      render: (_, record) =>
                        isEmptyDisplayValue(record.server?.maxmemoryPolicy) ? (
                          '-'
                        ) : (
                          <Tag>{record.server?.maxmemoryPolicy}</Tag>
                        ),
                    },
                    {
                      title: t('monitor.cacheDbSize'),
                      dataIndex: 'dbSize',
                      render: (_, record) => displayText(record.dbSize),
                    },
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
