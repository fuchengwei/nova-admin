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
}

export default function PasswordFormModal({ open, onSubmit, onClose }: PasswordFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<PasswordFormValues>
      title={t('profile.changePassword')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      layout="vertical"
      width={520}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) =>
        onSubmit({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        })
      }
    >
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
