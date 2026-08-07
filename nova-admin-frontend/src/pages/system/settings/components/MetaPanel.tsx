import type { ReactNode } from 'react';

export interface MetaPanelProps {
  title: string;
  children: ReactNode;
}

export default function MetaPanel({ title, children }: MetaPanelProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
      <div className="text-xs font-semibold tracking-[0.24em] text-[var(--color-text-muted)] uppercase">
        {title}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
