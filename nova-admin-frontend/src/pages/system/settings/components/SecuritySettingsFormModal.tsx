import { ModalForm, ProFormDigit, ProFormSwitch } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { SecuritySettings } from '@/api/settings';

export interface SecuritySettingsFormModalProps {
  open: boolean;
  initialValues: SecuritySettings;
  onSubmit: (values: SecuritySettings) => Promise<boolean>;
  onClose: () => void;
}

export default function SecuritySettingsFormModal({
  open,
  initialValues,
  onSubmit,
  onClose,
}: SecuritySettingsFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<SecuritySettings>
      title={t('settings.securityTab')}
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
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
        <ProFormDigit name="passwordMinLength" label={t('settings.passwordMinLength')} min={6} max={64} />
        <ProFormSwitch name="passwordRequireNumber" label={t('settings.passwordRequireNumber')} />
        <ProFormSwitch name="passwordRequireLetter" label={t('settings.passwordRequireLetter')} />
        <ProFormSwitch name="passwordRequireSpecial" label={t('settings.passwordRequireSpecial')} />
        <ProFormDigit name="loginLockMaxAttempts" label={t('settings.loginLockMaxAttempts')} min={1} max={20} />
        <ProFormDigit name="loginLockMinutes" label={t('settings.loginLockMinutes')} min={1} max={1440} />
        <ProFormSwitch name="captchaEnabled" label={t('settings.captchaEnabled')} />
        <ProFormDigit name="accessTokenExpireMinutes" label={t('settings.accessTokenExpireMinutes')} min={5} max={1440} />
        <ProFormDigit
          name="refreshTokenExpireMinutes"
          label={t('settings.refreshTokenExpireMinutes')}
          min={60}
          max={43200}
        />
      </div>
    </ModalForm>
  );
}
