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
    <div className="w-[min(360px,calc(100vw-32px))]">
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
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notification.empty')} />
      ) : (
        <div className="max-h-96 overflow-y-auto pr-1">
          <Space direction="vertical" size={4} className="w-full">
            {data.records.map((record) => (
              <button
                key={record.id}
                type="button"
                className={`w-full rounded-lg border-0 px-3 py-2 text-left transition-colors hover:bg-slate-50 ${
                  record.read ? 'bg-white' : 'bg-blue-50/70'
                }`}
                disabled={markReadMutation.isPending}
                onClick={() => void handleMessageClick(record)}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      record.read ? 'bg-slate-200' : 'bg-blue-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <Typography.Text strong={!record.read} ellipsis>
                        {record.title}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="shrink-0 text-xs">
                        {dayjs(record.createdAt).format('MM-DD HH:mm')}
                      </Typography.Text>
                    </span>
                    <Typography.Paragraph ellipsis={{ rows: 2 }} className="mt-1 mb-1 text-xs">
                      {record.content}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" className="text-xs">
                      {typeLabel(record.type)}
                    </Typography.Text>
                  </span>
                </div>
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
      title={
        <div className="flex items-center justify-between gap-6">
          <span>{t('notification.title')}</span>
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
      <Badge count={data.unreadCount} overflowCount={99} size="small" offset={[-2, 4]}>
        <Button
          type="text"
          size="large"
          className="notification-bell-button"
          icon={<BellOutlined />}
          aria-label={t('notification.open')}
          title={t('notification.open')}
        />
      </Badge>
    </Popover>
  );
}
