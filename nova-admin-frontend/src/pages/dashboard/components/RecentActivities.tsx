import dayjs from 'dayjs';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { DashboardActivity } from '@/api/dashboard';

interface RecentActivitiesProps {
  activities: DashboardActivity[];
  available: boolean;
}

export default function RecentActivities({ activities, available }: RecentActivitiesProps) {
  const { t } = useTranslation();

  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-slate-900">
            {t('dashboard.recentActivities')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t('dashboard.recentActivitiesDesc')}</p>
        </div>
      </div>
      {available && activities.length > 0 ? (
        <div className="ml-1 border-l border-slate-200 pl-6">
          {activities.map((activity, index) => (
            <div
              key={`${activity.type}-${activity.occurredAt}-${index}`}
              className="relative flex items-start gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span
                className={`absolute top-5 -left-[30px] h-2.5 w-2.5 rounded-full border-2 border-white ${activity.type === 'LOGIN' ? 'bg-blue-500' : 'bg-violet-500'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Tag color={activity.type === 'LOGIN' ? 'blue' : 'default'}>
                    {t(`dashboard.activity${activity.type}`)}
                  </Tag>
                  {typeof activity.status === 'number' ? (
                    <span
                      className={
                        activity.status === 1
                          ? 'text-xs text-emerald-600'
                          : 'text-xs text-amber-700'
                      }
                    >
                      {activity.status === 1 ? t('common.success') : t('common.fail')}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 truncate text-sm font-medium text-slate-800">
                  {activity.summary || '-'}
                </div>
                <div className="mt-1 text-xs text-slate-500">{activity.account || '-'}</div>
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {activity.occurredAt ? dayjs(activity.occurredAt).format('MM-DD HH:mm') : '-'}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-42 items-center justify-center text-sm text-slate-400">
          {t('dashboard.noData')}
        </div>
      )}
    </section>
  );
}
