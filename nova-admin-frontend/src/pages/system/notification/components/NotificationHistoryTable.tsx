import { EyeOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getNotificationHistory,
  getNotificationHistoryPage,
  type NotificationHistoryRecord,
} from '@/api/notification';
import { displayText } from '@/utils/display';

import NotificationHistoryDrawer from './NotificationHistoryDrawer';

interface NotificationHistoryTableProps {
  refreshToken?: number;
}

export default function NotificationHistoryTable({ refreshToken }: NotificationHistoryTableProps) {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [activeRecord, setActiveRecord] = useState<NotificationHistoryRecord | null>(null);
  const typeLabels: Record<string, string> = {
    system: t('notification.typeSystem'),
    permission: t('notification.typePermission'),
    job: t('notification.typeJob'),
  };

  useEffect(() => {
    if (refreshToken) actionRef.current?.reload();
  }, [refreshToken]);

  const columns: ProColumns<NotificationHistoryRecord>[] = [
    {
      title: t('notification.messageTitle'),
      dataIndex: 'title',
      ellipsis: true,
      width: 240,
    },
    {
      title: t('notification.publishType'),
      dataIndex: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: {
        system: { text: t('notification.typeSystem') },
        permission: { text: t('notification.typePermission') },
        job: { text: t('notification.typeJob') },
      },
      render: (_, record) => (
        <Tag className="notification-type-tag" color="blue">
          {typeLabels[record.type] ?? record.type}
        </Tag>
      ),
    },
    {
      title: t('notification.publisher'),
      dataIndex: 'publisherName',
      width: 140,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('notification.publishTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: t('notification.recipientCount'),
      dataIndex: 'recipientCount',
      width: 100,
      search: false,
    },
    {
      title: t('notification.readCount'),
      dataIndex: 'readCount',
      width: 90,
      search: false,
      render: (value, record) => (
        <div className="notification-count-cell">
          <strong className="notification-count-read">{value}</strong>
          <span className="notification-count-bar">
            <span
              className="notification-count-bar-read"
              style={{
                width:
                  String(
                    record.recipientCount ? (record.readCount / record.recipientCount) * 100 : 0,
                  ) + '%',
              }}
            />
          </span>
        </div>
      ),
    },
    {
      title: t('notification.recipientUnreadCount'),
      dataIndex: 'unreadCount',
      width: 90,
      search: false,
      render: (value, record) => (
        <div className="notification-count-cell">
          <strong className="notification-count-unread">{value}</strong>
          <span className="notification-count-bar">
            <span
              className="notification-count-bar-unread"
              style={{
                width:
                  String(
                    record.recipientCount ? (record.unreadCount / record.recipientCount) * 100 : 0,
                  ) + '%',
              }}
            />
          </span>
        </div>
      ),
    },
    {
      title: t('common.action'),
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={async () => {
            const result = await getNotificationHistory(record.id);
            if (result.code === 0) setActiveRecord(result.data);
          }}
        >
          {t('notification.detail')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProTable<NotificationHistoryRecord>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const result = await getNotificationHistoryPage({
            current: params.current,
            size: params.pageSize,
            title: typeof params.title === 'string' ? params.title : undefined,
            type: typeof params.type === 'string' ? params.type : undefined,
          });
          return {
            data: result.code === 0 ? result.data.records : [],
            success: result.code === 0,
            total: result.code === 0 ? result.data.total : 0,
          };
        }}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        options={{ reload: true, density: true, setting: true }}
      />
      <NotificationHistoryDrawer record={activeRecord} onClose={() => setActiveRecord(null)} />
    </>
  );
}
