import type { ReactNode } from 'react';

export interface MetaPanelProps {
  title: string;
  children: ReactNode;
}

export default function MetaPanel({ title, children }: MetaPanelProps) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/90 p-5">
      <div className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
        {title}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
