import { HistoryOutlined, NotificationOutlined, SendOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getNotificationDraft, type NotificationDraft } from '@/api/notification';
import { message } from '@/utils/message';

import NotificationHistoryTable from './components/NotificationHistoryTable';
import NotificationPublishForm from './components/NotificationPublishForm';
import styles from './notification.module.css';
import layoutStyles from '@/styles/layout.module.css';

export default function NotificationPage() {
  const { t } = useTranslation();
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const [activeTab, setActiveTab] = useState('publish');
  const [editingDraft, setEditingDraft] = useState<NotificationDraft | null>(null);

  const openDraft = async (id: string) => {
    const result = await getNotificationDraft(id);
    if (result.code !== 0) {
      message.error(result.msg || t('notification.draftLoadFailed'));
      return;
    }
    setEditingDraft(result.data);
    setActiveTab('publish');
  };

  return (
    <PageContainer
      className={`${layoutStyles.pageFill} ${layoutStyles.notificationPageScroll}`}
      title={
        <span className="flex items-center gap-2">
          <NotificationOutlined className="text-[var(--ant-color-primary)]" />
          {t('notification.publishTitle')}
        </span>
      }
    >
      <div className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
        <div className="flex items-start gap-3.5 rounded-[10px] border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 pt-5 pb-[17px] max-[900px]:px-4 max-[900px]:pb-3.5">
          <div
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-lg text-[var(--ant-color-primary)]"
            aria-hidden="true"
          >
            <NotificationOutlined />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] leading-[1.4] font-bold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
              {t('notification.workspaceEyebrow')}
            </div>
            <h1 className="mt-[3px] text-xl leading-[1.35] font-bold text-[var(--color-text-primary)] max-[560px]:text-lg">
              {t('notification.workspaceTitle')}
            </h1>
            <p className="mt-1 text-xs leading-[1.6] text-[var(--color-text-secondary)] max-[560px]:text-[11px]">
              {t('notification.workspaceSubtitle')}
            </p>
          </div>
        </div>
        <Tabs
          activeKey={activeTab}
          className={`px-5 pb-3.5 max-[900px]:px-3 max-[900px]:pb-2.5 ${styles.workspaceTabs}`}
          onChange={setActiveTab}
          items={[
            {
              key: 'publish',
              label: (
                <span className="flex items-center gap-2">
                  <SendOutlined />
                  {t('notification.publishTab')}
                </span>
              ),
              children: (
                <div className="w-full max-w-4xl">
                  <NotificationPublishForm
                    draft={editingDraft}
                    onPublished={() => {
                      setEditingDraft(null);
                      setHistoryRefreshToken((value) => value + 1);
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <span className="flex items-center gap-2">
                  <HistoryOutlined />
                  {t('notification.historyTab')}
                </span>
              ),
              children: (
                <NotificationHistoryTable
                  refreshToken={historyRefreshToken}
                  onEditDraft={openDraft}
                />
              ),
            },
          ]}
        />
      </div>
    </PageContainer>
  );
}
