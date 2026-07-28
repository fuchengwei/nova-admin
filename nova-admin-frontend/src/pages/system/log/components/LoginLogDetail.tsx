import { ClockCircleOutlined, DesktopOutlined, UserOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';

import type { LoginLogRecord } from '@/api/log';
import { displayText } from '@/utils/display';

import { formatAuditDateTime, renderAuditSectionTitle, renderLogStatus } from './auditDetail';

interface LoginLogDetailProps {
  record: LoginLogRecord;
}

export default function LoginLogDetail({ record }: LoginLogDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ClockCircleOutlined className="text-blue-600" />
          <span>{formatAuditDateTime(record.loginTime)}</span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          {renderLogStatus(t, record.status)}
        </div>
      </div>

      <section>
        {renderAuditSectionTitle(<UserOutlined />, t('log.eventInfo'))}
        <ProDescriptions<LoginLogRecord>
          column={{ xs: 1, sm: 2 }}
          layout="vertical"
          size="small"
          dataSource={record}
          columns={[
            {
              title: t('log.account'),
              dataIndex: 'account',
              render: (value) => displayText(value),
            },
            { title: 'IP', dataIndex: 'ip', render: (value) => displayText(value) },
            { title: t('log.os'), dataIndex: 'os', render: (value) => displayText(value) },
            {
              title: t('log.browser'),
              dataIndex: 'browser',
              render: (value) => displayText(value),
            },
            {
              title: t('log.userAgent'),
              dataIndex: 'userAgent',
              span: 2,
              render: (value) => (
                <span className="break-all text-slate-600">{displayText(value)}</span>
              ),
            },
          ]}
        />
      </section>

      <section className="border-t border-slate-200 pt-5">
        {renderAuditSectionTitle(<DesktopOutlined />, t('log.msg'))}
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {displayText(record.msg)}
        </div>
      </section>
    </div>
  );
}
