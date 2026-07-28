import { AuditOutlined, UserOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';

import type { LoginLogRecord, OperationLogRecord } from '@/api/log';
import { displayText } from '@/utils/display';

import LoginLogDetail from './LoginLogDetail';
import OperationLogDetail from './OperationLogDetail';

export type LogDetail =
  { type: 'operation'; record: OperationLogRecord } | { type: 'login'; record: LoginLogRecord };

interface LogDetailModalProps {
  detail: LogDetail | null;
  onClose: () => void;
}

export default function LogDetailModal({ detail, onClose }: LogDetailModalProps) {
  const { t } = useTranslation();
  const operationRecord = detail?.type === 'operation' ? detail.record : null;
  const loginRecord = detail?.type === 'login' ? detail.record : null;
  const modalTitle = operationRecord ? (
    <div className="flex min-w-0 items-center gap-3 pr-8">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <AuditOutlined />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">
          {displayText(operationRecord.module)}
        </div>
        <div className="truncate text-lg font-semibold text-slate-900">
          {displayText(operationRecord.description)}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <UserOutlined />
      </span>
      <span className="text-lg font-semibold text-slate-900">{t('log.loginTab')}</span>
    </div>
  );

  return (
    <Modal
      title={modalTitle}
      open={detail !== null}
      onCancel={onClose}
      footer={null}
      width={880}
      destroyOnHidden
      styles={{
        body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', padding: '0 24px 24px' },
      }}
    >
      {operationRecord && <OperationLogDetail record={operationRecord} />}
      {loginRecord && <LoginLogDetail record={loginRecord} />}
    </Modal>
  );
}
