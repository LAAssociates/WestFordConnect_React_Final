export interface NotificationItem {
  notificationId: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: number | null;
  isRead: boolean;
  createdOn: string;
  payloadJson?: string | null;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  result: NotificationItem[];
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface NotificationUnreadCountResponse {
  success: boolean;
  message: string;
  result: {
    unreadCount: number;
  };
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface MarkNotificationReadRequest {
  notificationId: number;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}
