import { useRef } from 'react';
import { Button, Popconfirm, Tag, Typography } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { ProCard, ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { message } from '@/utils/message';
import {
  getUserSessions,
  revokeOtherUserSessions,
  revokeUserSession,
  type UserSession,
} from '@/api/auth';

function formatLoginTime(value: number | undefined, language: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(language === 'en_US' ? 'en-US' : 'zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export default function SessionList() {
  const { t, i18n } = useTranslation();
  const actionRef = useRef<ActionType>(null);

  const revokeMutation = useMutation({
    mutationFn: revokeUserSession,
    onSuccess: (res) => {
      if (res.code !== 0) {
        message.error(res.msg || t('common.error'));
        return;
      }
      message.success(t('profile.sessionRevokeSuccess'));
      actionRef.current?.reload();
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: revokeOtherUserSessions,
    onSuccess: (res) => {
      if (res.code !== 0) {
        message.error(res.msg || t('common.error'));
        return;
      }
      message.success(t('profile.sessionRevokeOthersSuccess'));
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<UserSession>[] = [
    {
      title: t('profile.sessionDevice'),
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (value) => (
        <Typography.Text ellipsis={{ tooltip: true }} style={{ maxWidth: 360 }}>
          {typeof value === 'string' && value.trim() ? value : '-'}
        </Typography.Text>
      ),
    },
    {
      title: t('profile.sessionIp'),
      dataIndex: 'loginIp',
      key: 'loginIp',
      render: (value) => (typeof value === 'string' && value.trim() ? value : '-'),
    },
    {
      title: t('profile.sessionLoginTime'),
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (value) => formatLoginTime(value as number | undefined, i18n.language),
    },
    {
      title: t('profile.sessionStatus'),
      dataIndex: 'current',
      key: 'current',
      render: (_, record) =>
        record.current ? <Tag color="blue">{t('profile.currentSession')}</Tag> : '-',
    },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'option',
      width: 120,
      render: (_, record) =>
        record.current
          ? []
          : [
              <Popconfirm
                key="revoke"
                title={t('profile.sessionRevokeConfirm')}
                onConfirm={() => revokeMutation.mutate(record.accessJti)}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true, loading: revokeMutation.isPending }}
              >
                <Button type="link" danger size="small" icon={<LogoutOutlined />}>
                  {t('profile.sessionRevoke')}
                </Button>
              </Popconfirm>,
            ],
    },
  ];

  return (
    <ProCard
      className="border-[var(--color-border)]! bg-[var(--color-surface)]!"
      title={t('profile.sessionTitle')}
      extra={
        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
            loading={revokeMutation.isPending || revokeOthersMutation.isPending}
          >
            {t('common.refresh')}
          </Button>
          <Popconfirm
            title={t('profile.sessionRevokeOthersConfirm')}
            onConfirm={() => revokeOthersMutation.mutate()}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true, loading: revokeOthersMutation.isPending }}
          >
            <Button danger icon={<LogoutOutlined />}>
              {t('profile.sessionRevokeOthers')}
            </Button>
          </Popconfirm>
        </div>
      }
    >
      <ProTable<UserSession>
        actionRef={actionRef}
        rowKey="accessJti"
        search={false}
        options={false}
        pagination={false}
        columns={columns}
        request={async () => {
          const res = await getUserSessions();
          return {
            data: res.code === 0 ? res.data : [],
            success: res.code === 0,
            total: res.code === 0 ? res.data.length : 0,
          };
        }}
      />
    </ProCard>
  );
}
