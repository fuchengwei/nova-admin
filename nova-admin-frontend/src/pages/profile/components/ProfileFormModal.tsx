import { ModalForm, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { emailRule, phoneRule } from '@/utils/validators';
import type { CurrentUserProfileUpdateRequest } from '@/api/profile';

export interface ProfileFormModalProps {
  open: boolean;
  initialValues: CurrentUserProfileUpdateRequest;
  onSubmit: (values: CurrentUserProfileUpdateRequest) => Promise<boolean>;
  onClose: () => void;
}

export default function ProfileFormModal({
  open,
  initialValues,
  onSubmit,
  onClose,
}: ProfileFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<CurrentUserProfileUpdateRequest>
      title={t('profile.editProfile')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      layout="vertical"
      width={720}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <ProFormText name="nickname" label={t('profile.nickname')} fieldProps={{ maxLength: 64 }} />
        <ProFormText name="realName" label={t('profile.realName')} fieldProps={{ maxLength: 64 }} />
        <ProFormText
          name="email"
          label={t('profile.email')}
          rules={[emailRule(t('user.emailInvalid'))]}
          fieldProps={{ maxLength: 128 }}
        />
        <ProFormText
          name="phone"
          label={t('profile.phone')}
          rules={[phoneRule(t('user.phoneInvalid'))]}
          fieldProps={{ maxLength: 20 }}
        />
        <ProFormRadio.Group
          name="gender"
          label={t('profile.gender')}
          options={[
            { label: t('profile.genderUnknown'), value: 0 },
            { label: t('profile.genderMale'), value: 1 },
            { label: t('profile.genderFemale'), value: 2 },
          ]}
        />
      </div>
    </ModalForm>
  );
}
