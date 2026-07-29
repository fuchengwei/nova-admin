import { useEffect } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { StorageType, UploadSettings } from '@/api/settings';

export interface UploadSettingsFormModalProps {
  open: boolean;
  initialValues: UploadSettings;
  verifying: boolean;
  onVerify: (storageType: StorageType) => void;
  onSubmit: (values: UploadSettings) => Promise<boolean>;
  onClose: () => void;
}

export default function UploadSettingsFormModal({
  open,
  initialValues,
  verifying,
  onVerify,
  onSubmit,
  onClose,
}: UploadSettingsFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<UploadSettings>();
  const storageType = Form.useWatch('storageType', form) ?? initialValues.storageType;

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues);
  }, [form, initialValues, open]);

  return (
    <ModalForm<UploadSettings>
      form={form}
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
      onFinish={onSubmit}
    >
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
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
          </div>
          <Button
            className="mb-6 shrink-0"
            icon={<LinkOutlined />}
            loading={verifying}
            disabled={!storageType}
            onClick={() => onVerify(storageType as StorageType)}
          >
            {t('settings.verifyStorage')}
          </Button>
        </div>
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
