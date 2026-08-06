import { request } from '@/utils/request';
import type { PageResult, R } from '@/types/api';

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
  records: NotificationRecord[];
}

export type NotificationRecipientType = 'ALL' | 'ROLE' | 'USER';
export type NotificationPublishMode = 'IMMEDIATE' | 'SCHEDULED' | 'DRAFT';

export interface NotificationRecipientOption {
  id: string;
  label: string;
}

export interface NotificationRecipientOptions {
  users: NotificationRecipientOption[];
  roles: NotificationRecipientOption[];
}

export interface NotificationPublishRequest {
  title: string;
  content: string;
  link?: string;
  recipientType: NotificationRecipientType;
  recipientIds?: string[];
  mode?: NotificationPublishMode;
  scheduledAt?: string;
}

export interface NotificationPublishResult {
  id?: string;
  status: string;
  recipientCount: number;
  scheduledAt?: string;
}

export interface NotificationDraft {
  id: string;
  title: string;
  content: string;
  link?: string;
  recipientType: NotificationRecipientType;
  recipientIds: string[];
}

export interface NotificationRecipientPreviewRequest {
  recipientType: NotificationRecipientType;
  recipientIds?: string[];
}

export interface NotificationRecipientPreview {
  recipientCount: number;
  samples: NotificationRecipientOption[];
}

export interface NotificationHistoryRecord {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  publisherId?: string;
  publisherName: string;
  status: string;
  scheduledAt?: string;
  errorMsg?: string;
  createTime: string;
  recipientCount: number;
  readCount: number;
  unreadCount: number;
}

export interface NotificationHistoryQuery {
  current?: number;
  size?: number;
  title?: string;
  type?: string;
  status?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

export interface NotificationRecipientRecord {
  id: string;
  userId: string;
  account: string;
  nickname?: string;
  createTime: string;
  readAt?: string;
  read: boolean;
}

export interface NotificationRecipientQuery {
  current?: number;
  size?: number;
  keyword?: string;
  read?: boolean;
}

export const getNotificationSummary = () =>
  request<R<NotificationSummary>>({ url: '/system/notification/summary', method: 'GET' });

export const markNotificationRead = (id: string) =>
  request<R<void>>({ url: `/system/notification/${id}/read`, method: 'PUT' });

export const markAllNotificationsRead = () =>
  request<R<number>>({ url: '/system/notification/read-all', method: 'PUT' });

export const getNotificationRecipientOptions = () =>
  request<R<NotificationRecipientOptions>>({
    url: '/system/notification/recipients',
    method: 'GET',
  });

export const previewNotificationRecipients = (data: NotificationRecipientPreviewRequest) =>
  request<R<NotificationRecipientPreview>>({
    url: '/system/notification/recipients/preview',
    method: 'POST',
    data,
  });

export const publishNotification = (data: NotificationPublishRequest) =>
  request<R<NotificationPublishResult>>({
    url: '/system/notification/publish',
    method: 'POST',
    data,
  });

export const getNotificationDraft = (id: string) =>
  request<R<NotificationDraft>>({ url: `/system/notification/${id}/draft`, method: 'GET' });

export const updateNotificationDraft = (id: string, data: NotificationPublishRequest) =>
  request<R<NotificationPublishResult>>({
    url: `/system/notification/${id}`,
    method: 'PUT',
    data,
  });

export const deleteNotificationDraft = (id: string) =>
  request<R<void>>({ url: `/system/notification/${id}`, method: 'DELETE' });

export const cancelNotification = (id: string) =>
  request<R<void>>({ url: `/system/notification/${id}/cancel`, method: 'POST' });

export const getNotificationHistoryPage = (params: NotificationHistoryQuery) =>
  request<R<PageResult<NotificationHistoryRecord>>>({
    url: '/system/notification/page',
    method: 'GET',
    params,
  });

export const getNotificationHistory = (id: string) =>
  request<R<NotificationHistoryRecord>>({ url: '/system/notification/' + id, method: 'GET' });

export const getNotificationRecipientsPage = (id: string, params: NotificationRecipientQuery) =>
  request<R<PageResult<NotificationRecipientRecord>>>({
    url: '/system/notification/' + id + '/recipients',
    method: 'GET',
    params,
  });
