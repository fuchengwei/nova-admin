import {
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { GlobalOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  NotificationPublishRequest,
  NotificationRecipientOption,
  NotificationRecipientPreview,
  NotificationRecipientType,
} from '@/api/notification';

import NotificationRecipientPreviewPanel from './NotificationRecipientPreview';

interface NotificationAudienceFieldsProps {
  formRef: MutableRefObject<ProFormInstance<NotificationPublishRequest> | undefined>;
  recipientOptions: { users: NotificationRecipientOption[]; roles: NotificationRecipientOption[] };
  recipientOptionsLoading: boolean;
  recipientPreview?: NotificationRecipientPreview;
  hasRecipientSelection: boolean;
  recipientPreviewError: boolean;
  recipientPreviewFetching: boolean;
}

const recipientTypeOptions: NotificationRecipientType[] = ['ALL', 'ROLE', 'USER'];

const toSelectOptions = (options: NotificationRecipientOption[]) =>
  options.map(({ id, label }) => ({ label, value: id }));

export default function NotificationAudienceFields({
  formRef,
  recipientOptions,
  recipientOptionsLoading,
  recipientPreview,
  hasRecipientSelection,
  recipientPreviewError,
  recipientPreviewFetching,
}: NotificationAudienceFieldsProps) {
  const { t } = useTranslation();
  const recipientTypeLabels: Record<NotificationRecipientType, string> = {
    ALL: t('notification.recipientAll'),
    ROLE: t('notification.recipientRole'),
    USER: t('notification.recipientUser'),
  };

  return (
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
      <NotificationRecipientPreviewPanel
        data={recipientPreview}
        hasSelection={hasRecipientSelection}
        isError={recipientPreviewError}
        isFetching={recipientPreviewFetching}
      />
    </section>
  );
}
