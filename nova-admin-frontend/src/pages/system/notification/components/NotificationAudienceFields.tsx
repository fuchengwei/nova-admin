import {
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { GlobalOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  NotificationPublishRequest,
  NotificationRecipientOption,
  NotificationRecipientPreview,
  NotificationRecipientType,
} from '@/api/notification';

import NotificationRecipientPreviewPanel from './NotificationRecipientPreview';
import styles from '../notification.module.css';

interface NotificationAudienceFieldsProps {
  formRef: RefObject<ProFormInstance<NotificationPublishRequest> | undefined>;
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
    <section className="min-w-0 rounded-[10px] border border-slate-200 bg-[#fbfdff] px-[18px] pt-4 pb-1 max-[560px]:px-[13px] max-[560px]:pt-3.5">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] leading-[1.4] font-bold tracking-[0.12em] text-slate-500 uppercase">
            {t('notification.audienceKicker')}
          </div>
          <h2 className="mt-[3px] mb-[3px] text-[15px] font-bold text-slate-800">
            {t('notification.audienceTitle')}
          </h2>
          <p className="m-0 max-w-[42ch] text-xs leading-[1.55] text-slate-500">
            {t('notification.audienceHint')}
          </p>
        </div>
        <span
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"
          aria-hidden="true"
        >
          <GlobalOutlined />
        </span>
      </div>
      <ProFormRadio.Group
        name="recipientType"
        label={t('notification.recipientType')}
        className="w-full"
        fieldProps={{
          optionType: 'button',
          buttonStyle: 'solid',
          className: `flex w-full flex-nowrap overflow-x-auto ${styles.recipientModeGroup}`,
          onChange: () => formRef.current?.setFieldValue('recipientIds', undefined),
        }}
        options={recipientTypeOptions.map((value) => ({
          label: (
            <span className="inline-flex min-w-0 items-center gap-[5px] whitespace-nowrap">
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
            <div className="mt-[7px] mb-[13px] flex items-center gap-[9px] rounded-lg border border-dashed border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
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
