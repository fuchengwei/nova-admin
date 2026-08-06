import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import type { NotificationRecipientPreview } from '@/api/notification';

interface NotificationRecipientPreviewProps {
  data?: NotificationRecipientPreview;
  hasSelection: boolean;
  isError: boolean;
  isFetching: boolean;
}

export default function NotificationRecipientPreview({
  data,
  hasSelection,
  isError,
  isFetching,
}: NotificationRecipientPreviewProps) {
  const { t } = useTranslation();
  const isEmpty = Boolean(data && !data.recipientCount);
  const visibleSamples = data?.samples.slice(0, 3) ?? [];
  const hiddenSamples = data?.samples.slice(3) ?? [];
  const hiddenSampleCount = data ? Math.max(data.recipientCount - visibleSamples.length, 0) : 0;
  const missingSampleCount = data ? Math.max(data.recipientCount - data.samples.length, 0) : 0;

  return (
    <div
      className={`notification-recipient-preview ${
        isError || isEmpty ? 'notification-recipient-preview-warning' : ''
      }`}
    >
      {isFetching ? (
        <div className="notification-recipient-preview-row">
          <LoadingOutlined spin />
          <span>{t('notification.recipientPreviewLoading')}</span>
        </div>
      ) : isError ? (
        <div className="notification-recipient-preview-row">
          <WarningOutlined />
          <span>{t('notification.recipientPreviewFailed')}</span>
        </div>
      ) : !hasSelection ? (
        <div className="notification-recipient-preview-row">
          <InfoCircleOutlined />
          <span>{t('notification.recipientPreviewSelect')}</span>
        </div>
      ) : data?.recipientCount ? (
        <>
          <div className="notification-recipient-preview-row">
            <CheckCircleOutlined />
            <strong>
              {t('notification.recipientPreviewSuccess', { count: data.recipientCount })}
            </strong>
          </div>
          {visibleSamples.length > 0 && (
            <div className="notification-recipient-preview-samples">
              <span>{t('notification.recipientPreviewSamples')}</span>
              <div>
                {visibleSamples.map((sample) => (
                  <Tooltip key={sample.id} title={sample.label} placement="top">
                    <span>{sample.label}</span>
                  </Tooltip>
                ))}
                {hiddenSampleCount > 0 && (
                  <Tooltip
                    title={
                      <div className="notification-recipient-preview-tooltip">
                        {hiddenSamples.map((sample) => (
                          <div key={sample.id}>{sample.label}</div>
                        ))}
                        {missingSampleCount > 0 && (
                          <div>
                            {t('notification.recipientPreviewMore', {
                              count: missingSampleCount,
                            })}
                          </div>
                        )}
                      </div>
                    }
                    placement="top"
                  >
                    <span className="notification-recipient-preview-more">
                      +{hiddenSampleCount}
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="notification-recipient-preview-row">
          <WarningOutlined />
          <span>{t('notification.recipientPreviewEmpty')}</span>
        </div>
      )}
    </div>
  );
}
