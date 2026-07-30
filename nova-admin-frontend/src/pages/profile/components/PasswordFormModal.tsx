import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { CurrentUserPasswordUpdateRequest } from '@/api/profile';

interface PasswordFormValues extends CurrentUserPasswordUpdateRequest {
  confirmPassword: string;
}

export interface PasswordFormModalProps {
  open: boolean;
  onSubmit: (values: CurrentUserPasswordUpdateRequest) => Promise<boolean>;
  onClose: () => void;
  forceChange?: boolean;
}

export default function PasswordFormModal({ open, onSubmit, onClose, forceChange = false }: PasswordFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<PasswordFormValues>
      title={forceChange ? t('profile.passwordChangeRequiredTitle') : t('profile.changePassword')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible && !forceChange) onClose();
      }}
      layout="vertical"
      width={520}
      modalProps={{
        destroyOnHidden: true,
        closable: !forceChange,
        mask: { closable: !forceChange },
        keyboard: !forceChange,
      }}
      onFinish={async (values) =>
        onSubmit({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        })
      }
    >
      {forceChange && (
        <p className="mb-5 text-sm text-[color:var(--ant-color-text-secondary)]">
          {t('profile.passwordChangeRequiredDesc')}
        </p>
      )}
      <ProFormText.Password
        name="oldPassword"
        label={t('profile.oldPassword')}
        rules={[{ required: true, message: t('profile.oldPasswordRequired') }]}
      />
      <ProFormText.Password
        name="newPassword"
        label={t('profile.newPassword')}
        rules={[{ required: true, message: t('profile.newPasswordRequired') }]}
      />
      <ProFormText.Password
        name="confirmPassword"
        label={t('profile.confirmPassword')}
        dependencies={['newPassword']}
        rules={[
          { required: true, message: t('profile.confirmPasswordRequired') },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(t('profile.confirmPasswordMismatch')));
            },
          }),
        ]}
      />
    </ModalForm>
  );
}
