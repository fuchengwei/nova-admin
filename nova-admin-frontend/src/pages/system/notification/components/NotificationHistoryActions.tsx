import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  cancelNotification,
  deleteNotificationDraft,
  getNotificationHistory,
  type NotificationHistoryRecord,
} from '@/api/notification';
import { message } from '@/utils/message';

interface NotificationHistoryActionsProps {
  record: NotificationHistoryRecord;
  onEditDraft: (id: string) => void;
  onOpenDetail: (record: NotificationHistoryRecord) => void;
  onChanged: () => void;
}

export default function NotificationHistoryActions({
  record,
  onEditDraft,
  onOpenDetail,
  onChanged,
}: NotificationHistoryActionsProps) {
  const { t } = useTranslation();
  const cancelMutation = useMutation({ mutationFn: cancelNotification });
  const deleteMutation = useMutation({ mutationFn: deleteNotificationDraft });

  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <Button
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={async () => {
          const result = await getNotificationHistory(record.id);
          if (result.code === 0) onOpenDetail(result.data);
        }}
      >
        {t('notification.detail')}
      </Button>
      {record.status === 'DRAFT' && (
        <>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditDraft(record.id)}
          >
            {t('notification.continueEdit')}
          </Button>
          <Popconfirm
            title={t('notification.deleteDraftConfirm')}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            onConfirm={async () => {
              const result = await deleteMutation.mutateAsync(record.id);
              if (result.code !== 0) {
                message.error(result.msg || t('notification.deleteDraftFailed'));
                return;
              }
              message.success(t('notification.deleteDraftSuccess'));
              onChanged();
            }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </>
      )}
      {record.status === 'SCHEDULED' && (
        <Popconfirm
          title={t('notification.cancelConfirm')}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          onConfirm={async () => {
            const result = await cancelMutation.mutateAsync(record.id);
            if (result.code !== 0) {
              message.error(result.msg || t('notification.cancelFailed'));
              return;
            }
            message.success(t('notification.cancelSuccess'));
            onChanged();
          }}
        >
          <Button type="link" size="small" danger loading={cancelMutation.isPending}>
            {t('notification.cancel')}
          </Button>
        </Popconfirm>
      )}
    </span>
  );
}
