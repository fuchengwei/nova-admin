import { request } from '@/utils/request';
import type { R } from '@/types/api';

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

export const publishNotification = (data: NotificationPublishRequest) =>
  request<R<number>>({ url: '/system/notification/publish', method: 'POST', data });
