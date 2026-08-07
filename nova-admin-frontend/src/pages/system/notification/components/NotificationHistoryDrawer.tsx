import { Drawer, Tag } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import {
  getNotificationRecipientsPage,
  type NotificationHistoryRecord,
  type NotificationRecipientRecord,
} from '@/api/notification';
import { displayText } from '@/utils/display';

import styles from '../notification.module.css';

interface NotificationHistoryDrawerProps {
  record: NotificationHistoryRecord | null;
  onClose: () => void;
}

const formatDateTime = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

export default function NotificationHistoryDrawer({
  record,
  onClose,
}: NotificationHistoryDrawerProps) {
  const { t } = useTranslation();
  const statusLabels: Record<string, string> = {
    DRAFT: t('notification.statusDraft'),
    SCHEDULED: t('notification.statusScheduled'),
    SENDING: t('notification.statusSending'),
    SENT: t('notification.statusSent'),
    CANCELED: t('notification.statusCanceled'),
    FAILED: t('notification.statusFailed'),
  };

  return (
    <Drawer
      title={t('notification.historyDetails')}
      open={record !== null}
      onClose={onClose}
      width={820}
      destroyOnHidden
    >
      {record && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3.5 border-b border-[var(--color-border)] pb-[17px]">
            <div>
              <div className="text-[10px] leading-[1.4] font-bold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                {t('notification.detailKicker')}
              </div>
              <h2 className="mt-[3px] mb-[5px] text-[19px] leading-[1.4] font-bold text-[var(--color-text-primary)]">
                {record.title}
              </h2>
              <div className="flex flex-wrap gap-x-3.5 gap-y-2 text-xs text-[var(--color-text-secondary)]">
                <span>{record.publisherName}</span>
                <span>{formatDateTime(record.createTime)}</span>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-[9px] py-1 text-[11px] font-semibold text-[var(--ant-color-primary)]">
              {record.type === 'system'
                ? t('notification.typeSystem')
                : record.type === 'permission'
                  ? t('notification.typePermission')
                  : record.type === 'job'
                    ? t('notification.typeJob')
                    : record.type}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Tag
              color={
                record.status === 'SENT' ? 'green' : record.status === 'FAILED' ? 'red' : 'blue'
              }
            >
              {statusLabels[record.status] ?? record.status ?? t('notification.statusSent')}
            </Tag>
            {record.scheduledAt && (
              <span>
                {t('notification.scheduledAt')}: {formatDateTime(record.scheduledAt)}
              </span>
            )}
            {record.errorMsg && <span className="text-red-500">{record.errorMsg}</span>}
          </div>
          <div className="rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-[3px]">
            <div className="grid grid-cols-3">
              {[
                [t('notification.recipientCount'), record.recipientCount, 'total'],
                [t('notification.readCount'), record.readCount, 'read'],
                [t('notification.recipientUnreadCount'), record.unreadCount, 'unread'],
              ].map(([label, value, tone]) => (
                <div
                  key={String(label)}
                  className={`flex min-w-0 flex-col items-center gap-px px-1.5 pt-2 pb-[7px] ${styles.detailDeliveryStat}`}
                >
                  <strong
                    className={`text-lg leading-[1.1] font-bold ${tone === 'read' ? 'text-emerald-600' : tone === 'unread' ? 'text-amber-600' : 'text-[var(--color-text-primary)]'}`}
                  >
                    {value}
                  </strong>
                  <span className="text-[11px] leading-[1.4] whitespace-nowrap text-[var(--color-text-secondary)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-r-lg border-l-[3px] border-[var(--ant-color-primary)] bg-[var(--color-surface-elevated)] px-3.5 py-3">
            <div className="text-[10px] font-bold tracking-[0.1em] text-[var(--color-text-muted)] uppercase">
              {t('notification.messageContent')}
            </div>
            <div className="mt-1.5 text-[13px] leading-[1.7] whitespace-pre-wrap text-[var(--color-text-primary)]">
              {displayText(record.content)}
            </div>
            {record.link && (
              <div className="mt-2 font-mono text-[11px] break-all text-[var(--ant-color-primary)]">
                {record.link}
              </div>
            )}
          </div>
          <ProTable<NotificationRecipientRecord>
            rowKey="id"
            headerTitle={t('notification.recipientDetails')}
            search={{ labelWidth: 'auto' }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            options={false}
            request={async (params) => {
              const result = await getNotificationRecipientsPage(record.id, {
                current: params.current,
                size: params.pageSize,
                keyword: typeof params.keyword === 'string' ? params.keyword : undefined,
                read:
                  params.read === true || params.read === 'true'
                    ? true
                    : params.read === false || params.read === 'false'
                      ? false
                      : undefined,
              });
              return {
                data: result.code === 0 ? result.data.records : [],
                success: result.code === 0,
                total: result.code === 0 ? result.data.total : 0,
              };
            }}
            columns={[
              {
                title: t('notification.recipientUser'),
                dataIndex: 'keyword',
                render: (_, item) => item.nickname || item.account,
              },
              { title: t('user.account'), dataIndex: 'account', search: false },
              {
                title: t('notification.readStatus'),
                dataIndex: 'read',
                valueType: 'select',
                valueEnum: {
                  true: { text: t('notification.read'), status: 'Success' },
                  false: { text: t('notification.unread'), status: 'Warning' },
                },
                render: (_, item) => (
                  <Tag color={item.read ? 'green' : 'orange'}>
                    {item.read ? t('notification.read') : t('notification.unread')}
                  </Tag>
                ),
              },
              {
                title: t('notification.readTime'),
                dataIndex: 'readAt',
                search: false,
                render: (value) => formatDateTime(value as string),
              },
            ]}
          />
        </div>
      )}
    </Drawer>
  );
}
