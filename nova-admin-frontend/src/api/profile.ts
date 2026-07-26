import { request } from '@/utils/request';
import type { R, UserInfo } from '@/types/api';

export interface CurrentUserProfileUpdateRequest {
  nickname?: string;
  realName?: string;
  email?: string;
  phone?: string;
  gender?: number;
}

export interface CurrentUserPasswordUpdateRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AvatarUpdateResponse {
  avatar: string;
}

export const getCurrentUserProfile = () =>
  request<R<UserInfo>>({ url: '/system/user/me', method: 'GET' });

export const updateCurrentUserProfile = (data: CurrentUserProfileUpdateRequest) =>
  request<R<void>>({ url: '/system/user/me/profile', method: 'PUT', data });

export const uploadCurrentUserAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request<R<AvatarUpdateResponse>>({
    url: '/system/user/me/avatar',
    method: 'POST',
    data: formData,
  });
};

export const updateCurrentUserPassword = (data: CurrentUserPasswordUpdateRequest) =>
  request<R<void>>({ url: '/system/user/me/password', method: 'PUT', data });
