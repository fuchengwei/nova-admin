import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Descriptions, Progress, Tabs, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ProCard, ProTable, type ProColumns } from '@ant-design/pro-components';
import { getServerInfo, getOnlineUsers, getCacheInfo } from '@/api/monitor';
import type { CacheInfo, OnlineUser, ServerInfo } from '@/api/monitor';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

const usageColor = (v: number) => (v > 80 ? '#ff4d4f' : v > 60 ? '#faad14' : '#52c41a');
const fmt = (value: unknown, suffix: string) =>
  isEmptyDisplayValue(value) ? '-' : `${value}${suffix}`;

interface MetricCardProps {
  title: string;
  percent?: number;
  loading: boolean;
  children: React.ReactNode;
}

function MetricCard({ title, percent, loading, children }: MetricCardProps) {
  const p = Math.round(percent ?? 0);
  return (
    <ProCard
      title={title}
      loading={loading}
      className="h-full"
      extra={
        percent !== undefined ? (
          <Progress
            type="circle"
            size={64}
            percent={p}
            strokeColor={usageColor(p)}
            format={(val) => <span style={{ fontSize: 13, fontWeight: 600 }}>{val}%</span>}
          />
        ) : undefined
      }
    >
      {children}
    </ProCard>
  );
}

interface StatRowProps {
  label: string;
  value: React.ReactNode;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-[color:var(--ant-color-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

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
    { title: t('monitor.account'), dataIndex: 'account', key: 'account', render: (v) => displayText(v) },
    { title: t('monitor.nickname'), dataIndex: 'nickname', key: 'nickname', render: (v) => displayText(v) },
    { title: t('monitor.deptId'), dataIndex: 'deptId', key: 'deptId', render: (v) => displayText(v) },
    { title: t('monitor.loginIp'), dataIndex: 'loginIp', key: 'loginIp', render: (v) => displayText(v) },
    { title: t('monitor.loginTime'), dataIndex: 'loginTime', key: 'loginTime', render: (v) => displayText(v) },
  ];

  const diskColumns: ProColumns<ServerInfo['disks'][number]>[] = [
    { title: t('monitor.diskPath'), dataIndex: 'dirName', key: 'dirName', render: (v) => displayText(v) },
    { title: t('monitor.diskType'), dataIndex: 'sysTypeName', key: 'sysTypeName', render: (v) => displayText(v) },
    { title: t('monitor.total'), dataIndex: 'total', key: 'total', render: (v) => fmt(v, ' GB') },
    { title: t('monitor.used'), dataIndex: 'used', key: 'used', render: (v) => fmt(v, ' GB') },
    { title: t('monitor.free'), dataIndex: 'free', key: 'free', render: (v) => fmt(v, ' GB') },
    {
      title: t('monitor.usage'),
      dataIndex: 'usage',
      key: 'usage',
      render: (v) =>
        isEmptyDisplayValue(v) ? (
          '-'
        ) : (
          <Progress
            percent={Math.round(v as number)}
            strokeColor={usageColor(v as number)}
            size="small"
          />
        ),
    },
  ];

  const cmdColumns: ProColumns<CacheInfo['commandStats'][number]>[] = [
    { title: t('monitor.cmd'), dataIndex: 'name', key: 'name', render: (v) => displayText(v) },
    { title: t('monitor.calls'), dataIndex: 'value', key: 'value', render: (v) => displayText(v) },
  ];

  return (
    <div className="h-full overflow-auto p-4">
      <Tabs
        defaultActiveKey="server"
        tabBarExtraContent={
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            {t('common.refresh')}
          </Button>
        }
        items={[
          {
            key: 'server',
            label: t('monitor.tabServer'),
            children: (
              <div className="flex flex-col gap-4">
                {/* Three metric cards — equal height via grid + items-stretch */}
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
                  <MetricCard title={t('monitor.cpu')} percent={server?.cpu.used} loading={loading}>
                    <StatRow label={t('monitor.cpuNum')} value={displayText(server?.cpu.cpuNum)} />
                    <StatRow label={t('monitor.cpuSys')} value={fmt(server?.cpu.sys, '%')} />
                    <StatRow label={t('monitor.cpuUsed')} value={fmt(server?.cpu.used, '%')} />
                  </MetricCard>

                  <MetricCard title={t('monitor.mem')} percent={server?.mem.usage} loading={loading}>
                    <StatRow label={t('monitor.total')} value={fmt(server?.mem.total, ' GB')} />
                    <StatRow label={t('monitor.used')} value={fmt(server?.mem.used, ' GB')} />
                    <StatRow label={t('monitor.free')} value={fmt(server?.mem.free, ' GB')} />
                  </MetricCard>

                  <MetricCard title={t('monitor.jvm')} percent={server?.jvm.usage} loading={loading}>
                    <StatRow label={t('monitor.jvmName')} value={displayText(server?.jvm.name)} />
                    <StatRow label={t('monitor.jvmVersion')} value={displayText(server?.jvm.version)} />
                    <StatRow label={t('monitor.jvmUsed')} value={fmt(server?.jvm.used, ' GB')} />
                    <StatRow label={t('monitor.jvmStartTime')} value={displayText(server?.jvm.startTime)} />
                    <StatRow label={t('monitor.jvmRunTime')} value={displayText(server?.jvm.runTime)} />
                  </MetricCard>
                </div>

                <ProCard title={t('monitor.sysInfo')} loading={loading}>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label={t('monitor.computerName')}>{displayText(server?.sys.computerName)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.computerIp')}>{displayText(server?.sys.computerIp)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.osName')}>{displayText(server?.sys.osName)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.osArch')}>{displayText(server?.sys.osArch)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.userDir')} span={2}>{displayText(server?.sys.userDir)}</Descriptions.Item>
                  </Descriptions>
                </ProCard>

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
              <div className="flex flex-col gap-4">
                {/* Top: 4 key metric cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <ProCard loading={loading}>
                    <div className="text-xs text-[color:var(--ant-color-text-secondary)]">{t('monitor.cacheUsedMem')}</div>
                    <div className="mt-1 text-xl font-semibold">{displayText(cache?.server?.usedMemoryHuman)}</div>
                  </ProCard>
                  <ProCard loading={loading}>
                    <div className="text-xs text-[color:var(--ant-color-text-secondary)]">{t('monitor.cacheMaxMem')}</div>
                    <div className="mt-1 text-xl font-semibold">{displayText(cache?.server?.maxMemoryHuman)}</div>
                  </ProCard>
                  <ProCard loading={loading}>
                    <div className="text-xs text-[color:var(--ant-color-text-secondary)]">{t('monitor.cacheClients')}</div>
                    <div className="mt-1 text-xl font-semibold">{displayText(cache?.server?.connectedClients)}</div>
                  </ProCard>
                  <ProCard loading={loading}>
                    <div className="text-xs text-[color:var(--ant-color-text-secondary)]">{t('monitor.cacheDbSize')}</div>
                    <div className="mt-1 text-xl font-semibold">{cache?.dbSize ?? '-'}</div>
                  </ProCard>
                </div>

                {/* Middle: Redis server info */}
                <ProCard title={t('monitor.cacheBase')} loading={loading}>
                  <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
                    <Descriptions.Item label={t('monitor.cacheVersion')}>{displayText(cache?.server?.version)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.cacheMode')}>{displayText(cache?.server?.mode)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.cacheOs')}>{displayText(cache?.server?.os)}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.cacheUptime')}>{fmt(cache?.server?.uptime, ' d')}</Descriptions.Item>
                    <Descriptions.Item label={t('monitor.cachePolicy')}>
                      {isEmptyDisplayValue(cache?.server?.maxMemoryPolicy) ? (
                        '-'
                      ) : (
                        <Tag color="blue">{cache?.server?.maxMemoryPolicy}</Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </ProCard>

                {/* Bottom: Command stats */}
                <ProTable<CacheInfo['commandStats'][number]>
                  headerTitle={t('monitor.cacheCmds')}
                  loading={loading}
                  rowKey="name"
                  size="small"
                  search={false}
                  options={false}
                  pagination={{ pageSize: 10 }}
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
