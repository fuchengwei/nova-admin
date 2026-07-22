import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CaretRightOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getJobPage,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
  runJob,
  type SysJob,
  type JobPageQuery,
} from '@/api/job';

const JOB_PAGE_KEY = ['jobPage'];

export default function JobPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchForm] = Form.useForm();
  const [modalForm] = Form.useForm();

  const [pageParams, setPageParams] = useState<JobPageQuery>({ current: 1, size: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SysJob | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...JOB_PAGE_KEY, pageParams],
    queryFn: async () => {
      const res = await getJobPage(pageParams);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.saveSuccess'));
        setModalOpen(false);
        queryClient.invalidateQueries({ queryKey: JOB_PAGE_KEY });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.saveSuccess'));
        setModalOpen(false);
        queryClient.invalidateQueries({ queryKey: JOB_PAGE_KEY });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.deleteSuccess'));
        queryClient.invalidateQueries({ queryKey: JOB_PAGE_KEY });
      }
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.pauseSuccess'));
        queryClient.invalidateQueries({ queryKey: JOB_PAGE_KEY });
      }
    },
  });

  const resumeMutation = useMutation({
    mutationFn: resumeJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.resumeSuccess'));
        queryClient.invalidateQueries({ queryKey: JOB_PAGE_KEY });
      }
    },
  });

  const runMutation = useMutation({
    mutationFn: runJob,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('job.runSuccess'));
      }
    },
  });

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPageParams({ current: 1, size: pageParams.size, ...values });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPageParams({ current: 1, size: 10 });
  };

  const openCreate = () => {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({ jobGroup: 'DEFAULT', misfirePolicy: 'DO_NOTHING', concurrent: 1, status: 0 });
    setModalOpen(true);
  };

  const openEdit = async (record: SysJob) => {
    const res = await getJob(record.id as number);
    setEditing(res.data);
    modalForm.setFieldsValue(res.data);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    modalForm.validateFields().then((values: SysJob) => {
      if (editing) {
        updateMutation.mutate({ ...editing, ...values });
      } else {
        createMutation.mutate(values);
      }
    });
  };

  const columns = [
    { title: t('job.jobName'), dataIndex: 'jobName', key: 'jobName', width: 160 },
    { title: t('job.jobGroup'), dataIndex: 'jobGroup', key: 'jobGroup', width: 100 },
    { title: t('job.invokeTarget'), dataIndex: 'invokeTarget', key: 'invokeTarget', width: 200,
      render: (v: string) => <code>{v}</code> },
    { title: t('job.cronExpression'), dataIndex: 'cronExpression', key: 'cronExpression', width: 150 },
    {
      title: t('job.status'), dataIndex: 'status', key: 'status', width: 90,
      render: (v: number) =>
        v === 1 ? <Tag color="green">{t('job.statusRunning')}</Tag> : <Tag color="default">{t('job.statusPaused')}</Tag>,
    },
    {
      title: t('job.concurrent'), dataIndex: 'concurrent', key: 'concurrent', width: 90,
      render: (v: number) => (v === 1 ? t('job.concurrentAllow') : t('job.concurrentForbid')),
    },
    { title: t('job.remark'), dataIndex: 'remark', key: 'remark', width: 160, render: (v: string) => v || '-' },
    { title: t('job.createTime'), dataIndex: 'createTime', key: 'createTime', width: 170, render: (v: string) => v || '-' },
    {
      title: t('common.action'),
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: SysJob) => (
        <Space size="small">
          <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => runMutation.mutate(record.id as number)}>
            {t('job.run')}
          </Button>
          {record.status === 1 ? (
            <Button type="link" size="small" icon={<PauseCircleOutlined />} onClick={() => pauseMutation.mutate(record.id as number)}>
              {t('job.pause')}
            </Button>
          ) : (
            <Button type="link" size="small" icon={<CaretRightOutlined />} onClick={() => resumeMutation.mutate(record.id as number)}>
              {t('job.resume')}
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('job.edit')}
          </Button>
          <Popconfirm
            title={t('job.deleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id as number)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.job')}</h2>

      <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
        <Form form={searchForm} layout="inline" className="flex flex-wrap gap-2">
          <Form.Item name="jobName" label={t('job.jobName')}>
            <Input placeholder={t('job.jobName')} allowClear />
          </Form.Item>
          <Form.Item name="status" label={t('job.status')}>
            <Select
              placeholder={t('job.status')}
              allowClear
              style={{ width: 130 }}
              options={[
                { label: t('job.statusRunning'), value: 1 },
                { label: t('job.statusPaused'), value: 0 },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('common.search')}
              </Button>
              <Button onClick={handleReset}>{t('common.reset')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="flex-1">
        <div className="flex justify-between mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('job.add')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: JOB_PAGE_KEY })}>
            {t('common.refresh')}
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.records ?? []}
          loading={isLoading}
          scroll={{ x: 1300 }}
          pagination={{
            current: data?.current ?? pageParams.current,
            pageSize: data?.size ?? pageParams.size,
            total: data?.total ?? 0,
            showSizeChanger: true,
            onChange: (page: number, pageSize: number) => setPageParams((prev) => ({ ...prev, current: page, size: pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editing ? t('job.edit') : t('job.add')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <Form form={modalForm} layout="vertical" className="mt-4">
          <Form.Item name="jobName" label={t('job.jobName')} rules={[{ required: true, message: t('job.jobNameRequired') }]}>
            <Input placeholder={t('job.jobName')} />
          </Form.Item>
          <Form.Item name="jobGroup" label={t('job.jobGroup')} rules={[{ required: true }]}>
            <Input placeholder="DEFAULT" />
          </Form.Item>
          <Form.Item
            name="invokeTarget"
            label={t('job.invokeTarget')}
            tooltip="格式：springBeanName.method 或 beanName.method(arg)"
            rules={[{ required: true, message: t('job.invokeTargetRequired') }]}
          >
            <Input placeholder="demoJob.execute" />
          </Form.Item>
          <Form.Item
            name="cronExpression"
            label={t('job.cronExpression')}
            rules={[{ required: true, message: t('job.cronRequired') }]}
          >
            <Input placeholder="0 0/1 * * * ?" />
          </Form.Item>
          <Form.Item name="misfirePolicy" label={t('job.misfirePolicy')} rules={[{ required: true }]}>
            <Select
              options={[
                { label: t('job.misfireDoNothing'), value: 'DO_NOTHING' },
                { label: t('job.misfireFireNow'), value: 'FIRE_NOW' },
              ]}
            />
          </Form.Item>
          <Form.Item name="concurrent" label={t('job.concurrent')} rules={[{ required: true }]}>
            <Select
              options={[
                { label: t('job.concurrentAllow'), value: 1 },
                { label: t('job.concurrentForbid'), value: 0 },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label={t('job.startNow')} valuePropName="checked" getValueProps={(v) => ({ checked: v === 1 })} normalize={(v) => (v ? 1 : 0)}>
            <Switch />
          </Form.Item>
          <Form.Item name="remark" label={t('job.remark')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
