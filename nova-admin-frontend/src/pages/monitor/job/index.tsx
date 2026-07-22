import { useRef, useState } from 'react';
import { Button, Tag, Space, Popconfirm, message } from 'antd';
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

const statusEnum = {
  1: { text: '运行中', status: 'Success' },
  0: { text: '已暂停', status: 'Default' },
};

export default function JobPage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);

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
    { title: t('job.jobName'), dataIndex: 'jobName', width: 160, ellipsis: true },
    { title: t('job.jobGroup'), dataIndex: 'jobGroup', width: 100 },
    { title: t('job.invokeTarget'), dataIndex: 'invokeTarget', width: 200, ellipsis: true, render: (v) => <code>{v as string}</code> },
    { title: t('job.cronExpression'), dataIndex: 'cronExpression', width: 150 },
    {
      title: t('job.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, r) =>
        r.status === 1 ? <Tag color="green">{t('job.statusRunning')}</Tag> : <Tag color="default">{t('job.statusPaused')}</Tag>,
    },
    {
      title: t('job.concurrent'),
      dataIndex: 'concurrent',
      width: 100,
      search: false,
      render: (_, r) => (r.concurrent === 1 ? t('job.concurrentAllow') : t('job.concurrentForbid')),
    },
    { title: t('job.remark'), dataIndex: 'remark', width: 160, search: false, render: (v) => (v as string) || '-' },
    { title: t('job.createTime'), dataIndex: 'createTime', width: 170, search: false, render: (v) => (v as string) || '-' },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'option',
      width: 260,
      fixed: 'right',
      render: (_, record) => [
        <Button key="run" type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => runMutation.mutate(record.id as number)}>
          {t('job.run')}
        </Button>,
        record.status === 1 ? (
          <Button key="pause" type="link" size="small" icon={<PauseCircleOutlined />} onClick={() => pauseMutation.mutate(record.id as number)}>
            {t('job.pause')}
          </Button>
        ) : (
          <Button key="resume" type="link" size="small" icon={<CaretRightOutlined />} onClick={() => resumeMutation.mutate(record.id as number)}>
            {t('job.resume')}
          </Button>
        ),
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(record); setModalOpen(true); }}>
          {t('job.edit')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('job.deleteConfirm')}
          onConfirm={() => deleteMutation.mutate(record.id as number)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          okButtonProps={{ danger: true }}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            {t('common.delete')}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold m-0">{t('menu.job')}</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            {t('common.refresh')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            {t('job.add')}
          </Button>
        </Space>
      </div>

      <ProTable<SysJob>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1300 }}
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

      <ModalForm<SysJob>
        title={editing ? t('job.edit') : t('job.add')}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        width={560}
        layout="vertical"
        initialValues={
          editing
            ? { ...editing, id: undefined }
            : { jobGroup: 'DEFAULT', misfirePolicy: 'DO_NOTHING', concurrent: 1, status: 0 }
        }
        onFinish={async (values) => {
          const res = editing
            ? await updateMutation.mutateAsync(values as SysJob)
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
        <ProFormText
          name="jobName"
          label={t('job.jobName')}
          rules={[{ required: true, message: t('job.jobNameRequired') }]}
        />
        <ProFormText name="jobGroup" label={t('job.jobGroup')} rules={[{ required: true }]} />
        <ProFormText
          name="invokeTarget"
          label={t('job.invokeTarget')}
          tooltip="格式：springBeanName.method 或 beanName.method(arg)"
          rules={[{ required: true, message: t('job.invokeTargetRequired') }]}
        />
        <ProFormText
          name="cronExpression"
          label={t('job.cronExpression')}
          rules={[{ required: true, message: t('job.cronRequired') }]}
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
        <ProFormText name="remark" label={t('job.remark')} />
      </ModalForm>
    </div>
  );
}
