import { apiClient } from './apiClient';
import type { AxiosProgressEvent } from 'axios';
import type {
  ChatBootstrapResponse,
  ChatListResponse,
  ChatSendRequest,
  ChatSendFileRequest,
  ChatDownloadAttachmentRequest,
  ChatSendResponse,
  StartPrivateChatRequest,
  StartPrivateChatResponse,
  ChatMessageResponse,
  CreateGroupRequest,
  CreateGroupResponse,
  ChatMembershipsResponse,
  ToggleChatPinnedRequest,
  ToggleChatPinnedResponse,
  ToggleChatMuteRequest,
  ToggleChatMuteResponse,
  ToggleChatUnreadRequest,
  ToggleChatUnreadResponse,
  FileDownloadResponse,
  ExitGroupRequest,
  ExitGroupResponse,
} from '../types/chat';

export const chatService = {
  getChatList: async (page: number = 1, size: number = 50): Promise<ChatListResponse> => {
    return apiClient.get<ChatListResponse>('/api/Chat/list', {
      params: { page, size }
    });
  },

  getProjectGroupChats: async (page: number = 1, size: number = 50): Promise<ChatListResponse> => {
    return apiClient.get<ChatListResponse>('/api/Chat/project-groups', {
      params: { page, size }
    });
  },

  bootstrap: async (): Promise<ChatBootstrapResponse> => {
    return apiClient.get<ChatBootstrapResponse>('/api/Chat/bootstrap');
  },

  sendMessage: async (payload: ChatSendRequest): Promise<ChatSendResponse> => {
    return apiClient.post<ChatSendResponse>('/api/Chat/send', payload);
  },

  sendFileMessage: async (
    payload: ChatSendFileRequest,
    onUploadProgress?: (progress: number) => void
  ): Promise<ChatSendResponse> => {
    const form = new FormData();
    form.append('ChatType', payload.chatType);
    form.append('ChatId', payload.chatId.toString());
    if (payload.message) {
      form.append('Message', payload.message);
    }
    form.append('File', payload.file);

    return apiClient.post<ChatSendResponse>('/api/Chat/send-file', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt: AxiosProgressEvent) => {
        if (!onUploadProgress || !evt.total) return;
        const percent = Math.max(0, Math.min(100, Math.round((evt.loaded * 100) / evt.total)));
        onUploadProgress(percent);
      }
    });
  },

  startPrivateChat: async (payload: StartPrivateChatRequest): Promise<StartPrivateChatResponse> => {
    return apiClient.post<StartPrivateChatResponse>('/api/chat/private/start', payload);
  },

  createGroup: async (payload: CreateGroupRequest): Promise<CreateGroupResponse> => {
    const form = new FormData();
    form.append('GroupName', payload.groupName);
    payload.userIds.forEach((id) => form.append('UserIds', id.toString()));
    if (payload.groupImage) {
      form.append('GroupImage', payload.groupImage);
    }

    return apiClient.post<CreateGroupResponse>('/api/chat/group', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMemberships: async (): Promise<ChatMembershipsResponse> => {
    return apiClient.get<ChatMembershipsResponse>('/api/chat/memberships');
  },

  getMessages: async (
    type: string,
    chatId: number,
    page: number = 1,
    size: number = 50,
    beforeMessageId?: number
  ): Promise<ChatMessageResponse> => {
    return apiClient.get<ChatMessageResponse>('/api/Chat/messages', {
      params: { type, chatId, page, size, beforeMessageId }
    });
  },

  togglePinned: async (payload: ToggleChatPinnedRequest): Promise<ToggleChatPinnedResponse> => {
    return apiClient.post<ToggleChatPinnedResponse>('/api/chat/pin/toggle', payload);
  },

  toggleMute: async (payload: ToggleChatMuteRequest): Promise<ToggleChatMuteResponse> => {
    return apiClient.post<ToggleChatMuteResponse>('/api/chat/mute/toggle', payload);
  },

  toggleUnread: async (payload: ToggleChatUnreadRequest): Promise<ToggleChatUnreadResponse> => {
    return apiClient.post<ToggleChatUnreadResponse>('/api/chat/unread/toggle', payload);
  },

  downloadAttachment: async (payload: ChatDownloadAttachmentRequest): Promise<FileDownloadResponse> => {
    return apiClient.post<FileDownloadResponse>('/api/chat/attachment/download', payload);
  },

  exitGroup: async (payload: ExitGroupRequest): Promise<ExitGroupResponse> => {
    return apiClient.post<ExitGroupResponse>('/api/chat/group/exit', payload);
  },
};
