import { Tag } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';

import { displayText } from '@/utils/display';

export function formatAuditDateTime(value: unknown) {
  if (typeof value !== 'string' || !dayjs(value).isValid()) {
    return String(displayText(value));
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export function renderLogStatus(t: TFunction, status?: number) {
  return status === 1 ? (
    <Tag color="success" className="m-0 px-2 py-0.5 text-sm">
      {t('log.success')}
    </Tag>
  ) : (
    <Tag color="error" className="m-0 px-2 py-0.5 text-sm">
      {t('log.fail')}
    </Tag>
  );
}

export function renderAuditSectionTitle(icon: ReactNode, title: string) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </span>
      {title}
    </div>
  );
}

export function formatAuditJson(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
