import { Button, Popconfirm, Switch } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { UserRecord } from '@/api/user';
import { displayText } from '@/utils/display';

export interface UserColumnDeps {
  onEdit: (record: UserRecord) => void;
  onResetPwd: (record: UserRecord) => void;
  onDelete: (id: string) => void;
  toggleStatus: (id: string, status: number) => void;
  toggleLoading: boolean;
}

/** 用户表格列定义（页面局部逻辑） */
export const useUserColumns = (deps: UserColumnDeps): ProColumns<UserRecord>[] => {
  const { t } = useTranslation();
  const { onEdit, onResetPwd, onDelete, toggleStatus, toggleLoading } = deps;

  return [
    {
      title: t('user.account'),
      dataIndex: 'account',
      width: 120,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('user.nickname'),
      dataIndex: 'nickname',
      width: 120,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('user.dept'),
      dataIndex: 'deptName',
      width: 140,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('user.phone'),
      dataIndex: 'phone',
      width: 130,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('user.status'),
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: {
        1: { text: t('user.enabled'), status: 'Success' },
        0: { text: t('user.disabled'), status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          loading={toggleLoading}
          checkedChildren={t('user.enabled')}
          unCheckedChildren={t('user.disabled')}
          onChange={(checked) => toggleStatus(record.id, checked ? 1 : 0)}
        />
      ),
    },
    {
      title: t('user.createTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('user.action'),
      valueType: 'option',
      key: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        >
          {t('common.edit')}
        </Button>,
        <Button key="pwd" type="link" size="small" onClick={() => onResetPwd(record)}>
          {t('user.resetPwd')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('user.deleteConfirm')}
          onConfirm={() => onDelete(record.id)}
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
};
