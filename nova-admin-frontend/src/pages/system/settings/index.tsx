import { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Button, Skeleton, Tag } from 'antd';
import { message } from '@/utils/message';
import type { UploadProps } from 'antd';
import {
  EditOutlined,
  NotificationOutlined,
  SafetyOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getBasicSettings,
  getNoticeSettings,
  getSecuritySettings,
  getUploadSettings,
  updateBasicSettings,
  updateNoticeSettings,
  updateSecuritySettings,
  updateUploadSettings,
  type BasicSettings,
  type NoticeSettings,
  type SecuritySettings,
  type UploadSettings,
} from '@/api/settings';
import { uploadFile } from '@/api/file';
import RichTextContent from '@/components/RichTextContent';
import { useUserStore } from '@/stores/userStore';
import { useAppStore, type Locale } from '@/stores/appStore';
import { hasPermission } from '@/utils/layout';
import { displayText } from '@/utils/display';
import BasicSettingsFormModal from './components/BasicSettingsFormModal';
import DetailSection from './components/DetailSection';
import MetaPanel from './components/MetaPanel';
import MetaRow from './components/MetaRow';
import NoticeSettingsFormModal from './components/NoticeSettingsFormModal';
import OverviewCard from './components/OverviewCard';
import SecuritySettingsFormModal from './components/SecuritySettingsFormModal';
import UploadSettingsFormModal from './components/UploadSettingsFormModal';

const normalizeImageSrc = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const badge = (enabled: boolean, enabledText: string, disabledText: string) =>
  enabled ? <Tag color="success">{enabledText}</Tag> : <Tag>{disabledText}</Tag>;

const themeColorDisplay = (color: string | undefined, t: (key: string) => string) => {
  const themeLabels: Record<string, string> = {
    '#1677ff': t('settings.themeBlue'),
    '#4f46e5': t('settings.themeIndigo'),
    '#10b981': t('settings.themeEmerald'),
    '#f97316': t('settings.themeOrange'),
    '#e11d48': t('settings.themeRose'),
  };
  const label = color ? (themeLabels[color] ?? color) : '-';

  return color ? (
    <span className="inline-flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  ) : (
    label
  );
};

