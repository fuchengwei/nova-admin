import { FileSearchOutlined } from '@ant-design/icons';
import { Button, Tag, Tooltip } from 'antd';
import { type ProColumns } from '@ant-design/pro-components';
import type { TFunction } from 'i18next';

import type { LoginLogRecord, OperationLogRecord } from '@/api/log';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

const statusEnum = (t: TFunction) => ({
  1: { text: t('log.success'), status: 'Success' as const },
  0: { text: t('log.fail'), status: 'Error' as const },
});

export function getOperationLogColumns(
  t: TFunction,
  showDetail: (record: OperationLogRecord) => void,
): ProColumns<OperationLogRecord>[] {
  return [
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
      valueEnum: statusEnum(t),
      render: (_, record) =>
        record.status === 1 ? (
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
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'detail',
      fixed: 'right',
      width: 56,
      render: (_, record) => (
        <Tooltip title={t('log.details')}>
          <Button type="text" icon={<FileSearchOutlined />} onClick={() => showDetail(record)} />
        </Tooltip>
      ),
    },
  ];
}

export function getLoginLogColumns(
  t: TFunction,
  showDetail: (record: LoginLogRecord) => void,
): ProColumns<LoginLogRecord>[] {
  return [
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
      valueEnum: statusEnum(t),
      render: (_, record) =>
        record.status === 1 ? (
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
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'detail',
      fixed: 'right',
      width: 56,
      render: (_, record) => (
        <Tooltip title={t('log.details')}>
          <Button type="text" icon={<FileSearchOutlined />} onClick={() => showDetail(record)} />
        </Tooltip>
      ),
    },
  ];
}
