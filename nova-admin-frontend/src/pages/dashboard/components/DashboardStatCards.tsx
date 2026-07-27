import {
  ApartmentOutlined,
  CheckCircleFilled,
  DesktopOutlined,
  FileOutlined,
  FundOutlined,
  HddOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { DashboardRuntime, DashboardStats } from '@/api/dashboard';

interface DashboardStatCardsProps {
  available: boolean;
  runtime?: DashboardRuntime;
  stats?: DashboardStats;
}

export default function DashboardStatCards({ available, runtime, stats }: DashboardStatCardsProps) {
  const { t } = useTranslation();
  const cards = [
    {
      key: 'users',
      label: t('dashboard.users'),
      value: stats?.userCount,
      icon: <UserOutlined />,
    },
    {
      key: 'roles',
      label: t('dashboard.roles'),
      value: stats?.roleCount,
      icon: <TeamOutlined />,
    },
    {
      key: 'departments',
      label: t('dashboard.depts'),
      value: stats?.deptCount,
      icon: <ApartmentOutlined />,
    },
    {
      key: 'files',
      label: t('dashboard.files'),
      value: stats?.fileCount,
      icon: <FileOutlined />,
    },
  ];
  const onlineUserCount = runtime?.onlineUserCount ?? '-';
  const cpuUsage = runtime?.cpuUsage === undefined ? '-' : `${runtime.cpuUsage.toFixed(1)}%`;
  const memoryUsage =
    runtime?.memoryUsage === undefined ? '-' : `${runtime.memoryUsage.toFixed(1)}%`;
  const jobCount = available && stats ? stats.jobCount : '-';

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.key}
            className="flex min-h-27 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-lg text-blue-600">
              {card.icon}
            </span>
            <div>
              <div className="text-sm font-medium text-slate-500">{card.label}</div>
              <div className="mt-1 font-mono text-2xl leading-none font-semibold text-slate-950 tabular-nums">
                {available && card.value !== undefined ? card.value : '-'}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <span className="flex items-center gap-2 font-medium text-emerald-700">
          <CheckCircleFilled />
          {runtime?.online ? t('dashboard.online') : t('dashboard.offline')}
        </span>
        <span className="h-4 border-l border-slate-200" />
        <span className="flex items-center gap-2">
          <DesktopOutlined className="text-slate-400" />
          {t('dashboard.onlineUsers')}
          <strong className="font-mono font-semibold text-slate-800 tabular-nums">
            {onlineUserCount}
          </strong>
        </span>
        <span className="flex items-center gap-2">
          <FundOutlined className="text-slate-400" />
          {t('dashboard.cpu')}
          <strong className="font-mono font-semibold text-slate-800 tabular-nums">
            {cpuUsage}
          </strong>
        </span>
        <span className="flex items-center gap-2">
          <HddOutlined className="text-slate-400" />
          {t('dashboard.memory')}
          <strong className="font-mono font-semibold text-slate-800 tabular-nums">
            {memoryUsage}
          </strong>
        </span>
        <span className="flex items-center gap-2">
          {t('dashboard.jobs')}
          <strong className="font-mono font-semibold text-slate-800 tabular-nums">
            {jobCount}
          </strong>
        </span>
      </div>
    </section>
  );
}
