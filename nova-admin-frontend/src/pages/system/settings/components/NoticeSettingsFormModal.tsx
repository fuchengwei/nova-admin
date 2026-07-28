import { useEffect, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Collapse, Form } from 'antd';
import {
  ModalForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import AnnouncementDialog from '@/components/AnnouncementDialog';
import type { NoticeSettings } from '@/api/settings';
import { getRichTextPlainText, sanitizeRichHtml } from '@/utils/richText';
import RichNoticeEditor from './RichNoticeEditor';

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
      <div className="notice-publish-header">
        <div>
          <div className="notice-publish-kicker">{t('settings.noticeWorkspace')}</div>
          <div className="notice-publish-intro">{t('settings.noticeWorkspaceDescription')}</div>
        </div>
        <div className="flex items-center gap-3">
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
        className="notice-channel-collapse"
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
