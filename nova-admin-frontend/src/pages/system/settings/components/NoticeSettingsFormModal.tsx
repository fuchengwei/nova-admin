import { useEffect, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Collapse, Form } from 'antd';
import { ModalForm, ProFormDigit, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import AnnouncementDialog from '@/components/AnnouncementDialog';
import type { NoticeSettings } from '@/api/settings';
import { getRichTextPlainText, sanitizeRichHtml } from '@/utils/richText';

import RichNoticeEditor from './RichNoticeEditor';
import styles from './NoticeSettingsFormModal.module.css';

export interface NoticeSettingsFormModalProps {
  open: boolean;
  initialValues: NoticeSettings;
  onSubmit: (values: NoticeSettings) => Promise<boolean>;
  onClose: () => void;
}

export default function NoticeSettingsFormModal({
  open,
  initialValues,
  onSubmit,
  onClose,
}: NoticeSettingsFormModalProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<NoticeSettings>();
  const content = Form.useWatch('content', form) ?? '';
  const title = Form.useWatch('title', form) ?? '';
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ ...initialValues, content: sanitizeRichHtml(initialValues.content) });
  }, [form, initialValues, open]);

  return (
    <ModalForm<NoticeSettings>
      form={form}
      initialValues={initialValues}
      layout="vertical"
      modalProps={{
        destroyOnHidden: true,
        styles: { body: { maxHeight: '78vh', overflowY: 'auto' } },
      }}
      onFinish={async (values) => {
        const sanitizedContent = sanitizeRichHtml(values.content);
        if (values.enabled && !getRichTextPlainText(sanitizedContent)) {
          message.error(t('settings.noticeContentRequired'));
          return false;
        }
        return onSubmit({ ...values, content: sanitizedContent });
      }}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      open={open}
      submitter={{
        searchConfig: { resetText: t('common.cancel'), submitText: t('settings.publishNotice') },
      }}
      title={t('settings.noticePublishTitle')}
      width={1180}
    >
      <div className="mb-6 flex items-start justify-between gap-6 border-b border-[var(--color-border)] pb-[18px] max-md:block">
        <div>
          <div className="text-xs font-bold text-amber-700">{t('settings.noticeWorkspace')}</div>
          <div className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            {t('settings.noticeWorkspaceDescription')}
          </div>
        </div>
        <div className="flex items-center gap-3 max-md:mt-4">
          <ProFormSwitch name="enabled" label={t('settings.noticeEnabled')} />
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            {t('settings.previewNotice')}
          </Button>
        </div>
      </div>

      <ProFormText
        name="title"
        label={t('settings.noticeTitle')}
        fieldProps={{ maxLength: 64, showCount: true }}
      />
      <Form.Item label={t('settings.noticeContent')} name="content">
        <RichNoticeEditor
          value={content}
          onChange={(value) => form.setFieldValue('content', value)}
        />
      </Form.Item>

      <Collapse
        className={`mt-6 border-[var(--color-border)] bg-[var(--color-surface-elevated)] ${styles.channelCollapse}`}
        items={[
          {
            key: 'channels',
            label: t('settings.noticeChannelConfig'),
            children: (
              <div className="grid gap-x-5 md:grid-cols-2">
                <div>
                  <ProFormSwitch name="emailEnabled" label={t('settings.emailEnabled')} />
                  <ProFormText name="emailHost" label={t('settings.emailHost')} />
                  <ProFormText name="emailUsername" label={t('settings.emailUsername')} />
                </div>
                <div>
                  <ProFormSwitch name="smsEnabled" label={t('settings.smsEnabled')} />
                  <ProFormDigit
                    name="emailPort"
                    label={t('settings.emailPort')}
                    max={65535}
                    min={1}
                  />
                  <ProFormText name="smsProvider" label={t('settings.smsProvider')} />
                </div>
              </div>
            ),
          },
        ]}
      />
      <AnnouncementDialog
        notice={{ content, title }}
        onDismiss={() => setPreviewOpen(false)}
        open={previewOpen}
      />
    </ModalForm>
  );
}
