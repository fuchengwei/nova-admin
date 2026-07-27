import { useRef, useState } from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { message } from '@/utils/message';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CaretRightOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormRadio,
  type ProColumns,
  type ActionType,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getJobPage,
  createJob,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
  runJob,
  type SysJob,
  type JobPageQuery,
} from '@/api/job';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import { displayText, isEmptyDisplayValue } from '@/utils/display';
import { useUserStore } from '@/stores/userStore';
import { hasPermission } from '@/utils/layout';
import CronExpressionField from './components/CronExpressionField';
import { describeCron } from './cron';

export default function JobPage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const permissions = useUserStore((state) => state.permissions);
  const roles = useUserStore((state) => state.roles);
  const hasJobPermission = (permission: string) =>
    roles.includes('super_admin') || hasPermission(permission, permissions);
  const canCreate = hasJobPermission('monitor:job:add');
  const canEdit = hasJobPermission('monitor:job:edit');
  const canDelete = hasJobPermission('monitor:job:remove');
  const canRun = hasJobPermission('monitor:job:run');
  const canPause = hasJobPermission('monitor:job:pause');
  const canResume = hasJobPermission('monitor:job:resume');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SysJob | null>(null);

  const createMutation = useMutation({ mutationFn: createJob });
  const updateMutation = useMutation({ mutationFn: updateJob });
  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.deleteSuccess'));
        actionRef.current?.reload();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.pauseSuccess'));
        actionRef.current?.reload();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const resumeMutation = useMutation({
    mutationFn: resumeJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.resumeSuccess'));
        actionRef.current?.reload();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const runMutation = useMutation({
    mutationFn: runJob,
    onSuccess: (res) => {
      if (res.code === 0) message.success(t('job.runSuccess'));
      else message.error(res.msg || t('common.error'));
    },
  });

  const columns: ProColumns<SysJob>[] = [
    {
      title: t('job.jobName'),
      dataIndex: 'jobName',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('job.jobGroup'),
      dataIndex: 'jobGroup',
      width: 100,
      render: (value) => displayText(value),
    },
    {
      title: t('job.invokeTarget'),
      dataIndex: 'invokeTarget',
      width: 200,
      ellipsis: true,
      render: (value) => (isEmptyDisplayValue(value) ? '-' : <code>{displayText(value)}</code>),
    },
    {
      title: t('job.cronExpression'),
      dataIndex: 'cronExpression',
      width: 180,
      render: (value) =>
        isEmptyDisplayValue(value) ? (
          '-'
        ) : (
          <Tooltip title={describeCron(value, t)}>
            <code>{displayText(value)}</code>
          </Tooltip>
        ),
    },
    {
      title: t('job.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: t('job.statusRunning'), status: 'Success' },
        0: { text: t('job.statusPaused'), status: 'Default' },
      },
      render: (_, r) =>
        r.status === 1 ? (
          <Tag color="green">{t('job.statusRunning')}</Tag>
        ) : (
          <Tag color="default">{t('job.statusPaused')}</Tag>
        ),
    },
    {
      title: t('job.concurrent'),
      dataIndex: 'concurrent',
      width: 100,
      search: false,
      render: (_, record) =>
        isEmptyDisplayValue(record.concurrent)
          ? '-'
          : record.concurrent === 1
            ? t('job.concurrentAllow')
            : t('job.concurrentForbid'),
    },
    {
      title: t('job.remark'),
      dataIndex: 'remark',
      width: 160,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('job.createTime'),
      dataIndex: 'createTime',
      width: 170,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'option',
      width: 144,
      fixed: 'right',
      render: (_, record) =>
        [
          canRun && (
            <Tooltip key="run" title={t('job.run')}>
              <Button
                type="text"
                size="small"
                aria-label={t('job.run')}
                icon={<PlayCircleOutlined />}
                onClick={() => runMutation.mutate(record.id as number)}
              />
            </Tooltip>
          ),
          record.status === 1 && canPause ? (
            <Tooltip key="pause" title={t('job.pause')}>
              <Button
                type="text"
                size="small"
                aria-label={t('job.pause')}
                icon={<PauseCircleOutlined />}
                onClick={() => pauseMutation.mutate(record.id as number)}
              />
            </Tooltip>
          ) : record.status !== 1 && canResume ? (
            <Tooltip key="resume" title={t('job.resume')}>
              <Button
                type="text"
                size="small"
                aria-label={t('job.resume')}
                icon={<CaretRightOutlined />}
                onClick={() => resumeMutation.mutate(record.id as number)}
              />
            </Tooltip>
          ) : null,
          canEdit && (
            <Tooltip key="edit" title={t('job.edit')}>
              <Button
                type="text"
                size="small"
                aria-label={t('job.edit')}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(record);
                  setModalOpen(true);
                }}
              />
            </Tooltip>
          ),
          canDelete && (
            <Popconfirm
              key="del"
              title={t('job.deleteConfirm')}
              onConfirm={() => deleteMutation.mutate(record.id as number)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={t('common.delete')}>
                <Button
                  type="text"
                  size="small"
                  danger
                  aria-label={t('common.delete')}
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          ),
        ].filter(Boolean),
    },
  ];

  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-lg font-semibold">{t('menu.job')}</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            {t('common.refresh')}
          </Button>
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              {t('job.add')}
            </Button>
          )}
        </Space>
      </div>

      <div ref={wrapperRef} className="min-h-0 flex-1">
        <ProTable<SysJob>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          style={{ height: '100%' }}
          scroll={{ x: 1400, y: scrollY }}
          request={async (params) => {
            const payload: JobPageQuery = {
              current: params.current ?? 1,
              size: params.pageSize ?? 10,
              jobName: params.jobName,
              status: params.status,
            };
            const res = await getJobPage(payload);
            if (res.code !== 0) return { data: [], success: false, total: 0 };
            return { data: res.data.records, success: true, total: res.data.total };
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          search={{ labelWidth: 'auto' }}
          options={{ reload: true, density: true, setting: true }}
        />
      </div>

      <ModalForm<SysJob>
        title={editing ? t('job.edit') : t('job.add')}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        width={640}
        layout="vertical"
        modalProps={{ destroyOnHidden: true }}
        initialValues={
          editing
            ? editing
            : { jobGroup: 'DEFAULT', misfirePolicy: 'DO_NOTHING', concurrent: 1, status: 0 }
        }
        onFinish={async (values) => {
          const res = editing
            ? await updateMutation.mutateAsync({ ...values, id: editing.id })
            : await createMutation.mutateAsync(values as SysJob);
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(t('job.saveSuccess'));
          actionRef.current?.reload();
          return true;
        }}
      >
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <ProFormText
            name="jobName"
            label={t('job.jobName')}
            rules={[{ required: true, message: t('job.jobNameRequired') }]}
          />
          <ProFormText name="jobGroup" label={t('job.jobGroup')} rules={[{ required: true }]} />
          <ProFormText
            name="invokeTarget"
            label={t('job.invokeTarget')}
            tooltip={t('job.invokeTargetHelp')}
            rules={[{ required: true, message: t('job.invokeTargetRequired') }]}
          />
          <ProFormSelect
            name="misfirePolicy"
            label={t('job.misfirePolicy')}
            rules={[{ required: true }]}
            options={[
              { label: t('job.misfireDoNothing'), value: 'DO_NOTHING' },
              { label: t('job.misfireFireNow'), value: 'FIRE_NOW' },
            ]}
          />
          <div className="col-span-2">
            <CronExpressionField />
          </div>
          <ProFormSelect
            name="concurrent"
            label={t('job.concurrent')}
            rules={[{ required: true }]}
            options={[
              { label: t('job.concurrentAllow'), value: 1 },
              { label: t('job.concurrentForbid'), value: 0 },
            ]}
          />
          <ProFormRadio.Group
            name="status"
            label={t('job.startNow')}
            rules={[{ required: true }]}
            options={[
              { label: t('job.statusRunning'), value: 1 },
              { label: t('job.statusPaused'), value: 0 },
            ]}
          />
          <ProFormText className="col-span-2" name="remark" label={t('job.remark')} />
        </div>
      </ModalForm>
    </div>
  );
}
