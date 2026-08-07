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
    <div className="flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-end">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('dashboard.subtitle')}</p>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <Badge
          status={online ? 'success' : 'default'}
          text={online ? t('dashboard.online') : t('dashboard.offline')}
        />
        <div className="border-l border-[var(--color-border)] pl-5 text-[var(--color-text-secondary)]">
          <span>{t('dashboard.updatedAt')}: </span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {updatedAt ? dayjs(updatedAt).format('HH:mm:ss') : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
