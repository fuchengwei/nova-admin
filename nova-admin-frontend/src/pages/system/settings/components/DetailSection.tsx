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
    <ProCard className="overflow-hidden rounded-2xl border border-[var(--color-border)]! bg-[var(--color-surface)]!">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${accentClass}`}
          >
            {icon}
          </div>
          <div>
            <div className="text-[11px] tracking-[0.28em] text-[var(--color-text-muted)] uppercase">
              {eyebrow}
            </div>
            <div className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">
              {title}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </ProCard>
  );
}
