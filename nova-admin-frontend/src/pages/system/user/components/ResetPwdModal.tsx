import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { UserRecord } from '@/api/user';

interface ResetPwdForm {
  password?: string;
}

export interface ResetPwdModalProps {
  open: boolean;
  record: UserRecord | null;
  onSubmit: (password: string, record: UserRecord | null) => Promise<boolean>;
  onClose: () => void;
}

/** 重置用户密码弹窗（页面局部组件） */
export default function ResetPwdModal({ open, record, onSubmit, onClose }: ResetPwdModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<ResetPwdForm>
      title={t('user.resetPwd')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      width={400}
      layout="vertical"
      onFinish={async (values) => onSubmit(values.password ?? '', record)}
    >
      <ProFormText.Password
        name="password"
        label={t('user.newPassword')}
        rules={[
          { required: true, message: t('user.passwordRequired') },
          { min: 6, message: t('user.passwordMinLen') },
        ]}
      />
    </ModalForm>
  );
}
