import { HistoryOutlined, NotificationOutlined, SendOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import NotificationHistoryTable from './components/NotificationHistoryTable';
import NotificationPublishForm from './components/NotificationPublishForm';

export default function NotificationPage() {
  const { t } = useTranslation();
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  return (
    <PageContainer
      className="page-fill"
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
          className="notification-workspace-tabs tabs-fill"
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
                    onPublished={() => setHistoryRefreshToken((value) => value + 1)}
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
              children: <NotificationHistoryTable refreshToken={historyRefreshToken} />,
            },
          ]}
        />
      </div>
    </PageContainer>
  );
}
