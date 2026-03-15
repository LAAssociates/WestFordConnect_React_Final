import { apiClient } from './apiClient';
import type {
  ActionResponse,
  MarkNotificationReadRequest,
  NotificationListResponse,
  NotificationUnreadCountResponse
} from '../types/notification';

export const notificationService = {
  getList: async (
    page: number = 1,
    size: number = 25,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> => {
    return apiClient.get<NotificationListResponse>('/api/notification/list', {
      params: { page, size, unreadOnly }
    });
  },

  getUnreadCount: async (): Promise<NotificationUnreadCountResponse> => {
    return apiClient.get<NotificationUnreadCountResponse>('/api/notification/unread-count');
  },

  markRead: async (payload: MarkNotificationReadRequest): Promise<ActionResponse> => {
    return apiClient.post<ActionResponse>('/api/notification/read', payload);
  },

  markAllRead: async (): Promise<ActionResponse> => {
    return apiClient.post<ActionResponse>('/api/notification/read-all');
  }
};
