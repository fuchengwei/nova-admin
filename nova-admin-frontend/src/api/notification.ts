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

export const getNotificationSummary = () =>
  request<R<NotificationSummary>>({ url: '/system/notification/summary', method: 'GET' });

export const markNotificationRead = (id: string) =>
  request<R<void>>({ url: `/system/notification/${id}/read`, method: 'PUT' });

export const markAllNotificationsRead = () =>
  request<R<number>>({ url: '/system/notification/read-all', method: 'PUT' });
