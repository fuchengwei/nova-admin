import { useRef } from 'react';
import { Button, Tag, Tabs, Popconfirm } from 'antd';
import { message } from '@/utils/message';
import { DeleteOutlined } from '@ant-design/icons';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getOperationLogPage,
  cleanOperationLog,
  getLoginLogPage,
  cleanLoginLog,
  type OperationLogRecord,
  type LoginLogRecord,
} from '@/api/log';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

const statusEnum = {
  1: { text: '成功', status: 'Success' },
  0: { text: '失败', status: 'Error' },
};

export default function LogPage() {
  const { t } = useTranslation();
  const opActionRef = useRef<ActionType>(null);
  const loginActionRef = useRef<ActionType>(null);

  const cleanOpMutation = useMutation({ mutationFn: cleanOperationLog });
  const cleanLoginMutation = useMutation({ mutationFn: cleanLoginLog });

  const opColumns: ProColumns<OperationLogRecord>[] = [
    {
      title: t('log.module'),
      dataIndex: 'module',
      width: 120,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('log.description'),
      dataIndex: 'description',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('log.requestMethod'),
      dataIndex: 'requestMethod',
      width: 100,
      render: (value) => displayText(value),
    },
    {
      title: t('log.requestUrl'),
      dataIndex: 'requestUrl',
      width: 200,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('log.operator'),
      dataIndex: 'account',
      width: 100,
      render: (value) => displayText(value),
    },
    { title: 'IP', dataIndex: 'ip', width: 130, render: (value) => displayText(value) },
    {
      title: t('log.costMs'),
      dataIndex: 'costMs',
      width: 100,
      render: (value) => (isEmptyDisplayValue(value) ? '-' : `${value}ms`),
    },
    {
      title: t('log.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, r) =>
        r.status === 1 ? (
          <Tag color="green">{t('log.success')}</Tag>
        ) : (
          <Tag color="red">{t('log.fail')}</Tag>
        ),
    },
    {
      title: t('log.createTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (value) => displayText(value),
    },
  ];

  const loginColumns: ProColumns<LoginLogRecord>[] = [
    {
      title: t('log.account'),
      dataIndex: 'account',
      width: 120,
      render: (value) => displayText(value),
    },
    { title: 'IP', dataIndex: 'ip', width: 130, render: (value) => displayText(value) },
    { title: t('log.os'), dataIndex: 'os', width: 140, render: (value) => displayText(value) },
    {
      title: t('log.browser'),
      dataIndex: 'browser',
      width: 140,
      render: (value) => displayText(value),
    },
    {
      title: t('log.loginResult'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, r) =>
        r.status === 1 ? (
          <Tag color="green">{t('log.success')}</Tag>
        ) : (
          <Tag color="red">{t('log.fail')}</Tag>
        ),
    },
    {
      title: t('log.msg'),
      dataIndex: 'msg',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('log.loginTime'),
      dataIndex: 'loginTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (value) => displayText(value),
    },
  ];

  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="mb-4 text-lg font-semibold">{t('menu.log')}</h2>

      <div ref={wrapperRef} className="min-h-0 flex-1">
        <Tabs
          defaultActiveKey="operation"
          className="tabs-fill h-full"
          items={[
            {
              key: 'operation',
              label: t('log.operationTab'),
              children: (
                <div className="min-h-0 flex-1">
                  <ProTable<OperationLogRecord>
                    actionRef={opActionRef}
                    rowKey="id"
                    columns={opColumns}
                    style={{ height: '100%' }}
                    scroll={{ x: 1200, y: scrollY }}
                    request={async (params) => {
                      const res = await getOperationLogPage({
                        current: params.current ?? 1,
                        size: params.pageSize ?? 10,
                        module: params.module,
                        account: params.account,
                        status: params.status,
                      });
                      if (res.code !== 0) return { data: [], success: false, total: 0 };
                      return { data: res.data.records, success: true, total: res.data.total };
                    }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    search={{ labelWidth: 'auto' }}
                    toolBarRender={() => [
                      <Popconfirm
                        key="clean"
                        title={t('log.cleanConfirm')}
                        onConfirm={() => {
                          cleanOpMutation.mutate(undefined, {
                            onSuccess: (res) => {
                              if (res.code === 0) {
                                message.success(t('log.cleanSuccess'));
                                opActionRef.current?.reload();
                              }
                            },
                          });
                        }}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          {t('log.clean')}
                        </Button>
                      </Popconfirm>,
                    ]}
                    options={{ reload: true, density: true, setting: true }}
                  />
                </div>
              ),
            },
            {
              key: 'login',
              label: t('log.loginTab'),
              children: (
                <div className="min-h-0 flex-1">
                  <ProTable<LoginLogRecord>
                    actionRef={loginActionRef}
                    rowKey="id"
                    columns={loginColumns}
                    style={{ height: '100%' }}
                    scroll={{ x: 900, y: scrollY }}
                    request={async (params) => {
                      const res = await getLoginLogPage({
                        current: params.current ?? 1,
                        size: params.pageSize ?? 10,
                        account: params.account,
                        status: params.status,
                      });
                      if (res.code !== 0) return { data: [], success: false, total: 0 };
                      return { data: res.data.records, success: true, total: res.data.total };
                    }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    search={{ labelWidth: 'auto' }}
                    toolBarRender={() => [
                      <Popconfirm
                        key="clean"
                        title={t('log.cleanConfirm')}
                        onConfirm={() => {
                          cleanLoginMutation.mutate(undefined, {
                            onSuccess: (res) => {
                              if (res.code === 0) {
                                message.success(t('log.cleanSuccess'));
                                loginActionRef.current?.reload();
                              }
                            },
                          });
                        }}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          {t('log.clean')}
                        </Button>
                      </Popconfirm>,
                    ]}
                    options={{ reload: true, density: true, setting: true }}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
