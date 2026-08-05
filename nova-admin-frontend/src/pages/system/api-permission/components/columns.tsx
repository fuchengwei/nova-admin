import { SettingOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Tooltip } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import type { TFunction } from 'i18next';

import type { ApiPermissionRecord } from '@/api/menu';
import { displayText } from '@/utils/display';

export interface ApiPermissionTableRow extends ApiPermissionRecord {
  rowKey: string;
  method: string;
  path: string;
  summary?: string;
}

interface ApiPermissionColumnOptions {
  t: TFunction;
  roleLabels: Map<string, string>;
  canEdit: boolean;
  rolesLoading: boolean;
  roleMutationPending: boolean;
  onConfigure: (record: ApiPermissionRecord) => void;
}

const statusColor: Record<ApiPermissionRecord['status'], string> = {
  REGISTERED: 'green',
  SYNCABLE: 'blue',
};

const methodColor: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'purple',
  DELETE: 'red',
  ANY: 'cyan',
};

const methodValueEnum = {
  GET: { text: <Tag color={methodColor.GET}>GET</Tag> },
  POST: { text: <Tag color={methodColor.POST}>POST</Tag> },
  PUT: { text: <Tag color={methodColor.PUT}>PUT</Tag> },
  PATCH: { text: <Tag color={methodColor.PATCH}>PATCH</Tag> },
  DELETE: { text: <Tag color={methodColor.DELETE}>DELETE</Tag> },
  ANY: { text: <Tag color={methodColor.ANY}>ANY</Tag> },
};

export function getApiPermissionColumns({
  t,
  roleLabels,
  canEdit,
  rolesLoading,
  roleMutationPending,
  onConfigure,
}: ApiPermissionColumnOptions): ProColumns<ApiPermissionTableRow>[] {
  return [
    {
      title: t('menu.apiPermissionUrl'),
      dataIndex: 'path',
      width: 240,
      ellipsis: true,
      render: (value) => <code>{displayText(value)}</code>,
    },
    {
      title: t('menu.apiPermissionMethod'),
      dataIndex: 'method',
      width: 100,
      valueType: 'select',
      valueEnum: methodValueEnum,
      render: (_, record) => (
        <Tag color={methodColor[record.method] ?? 'default'}>{record.method}</Tag>
      ),
    },
    {
      title: t('menu.apiPermission'),
      dataIndex: 'permission',
      width: 180,
      ellipsis: true,
      render: (value) => <code>{displayText(value)}</code>,
    },
    {
      title: t('menu.apiPermissionSummary'),
      dataIndex: 'summary',
      width: 180,
      ellipsis: true,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('menu.apiPermissionStatus'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        REGISTERED: { text: t('menu.apiPermissionRegistered'), status: 'Success' },
        SYNCABLE: { text: t('menu.apiPermissionSyncable'), status: 'Processing' },
      },
      render: (_, record) => (
        <Tag color={statusColor[record.status]}>
          {t(`menu.apiPermission${record.status[0]}${record.status.slice(1).toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('menu.apiPermissionRoles'),
      dataIndex: 'roleIds',
      width: 280,
      search: false,
      render: (_, record) => {
        const assignedRoles = (record.roleIds ?? [])
          .map((roleId) => roleLabels.get(roleId))
          .filter((label): label is string => Boolean(label));
        return assignedRoles.length > 0 ? (
          <Space size={[4, 4]} wrap>
            {assignedRoles.slice(0, 2).map((label) => (
              <Tag key={label} color="blue">
                {label}
              </Tag>
            ))}
            {assignedRoles.length > 2 && <Tag>+{assignedRoles.length - 2}</Tag>}
          </Space>
        ) : (
          <span className="text-slate-400">{t('menu.apiPermissionNoAssignedRole')}</span>
        );
      },
    },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'roleAction',
      width: 120,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Tooltip
          title={
            record.status === 'REGISTERED'
              ? t('menu.apiPermissionAssignRole')
              : t('menu.apiPermissionRoleSyncFirst')
          }
        >
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            disabled={
              !canEdit || record.status !== 'REGISTERED' || rolesLoading || roleMutationPending
            }
            onClick={() => onConfigure(record)}
          >
            {t('menu.apiPermissionConfigureRoles')}
          </Button>
        </Tooltip>
      ),
    },
  ];
}
