export interface ChatUserInfo {
  id: number;
  name: string;
  email: string;
  department: string;
  departmentId: number;
  designation: string;
  designationId: number;
  profileImageUrl: string;
  availabilityStatus?: number | null;
  isOnline?: boolean | null;
}

export interface ChatBootstrapResult {
  users: ChatUserInfo[];
}

export interface ChatBootstrapResponse {
  success: boolean;
  message: string | null;
  result: ChatBootstrapResult;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ChatListResponse {
  success: boolean;
  message: string;
  result: any[]; // Adjust once the structure of existing chats is known
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ChatUnreadCountResponse {
  success: boolean;
  message: string;
  result: {
    unreadConversationCount: number;
  } | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ChatSendRequest {
  chatType: 'user' | 'group';
  chatId: number;
  message: string;
}

export interface ChatSendFileRequest {
  chatType: 'user' | 'group';
  chatId: number;
  message?: string;
  file: File;
}

export interface ChatSendResponse {
  success: boolean;
  message: string;
  result: any;
  errors: any | null;
  requestId: string;
  timestamp: string;
}
export interface StartPrivateChatRequest {
  targetUserId: number;
}

export interface StartPrivateChatByEmailRequest {
  targetEmail: string;
}

export interface StartPrivateChatResponse {
  success: boolean;
  message: string;
  result: {
    chatId: number;
  };
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface StartPrivateChatByEmailResponse {
  success: boolean;
  message: string;
  result: {
    chatId: number;
    targetUserId: number;
  } | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ChatMessage {
  messageId: number;
  chatType: 'user' | 'group';
  chatId: number;
  senderId: number;
  message: string;
  attachments?: ChatAttachment[];
  createdOn: string;
  isDelivered?: boolean | null;
  isRead?: boolean | null;
}

export interface ChatAttachment {
  attachmentId: number;
  attachmentType: string;
  displayText: string;
  fileKey?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  size?: number | null;
  fileSize?: number | null;
  fileSizeBytes?: number | null;
  contentLength?: number | null;
  downloadCount?: number;
  url?: string | null;
}

export interface ChatMessageResponse {
  success: boolean;
  message: string;
  result: ChatMessage[];
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ChatMembership {
  chatType: 'user' | 'group';
  chatId: number;
}

export interface ChatMembershipsResponse {
  success: boolean;
  message: string;
  result: ChatMembership[];
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface CreateGroupRequest {
  groupName: string;
  userIds: number[];
  groupImage?: File | null;
}

export interface CreateGroupResponse {
  success: boolean;
  message: string;
  result: {
    groupId: number;
  };
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ToggleChatPinnedRequest {
  chatType: 'user' | 'group';
  chatId: number;
  isPinned: boolean;
}

export interface ToggleChatPinnedResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ToggleChatMuteRequest {
  chatType: 'user' | 'group';
  chatId: number;
  isMuted: boolean;
}

export interface ToggleChatMuteResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ToggleChatUnreadRequest {
  chatType: 'user' | 'group';
  chatId: number;
  isUnread: boolean;
  lastMessageId?: number | null;
}

export interface ToggleChatUnreadResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ChatDownloadAttachmentRequest {
  chatType: 'user' | 'group';
  chatId: number;
  messageId: number;
  attachmentId: number;
}

export interface FileDownloadResponse {
  success: boolean;
  message: string;
  result: {
    url: string;
  } | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export interface ExitGroupRequest {
  groupId: number;
}

export interface ExitGroupResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}
