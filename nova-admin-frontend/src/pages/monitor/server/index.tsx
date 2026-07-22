import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Descriptions, Progress, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getCacheInfo, getOnlineUsers, getServerInfo } from '@/api/monitor';
import type { CacheInfo, OnlineUser, ServerInfo } from '@/api/monitor';

const usageStatus = (v: number) => (v > 80 ? 'exception' : v > 60 ? 'normal' : 'success');
const item = (label: string, children: React.ReactNode) => ({ key: label, label, children });

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

  const onlineColumns: ColumnsType<OnlineUser> = [
    { title: t('monitor.username'), dataIndex: 'username', key: 'username' },
    { title: t('monitor.nickname'), dataIndex: 'nickname', key: 'nickname' },
    { title: t('monitor.deptId'), dataIndex: 'deptId', key: 'deptId' },
    { title: t('monitor.loginIp'), dataIndex: 'loginIp', key: 'loginIp' },
    { title: t('monitor.loginTime'), dataIndex: 'loginTime', key: 'loginTime' },
  ];

  const diskColumns: ColumnsType<ServerInfo['disks'][number]> = [
    { title: t('monitor.diskPath'), dataIndex: 'dirName', key: 'dirName' },
    { title: t('monitor.diskType'), dataIndex: 'sysTypeName', key: 'sysTypeName' },
    { title: t('monitor.total'), dataIndex: 'total', key: 'total', render: (v: number) => `${v} GB` },
    { title: t('monitor.used'), dataIndex: 'used', key: 'used', render: (v: number) => `${v} GB` },
    { title: t('monitor.free'), dataIndex: 'free', key: 'free', render: (v: number) => `${v} GB` },
    {
      title: t('monitor.usage'),
      dataIndex: 'usage',
      key: 'usage',
      render: (v: number) => <Progress percent={Math.round(v)} status={usageStatus(v)} />,
    },
  ];

  const cmdColumns: ColumnsType<CacheInfo['commandStats'][number]> = [
    { title: t('monitor.cmd'), dataIndex: 'name', key: 'name' },
    { title: t('monitor.calls'), dataIndex: 'value', key: 'value' },
  ];

  return (
    <div className="p-4">
      <Tabs
        defaultActiveKey="server"
        items={[
          {
            key: 'server',
            label: t('monitor.tabServer'),
            children: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title={t('monitor.cpu')} loading={loading}>
                  {server && (
                    <>
                      <Descriptions column={1} size="small" items={[
                        item(t('monitor.cpuNum'), server.cpu.cpuNum),
                        item(t('monitor.cpuSys'), `${server.cpu.sys}%`),
                        item(t('monitor.cpuUsed'), `${server.cpu.used}%`),
                      ]} />
                      <Progress percent={Math.round(server.cpu.used)} status={usageStatus(server.cpu.used)} />
                    </>
                  )}
                </Card>
                <Card title={t('monitor.mem')} loading={loading}>
                  {server && (
                    <>
                      <Descriptions column={1} size="small" items={[
                        item(t('monitor.total'), `${server.mem.total} GB`),
                        item(t('monitor.used'), `${server.mem.used} GB`),
                        item(t('monitor.free'), `${server.mem.free} GB`),
                      ]} />
                      <Progress percent={Math.round(server.mem.usage)} status={usageStatus(server.mem.usage)} />
                    </>
                  )}
                </Card>
                <Card title={t('monitor.jvm')} loading={loading}>
                  {server && (
                    <>
                      <Descriptions column={1} size="small" items={[
                        item(t('monitor.jvmName'), server.jvm.name),
                        item(t('monitor.jvmVersion'), server.jvm.version),
                        item(t('monitor.jvmUsed'), `${server.jvm.used} GB`),
                        item(t('monitor.jvmStartTime'), server.jvm.startTime),
                        item(t('monitor.jvmRunTime'), server.jvm.runTime),
                      ]} />
                      <Progress percent={Math.round(server.jvm.usage)} status={usageStatus(server.jvm.usage)} />
                    </>
                  )}
                </Card>
                <Card title={t('monitor.sysInfo')} loading={loading}>
                  {server && (
                    <Descriptions column={1} size="small" items={[
                      item(t('monitor.computerName'), server.sys.computerName),
                      item(t('monitor.computerIp'), server.sys.computerIp),
                      item(t('monitor.osName'), server.sys.osName),
                      item(t('monitor.osArch'), server.sys.osArch),
                      item(t('monitor.userDir'), server.sys.userDir),
                    ]} />
                  )}
                </Card>
                <Card title={t('monitor.disk')} loading={loading} className="lg:col-span-2">
                  {server && (
                    <Table rowKey="dirName" size="small" columns={diskColumns} dataSource={server.disks} pagination={false} />
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: 'online',
            label: t('monitor.tabOnline'),
            children: (
              <Card>
                <Table
                  rowKey="tokenKey"
                  loading={loading}
                  columns={onlineColumns}
                  dataSource={online}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'cache',
            label: t('monitor.tabCache'),
            children: (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title={t('monitor.cacheBase')} loading={loading}>
                  {cache && (
                    <Descriptions column={1} size="small" items={[
                      item(t('monitor.cacheVersion'), cache.server?.version),
                      item(t('monitor.cacheMode'), cache.server?.mode),
                      item(t('monitor.cacheOs'), cache.server?.os),
                      item(t('monitor.cacheUptime'), `${cache.server?.uptime} d`),
                      item(t('monitor.cacheUsedMem'), cache.server?.usedMemoryHuman),
                      item(t('monitor.cacheMaxMem'), cache.server?.maxMemoryHuman),
                      item(t('monitor.cacheClients'), cache.server?.connectedClients),
                      item(t('monitor.cachePolicy'), <Tag>{cache.server?.maxmemoryPolicy}</Tag>),
                      item(t('monitor.cacheDbSize'), cache.dbSize),
                    ]} />
                  )}
                </Card>
                <Card title={t('monitor.cacheCmds')} loading={loading}>
                  {cache && (
                    <Table
                      rowKey="name"
                      size="small"
                      columns={cmdColumns}
                      dataSource={cache.commandStats}
                      pagination={{ pageSize: 8 }}
                    />
                  )}
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
