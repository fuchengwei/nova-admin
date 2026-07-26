import type { ReactNode } from 'react';
import { Tooltip } from 'antd';

export interface OverviewCardProps {
  accentClass: string;
  action?: ReactNode;
  description: string;
  highlights: Array<{ label: string; value: ReactNode }>;
  icon: ReactNode;
  title: string;
}

const isPrimitiveValue = (value: ReactNode): value is string | number =>
  typeof value === 'string' || typeof value === 'number';

export default function OverviewCard({
  accentClass,
  action,
  description,
  highlights,
  icon,
  title,
}: OverviewCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.32)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${accentClass}`}>
            {icon}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">{title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50/90 p-4">
        {highlights.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
            <span className="shrink-0 whitespace-nowrap text-slate-500">{item.label}</span>
            {isPrimitiveValue(item.value) ? (
              <Tooltip title={String(item.value)}>
                <span className="max-w-[58%] truncate text-right font-medium text-slate-900" title={String(item.value)}>
                  {item.value}
                </span>
              </Tooltip>
            ) : (
              <span className="max-w-[58%] text-right font-medium text-slate-900">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
