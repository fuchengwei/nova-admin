import { useMemo } from 'react';
import { Line } from '@ant-design/charts';
import { Segmented } from 'antd';
import { useTranslation } from 'react-i18next';
import type { DashboardRange, DashboardTrendPoint } from '@/api/dashboard';
import { useAppStore } from '@/stores/appStore';

interface ActivityTrendChartProps {
  available: boolean;
  data: DashboardTrendPoint[];
  loading: boolean;
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
}

export default function ActivityTrendChart({
  available,
  data,
  loading,
  range,
  onRangeChange,
}: ActivityTrendChartProps) {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const chartData = useMemo(
    () =>
      data.flatMap((point) => [
        { date: point.date, metric: t('dashboard.loginTrend'), count: point.loginCount },
        { date: point.date, metric: t('dashboard.operationTrend'), count: point.operationCount },
      ]),
    [data, t],
  );

  return (
    <section className="h-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold text-[var(--color-text-primary)]">
            {t('dashboard.activityTrend')}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {t('dashboard.activityTrendDesc')}
          </p>
        </div>
        <Segmented<DashboardRange>
          options={[
            { label: t('dashboard.days7'), value: '7d' },
            { label: t('dashboard.days30'), value: '30d' },
          ]}
          value={range}
          onChange={onRangeChange}
        />
      </div>
      <div className="h-[340px]">
        {available && chartData.length > 0 ? (
          <Line
            data={chartData}
            xField="date"
            yField="count"
            colorField="metric"
            shapeField="smooth"
            area={{ style: { fillOpacity: 0.06 } }}
            axis={{
              x: { labelAutoHide: true, labelAutoRotate: false, title: false },
              y: { grid: true, title: false },
            }}
            tooltip={{ title: 'date' }}
            legend={{ color: { position: 'bottom' } }}
            theme={theme === 'dark' ? 'classicDark' : 'classic'}
            interaction={{ tooltip: { shared: true } }}
            animate={false}
            loading={loading}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            {t('dashboard.noData')}
          </div>
        )}
      </div>
    </section>
  );
}
