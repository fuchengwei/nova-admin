import { useRef, useState } from 'react';
import { FileSearchOutlined } from '@ant-design/icons';
import { Button, Drawer, Tooltip } from 'antd';
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';

import { getJobLogPage, type JobLogPageQuery, type JobLogRecord, type SysJob } from '@/api/job';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

import JobLogDetailModal from './JobLogDetailModal';
import { getJobLogStatusEnum, getJobTriggerTypeEnum, renderJobLogStatus } from './jobLogDisplay';

interface JobLogDrawerProps {
  job: SysJob | null;
  onClose: () => void;
}

export default function JobLogDrawer({ job, onClose }: JobLogDrawerProps) {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [detail, setDetail] = useState<JobLogRecord | null>(null);

  const columns: ProColumns<JobLogRecord>[] = [
    {
      title: t('job.triggerType'),
      dataIndex: 'triggerType',
      width: 110,
      valueType: 'select',
      valueEnum: getJobTriggerTypeEnum(t),
    },
    {
      title: t('job.executionStatus'),
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: getJobLogStatusEnum(t),
      render: (_, record) => renderJobLogStatus(t, record.status),
    },
    {
      title: t('job.executionStartTime'),
      dataIndex: 'startTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('job.duration'),
      dataIndex: 'costMs',
      width: 100,
      search: false,
      render: (value) => (isEmptyDisplayValue(value) ? '-' : `${value}ms`),
    },
    {
      title: t('job.executionReason'),
      dataIndex: 'errorMsg',
      width: 220,
      search: false,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('job.executionTime'),
      dataIndex: 'executionTime',
      valueType: 'dateTimeRange',
      hideInTable: true,
      search: {
        transform: (value) => ({
          createTimeStart: Array.isArray(value) ? value[0] : undefined,
          createTimeEnd: Array.isArray(value) ? value[1] : undefined,
        }),
      },
    },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'detail',
      width: 56,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title={t('job.viewExecutionDetail')}>
          <Button type="text" icon={<FileSearchOutlined />} onClick={() => setDetail(record)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={t('job.executionHistoryFor', { name: displayText(job?.jobName) })}
        open={job !== null}
        onClose={onClose}
        size="large"
        destroyOnHidden
      >
        {job?.id && (
          <ProTable<JobLogRecord>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={async (params) => {
              const payload: JobLogPageQuery = {
                current: params.current ?? 1,
                size: params.pageSize ?? 10,
                jobId: job.id,
                triggerType:
                  typeof params.triggerType === 'string' ? params.triggerType : undefined,
                status: typeof params.status === 'number' ? params.status : undefined,
                createTimeStart:
                  typeof params.createTimeStart === 'string' ? params.createTimeStart : undefined,
                createTimeEnd:
                  typeof params.createTimeEnd === 'string' ? params.createTimeEnd : undefined,
              };
              const result = await getJobLogPage(payload);
              if (result.code !== 0) return { data: [], success: false, total: 0 };
              return { data: result.data.records, success: true, total: result.data.total };
            }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            search={{ labelWidth: 'auto' }}
            options={{ reload: true, density: true, setting: true }}
          />
        )}
      </Drawer>
      <JobLogDetailModal record={detail} onClose={() => setDetail(null)} />
    </>
  );
}
