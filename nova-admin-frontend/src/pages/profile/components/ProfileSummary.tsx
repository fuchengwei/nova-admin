import { Avatar, Button, Descriptions, Tag, Upload, type UploadProps } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { UserInfo } from '@/types/api';

interface ProfileSummaryProps {
  userInfo: UserInfo | null;
  avatarSrc?: string;
  roleTags: string[];
  loginTimeText: string;
  uploadProps: UploadProps;
  avatarLoading: boolean;
}

export default function ProfileSummary({
  userInfo,
  avatarSrc,
  roleTags,
  loginTimeText,
  uploadProps,
  avatarLoading,
}: ProfileSummaryProps) {
  const { t } = useTranslation();

  return (
    <ProCard className="overflow-hidden border-[var(--color-border)]! bg-[var(--color-surface)]! shadow-sm">
      <div className="border-l-4 border-[var(--ant-color-primary)] bg-[var(--color-surface-elevated)] p-6 text-[var(--color-text-primary)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Avatar
            size={104}
            src={avatarSrc}
            icon={<UserOutlined />}
            className="ring-4 ring-[var(--ant-color-primary)]/20"
          />
          <div>
            <div className="text-xl font-semibold">
              {userInfo?.nickname ?? userInfo?.account ?? '-'}
            </div>
            <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {userInfo?.realName || userInfo?.account || '-'}
            </div>
          </div>
          <Upload {...uploadProps}>
            <Button type="primary" ghost icon={<UploadOutlined />} loading={avatarLoading}>
              {t('profile.uploadAvatar')}
            </Button>
          </Upload>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t('profile.account')}>
            {userInfo?.account ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.department')}>
            {userInfo?.deptName ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.roles')}>
            <div className="flex flex-wrap gap-2">
              {roleTags.length > 0 ? roleTags.map((role) => <Tag key={role}>{role}</Tag>) : '-'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.statusSummary')}>
            {t('profile.profileReady')}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.lastLoginTime')}>{loginTimeText}</Descriptions.Item>
          <Descriptions.Item label={t('profile.lastLoginIp')}>
            {userInfo?.lastLoginIp ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </ProCard>
  );
}
