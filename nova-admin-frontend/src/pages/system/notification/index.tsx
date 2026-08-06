import { HistoryOutlined, NotificationOutlined, SendOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getNotificationDraft, type NotificationDraft } from '@/api/notification';
import { message } from '@/utils/message';

import NotificationHistoryTable from './components/NotificationHistoryTable';
import NotificationPublishForm from './components/NotificationPublishForm';

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
      className="page-fill notification-page-scroll"
      title={
        <span className="flex items-center gap-2">
          <NotificationOutlined className="text-blue-600" />
          {t('notification.publishTitle')}
        </span>
      }
    >
      <div className="notification-workspace">
        <div className="notification-workspace-intro">
          <div className="notification-workspace-mark" aria-hidden="true">
            <NotificationOutlined />
          </div>
          <div className="min-w-0">
            <div className="notification-workspace-eyebrow">
              {t('notification.workspaceEyebrow')}
            </div>
            <h1 className="notification-workspace-title">{t('notification.workspaceTitle')}</h1>
            <p className="notification-workspace-subtitle">{t('notification.workspaceSubtitle')}</p>
          </div>
        </div>
        <Tabs
          activeKey={activeTab}
          className="notification-workspace-tabs"
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
                <div className="max-w-4xl">
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
