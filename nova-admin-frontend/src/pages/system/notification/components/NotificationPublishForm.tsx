import {
  ProForm,
  ProFormDependency,
  ProFormDateTimePicker,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getNotificationRecipientOptions,
  previewNotificationRecipients,
  publishNotification,
  updateNotificationDraft,
  type NotificationDraft,
  type NotificationPublishMode,
  type NotificationPublishRequest,
  type NotificationRecipientPreviewRequest,
} from '@/api/notification';
import { message } from '@/utils/message';

import NotificationAudienceFields from './NotificationAudienceFields';
import styles from '../notification.module.css';

interface NotificationPublishFormProps {
  draft: NotificationDraft | null;
  onPublished: () => void;
}

export default function NotificationPublishForm({
  draft,
  onPublished,
}: NotificationPublishFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<ProFormInstance<NotificationPublishRequest> | undefined>(undefined);
  const [recipientPreviewRequest, setRecipientPreviewRequest] =
    useState<NotificationRecipientPreviewRequest>({
      recipientType: draft?.recipientType ?? 'ALL',
      recipientIds: draft?.recipientIds,
    });
  const [publishMode, setPublishMode] = useState<NotificationPublishMode>(
    draft ? 'DRAFT' : 'IMMEDIATE',
  );
  const { data: recipientOptions = { users: [], roles: [] }, isLoading: recipientOptionsLoading } =
    useQuery({
      queryKey: ['notification', 'recipient-options'],
      queryFn: async () => {
        const result = await getNotificationRecipientOptions();
        return result.code === 0 ? result.data : { users: [], roles: [] };
      },
    });
  const publishMutation = useMutation({
    mutationFn: (data: NotificationPublishRequest) =>
      draft ? updateNotificationDraft(draft.id, data) : publishNotification(data),
  });
  useEffect(() => {
    setPublishMode(draft ? 'DRAFT' : 'IMMEDIATE');
    setRecipientPreviewRequest({
      recipientType: draft?.recipientType ?? 'ALL',
      recipientIds: draft?.recipientIds,
    });
  }, [draft]);
  const hasRecipientSelection =
    recipientPreviewRequest.recipientType === 'ALL' ||
    Boolean(recipientPreviewRequest.recipientIds?.length);
  const recipientPreviewQuery = useQuery({
    queryKey: [
      'notification',
      'recipient-preview',
      recipientPreviewRequest.recipientType,
      recipientPreviewRequest.recipientIds ?? [],
    ],
    queryFn: async () => {
      const result = await previewNotificationRecipients(recipientPreviewRequest);
      if (result.code !== 0) {
        throw new Error(result.msg || t('notification.recipientPreviewFailed'));
      }
      return result.data;
    },
    enabled: hasRecipientSelection,
  });
  const recipientPreview = recipientPreviewQuery.data;
  const canPublish =
    hasRecipientSelection &&
    !recipientPreviewQuery.isFetching &&
    !recipientPreviewQuery.isError &&
    Boolean(recipientPreview?.recipientCount);
  const canSubmit = publishMode === 'DRAFT' || canPublish;
  return (
    <ProForm<NotificationPublishRequest>
      key={draft?.id ?? 'new-notification'}
      className={styles.publishForm}
      formRef={formRef}
      initialValues={
        draft ? { ...draft, mode: 'DRAFT' } : { recipientType: 'ALL', mode: 'IMMEDIATE' }
      }
      layout="vertical"
      submitter={{
        resetButtonProps: false,
        searchConfig: {
          submitText:
            publishMode === 'DRAFT'
              ? t('notification.saveDraft')
              : publishMode === 'SCHEDULED'
                ? t('notification.schedulePublish')
                : t('notification.publish'),
        },
        submitButtonProps: {
          size: 'middle',
          className: 'mt-2',
          disabled: !canSubmit,
          loading: recipientPreviewQuery.isFetching || publishMutation.isPending,
        },
      }}
      onValuesChange={(changedValues, values) => {
        if ('mode' in changedValues) setPublishMode(changedValues.mode ?? 'IMMEDIATE');
        if (!('recipientType' in changedValues) && !('recipientIds' in changedValues)) return;
        setRecipientPreviewRequest({
          recipientType: values.recipientType ?? 'ALL',
          recipientIds: values.recipientIds,
        });
      }}
      onFinish={async (values) => {
        const result = await publishMutation.mutateAsync({ ...values, mode: publishMode });
        if (result.code !== 0) {
          message.error(result.msg || t('notification.publishFailed'));
          return false;
        }
        message.success(
          publishMode === 'DRAFT'
            ? draft
              ? t('notification.draftUpdated')
              : t('notification.draftSaved')
            : publishMode === 'SCHEDULED'
              ? t('notification.scheduleSuccess')
              : t('notification.publishSuccess', { count: result.data.recipientCount }),
        );
        onPublished();
        return true;
      }}
    >
      <div className="grid items-start gap-4 px-0.5 pt-3.5 pb-1 max-[900px]:grid-cols-1 min-[901px]:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.95fr)]">
        <section className="min-w-0 rounded-[10px] border border-slate-200 bg-white px-[18px] pt-4 pb-1 max-[560px]:px-[13px] max-[560px]:pt-3.5">
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] leading-[1.4] font-bold tracking-[0.12em] text-slate-500 uppercase">
                {t('notification.composeKicker')}
              </div>
              <h2 className="mt-[3px] mb-[3px] text-[15px] font-bold text-slate-800">
                {draft ? t('notification.editDraftTitle') : t('notification.composeTitle')}
              </h2>
              <p className="m-0 max-w-[42ch] text-xs leading-[1.55] text-slate-500">
                {draft ? t('notification.editDraftHint') : t('notification.composeHint')}
              </p>
            </div>
          </div>
          <ProFormRadio.Group
            name="mode"
            label={t('notification.publishMode')}
            fieldProps={{ optionType: 'button', buttonStyle: 'solid' }}
            options={[
              { label: t('notification.publishNow'), value: 'IMMEDIATE' },
              { label: t('notification.publishLater'), value: 'SCHEDULED' },
              { label: t('notification.saveAsDraft'), value: 'DRAFT' },
            ]}
          />
          <ProFormDependency name={['mode']}>
            {({ mode }) =>
              mode === 'SCHEDULED' ? (
                <ProFormDateTimePicker
                  name="scheduledAt"
                  label={t('notification.scheduledAt')}
                  fieldProps={{ showTime: true, format: 'YYYY-MM-DD HH:mm:ss' }}
                  transform={(value) =>
                    value ? dayjs(value as string).format('YYYY-MM-DDTHH:mm:ss') : undefined
                  }
                  rules={[{ required: true, message: t('notification.scheduledAtRequired') }]}
                />
              ) : null
            }
          </ProFormDependency>
          <ProFormText
            name="title"
            label={t('notification.messageTitle')}
            fieldProps={{ maxLength: 200, showCount: true }}
            rules={[{ required: true, message: t('notification.messageTitleRequired') }]}
          />
          <ProFormTextArea
            name="content"
            label={t('notification.messageContent')}
            fieldProps={{ autoSize: { minRows: 4, maxRows: 10 }, maxLength: 5000, showCount: true }}
            rules={[{ required: true, message: t('notification.messageContentRequired') }]}
          />
          <ProFormText
            name="link"
            label={t('notification.messageLink')}
            fieldProps={{ maxLength: 500 }}
            tooltip={t('notification.messageLinkHint')}
          />
        </section>
        <NotificationAudienceFields
          formRef={formRef}
          recipientOptions={recipientOptions}
          recipientOptionsLoading={recipientOptionsLoading}
          recipientPreview={recipientPreview}
          hasRecipientSelection={hasRecipientSelection}
          recipientPreviewError={recipientPreviewQuery.isError}
          recipientPreviewFetching={recipientPreviewQuery.isFetching}
        />
      </div>
    </ProForm>
  );
}
