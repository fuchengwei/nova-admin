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
          <div className="notification-detail-hero">
            <div className="notification-detail-hero-copy">
              <div className="notification-panel-kicker">{t('notification.detailKicker')}</div>
              <h2>{record.title}</h2>
              <div className="notification-detail-meta">
                <span>{record.publisherName}</span>
                <span>{formatDateTime(record.createTime)}</span>
              </div>
            </div>
            <span className="notification-detail-type">
              {record.type === 'system'
                ? t('notification.typeSystem')
                : record.type === 'permission'
                  ? t('notification.typePermission')
                  : record.type === 'job'
                    ? t('notification.typeJob')
                    : record.type}
            </span>
          </div>
          <div className="notification-detail-status-row">
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
          <div className="notification-delivery-summary">
            <div className="notification-delivery-stats">
              {[
                [t('notification.recipientCount'), record.recipientCount, 'total'],
                [t('notification.readCount'), record.readCount, 'read'],
                [t('notification.recipientUnreadCount'), record.unreadCount, 'unread'],
              ].map(([label, value, tone]) => (
                <div
                  key={String(label)}
                  className={'notification-delivery-stat notification-delivery-stat-' + tone}
                >
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="notification-message-reading">
            <div className="notification-message-reading-label">
              {t('notification.messageContent')}
            </div>
            <div className="notification-message-reading-body">{displayText(record.content)}</div>
            {record.link && <div className="notification-message-reading-link">{record.link}</div>}
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
