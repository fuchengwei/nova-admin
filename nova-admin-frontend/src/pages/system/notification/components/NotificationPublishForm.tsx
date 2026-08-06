import {
  ProForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { GlobalOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getNotificationRecipientOptions,
  previewNotificationRecipients,
  publishNotification,
  type NotificationPublishRequest,
  type NotificationRecipientOption,
  type NotificationRecipientPreviewRequest,
  type NotificationRecipientType,
} from '@/api/notification';
import { message } from '@/utils/message';

import NotificationRecipientPreview from './NotificationRecipientPreview';

interface NotificationPublishFormProps {
  onPublished: () => void;
}

const recipientTypeOptions: NotificationRecipientType[] = ['ALL', 'ROLE', 'USER'];

const toSelectOptions = (options: NotificationRecipientOption[]) =>
  options.map(({ id, label }) => ({ label, value: id }));

export default function NotificationPublishForm({ onPublished }: NotificationPublishFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<ProFormInstance<NotificationPublishRequest> | undefined>(undefined);
  const [recipientPreviewRequest, setRecipientPreviewRequest] =
    useState<NotificationRecipientPreviewRequest>({ recipientType: 'ALL' });
  const { data: recipientOptions = { users: [], roles: [] }, isLoading: recipientOptionsLoading } =
    useQuery({
      queryKey: ['notification', 'recipient-options'],
      queryFn: async () => {
        const result = await getNotificationRecipientOptions();
        return result.code === 0 ? result.data : { users: [], roles: [] };
      },
    });
  const publishMutation = useMutation({ mutationFn: publishNotification });
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
  const recipientTypeLabels: Record<NotificationRecipientType, string> = {
    ALL: t('notification.recipientAll'),
    ROLE: t('notification.recipientRole'),
    USER: t('notification.recipientUser'),
  };

  return (
    <ProForm<NotificationPublishRequest>
      className="notification-publish-form"
      formRef={formRef}
      initialValues={{ recipientType: 'ALL' }}
      layout="vertical"
      submitter={{
        resetButtonProps: false,
        searchConfig: { submitText: t('notification.publish') },
        submitButtonProps: {
          size: 'middle',
          className: 'mt-2',
          disabled: !canPublish,
          loading: recipientPreviewQuery.isFetching,
        },
      }}
      onValuesChange={(changedValues, values) => {
        if (!('recipientType' in changedValues) && !('recipientIds' in changedValues)) return;
        setRecipientPreviewRequest({
          recipientType: values.recipientType ?? 'ALL',
          recipientIds: values.recipientIds,
        });
      }}
      onFinish={async (values) => {
        const result = await publishMutation.mutateAsync(values);
        if (result.code !== 0) {
          message.error(result.msg || t('notification.publishFailed'));
          return false;
        }
        message.success(t('notification.publishSuccess', { count: result.data }));
        onPublished();
        return true;
      }}
    >
      <div className="notification-publish-layout">
        <section className="notification-compose-panel">
          <div className="notification-panel-heading">
            <div>
              <div className="notification-panel-kicker">{t('notification.composeKicker')}</div>
              <h2>{t('notification.composeTitle')}</h2>
              <p>{t('notification.composeHint')}</p>
            </div>
          </div>
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
        <section className="notification-audience-panel">
          <div className="notification-panel-heading">
            <div>
              <div className="notification-panel-kicker">{t('notification.audienceKicker')}</div>
              <h2>{t('notification.audienceTitle')}</h2>
              <p>{t('notification.audienceHint')}</p>
            </div>
            <span className="notification-audience-signal" aria-hidden="true">
              <GlobalOutlined />
            </span>
          </div>
          <ProFormRadio.Group
            name="recipientType"
            label={t('notification.recipientType')}
            className="notification-recipient-mode"
            fieldProps={{
              optionType: 'button',
              buttonStyle: 'solid',
              className: 'notification-recipient-mode-group',
              onChange: () => formRef.current?.setFieldValue('recipientIds', undefined),
            }}
            options={recipientTypeOptions.map((value) => ({
              label: (
                <span className="notification-recipient-option">
                  {value === 'ALL' ? (
                    <GlobalOutlined />
                  ) : value === 'ROLE' ? (
                    <TeamOutlined />
                  ) : (
                    <UserOutlined />
                  )}
                  {recipientTypeLabels[value]}
                </span>
              ),
              value,
            }))}
            rules={[{ required: true }]}
          />
          <ProFormDependency name={['recipientType']}>
            {({ recipientType }) => {
              if (recipientType === 'ROLE') {
                return (
                  <ProFormSelect
                    name="recipientIds"
                    label={t('notification.recipientRoles')}
                    preserve={false}
                    fieldProps={{
                      loading: recipientOptionsLoading,
                      mode: 'multiple',
                      options: toSelectOptions(recipientOptions.roles),
                      maxTagCount: 'responsive',
                      showSearch: true,
                      optionFilterProp: 'label',
                    }}
                    rules={[{ required: true, message: t('notification.recipientRequired') }]}
                  />
                );
              }
              if (recipientType === 'USER') {
                return (
                  <ProFormSelect
                    name="recipientIds"
                    label={t('notification.recipientUsers')}
                    preserve={false}
                    fieldProps={{
                      loading: recipientOptionsLoading,
                      mode: 'multiple',
                      options: toSelectOptions(recipientOptions.users),
                      maxTagCount: 'responsive',
                      showSearch: true,
                      optionFilterProp: 'label',
                    }}
                    rules={[{ required: true, message: t('notification.recipientRequired') }]}
                  />
                );
              }
              return (
                <div className="notification-all-audience">
                  <GlobalOutlined />
                  <span>{t('notification.recipientAllHint')}</span>
                </div>
              );
            }}
          </ProFormDependency>
          <NotificationRecipientPreview
            data={recipientPreview}
            hasSelection={hasRecipientSelection}
            isError={recipientPreviewQuery.isError}
            isFetching={recipientPreviewQuery.isFetching}
          />
        </section>
      </div>
    </ProForm>
  );
}
