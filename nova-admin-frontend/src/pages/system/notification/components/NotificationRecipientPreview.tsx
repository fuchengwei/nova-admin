import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import type { NotificationRecipientPreview } from '@/api/notification';

import styles from '../notification.module.css';

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
      className={`mt-2.5 mb-[13px] rounded-lg border p-3 text-xs ${
        isError || isEmpty
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : 'border-blue-200 bg-[#f8fbff] text-blue-700'
      }`}
    >
      {isFetching ? (
        <div className="flex min-h-5 items-center gap-[7px]">
          <LoadingOutlined spin />
          <span>{t('notification.recipientPreviewLoading')}</span>
        </div>
      ) : isError ? (
        <div className="flex min-h-5 items-center gap-[7px]">
          <WarningOutlined />
          <span>{t('notification.recipientPreviewFailed')}</span>
        </div>
      ) : !hasSelection ? (
        <div className="flex min-h-5 items-center gap-[7px]">
          <InfoCircleOutlined />
          <span>{t('notification.recipientPreviewSelect')}</span>
        </div>
      ) : data?.recipientCount ? (
        <>
          <div className="flex min-h-5 items-center gap-[7px]">
            <CheckCircleOutlined />
            <strong>
              {t('notification.recipientPreviewSuccess', { count: data.recipientCount })}
            </strong>
          </div>
          {visibleSamples.length > 0 && (
            <div
              className={`mt-2 flex items-center gap-2 text-[11px] text-slate-500 ${styles.previewSamples}`}
            >
              <span className="w-[72px] shrink-0 whitespace-nowrap">
                {t('notification.recipientPreviewSamples')}
              </span>
              <div className="flex items-center gap-[5px]">
                {visibleSamples.map((sample) => (
                  <Tooltip key={sample.id} title={sample.label} placement="top">
                    <span>{sample.label}</span>
                  </Tooltip>
                ))}
                {hiddenSampleCount > 0 && (
                  <Tooltip
                    title={
                      <div className="max-h-[220px] overflow-y-auto py-0.5 pr-1 leading-[1.7]">
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
                    <span className={styles.previewMore}>+{hiddenSampleCount}</span>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex min-h-5 items-center gap-[7px]">
          <WarningOutlined />
          <span>{t('notification.recipientPreviewEmpty')}</span>
        </div>
      )}
    </div>
  );
}
