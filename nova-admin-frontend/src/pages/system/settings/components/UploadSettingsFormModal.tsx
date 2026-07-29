import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { UploadSettings } from '@/api/settings';

export interface UploadSettingsFormModalProps {
  open: boolean;
  initialValues: UploadSettings;
  onSubmit: (values: UploadSettings) => Promise<boolean>;
  onClose: () => void;
}

export default function UploadSettingsFormModal({
  open,
  initialValues,
  onSubmit,
  onClose,
}: UploadSettingsFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<UploadSettings>
      title={t('settings.uploadTab')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      layout="vertical"
      width={720}
      modalProps={{
        destroyOnHidden: true,
        styles: { body: { maxHeight: '70vh', overflowY: 'auto' } },
      }}
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <ProFormSelect
          name="storageType"
          label={t('settings.storageType')}
          tooltip={t('settings.storageTypeHint')}
          options={[
            { label: t('settings.storageLocal'), value: 'local' },
            { label: t('settings.storageMinio'), value: 'minio' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormDigit name="maxSizeMb" label={t('settings.maxSizeMb')} min={1} max={100} />
        <ProFormText name="allowedTypes" label={t('settings.allowedTypes')} />
        <ProFormDigit
          name="avatarMaxSizeMb"
          label={t('settings.avatarMaxSizeMb')}
          min={1}
          max={20}
        />
        <ProFormText name="avatarAllowedTypes" label={t('settings.avatarAllowedTypes')} />
      </div>
    </ModalForm>
  );
}
