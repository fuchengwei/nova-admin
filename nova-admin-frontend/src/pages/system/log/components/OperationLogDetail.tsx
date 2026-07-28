import {
  ApiOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DesktopOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';

import type { OperationLogRecord } from '@/api/log';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

import {
  formatAuditDateTime,
  formatAuditJson,
  renderAuditSectionTitle,
  renderLogStatus,
} from './auditDetail';

interface OperationLogDetailProps {
  record: OperationLogRecord;
}

export default function OperationLogDetail({ record }: OperationLogDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-5 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ClockCircleOutlined className="text-blue-600" />
          <span>{formatAuditDateTime(record.createTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FieldTimeOutlined className="text-blue-600" />
          <span>{isEmptyDisplayValue(record.costMs) ? '-' : `${record.costMs}ms`}</span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          {renderLogStatus(t, record.status)}
        </div>
      </div>

      <section>
        {renderAuditSectionTitle(<AuditOutlined />, t('log.eventInfo'))}
        <ProDescriptions<OperationLogRecord>
          column={{ xs: 1, sm: 2 }}
          layout="vertical"
          size="small"
          dataSource={record}
          columns={[
            { title: t('log.module'), dataIndex: 'module', render: (value) => displayText(value) },
            { title: t('log.action'), dataIndex: 'action', render: (value) => displayText(value) },
            {
              title: t('log.javaMethod'),
              dataIndex: 'javaMethod',
              render: (value) => displayText(value),
            },
            {
              title: t('log.operator'),
              dataIndex: 'account',
              render: (value) => displayText(value),
            },
          ]}
        />
      </section>

      <section className="border-t border-slate-200 pt-5">
        {renderAuditSectionTitle(<ApiOutlined />, t('log.requestContext'))}
        <ProDescriptions<OperationLogRecord>
          column={{ xs: 1, sm: 2 }}
          layout="vertical"
          size="small"
          dataSource={record}
          columns={[
            {
              title: t('log.requestMethod'),
              dataIndex: 'requestMethod',
              render: (value) => displayText(value),
            },
            { title: 'IP', dataIndex: 'ip', render: (value) => displayText(value) },
            {
              title: t('log.requestUrl'),
              dataIndex: 'requestUrl',
              span: 2,
              render: (value) => (
                <code className="break-all text-slate-700">{displayText(value)}</code>
              ),
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
        {renderAuditSectionTitle(<CodeOutlined />, t('log.requestArgs'))}
        <pre className="m-0 max-h-72 overflow-auto rounded-md border border-slate-700 bg-slate-800 p-4 font-mono text-xs leading-6 text-slate-100">
          {isEmptyDisplayValue(record.javaArgs) ? '-' : formatAuditJson(record.javaArgs)}
        </pre>
      </section>

      {record.status !== 1 && (
        <section className="border-t border-slate-200 pt-5">
          {renderAuditSectionTitle(<DesktopOutlined />, t('log.errorMessage'))}
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {displayText(record.errorMsg)}
          </div>
        </section>
      )}
    </div>
  );
}
