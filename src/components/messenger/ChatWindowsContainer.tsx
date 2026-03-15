import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { Conversation, Message } from './types';
import ChatWindow from './ChatWindow';
import Logo from '../common/Logo';


interface ChatWindowsContainerProps {
  openChats: Conversation[];
  messages: Record<string, Message[]>;
  currentUserId: string;
  currentUserName: string;
  onCloseChat: (conversationId: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  onSendFile?: (conversationId: string, file: File, caption?: string) => Promise<void>;
  onDownloadAttachment?: (
    conversationId: string,
    messageId: string,
    attachmentId: number,
    fileName: string
  ) => Promise<void>;
  onPinToggle?: (conversationId: string) => void;
  onMarkAsReadToggle?: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  onMuteToggle?: (conversationId: string) => void;
  onViewMedia?: (conversationId: string) => void;
}

const ChatWindowsContainer: React.FC<ChatWindowsContainerProps> = ({
  openChats,
  messages,
  currentUserId,
  currentUserName,
  onCloseChat,
  onSendMessage,
  onSendFile,
  onDownloadAttachment,
  onPinToggle,
  onMarkAsReadToggle,
  onMarkAsRead,
  onMuteToggle,
  onViewMedia,
}) => {
  if (openChats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <Logo centered />
        <p className="text-base text-[#535352] font-medium leading-normal mt-0.5">WEngage. WEmpower.</p>
        <p className="text-sm text-[#535352] font-medium leading-normal mt-[46px]">
          Manage your conversations and projects with clarity and confidence.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex-1 flex gap-0',
      // openChats.length === 2 ? 'divide-x-4 divide-[#E0E3E7]' : ''
    )}>
      {openChats.map((chat, index) => (
        <div
          key={chat.id}
          className={cn(
            'flex-1 overflow-hidden shadow-[2px_2px_4px_0_rgba(0,0,0,0.10)]',
            index === 0 ? 'rounded-tr-[10px]' : 'rounded-tl-[10px] ml-1',
            openChats.length === 2 ? 'w-1/2' : 'w-full'
          )}
        >
          <ChatWindow
            conversation={chat}
            messages={messages[chat.id] || []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onClose={() => onCloseChat(chat.id)}
            onSendMessage={(content) => onSendMessage(chat.id, content)}
            onSendFile={onSendFile}
            onDownloadAttachment={onDownloadAttachment}
            onPinToggle={onPinToggle}
            onMarkAsReadToggle={onMarkAsReadToggle}
            onMarkAsRead={onMarkAsRead}
            onMuteToggle={onMuteToggle}
            onViewMedia={onViewMedia}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatWindowsContainer;
