import React, { useState, useRef } from 'react';
import { BellOff } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { Conversation } from './types';
import StatusIndicator from './StatusIndicator';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import ConversationDropdown from '../common/ConversationDropdown';
import HighlightText from '../common/HighlightText';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
  onClick?: () => void;
  onMuteNotifications?: (conversationId: string) => void;
  onPinGroup?: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  onExitGroup?: (conversationId: string) => void;
  currentUserId: string;
  searchQuery?: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected = false,
  onClick,
  onMuteNotifications,
  onPinGroup,
  onMarkAsRead,
  onExitGroup,
  currentUserId,
  searchQuery = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const currentUser = conversation.participants.find((p) => p.id === currentUserId);
  const normalizeMentionName = (name: string): string => name.replace(/\s+/g, '').replace(/[^A-Za-z0-9_]/g, '');

  const normalizeIncomingMentionPreview = (text: string): string => {
    if (!currentUser) return text;
    const fullToken = normalizeMentionName(currentUser.name);
    const firstToken = normalizeMentionName(currentUser.name.split(' ')[0] || '');
    let normalized = text;
    if (fullToken) {
      const fullMentionPattern = new RegExp(`@${fullToken}\\b`, 'gi');
      normalized = normalized.replace(fullMentionPattern, '@You');
    }
    if (firstToken) {
      const firstMentionPattern = new RegExp(`@${firstToken}\\b`, 'gi');
      normalized = normalized.replace(firstMentionPattern, '@You');
    }
    return normalized;
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const lastMessagePreview = conversation.lastMessage
    ? conversation.type === 'group' && conversation.lastMessage.senderName !== 'You'
      ? `${conversation.lastMessage.senderName}: ${normalizeIncomingMentionPreview(conversation.lastMessage.content)}`
      : normalizeIncomingMentionPreview(conversation.lastMessage.content)
    : 'No messages yet';

  // Get the other participant (not current user) - only for individual conversations
  const otherParticipant = conversation.type === 'individual'
    ? conversation.participants.find((p) => p.id !== currentUserId) || conversation.participants[0]
    : null;
  const showUnreadIndicators = conversation.unreadCount > 0;

  // Render message status indicator (WhatsApp-style)
  const renderMessageStatus = () => {
    if (!conversation.lastMessage || conversation.lastMessage.senderId !== currentUserId) {
      return null;
    }

    const status = conversation.lastMessage.status;
    const isRead = status === 'read';
    const isDelivered = status === 'delivered';

    if (isRead) {
      // Blue double tick for read
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 flex-shrink-0">
          <path d="M1.75 9.75L4.25 12.25M7.75 8.25L10.25 5.75M5.75 9.75L8.25 12.25L14.25 5.75" stroke="#1E88E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (isDelivered) {
      // Black double tick for delivered
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 flex-shrink-0">
          <path d="M1.75 9.75L4.25 12.25M7.75 8.25L10.25 5.75M5.75 9.75L8.25 12.25L14.25 5.75" stroke="#535352" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else {
      // Single tick for sent
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 flex-shrink-0">
          <path d="M2.75 8.75L6.25 12.25L13.25 4.75" stroke="#535352" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-2.5 ps-5 pe-[33px] py-[15px] cursor-pointer transition-colors border-b border-b-[#E6E6E6] group',
        isSelected ? 'bg-[#E6E6E6]' : 'bg-white hover:bg-[#E6E6E6]'
      )}
    >
      <div className="relative flex-shrink-0">
        <img
          src={conversation.avatar || avatarPlaceholder}
          alt={conversation.name}
          className="w-12 h-12 rounded-full object-cover border border-[#E6E6E6]"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = avatarPlaceholder;
          }}
        />
        {conversation.type === 'individual' && otherParticipant?.status && otherParticipant.status !== 'offline' && (
          <div className="absolute bottom-0 right-0">
            <StatusIndicator status={otherParticipant.status} />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between gap-[5px] min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn("text-[16px] leading-normal truncate font-semibold")}>
            <HighlightText text={conversation.name} highlight={searchQuery} />
          </h3>
          <span className={cn("text-[12px] leading-normal font-semibold flex-shrink-0", showUnreadIndicators ? "text-[#008080]" : "text-[#535352]")}>
            {formatTimestamp(conversation.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn("text-[13px] truncate flex-1 mr-2 text-[#535352] font-normal flex items-center")}>
            {conversation.lastMessage?.senderId === currentUserId && renderMessageStatus()}
            {conversation.type === 'group' && conversation.lastMessage && conversation.lastMessage.senderName !== 'You' ? (
                <span className="truncate">
                  <span className="font-medium">{conversation.lastMessage.senderName}:</span>{' '}
                  <span>{normalizeIncomingMentionPreview(conversation.lastMessage.content)}</span>
                </span>
              ) : (
                <span className="truncate">{lastMessagePreview.replace(/^You: /, '')}</span>
              )}
          </p>
          <div className="flex items-center gap-1">
            {showUnreadIndicators && conversation.mentions && conversation.mentions > 0 && (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.71875 4.78906C7.71875 4.51302 7.63542 4.28125 7.46875 4.09375C7.30208 3.90625 7.07812 3.8125 6.79688 3.8125C6.25521 3.8125 5.78906 4.15104 5.39844 4.82812C5.00781 5.5 4.8125 6.15104 4.8125 6.78125C4.8125 7.16146 4.89844 7.46875 5.07031 7.70312C5.2474 7.9375 5.49479 8.05469 5.8125 8.05469C6.36979 8.05469 6.82552 7.63281 7.17969 6.78906C7.53906 5.9401 7.71875 5.27344 7.71875 4.78906ZM5.3125 9.20312C4.68229 9.20312 4.15625 8.97656 3.73438 8.52344C3.31771 8.07031 3.10938 7.4375 3.10938 6.625C3.10938 5.68229 3.42969 4.79948 4.07031 3.97656C4.71094 3.15365 5.4974 2.74219 6.42969 2.74219C6.97656 2.74219 7.40104 2.89323 7.70312 3.19531C7.93229 3.42969 8.08594 3.69792 8.16406 4L8.44531 3.01562H9.92188L8.92188 6.40625C8.84375 6.68229 8.78646 6.88802 8.75 7.02344C8.71875 7.15365 8.70312 7.26823 8.70312 7.36719C8.70312 7.52344 8.75521 7.67188 8.85938 7.8125C8.96354 7.94792 9.13021 8.01562 9.35938 8.01562C9.80729 8.01562 10.2552 7.72396 10.7031 7.14062C11.1562 6.55208 11.3828 5.77344 11.3828 4.80469C11.3828 3.3724 10.7682 2.34375 9.53906 1.71875C8.76823 1.32292 7.90104 1.125 6.9375 1.125C5.16667 1.125 3.74479 1.66667 2.67188 2.75C1.70312 3.72917 1.21875 4.90365 1.21875 6.27344C1.21875 7.79427 1.78646 9 2.92188 9.89062C3.92708 10.6771 5.15365 11.0703 6.60156 11.0703C7.59115 11.0703 8.51562 10.888 9.375 10.5234C9.84375 10.3307 10.3281 10.0573 10.8281 9.70312L11.0156 9.57031L11.5859 10.4453C10.8464 11.0182 10.0443 11.4557 9.17969 11.7578C8.32031 12.0547 7.42708 12.2031 6.5 12.2031C4.33854 12.2031 2.66406 11.5312 1.47656 10.1875C0.492188 9.07292 0 7.7526 0 6.22656C0 4.51823 0.614583 3.07031 1.84375 1.88281C3.13542 0.627604 4.78906 0 6.80469 0C8.44531 0 9.80469 0.429688 10.8828 1.28906C12.0182 2.19531 12.5859 3.39844 12.5859 4.89844C12.5859 6.08073 12.2266 7.09635 11.5078 7.94531C10.7891 8.78906 9.96875 9.21094 9.04688 9.21094C8.56771 9.21094 8.19792 9.07552 7.9375 8.80469C7.68229 8.53385 7.55469 8.25521 7.55469 7.96875C7.55469 7.93229 7.55469 7.89323 7.55469 7.85156C7.5599 7.80469 7.5651 7.75521 7.57031 7.70312C7.3724 8.07812 7.15104 8.3776 6.90625 8.60156C6.46354 9.0026 5.93229 9.20312 5.3125 9.20312Z" fill="#008080" />
              </svg>
            )}
            {showUnreadIndicators && (
              <div className="flex items-center justify-center bg-[#008080] text-white text-[14px] leading-normal font-semibold w-[21px] h-[21px] rounded-full">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </div>
            )}
            {conversation.isMuted && (
              <div className="w-[21px] h-[21px] rounded-full bg-[#E6E6E6] flex items-center justify-center" title="Notifications muted">
                <BellOff size={12} color="#000000" strokeWidth={2.2} />
              </div>
            )}
            {conversation.isPinned && (
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10.5" cy="10.5" r="10.5" fill="#E6E6E6" />
                <path d="M16 8.81407C15.8784 8.93568 15.7605 9.04623 15.6462 9.14573C15.532 9.24523 15.4122 9.33183 15.2869 9.40553C15.1616 9.47923 15.0271 9.53266 14.8834 9.56583C14.7397 9.599 14.5739 9.61926 14.3859 9.62663C14.2606 9.62663 14.1409 9.61558 14.0266 9.59347L11.9317 11.6884C11.9796 11.8285 12.0146 11.9722 12.0367 12.1196C12.0588 12.267 12.0698 12.4144 12.0698 12.5618C12.0698 12.8013 12.0459 13.0188 11.998 13.2141C11.9501 13.4094 11.8819 13.5936 11.7935 13.7668C11.705 13.94 11.5945 14.104 11.4618 14.2588C11.3291 14.4136 11.1836 14.5739 11.0251 14.7397L8.89146 12.606L5.75176 15.7513L5 16L5.24874 15.2482L8.39397 12.1085L6.2603 9.97487L6.50905 9.72613C6.767 9.46817 7.06181 9.27102 7.39347 9.13467C7.72513 8.99833 8.07521 8.93015 8.44372 8.93015C8.7459 8.93015 9.03518 8.97621 9.31156 9.06834L11.4065 6.97337C11.3844 6.85913 11.3734 6.73936 11.3734 6.61407C11.3734 6.4335 11.3918 6.27136 11.4286 6.12764C11.4655 5.98392 11.5208 5.84757 11.5945 5.71859C11.6682 5.58961 11.7529 5.46985 11.8487 5.3593C11.9446 5.24874 12.057 5.12898 12.1859 5L16 8.81407Z" fill="black" />
              </svg>
            )}
            <button
              ref={dropdownButtonRef}
              className={cn(
                "overflow-hidden transition-all duration-300 flex items-center justify-center py-1",
                isDropdownOpen ? "w-4" : "w-0 group-hover:w-4"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
                className={cn(
                  "transition-transform duration-300",
                  isDropdownOpen && "rotate-180"
                )}
              >
                <path d="M0.264138 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899076 11.1057 0.0110741C11.3422 0.0131569 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.67763 12 0.917343C12.002 1.15705 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264138 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671627 0.0950107 0.439126 0.264138 0.267679Z" fill="black" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <ConversationDropdown
        conversationId={conversation.id}
        conversationType={conversation.type}
        buttonRef={dropdownButtonRef}
        isMuted={conversation.isMuted}
        isPinned={conversation.isPinned}
        unreadCount={conversation.unreadCount}
        onMuteNotifications={onMuteNotifications}
        onPinGroup={onPinGroup}
        onMarkAsRead={onMarkAsRead}
        onExitGroup={onExitGroup}
        onOpenChange={setIsDropdownOpen}
      />
    </div>
  );
};

export default ConversationItem;
