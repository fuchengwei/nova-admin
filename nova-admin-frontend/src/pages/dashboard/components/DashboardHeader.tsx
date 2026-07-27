import { Badge } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { DashboardRuntime } from '@/api/dashboard';

interface DashboardHeaderProps {
  runtime?: DashboardRuntime;
  updatedAt?: string;
}

export default function DashboardHeader({ runtime, updatedAt }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const online = runtime?.online ?? false;

  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('dashboard.subtitle')}</p>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <Badge
          status={online ? 'success' : 'default'}
          text={online ? t('dashboard.online') : t('dashboard.offline')}
        />
        <div className="border-l border-slate-200 pl-5 text-slate-500">
          <span>{t('dashboard.updatedAt')}: </span>
          <span className="font-medium text-slate-700">
            {updatedAt ? dayjs(updatedAt).format('HH:mm:ss') : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
