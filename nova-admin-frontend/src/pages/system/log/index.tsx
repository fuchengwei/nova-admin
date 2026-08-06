import { useMemo, useRef, useState } from 'react';
import { Button, Tabs } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { ProTable, type ActionType } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  cleanLoginLog,
  cleanOperationLog,
  getLoginLogPage,
  getOperationLogPage,
  type LoginLogRecord,
  type OperationLogRecord,
} from '@/api/log';
import { message } from '@/utils/message';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import layoutStyles from '@/styles/layout.module.css';

import LogCleanupModal, { type LogType } from './components/LogCleanupModal';
import LogDetailModal, { type LogDetail } from './components/LogDetailModal';
import { getLoginLogColumns, getOperationLogColumns } from './components/logColumns';

export default function LogPage() {
  const { t } = useTranslation();
  const opActionRef = useRef<ActionType>(null);
  const loginActionRef = useRef<ActionType>(null);
  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [cleanupType, setCleanupType] = useState<LogType | null>(null);
  const { wrapperRef, scrollY } = useTableScrollY();
  const cleanupMutation = useMutation({
    mutationFn: ({ logType, retentionDays }: { logType: LogType; retentionDays: number }) =>
      logType === 'operation' ? cleanOperationLog(retentionDays) : cleanLoginLog(retentionDays),
  });

  const opColumns = useMemo(
    () => getOperationLogColumns(t, (record) => setDetail({ type: 'operation', record })),
    [t],
  );
  const loginColumns = useMemo(
    () => getLoginLogColumns(t, (record) => setDetail({ type: 'login', record })),
    [t],
  );

  const cleanLogs = async (retentionDays: number) => {
    if (cleanupType === null) return false;
    const result = await cleanupMutation.mutateAsync({ logType: cleanupType, retentionDays });
    if (result.code !== 0) {
      message.error(result.msg || t('common.error'));
      return false;
    }
    message.success(t('log.cleanSuccess'));
    (cleanupType === 'operation' ? opActionRef : loginActionRef).current?.reload();
    return true;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="mb-4 text-lg font-semibold">{t('menu.log')}</h2>
      <div ref={wrapperRef} className="min-h-0 flex-1">
        <Tabs
          defaultActiveKey="operation"
          className={`${layoutStyles.tabsFill} flex h-full min-h-0 flex-col`}
          items={[
            {
              key: 'operation',
              label: t('log.operationTab'),
              children: (
                <ProTable<OperationLogRecord>
                  actionRef={opActionRef}
                  rowKey="id"
                  columns={opColumns}
                  style={{ height: '100%' }}
                  scroll={{ x: 1280, y: scrollY }}
                  request={async (params) => {
                    const result = await getOperationLogPage({
                      current: params.current ?? 1,
                      size: params.pageSize ?? 10,
                      module: params.module,
                      account: params.account,
                      status: params.status,
                    });
                    if (result.code !== 0) return { data: [], success: false, total: 0 };
                    return { data: result.data.records, success: true, total: result.data.total };
                  }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  search={{ labelWidth: 'auto' }}
                  toolBarRender={() => [
                    <Button
                      key="clean"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setCleanupType('operation')}
                    >
                      {t('log.clean')}
                    </Button>,
                  ]}
                  options={{ reload: true, density: true, setting: true }}
                />
              ),
            },
            {
              key: 'login',
              label: t('log.loginTab'),
              children: (
                <ProTable<LoginLogRecord>
                  actionRef={loginActionRef}
                  rowKey="id"
                  columns={loginColumns}
                  style={{ height: '100%' }}
                  scroll={{ x: 960, y: scrollY }}
                  request={async (params) => {
                    const result = await getLoginLogPage({
                      current: params.current ?? 1,
                      size: params.pageSize ?? 10,
                      account: params.account,
                      status: params.status,
                    });
                    if (result.code !== 0) return { data: [], success: false, total: 0 };
                    return { data: result.data.records, success: true, total: result.data.total };
                  }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  search={{ labelWidth: 'auto' }}
                  toolBarRender={() => [
                    <Button
                      key="clean"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setCleanupType('login')}
                    >
                      {t('log.clean')}
                    </Button>,
                  ]}
                  options={{ reload: true, density: true, setting: true }}
                />
              ),
            },
          ]}
        />
      </div>
      <LogDetailModal detail={detail} onClose={() => setDetail(null)} />
      <LogCleanupModal
        logType={cleanupType ?? 'operation'}
        open={cleanupType !== null}
        onOpenChange={(open) => {
          if (!open) setCleanupType(null);
        }}
        onFinish={cleanLogs}
      />
    </div>
  );
}
