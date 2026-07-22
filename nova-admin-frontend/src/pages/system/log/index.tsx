import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
} from 'antd';
import {
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getOperationLogPage,
  cleanOperationLog,
  getLoginLogPage,
  cleanLoginLog,
  type OperationLogRecord,
  type LoginLogRecord,
} from '@/api/log';

const OP_LOG_KEY = ['operationLogPage'];
const LOGIN_LOG_KEY = ['loginLogPage'];

export default function LogPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [opSearchForm] = Form.useForm();
  const [loginSearchForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState<'operation' | 'login'>('operation');

  // Operation log state
  const [opPageParams, setOpPageParams] = useState<any>({ current: 1, size: 10 });

  // Login log state
  const [loginPageParams, setLoginPageParams] = useState<any>({ current: 1, size: 10 });

  // ========== Operation Log Queries & Mutations ==========
  const { data: opData, isLoading: opLoading } = useQuery({
    queryKey: [...OP_LOG_KEY, opPageParams],
    queryFn: async () => {
      const res = await getOperationLogPage(opPageParams);
      return res.data;
    },
  });

  const cleanOpMutation = useMutation({
    mutationFn: cleanOperationLog,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('log.cleanSuccess'));
        queryClient.invalidateQueries({ queryKey: OP_LOG_KEY });
      }
    },
  });

  // ========== Login Log Queries & Mutations ==========
  const { data: loginData, isLoading: loginLoading } = useQuery({
    queryKey: [...LOGIN_LOG_KEY, loginPageParams],
    queryFn: async () => {
      const res = await getLoginLogPage(loginPageParams);
      return res.data;
    },
  });

  const cleanLoginMutation = useMutation({
    mutationFn: cleanLoginLog,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('log.cleanSuccess'));
        queryClient.invalidateQueries({ queryKey: LOGIN_LOG_KEY });
      }
    },
  });

  // ========== Operation Log Handlers ==========
  const handleOpSearch = () => {
    const values = opSearchForm.getFieldsValue();
    const params: any = { current: 1, size: opPageParams.size };
    if (values.module) params.module = values.module;
    if (values.username) params.username = values.username;
    if (values.status !== undefined && values.status !== null && values.status !== '')
      params.status = values.status;
    setOpPageParams(params);
  };

  const handleOpReset = () => {
    opSearchForm.resetFields();
    setOpPageParams({ current: 1, size: 10 });
  };

  // ========== Login Log Handlers ==========
  const handleLoginSearch = () => {
    const values = loginSearchForm.getFieldsValue();
    const params: any = { current: 1, size: loginPageParams.size };
    if (values.username) params.username = values.username;
    if (values.status !== undefined && values.status !== null && values.status !== '')
      params.status = values.status;
    setLoginPageParams(params);
  };

  const handleLoginReset = () => {
    loginSearchForm.resetFields();
    setLoginPageParams({ current: 1, size: 10 });
  };

  // ========== Columns ==========
  const opColumns = [
    {
      title: t('log.module'),
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.description'),
      dataIndex: 'description',
      key: 'description',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.requestMethod'),
      dataIndex: 'requestMethod',
      key: 'requestMethod',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.requestUrl'),
      dataIndex: 'requestUrl',
      key: 'requestUrl',
      width: 200,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.operator'),
      dataIndex: 'username',
      key: 'username',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.costMs'),
      dataIndex: 'costMs',
      key: 'costMs',
      width: 100,
      render: (v: number) => (v !== undefined && v !== null ? `${v}ms` : '-'),
    },
    {
      title: t('log.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">{t('log.success')}</Tag>
        ) : (
          <Tag color="red">{t('log.fail')}</Tag>
        ),
    },
    {
      title: t('log.createTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (v: string) => v || '-',
    },
  ];

  const loginColumns = [
    {
      title: t('log.username'),
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.os'),
      dataIndex: 'os',
      key: 'os',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.browser'),
      dataIndex: 'browser',
      key: 'browser',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.loginResult'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">{t('log.success')}</Tag>
        ) : (
          <Tag color="red">{t('log.fail')}</Tag>
        ),
    },
    {
      title: t('log.msg'),
      dataIndex: 'msg',
      key: 'msg',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: t('log.loginTime'),
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.log')}</h2>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'operation' | 'login')}
        items={[
          {
            key: 'operation',
            label: t('log.operationTab'),
            children: (
              <>
                {/* Operation Log Search */}
                <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
                  <Form form={opSearchForm} layout="inline" className="flex flex-wrap gap-2">
                    <Form.Item name="module" label={t('log.module')}>
                      <Input placeholder={t('log.module')} allowClear />
                    </Form.Item>
                    <Form.Item name="username" label={t('log.operator')}>
                      <Input placeholder={t('log.operator')} allowClear />
                    </Form.Item>
                    <Form.Item name="status" label={t('log.status')}>
                      <Select placeholder={t('log.status')} allowClear style={{ width: 120 }}>
                        <Select.Option value={1}>{t('log.success')}</Select.Option>
                        <Select.Option value={0}>{t('log.fail')}</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleOpSearch}>
                          {t('common.search')}
                        </Button>
                        <Button onClick={handleOpReset}>{t('common.reset')}</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>

                {/* Operation Log Table */}
                <Card className="flex-1">
                  <div className="flex justify-between mb-4">
                    <Popconfirm
                      title={t('log.cleanConfirm')}
                      onConfirm={() => cleanOpMutation.mutate()}
                      okText={t('common.confirm')}
                      cancelText={t('common.cancel')}
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        {t('log.clean')}
                      </Button>
                    </Popconfirm>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: OP_LOG_KEY })}
                    >
                      {t('common.reset')}
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={opColumns}
                    dataSource={opData?.records ?? []}
                    loading={opLoading}
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: opData?.current ?? opPageParams.current,
                      pageSize: opData?.size ?? opPageParams.size,
                      total: opData?.total ?? 0,
                      showSizeChanger: true,
                      onChange: (page: number, pageSize: number) => {
                        setOpPageParams((prev: any) => ({ ...prev, current: page, size: pageSize }));
                      },
                    }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'login',
            label: t('log.loginTab'),
            children: (
              <>
                {/* Login Log Search */}
                <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
                  <Form form={loginSearchForm} layout="inline" className="flex flex-wrap gap-2">
                    <Form.Item name="username" label={t('log.username')}>
                      <Input placeholder={t('log.username')} allowClear />
                    </Form.Item>
                    <Form.Item name="status" label={t('log.status')}>
                      <Select placeholder={t('log.status')} allowClear style={{ width: 120 }}>
                        <Select.Option value={1}>{t('log.success')}</Select.Option>
                        <Select.Option value={0}>{t('log.fail')}</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleLoginSearch}>
                          {t('common.search')}
                        </Button>
                        <Button onClick={handleLoginReset}>{t('common.reset')}</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>

                {/* Login Log Table */}
                <Card className="flex-1">
                  <div className="flex justify-between mb-4">
                    <Popconfirm
                      title={t('log.cleanConfirm')}
                      onConfirm={() => cleanLoginMutation.mutate()}
                      okText={t('common.confirm')}
                      cancelText={t('common.cancel')}
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        {t('log.clean')}
                      </Button>
                    </Popconfirm>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: LOGIN_LOG_KEY })}
                    >
                      {t('common.reset')}
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={loginColumns}
                    dataSource={loginData?.records ?? []}
                    loading={loginLoading}
                    scroll={{ x: 900 }}
                    pagination={{
                      current: loginData?.current ?? loginPageParams.current,
                      pageSize: loginData?.size ?? loginPageParams.size,
                      total: loginData?.total ?? 0,
                      showSizeChanger: true,
                      onChange: (page: number, pageSize: number) => {
                        setLoginPageParams((prev: any) => ({ ...prev, current: page, size: pageSize }));
                      },
                    }}
                  />
                </Card>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
