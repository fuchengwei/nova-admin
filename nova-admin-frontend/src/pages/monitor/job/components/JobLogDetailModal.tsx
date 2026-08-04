import { ClockCircleOutlined, CodeOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import type { JobLogRecord } from '@/api/job';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

import { getJobTriggerTypeEnum, renderJobLogStatus } from './jobLogDisplay';

interface JobLogDetailModalProps {
  record: JobLogRecord | null;
  onClose: () => void;
}

function formatExecutionDateTime(value: unknown): string {
  if (typeof value !== 'string' || !dayjs(value).isValid()) {
    return String(displayText(value));
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export default function JobLogDetailModal({ record, onClose }: JobLogDetailModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('job.executionDetails')}
      open={record !== null}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      {record && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-5 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ClockCircleOutlined className="text-blue-600" />
              <span>{formatExecutionDateTime(record.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FieldTimeOutlined className="text-blue-600" />
              <span>{isEmptyDisplayValue(record.costMs) ? '-' : `${record.costMs}ms`}</span>
            </div>
            <div className="flex items-center sm:justify-end">
              {renderJobLogStatus(t, record.status)}
            </div>
          </div>

          <ProDescriptions<JobLogRecord>
            column={{ xs: 1, sm: 2 }}
            layout="vertical"
            size="small"
            dataSource={record}
            columns={[
              {
                title: t('job.jobName'),
                dataIndex: 'jobName',
                render: (value) => displayText(value),
              },
              {
                title: t('job.jobGroup'),
                dataIndex: 'jobGroup',
                render: (value) => displayText(value),
              },
              {
                title: t('job.triggerType'),
                dataIndex: 'triggerType',
                render: (value) =>
                  getJobTriggerTypeEnum(t)[String(value) as 'CRON' | 'MANUAL'] ?? '-',
              },
              {
                title: t('job.executionEndTime'),
                dataIndex: 'endTime',
                render: (value) => formatExecutionDateTime(value),
              },
              {
                title: t('job.invokeTarget'),
                dataIndex: 'invokeTarget',
                span: 2,
                render: (value) => (
                  <code className="break-all text-slate-700">{displayText(value)}</code>
                ),
              },
            ]}
          />

          {!isEmptyDisplayValue(record.errorMsg) && (
            <section className="border-t border-slate-200 pt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <CodeOutlined className="text-red-600" />
                <span>{t('job.executionReason')}</span>
              </div>
              <pre className="m-0 max-h-60 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 font-mono text-xs leading-6 text-red-800">
                {record.errorMsg}
              </pre>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
