import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from '@/utils/message';
import { updateCurrentUserPassword, type CurrentUserPasswordUpdateRequest } from '@/api/profile';
import { clearTokens, setAuthExpiryFeedbackSuppressed } from '@/utils/request';
import { useUserStore } from '@/stores/userStore';
import PasswordFormModal from '@/pages/profile/components/PasswordFormModal';

interface PasswordChangeGateProps {
  required: boolean;
  onPasswordChangeStart: () => void;
  onPasswordChangeFailed: () => void;
}

export default function PasswordChangeGate({
  required,
  onPasswordChangeStart,
  onPasswordChangeFailed,
}: PasswordChangeGateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reset = useUserStore((state) => state.reset);
  const passwordMutation = useMutation({ mutationFn: updateCurrentUserPassword });

  return (
    <PasswordFormModal
      open={required}
      forceChange
      onClose={() => undefined}
      onSubmit={async (values: CurrentUserPasswordUpdateRequest) => {
        setAuthExpiryFeedbackSuppressed(true);
        onPasswordChangeStart();
        try {
          const response = await passwordMutation.mutateAsync(values);
          if (response.code !== 0) {
            setAuthExpiryFeedbackSuppressed(false);
            onPasswordChangeFailed();
            message.error(response.msg || t('common.error'));
            return false;
          }
          message.success(t('profile.passwordUpdateSuccess'));
          clearTokens();
          reset();
          navigate('/login', { replace: true });
          return true;
        } catch {
          setAuthExpiryFeedbackSuppressed(false);
          onPasswordChangeFailed();
          return false;
        }
      }}
    />
  );
}
