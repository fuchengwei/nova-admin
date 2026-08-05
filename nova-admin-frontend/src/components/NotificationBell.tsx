import { useMemo } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, Popover, Space, Spin, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  getNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from '@/api/notification';
import { message } from '@/utils/message';

const notificationTypeKeys: Record<string, string> = {
  system: 'notification.typeSystem',
  permission: 'notification.typePermission',
  job: 'notification.typeJob',
};

const emptySummary = {
  unreadCount: 0,
  records: [] as NotificationRecord[],
};

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data = emptySummary,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: async () => {
      const result = await getNotificationSummary();
      if (result.code !== 0 || !result.data) {
        throw new Error(result.msg || t('notification.loadFailed'));
      }
      return result.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async (result) => {
      if (result.code !== 0) {
        message.error(result.msg || t('notification.markReadFailed'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] });
    },
    onError: () => message.error(t('notification.markReadFailed')),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async (result) => {
      if (result.code !== 0) {
        message.error(result.msg || t('notification.markReadFailed'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] });
    },
    onError: () => message.error(t('notification.markReadFailed')),
  });

  const typeLabel = useMemo(
    () => (type: string) => t(notificationTypeKeys[type] ?? 'notification.typeDefault'),
    [t],
  );

  const handleMessageClick = async (record: NotificationRecord) => {
    if (!record.read) {
      try {
        const result = await markReadMutation.mutateAsync(record.id);
        if (result.code !== 0) return;
      } catch {
        return;
      }
    }
    if (record.link) navigate(record.link);
  };

  const content = (
    <div className="notification-popover-content">
      {isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Spin size="small" />
        </div>
      ) : isError ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2">
          <Typography.Text type="secondary">{t('notification.loadFailed')}</Typography.Text>
          <Button type="link" size="small" onClick={() => void refetch()}>
            {t('notification.retry')}
          </Button>
        </div>
      ) : data.records.length === 0 ? (
        <div className="notification-empty-state">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notification.empty')} />
        </div>
      ) : (
        <div className="notification-list">
          <Space orientation="vertical" size={0} className="w-full">
            {data.records.map((record) => (
              <button
                key={record.id}
                type="button"
                className={`notification-item ${record.read ? '' : 'notification-item-unread'}`}
                disabled={markReadMutation.isPending}
                onClick={() => void handleMessageClick(record)}
              >
                <span
                  className={`notification-item-dot ${record.read ? '' : 'notification-item-dot-unread'}`}
                  aria-hidden="true"
                />
                <span className="notification-item-main">
                  <span className="notification-item-header">
                    <Typography.Text strong={!record.read} ellipsis>
                      {record.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="notification-item-time">
                      {dayjs(record.createdAt).format('MM-DD HH:mm')}
                    </Typography.Text>
                  </span>
                  <Typography.Paragraph
                    ellipsis={{ rows: 2 }}
                    className="notification-item-content"
                  >
                    {record.content}
                  </Typography.Paragraph>
                  <span className="notification-item-type">{typeLabel(record.type)}</span>
                </span>
              </button>
            ))}
          </Space>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      classNames={{
        root: 'notification-popover',
        title: 'notification-popover-title',
        content: 'notification-popover-body',
      }}
      title={
        <div className="notification-popover-heading">
          <div className="notification-popover-title-group">
            <span>{t('notification.title')}</span>
            {data.unreadCount > 0 && (
              <span className="notification-unread-count">
                {t('notification.unreadCount', { count: data.unreadCount })}
              </span>
            )}
          </div>
          <Button
            type="link"
            size="small"
            disabled={data.unreadCount === 0 || markAllReadMutation.isPending}
            loading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            {t('notification.markAllRead')}
          </Button>
        </div>
      }
      content={content}
    >
      <Badge
        className="notification-bell-badge"
        size="small"
        count={data.unreadCount}
        overflowCount={99}
        offset={[-13, 13]}
      >
        <Button
          type="text"
          size="middle"
          className="notification-bell-button"
          icon={<BellOutlined />}
          aria-label={t('notification.open')}
          title={t('notification.open')}
        />
      </Badge>
    </Popover>
  );
}
