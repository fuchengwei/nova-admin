import type { ReactNode } from 'react';
import { ProCard } from '@ant-design/pro-components';

export interface DetailSectionProps {
  accentClass: string;
  action?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}

export default function DetailSection({
  accentClass,
  action,
  children,
  description,
  eyebrow,
  icon,
  title,
}: DetailSectionProps) {
  return (
    <ProCard className="overflow-hidden rounded-[30px] border border-slate-200/80 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${accentClass}`}
          >
            {icon}
          </div>
          <div>
            <div className="text-[11px] tracking-[0.28em] text-slate-400 uppercase">{eyebrow}</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{title}</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </ProCard>
  );
}
