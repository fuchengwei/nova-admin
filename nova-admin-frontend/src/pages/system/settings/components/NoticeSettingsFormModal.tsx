import { ModalForm, ProFormDigit, ProFormRadio, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { NoticeSettings } from '@/api/settings';

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

  return (
    <ModalForm<NoticeSettings>
      title={t('settings.noticeTab')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      layout="vertical"
      width={860}
      modalProps={{
        destroyOnHidden: true,
        styles: { body: { maxHeight: '70vh', overflowY: 'auto' } },
      }}
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <ProFormText name="title" label={t('settings.noticeTitle')} />
        <ProFormRadio.Group
          name="level"
          label={t('settings.noticeLevel')}
          options={[
            { label: 'info', value: 'info' },
            { label: 'success', value: 'success' },
            { label: 'warning', value: 'warning' },
            { label: 'error', value: 'error' },
          ]}
        />
        <div className="md:col-span-2">
          <ProFormTextArea name="content" label={t('settings.noticeContent')} fieldProps={{ rows: 6 }} />
        </div>
        <ProFormSwitch name="enabled" label={t('settings.noticeEnabled')} />
        <ProFormSwitch name="emailEnabled" label={t('settings.emailEnabled')} />
        <ProFormText name="emailHost" label={t('settings.emailHost')} />
        <ProFormDigit name="emailPort" label={t('settings.emailPort')} min={1} max={65535} />
        <ProFormText name="emailUsername" label={t('settings.emailUsername')} />
        <ProFormSwitch name="smsEnabled" label={t('settings.smsEnabled')} />
        <ProFormText name="smsProvider" label={t('settings.smsProvider')} />
      </div>
    </ModalForm>
  );
}
