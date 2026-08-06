import type { ReactNode } from 'react';

export interface MetaRowProps {
  label: string;
  value: ReactNode;
  stacked?: boolean;
}

export default function MetaRow({ label, value, stacked = false }: MetaRowProps) {
  if (stacked) {
    return (
      <div className="space-y-2 text-sm">
        <div className="whitespace-nowrap text-slate-500">{label}</div>
        <div className="overflow-x-auto rounded-xl bg-white px-3 py-2 font-medium whitespace-nowrap text-slate-900">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="w-36 shrink-0 whitespace-nowrap text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 text-right font-medium break-words text-slate-900">
        {value}
      </span>
    </div>
  );
}
