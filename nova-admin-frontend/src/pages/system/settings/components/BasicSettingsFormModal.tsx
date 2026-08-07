import { Avatar, Button, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { SettingOutlined, UploadOutlined } from '@ant-design/icons';
import { ModalForm, ProFormRadio, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { BasicSettings } from '@/api/settings';
import defaultLogo from '@/assets/images/logo.png';

export interface BasicSettingsFormModalProps {
  open: boolean;
  initialValues: BasicSettings;
  logoUrl?: string;
  logoUploadProps: UploadProps;
  logoUploading: boolean;
  onSubmit: (values: BasicSettings) => Promise<boolean>;
  onClose: () => void;
}

const normalizeImageSrc = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export default function BasicSettingsFormModal({
  open,
  initialValues,
  logoUrl,
  logoUploadProps,
  logoUploading,
  onSubmit,
  onClose,
}: BasicSettingsFormModalProps) {
  const { t } = useTranslation();
  const safeLogoSrc = normalizeImageSrc(logoUrl) ?? defaultLogo;

  return (
    <ModalForm<BasicSettings>
      title={t('settings.basicTab')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      layout="vertical"
      width={760}
      modalProps={{
        destroyOnHidden: true,
        styles: { body: { maxHeight: '70vh', overflowY: 'auto' } },
      }}
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-center">
          <Avatar shape="square" size={96} src={safeLogoSrc} icon={<SettingOutlined />} />
          <div className="mt-3">
            <Upload {...logoUploadProps}>
              <Button icon={<UploadOutlined />} loading={logoUploading}>
                {t('settings.uploadLogo')}
              </Button>
            </Upload>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <ProFormText name="systemName" label={t('settings.systemName')} />
          <ProFormText name="browserTitle" label={t('settings.browserTitle')} />
          <ProFormRadio.Group
            name="defaultLanguage"
            label={t('settings.defaultLanguage')}
            options={[
              { label: '中文', value: 'zh_CN' },
              { label: 'English', value: 'en_US' },
            ]}
          />
          <ProFormSelect
            name="themeColor"
            label={t('settings.themeColor')}
            options={[
              { label: t('settings.themeBlue'), value: '#1677ff' },
              { label: t('settings.themeIndigo'), value: '#4f46e5' },
              { label: t('settings.themeEmerald'), value: '#10b981' },
              { label: t('settings.themeOrange'), value: '#f97316' },
              { label: t('settings.themeRose'), value: '#e11d48' },
            ]}
            fieldProps={{
              optionRender: (option) => (
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: String(option.value) }}
                  />
                  {option.label}
                </span>
              ),
              labelRender: ({ label, value }) => (
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: String(value) }}
                  />
                  {label}
                </span>
              ),
            }}
          />
          <div className="md:col-span-2">
            <ProFormText name="copyrightText" label={t('settings.copyrightText')} />
          </div>
        </div>
      </div>
    </ModalForm>
  );
}
