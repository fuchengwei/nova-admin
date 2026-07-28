import { useTranslation } from 'react-i18next';

import { ModalForm, ProFormDigit } from '@ant-design/pro-components';

export type LogType = 'operation' | 'login';

interface CleanupFormValues {
  retentionDays: number;
}

interface LogCleanupModalProps {
  logType: LogType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (retentionDays: number) => Promise<boolean>;
}

const RETENTION_DAYS_MIN = 1;
const RETENTION_DAYS_MAX = 3650;
const RETENTION_DAYS_DEFAULT = 30;

export default function LogCleanupModal({
  logType,
  open,
  onOpenChange,
  onFinish,
}: LogCleanupModalProps) {
  const { t } = useTranslation();
  const logLabel = t(logType === 'operation' ? 'log.operationTab' : 'log.loginTab');

  return (
    <ModalForm<CleanupFormValues>
      title={t('log.cleanTitle', { logType: logLabel })}
      open={open}
      onOpenChange={onOpenChange}
      width={520}
      layout="vertical"
      initialValues={{ retentionDays: RETENTION_DAYS_DEFAULT }}
      modalProps={{ destroyOnHidden: true }}
      onFinish={({ retentionDays }) => onFinish(retentionDays)}
    >
      <ProFormDigit
        name="retentionDays"
        label={t('log.retentionDays')}
        min={RETENTION_DAYS_MIN}
        max={RETENTION_DAYS_MAX}
        fieldProps={{ precision: 0 }}
        extra={t('log.retentionDaysHint')}
        rules={[{ required: true, message: t('log.retentionDaysRequired') }]}
      />
    </ModalForm>
  );
}