export default function SystemSettingsPage() {
  const { t } = useTranslation();
  const permissions = useUserStore((s) => s.permissions);
  const roles = useUserStore((s) => s.roles);
  const setSystemLocale = useAppStore((s) => s.setSystemLocale);
  const queryClient = useQueryClient();
  const canEdit =
    roles.includes('super_admin') || hasPermission('system:settings:edit', permissions);

  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>();

  const {
    data: basicData,
    isLoading: basicLoading,
    refetch: refetchBasic,
  } = useQuery({
    queryKey: ['settings', 'basic'],
    queryFn: async () => {
      const res = await getBasicSettings();
      return res.data;
    },
  });
  const {
    data: securityData,
    isLoading: securityLoading,
    refetch: refetchSecurity,
  } = useQuery({
    queryKey: ['settings', 'security'],
    queryFn: async () => {
      const res = await getSecuritySettings();
      return res.data;
    },
  });
  const {
    data: uploadData,
    isLoading: uploadLoading,
    refetch: refetchUpload,
  } = useQuery({
    queryKey: ['settings', 'upload'],
    queryFn: async () => {
      const res = await getUploadSettings();
      return res.data;
    },
  });
  const {
    data: noticeData,
    isLoading: noticeLoading,
    refetch: refetchNotice,
  } = useQuery({
    queryKey: ['settings', 'notice'],
    queryFn: async () => {
      const res = await getNoticeSettings();
      return res.data;
    },
  });

  useEffect(() => {
    setLogoUrl(basicData?.logoUrl);
  }, [basicData?.logoUrl]);

  const basicMutation = useMutation({
    mutationFn: updateBasicSettings,
    onSuccess: async (res, settings) => {
      if (res.code === 0) {
        message.success(t('settings.saveSuccess'));
        if (settings.defaultLanguage === 'zh_CN' || settings.defaultLanguage === 'en_US') {
          setSystemLocale(settings.defaultLanguage as Locale);
        }
        setBasicModalOpen(false);
        await Promise.all([
          refetchBasic(),
          queryClient.invalidateQueries({ queryKey: ['settings', 'public-basic'] }),
        ]);
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const securityMutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: async (res) => {
      if (res.code === 0) {
        message.success(t('settings.securitySaveSuccess'));
        setSecurityModalOpen(false);
        await refetchSecurity();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: updateUploadSettings,
    onSuccess: async (res) => {
      if (res.code === 0) {
        message.success(t('settings.saveSuccess'));
        setUploadModalOpen(false);
        await refetchUpload();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const noticeMutation = useMutation({
    mutationFn: updateNoticeSettings,
    onSuccess: async (res) => {
      if (res.code === 0) {
        message.success(t('settings.saveSuccess'));
        setNoticeModalOpen(false);
        await refetchNotice();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const logoUploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (res) => {
      if (res.code === 0 && res.data) {
        setLogoUrl(res.data.url);
        message.success(t('settings.logoUploadSuccess'));
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const logoUploadProps: UploadProps = {
    showUploadList: false,
    accept: 'image/*',
    customRequest: (options) => {
      logoUploadMutation.mutate(options.file as File);
      options.onSuccess?.({}, undefined as never);
    },
  };

  const safeBasicLogoSrc = useMemo(
    () => normalizeImageSrc(basicData?.logoUrl),
    [basicData?.logoUrl],
  );

  const basicInitialValues: BasicSettings = useMemo(
    () => ({
      systemName: basicData?.systemName,
      browserTitle: basicData?.browserTitle,
      defaultLanguage: basicData?.defaultLanguage,
      themeColor: basicData?.themeColor,
      copyrightText: basicData?.copyrightText,
      logoUrl: logoUrl ?? basicData?.logoUrl,
    }),
    [basicData, logoUrl],
  );
  const securityInitialValues: SecuritySettings = useMemo(() => securityData ?? {}, [securityData]);
  const uploadInitialValues: UploadSettings = useMemo(() => uploadData ?? {}, [uploadData]);
  const noticeInitialValues: NoticeSettings = useMemo(() => noticeData ?? {}, [noticeData]);

  return (
    <PageContainer title={t('settings.title')} className="page-fill overflow-y-auto">
      <div className="h-full overflow-y-auto pb-6">
        <div className="space-y-6 pr-1">
          {!canEdit ? (
            <Alert
              className="rounded-2xl"
              type="info"
              showIcon
              title={t('settings.readonlyHint')}
            />
          ) : null}

          <div className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-7 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.2),_transparent_34%)]" />
            <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
              <div>
                <div className="text-[11px] tracking-[0.34em] text-white/55 uppercase">
                  {t('settings.overviewLabel')}
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {t('settings.title')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                  {t('settings.subtitle')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('settings.basicTab'), tone: 'bg-blue-400' },
                  { label: t('settings.securityTab'), tone: 'bg-indigo-400' },
                  { label: t('settings.uploadTab'), tone: 'bg-emerald-400' },
                  { label: t('settings.noticeTab'), tone: 'bg-amber-400' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                      <span className="text-sm font-medium text-white/88">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {basicLoading || securityLoading || uploadLoading || noticeLoading ? (
            <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.22)]">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            <OverviewCard
              accentClass="bg-blue-50 text-blue-600"
              icon={<SettingOutlined />}
              title={t('settings.basicTab')}
              description={t('settings.basicDesc')}
              action={
                canEdit ? (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setBasicModalOpen(true)}
                  >
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
              highlights={[
                { label: t('settings.systemName'), value: displayText(basicData?.systemName) },
                {
                  label: t('settings.defaultLanguage'),
                  value: displayText(basicData?.defaultLanguage),
                },
                {
                  label: t('settings.themeColor'),
                  value: themeColorDisplay(basicData?.themeColor, t),
                },
                {
                  label: t('settings.logoPreview'),
                  value: safeBasicLogoSrc ? t('menu.enabled') : '-',
                },
              ]}
            />

            <OverviewCard
              accentClass="bg-indigo-50 text-indigo-600"
              icon={<SafetyOutlined />}
              title={t('settings.securityTab')}
              description={t('settings.securityDesc')}
              action={
                canEdit ? (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setSecurityModalOpen(true)}
                  >
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
              highlights={[
                {
                  label: t('settings.passwordMinLength'),
                  value: displayText(securityData?.passwordMinLength),
                },
                {
                  label: t('settings.captchaEnabled'),
                  value: badge(
                    Boolean(securityData?.captchaEnabled),
                    t('menu.enabled'),
                    t('menu.disabled'),
                  ),
                },
                {
                  label: t('settings.loginLockMaxAttempts'),
                  value: displayText(securityData?.loginLockMaxAttempts),
                },
                {
                  label: t('settings.loginLockMinutes'),
                  value: displayText(securityData?.loginLockMinutes),
                },
              ]}
            />

            <OverviewCard
              accentClass="bg-emerald-50 text-emerald-600"
              icon={<UploadOutlined />}
              title={t('settings.uploadTab')}
              description={t('settings.uploadDesc')}
              action={
                canEdit ? (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setUploadModalOpen(true)}
                  >
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
              highlights={[
                {
                  label: t('settings.maxSizeMb'),
                  value: `${displayText(uploadData?.maxSizeMb)} MB`,
                },
                {
                  label: t('settings.avatarMaxSizeMb'),
                  value: `${displayText(uploadData?.avatarMaxSizeMb)} MB`,
                },
                { label: t('settings.allowedTypes'), value: displayText(uploadData?.allowedTypes) },
                {
                  label: t('settings.avatarAllowedTypes'),
                  value: displayText(uploadData?.avatarAllowedTypes),
                },
              ]}
            />

            <OverviewCard
              accentClass="bg-amber-50 text-amber-600"
              icon={<NotificationOutlined />}
              title={t('settings.noticeTab')}
              description={t('settings.noticeDesc')}
              action={
                canEdit ? (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setNoticeModalOpen(true)}
                  >
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
              highlights={[
                { label: t('settings.noticeTitle'), value: displayText(noticeData?.title) },
                {
                  label: t('settings.noticeEnabled'),
                  value: badge(Boolean(noticeData?.enabled), t('menu.enabled'), t('menu.disabled')),
                },
                {
                  label: t('settings.emailEnabled'),
                  value: badge(
                    Boolean(noticeData?.emailEnabled),
                    t('menu.enabled'),
                    t('menu.disabled'),
                  ),
                },
                {
                  label: t('settings.smsEnabled'),
                  value: badge(
                    Boolean(noticeData?.smsEnabled),
                    t('menu.enabled'),
                    t('menu.disabled'),
                  ),
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-6">
            <DetailSection
              accentClass="bg-blue-50 text-blue-600"
              icon={<SettingOutlined />}
              eyebrow={t('settings.detailsLabel')}
              title={t('settings.basicSummary')}
              description={t('settings.basicDesc')}
              action={
                canEdit ? (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setBasicModalOpen(true)}
                  >
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
            >
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div className="rounded-[24px] bg-slate-50 p-5 text-center">
                  <Avatar
                    shape="square"
                    size={104}
                    src={safeBasicLogoSrc}
                    icon={<SettingOutlined />}
                  />
                  <div className="mt-4 text-lg font-semibold text-slate-900">
                    {displayText(basicData?.systemName)}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {displayText(basicData?.browserTitle)}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <MetaPanel title={t('settings.basicTab')}>
                    <MetaRow
                      label={t('settings.systemName')}
                      value={displayText(basicData?.systemName)}
                    />
                    <MetaRow
                      label={t('settings.browserTitle')}
                      value={displayText(basicData?.browserTitle)}
                    />
                    <MetaRow
                      label={t('settings.defaultLanguage')}
                      value={displayText(basicData?.defaultLanguage)}
                    />
                  </MetaPanel>
                  <MetaPanel title={t('settings.logoPreview')}>
                    <MetaRow
                      label={t('settings.themeColor')}
                      value={themeColorDisplay(basicData?.themeColor, t)}
                    />
                    <MetaRow
                      label={t('settings.copyrightText')}
                      value={displayText(basicData?.copyrightText)}
                    />
                  </MetaPanel>
                </div>
              </div>
            </DetailSection>

            <DetailSection
              accentClass="bg-indigo-50 text-indigo-600"
              icon={<SafetyOutlined />}
              eyebrow={t('settings.detailsLabel')}
              title={t('settings.securitySummary')}
              description={t('settings.securityDesc')}
              action={
                canEdit ? (
                  <Button icon={<EditOutlined />} onClick={() => setSecurityModalOpen(true)}>
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <MetaPanel title={t('settings.passwordPolicy')}>
                  <MetaRow
                    label={t('settings.passwordMinLength')}
                    value={displayText(securityData?.passwordMinLength)}
                  />
                  <MetaRow
                    label={t('settings.passwordRequireNumber')}
                    value={badge(
                      Boolean(securityData?.passwordRequireNumber),
                      t('menu.yes'),
                      t('menu.no'),
                    )}
                  />
                  <MetaRow
                    label={t('settings.passwordRequireLetter')}
                    value={badge(
                      Boolean(securityData?.passwordRequireLetter),
                      t('menu.yes'),
                      t('menu.no'),
                    )}
                  />
                  <MetaRow
                    label={t('settings.passwordRequireSpecial')}
                    value={badge(
                      Boolean(securityData?.passwordRequireSpecial),
                      t('menu.yes'),
                      t('menu.no'),
                    )}
                  />
                </MetaPanel>
                <MetaPanel title={t('settings.loginProtection')}>
                  <MetaRow
                    label={t('settings.captchaEnabled')}
                    value={badge(
                      Boolean(securityData?.captchaEnabled),
                      t('menu.enabled'),
                      t('menu.disabled'),
                    )}
                  />
                  <MetaRow
                    label={t('settings.loginLockMaxAttempts')}
                    value={displayText(securityData?.loginLockMaxAttempts)}
                  />
                  <MetaRow
                    label={t('settings.loginLockMinutes')}
                    value={displayText(securityData?.loginLockMinutes)}
                  />
                  <MetaRow
                    label={t('settings.accessTokenExpireMinutes')}
                    value={displayText(securityData?.accessTokenExpireMinutes)}
                  />
                  <MetaRow
                    label={t('settings.refreshTokenExpireMinutes')}
                    value={displayText(securityData?.refreshTokenExpireMinutes)}
                  />
                </MetaPanel>
              </div>
            </DetailSection>

            <DetailSection
              accentClass="bg-emerald-50 text-emerald-600"
              icon={<UploadOutlined />}
              eyebrow={t('settings.detailsLabel')}
              title={t('settings.uploadSummary')}
              description={t('settings.uploadDesc')}
              action={
                canEdit ? (
                  <Button icon={<EditOutlined />} onClick={() => setUploadModalOpen(true)}>
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <MetaPanel title={t('settings.generalUpload')}>
                  <MetaRow
                    label={t('settings.maxSizeMb')}
                    value={`${displayText(uploadData?.maxSizeMb)} MB`}
                  />
                  <MetaRow
                    label={t('settings.allowedTypes')}
                    value={displayText(uploadData?.allowedTypes)}
                    stacked
                  />
                </MetaPanel>
                <MetaPanel title={t('settings.avatarUploadGroup')}>
                  <MetaRow
                    label={t('settings.avatarMaxSizeMb')}
                    value={`${displayText(uploadData?.avatarMaxSizeMb)} MB`}
                  />
                  <MetaRow
                    label={t('settings.avatarAllowedTypes')}
                    value={displayText(uploadData?.avatarAllowedTypes)}
                    stacked
                  />
                </MetaPanel>
              </div>
            </DetailSection>

            <DetailSection
              accentClass="bg-amber-50 text-amber-600"
              icon={<NotificationOutlined />}
              eyebrow={t('settings.detailsLabel')}
              title={t('settings.noticeSummary')}
              description={t('settings.noticeDesc')}
              action={
                canEdit ? (
                  <Button icon={<EditOutlined />} onClick={() => setNoticeModalOpen(true)}>
                    {t('settings.editSection')}
                  </Button>
                ) : null
              }
            >
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <MetaPanel title={t('settings.noticeMessage')}>
                  <MetaRow
                    label={t('settings.noticeTitle')}
                    value={displayText(noticeData?.title)}
                  />
                  <MetaRow
                    label={t('settings.noticeEnabled')}
                    value={badge(
                      Boolean(noticeData?.enabled),
                      t('menu.enabled'),
                      t('menu.disabled'),
                    )}
                  />
                  <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-600">
                    {noticeData?.content ? (
                      <RichTextContent content={noticeData.content} />
                    ) : (
                      displayText(noticeData?.content)
                    )}
                  </div>
                </MetaPanel>
                <div className="grid gap-4">
                  <MetaPanel title={t('settings.emailChannel')}>
                    <MetaRow
                      label={t('settings.emailEnabled')}
                      value={badge(
                        Boolean(noticeData?.emailEnabled),
                        t('menu.enabled'),
                        t('menu.disabled'),
                      )}
                    />
                    <MetaRow
                      label={t('settings.emailHost')}
                      value={displayText(noticeData?.emailHost)}
                    />
                    <MetaRow
                      label={t('settings.emailPort')}
                      value={displayText(noticeData?.emailPort)}
                    />
                    <MetaRow
                      label={t('settings.emailUsername')}
                      value={displayText(noticeData?.emailUsername)}
                    />
                  </MetaPanel>
                  <MetaPanel title={t('settings.smsChannel')}>
                    <MetaRow
                      label={t('settings.smsEnabled')}
                      value={badge(
                        Boolean(noticeData?.smsEnabled),
                        t('menu.enabled'),
                        t('menu.disabled'),
                      )}
                    />
                    <MetaRow
                      label={t('settings.smsProvider')}
                      value={displayText(noticeData?.smsProvider)}
                    />
                  </MetaPanel>
                </div>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>

      <BasicSettingsFormModal
        open={basicModalOpen}
        initialValues={basicInitialValues}
        logoUrl={logoUrl}
        logoUploadProps={logoUploadProps}
        logoUploading={logoUploadMutation.isPending}
        onClose={() => setBasicModalOpen(false)}
        onSubmit={async (values) => {
          basicMutation.mutate({ ...values, logoUrl });
          return false;
        }}
      />

      <SecuritySettingsFormModal
        open={securityModalOpen}
        initialValues={securityInitialValues}
        onClose={() => setSecurityModalOpen(false)}
        onSubmit={async (values) => {
          securityMutation.mutate(values);
          return false;
        }}
      />

      <UploadSettingsFormModal
        open={uploadModalOpen}
        initialValues={uploadInitialValues}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={async (values) => {
          uploadMutation.mutate(values);
          return false;
        }}
      />

      <NoticeSettingsFormModal
        open={noticeModalOpen}
        initialValues={noticeInitialValues}
        onClose={() => setNoticeModalOpen(false)}
        onSubmit={async (values) => {
          noticeMutation.mutate(values);
          return false;
        }}
      />
    </PageContainer>
  );
}
