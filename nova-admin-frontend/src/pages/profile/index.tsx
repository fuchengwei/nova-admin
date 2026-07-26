import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Descriptions, Tag, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { EditOutlined, LockOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearTokens } from '@/utils/request';
import { useUserStore } from '@/stores/userStore';
import {
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  updateCurrentUserPassword,
  type CurrentUserPasswordUpdateRequest,
  type CurrentUserProfileUpdateRequest,
} from '@/api/profile';
import { getUserInfo } from '@/api/auth';
import ProfileFormModal from './components/ProfileFormModal';
import PasswordFormModal from './components/PasswordFormModal';

const normalizeImageSrc = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | undefined>();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const userInfo = useUserStore((s) => s.userInfo);
  const setUserInfo = useUserStore((s) => s.setUserInfo);
  const reset = useUserStore((s) => s.reset);

  const refreshCurrentUser = async () => {
    const res = await getUserInfo();
    if (res.code === 0 && res.data) {
      setUserInfo(res.data);
      setAvatar(res.data.avatar);
      return res.data;
    }
    return null;
  };

  useEffect(() => {
    if (userInfo) {
      setAvatar(userInfo.avatar);
    }
    void refreshCurrentUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const profileMutation = useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: async (res) => {
      if (res.code === 0) {
        message.success(t('profile.profileSaveSuccess'));
        setProfileModalOpen(false);
        await refreshCurrentUser();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadCurrentUserAvatar,
    onSuccess: async (res) => {
      if (res.code === 0 && res.data) {
        message.success(t('profile.avatarUploadSuccess'));
        setAvatar(res.data.avatar);
        await refreshCurrentUser();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const passwordMutation = useMutation({
    mutationFn: updateCurrentUserPassword,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('profile.passwordUpdateSuccess'));
        clearTokens();
        reset();
        navigate('/login');
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const uploadProps: UploadProps = {
    showUploadList: false,
    accept: 'image/*',
    customRequest: (options) => {
      avatarMutation.mutate(options.file as File);
      options.onSuccess?.({}, undefined as never);
    },
  };

  const roleTags = useMemo(() => userInfo?.roles ?? [], [userInfo]);
  const safeAvatarSrc = useMemo(() => normalizeImageSrc(avatar), [avatar]);

  const profileInitialValues: CurrentUserProfileUpdateRequest = {
    nickname: userInfo?.nickname,
    realName: userInfo?.realName,
    email: userInfo?.email,
    phone: userInfo?.phone,
    gender: userInfo?.gender ?? 0,
  };

  const loginTimeText = useMemo(() => {
    if (!userInfo?.lastLoginTime) return '-';
    return new Date(userInfo.lastLoginTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [userInfo?.lastLoginTime]);

  return (
    <PageContainer title={t('header.profile')} className="page-fill">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <ProCard className="overflow-hidden shadow-sm">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-6 text-white">
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar size={104} src={safeAvatarSrc} icon={<UserOutlined />} className="ring-4 ring-white/20" />
              <div>
                <div className="text-xl font-semibold">{userInfo?.nickname ?? userInfo?.account ?? '-'}</div>
                <div className="mt-1 text-sm text-white/80">{userInfo?.realName || userInfo?.account || '-'}</div>
              </div>
              <Upload {...uploadProps}>
                <Button ghost icon={<UploadOutlined />} loading={avatarMutation.isPending}>
                  {t('profile.uploadAvatar')}
                </Button>
              </Upload>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={t('profile.account')}>{userInfo?.account ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.department')}>{userInfo?.deptName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.roles')}>
                <div className="flex flex-wrap gap-2">
                  {roleTags.length > 0 ? roleTags.map((role) => <Tag key={role}>{role}</Tag>) : '-'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label={t('profile.statusSummary')}>{t('profile.profileReady')}</Descriptions.Item>
              <Descriptions.Item label={t('profile.lastLoginTime')}>{loginTimeText}</Descriptions.Item>
              <Descriptions.Item label={t('profile.lastLoginIp')}>{userInfo?.lastLoginIp ?? '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        </ProCard>

        <div className="grid gap-6">
          <ProCard
            title={t('profile.basicInfo')}
            extra={
              <Button type="primary" icon={<EditOutlined />} onClick={() => setProfileModalOpen(true)}>
                {t('profile.editProfile')}
              </Button>
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label={t('profile.nickname')}>{userInfo?.nickname ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.realName')}>{userInfo?.realName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.email')}>{userInfo?.email ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.phone')}>{userInfo?.phone ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.gender')}>
                {userInfo?.gender === 1
                  ? t('profile.genderMale')
                  : userInfo?.gender === 2
                    ? t('profile.genderFemale')
                    : t('profile.genderUnknown')}
              </Descriptions.Item>
              <Descriptions.Item label={t('profile.avatar')}>{safeAvatarSrc ? t('common.success') : '-'}</Descriptions.Item>
            </Descriptions>
          </ProCard>

          <ProCard
            title={t('profile.securityInfo')}
            extra={
              <Button icon={<LockOutlined />} onClick={() => setPasswordModalOpen(true)}>
                {t('profile.changePassword')}
              </Button>
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label={t('profile.account')}>{userInfo?.account ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.department')}>{userInfo?.deptName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('profile.roles')}>
                <div className="flex flex-wrap gap-2">
                  {roleTags.length > 0 ? roleTags.map((role) => <Tag key={role}>{role}</Tag>) : '-'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label={t('profile.statusSummary')}>{t('profile.profileReady')}</Descriptions.Item>
              <Descriptions.Item label={t('profile.lastLoginTime')}>{loginTimeText}</Descriptions.Item>
              <Descriptions.Item label={t('profile.lastLoginIp')}>{userInfo?.lastLoginIp ?? '-'}</Descriptions.Item>
            </Descriptions>
          </ProCard>
        </div>
      </div>

      <ProfileFormModal
        open={profileModalOpen}
        initialValues={profileInitialValues}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={async (values) => {
          profileMutation.mutate(values);
          return false;
        }}
      />

      <PasswordFormModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={async (values: CurrentUserPasswordUpdateRequest) => {
          passwordMutation.mutate(values);
          return false;
        }}
      />
    </PageContainer>
  );
}
