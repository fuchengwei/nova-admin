import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Result, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { getDashboardOverview, type DashboardRange } from '@/api/dashboard';
import ActivityTrendChart from './components/ActivityTrendChart';
import DashboardHeader from './components/DashboardHeader';
import DashboardStatCards from './components/DashboardStatCards';
import RecentActivities from './components/RecentActivities';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DashboardRange>('7d');
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'overview', range],
    queryFn: async () => {
      const response = await getDashboardOverview(range);
      if (response.code !== 0) throw new Error(response.msg);
      return response.data;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <Skeleton active paragraph={{ rows: 14 }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <Result
          status="error"
          title={t('dashboard.loadFailed')}
          extra={
            <Button type="primary" onClick={() => refetch()}>
              {t('dashboard.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex w-full flex-col gap-5 pb-6">
        <DashboardHeader runtime={data.runtime.data} updatedAt={data.updatedAt} />
        <DashboardStatCards
          available={data.stats.available}
          runtime={data.runtime.available ? data.runtime.data : undefined}
          stats={data.stats.data}
        />
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
          <ActivityTrendChart
            available={data.trend.available}
            data={data.trend.data}
            loading={isFetching}
            range={range}
            onRangeChange={setRange}
          />
          <RecentActivities
            available={data.activities.available}
            activities={data.activities.data}
          />
        </div>
      </div>
    </div>
  );
}
