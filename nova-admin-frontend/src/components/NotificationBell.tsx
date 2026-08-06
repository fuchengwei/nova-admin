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

import styles from './NotificationBell.module.css';

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
    <div className="w-[340px] max-w-[calc(100vw-32px)]">
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
        <div className="px-3 pt-[18px] pb-5">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notification.empty')} />
        </div>
      ) : (
        <div className={`max-h-[340px] overflow-y-auto ${styles.list}`}>
          <Space orientation="vertical" size={0} className="w-full">
            {data.records.map((record) => (
              <button
                key={record.id}
                type="button"
                className={`flex w-full min-w-0 items-start gap-2 border-0 border-b border-slate-100 bg-white px-[13px] py-[9px] text-left text-inherit transition-colors duration-150 last:border-b-0 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 motion-reduce:transition-none ${record.read ? '' : 'bg-[#f7faff] hover:bg-[#e8f0ff] focus-visible:bg-[#e8f0ff]'}`}
                disabled={markReadMutation.isPending}
                onClick={() => void handleMessageClick(record)}
              >
                <span
                  className={`mt-[5px] block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200 ${record.read ? '' : 'bg-blue-600'}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <Typography.Text
                      strong={!record.read}
                      ellipsis
                      className="min-w-0 !text-xs !text-slate-800"
                    >
                      {record.title}
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      className="shrink-0 !text-[10px] !leading-[1.3]"
                    >
                      {dayjs(record.createdAt).format('MM-DD HH:mm')}
                    </Typography.Text>
                  </span>
                  <Typography.Paragraph
                    ellipsis={{ rows: 2 }}
                    className="!mt-0.5 !mb-1 !text-[11px] !leading-[1.4] !text-slate-500"
                  >
                    {record.content}
                  </Typography.Paragraph>
                  <span
                    className={`text-[10px] leading-[1.3] ${record.read ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    {typeLabel(record.type)}
                  </span>
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
        root: styles.popover,
        title: styles.popoverTitle,
        content: styles.popoverBody,
      }}
      title={
        <div className="flex items-center justify-between gap-4 text-[13px] font-bold text-slate-900">
          <div className="inline-flex items-baseline gap-1.5">
            <span>{t('notification.title')}</span>
            {data.unreadCount > 0 && (
              <span className="text-[10px] font-medium text-slate-500">
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
        className="inline-flex items-center justify-center leading-none"
        size="small"
        count={data.unreadCount}
        overflowCount={99}
        offset={[-13, 13]}
      >
        <Button
          type="text"
          className={`${styles.bellButton}`}
          icon={<BellOutlined className="!h-5 !w-5 !text-xl" />}
          aria-label={t('notification.open')}
          title={t('notification.open')}
        />
      </Badge>
    </Popover>
  );
}
