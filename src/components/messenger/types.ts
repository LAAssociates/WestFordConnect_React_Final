export interface User {
  id: string;
  name: string;
  position: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface Attachment {
  id: string;
  attachmentId?: number;
  type: 'image' | 'file';
  name: string;
  url: string;
  size?: number;
  contentType?: string;
  downloadCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  status: 'pending' | 'sent' | 'delivered' | 'read';
  tempId?: string; // Temporary ID for pending messages
  uploadProgress?: number;
}

export interface Conversation {
  id: string;
  type: 'individual' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: Message;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isLeft?: boolean;
  leftOn?: Date;
  mentions?: number;
  participants: User[];
}

export interface ProjectGroup {
  id: string;
  name: string;
  icon?: string;
  members: User[];
  createdAt: Date;
}

export type ConversationFilter = 'all' | 'unread' | 'project-groups';

export type MessengerView = 'conversations' | 'new-chat' | 'add-members' | 'new-group';

