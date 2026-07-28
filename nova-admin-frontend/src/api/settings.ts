import { request } from '@/utils/request';
import type { R } from '@/types/api';

export type SettingsGroup = 'basic' | 'security' | 'upload' | 'notice';
export type NoticeLevel = 'info' | 'success' | 'warning' | 'error';

export interface BasicSettings {
  systemName?: string;
  browserTitle?: string;
  logoUrl?: string;
  defaultLanguage?: string;
  themeColor?: string;
  copyrightText?: string;
}

export interface SecuritySettings {
  passwordMinLength?: number;
  passwordRequireNumber?: boolean;
  passwordRequireLetter?: boolean;
  passwordRequireSpecial?: boolean;
  loginLockMaxAttempts?: number;
  loginLockMinutes?: number;
  captchaEnabled?: boolean;
  accessTokenExpireMinutes?: number;
  refreshTokenExpireMinutes?: number;
}

export interface UploadSettings {
  maxSizeMb?: number;
  allowedTypes?: string;
  avatarMaxSizeMb?: number;
  avatarAllowedTypes?: string;
}

export interface NoticeSettings {
  title?: string;
  content?: string;
  enabled?: boolean;
  level?: NoticeLevel;
  emailEnabled?: boolean;
  emailHost?: string;
  emailPort?: number;
  emailUsername?: string;
  smsEnabled?: boolean;
  smsProvider?: string;
}

export interface ActiveNotice {
  title?: string;
  content?: string;
}

export const getSettingsGroup = <T>(group: SettingsGroup) =>
  request<R<T>>({ url: `/system/config/group/${group}`, method: 'GET' });

export const updateSettingsGroup = <T>(group: SettingsGroup, data: T) =>
  request<R<void>>({ url: `/system/config/group/${group}`, method: 'PUT', data });

export const getBasicSettings = () => getSettingsGroup<BasicSettings>('basic');
export const getPublicBasicSettings = () =>
  request<R<BasicSettings>>({ url: '/system/config/basic', method: 'GET' });
export const getActiveNotice = () =>
  request<R<ActiveNotice>>({ url: '/system/config/notice', method: 'GET' });
export const updateBasicSettings = (data: BasicSettings) => updateSettingsGroup('basic', data);

export const getSecuritySettings = () => getSettingsGroup<SecuritySettings>('security');
export const updateSecuritySettings = (data: SecuritySettings) =>
  updateSettingsGroup('security', data);

export const getUploadSettings = () => getSettingsGroup<UploadSettings>('upload');
export const updateUploadSettings = (data: UploadSettings) => updateSettingsGroup('upload', data);

export const getNoticeSettings = () => getSettingsGroup<NoticeSettings>('notice');
export const updateNoticeSettings = (data: NoticeSettings) => updateSettingsGroup('notice', data);
