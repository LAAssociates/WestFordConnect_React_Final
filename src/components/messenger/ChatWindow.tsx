import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMessengerContext } from '../../contexts/MessengerContext';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Conversation, Message } from './types';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import StatusIndicator from './StatusIndicator';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import { MacScrollbar } from 'mac-scrollbar';

// Date grouping utilities
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDateLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(messageDate, today)) {
    return 'Today';
  } else if (isSameDay(messageDate, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

interface GroupedMessage {
  date: Date;
  dateLabel: string;
  messages: Message[];
}

const groupMessagesByDate = (messages: Message[]): GroupedMessage[] => {
  if (messages.length === 0) return [];

  const grouped: GroupedMessage[] = [];
  let currentGroup: GroupedMessage | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);

    if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
      // Start a new group
      currentGroup = {
        date: messageDate,
        dateLabel: formatDateLabel(messageDate),
        messages: [message],
      };
      grouped.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.messages.push(message);
    }
  });

  return grouped;
};

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onSendMessage: (content: string) => void;
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

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  currentUserName,
  onClose,
  onSendMessage,
  onSendFile,
  onDownloadAttachment,
  onPinToggle,
  onMarkAsReadToggle,
  onMuteToggle,
  onViewMedia,
}) => {
  const { sendTypingIndicator, typingUsers, getNumericChatId, markMessageAsRead, fetchOlderMessages } = useMessengerContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [visibleDateLabel, setVisibleDateLabel] = useState<string>('');
  const dateSeparatorRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastTypingSentRef = useRef<number>(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const loadingOlderRef = useRef(false);
  const previousConversationRef = useRef<string>('');
  const previousLastMessageIdRef = useRef<string | null>(null);

  // Get conversation ID for typing status
  const numericChatId = useMemo(() => {
    const chatType = conversation.type === 'individual' ? 'user' : 'group';
    return getNumericChatId(chatType, conversation.id);
  }, [conversation.id, conversation.type, getNumericChatId]);

  const typingKey = conversation.type === 'individual' 
    ? `conv-${numericChatId}` 
    : `conv-group-${numericChatId}`;
    
  const typingUser = typingUsers[typingKey];

  // Debug logging removed

  // Message Read Tracking
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackReadRef = useRef<{ conversationId: string; messageId: string | null }>({
    conversationId: '',
    messageId: null,
  });
  
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId) {
            // Mark as read
            const readChatType = conversation.type === 'individual' ? 'user' : 'group';
            markMessageAsRead(messageId, readChatType, numericChatId);
            // Stop observing this message
            observerRef.current?.unobserve(entry.target);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: scrollContainerRef.current,
      threshold: 0.5 // Mark as read when 50% visible
    });

    // Observe unread messages from other users
    const unreadMessages = messages.filter(
      m => m.senderId !== currentUserId && m.status !== 'read'
    );

    unreadMessages.forEach(msg => {
      const element = document.querySelector(`[data-message-id="${msg.id}"]`);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [messages, currentUserId, markMessageAsRead]);

  // Fallback read: when chat opens (or observer misses), mark latest incoming unread once.
  useEffect(() => {
    const latestIncomingUnread = [...messages]
      .reverse()
      .find((m) => m.senderId !== currentUserId && m.status !== 'read');

    if (!latestIncomingUnread) return;

    const alreadyMarkedForConversation =
      fallbackReadRef.current.conversationId === conversation.id &&
      fallbackReadRef.current.messageId === latestIncomingUnread.id;

    if (alreadyMarkedForConversation) return;

    fallbackReadRef.current = {
      conversationId: conversation.id,
      messageId: latestIncomingUnread.id,
    };

    const readChatType = conversation.type === 'individual' ? 'user' : 'group';
    markMessageAsRead(latestIncomingUnread.id, readChatType, numericChatId);
  }, [conversation.id, conversation.type, numericChatId, messages, currentUserId, markMessageAsRead]);

  const handleTyping = useCallback(() => {
    const now = Date.now();
    // Send typing indicator at most once every 2 seconds
    if (now - lastTypingSentRef.current > 2000) {
      if (numericChatId) {
        const chatType = conversation.type === 'individual' ? 'user' : 'group';
        sendTypingIndicator(chatType, numericChatId);
        lastTypingSentRef.current = now;
      }
    }
  }, [numericChatId, conversation.type, sendTypingIndicator]);

  // Get the other participant (not current user)
  const otherParticipant = conversation.participants.find((p) => p.id !== currentUserId) || conversation.participants[0];
  const currentUser = conversation.participants.find((p) => p.id === currentUserId);
  const resolvedCurrentUserName = currentUser?.name || currentUserName;
  const mentionUsers = useMemo(() => {
    const byKey = new Map<string, { id: string; name: string }>();

    conversation.participants
      .filter((p) => p.id !== currentUserId)
      .forEach((p) => {
        const key = p.name.trim().toLowerCase();
        if (!key) return;
        byKey.set(key, { id: p.id, name: p.name });
      });

    messages
      .filter((m) => m.senderId !== currentUserId)
      .forEach((m) => {
        const name = (m.senderName || '').trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (byKey.has(key)) return;
        byKey.set(key, { id: `msg-${key}`, name });
      });

    return Array.from(byKey.values());
  }, [conversation.participants, currentUserId, messages]);
  const isReadOnlyLeftGroup = conversation.type === 'group' && conversation.isLeft === true;

  // Group messages by date
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  // Calculate the global index where unread messages start
  const unreadStartGlobalIndex = conversation.unreadCount > 0
    ? messages.length - conversation.unreadCount
    : -1;

  // Set initial visible date label
  useEffect(() => {
    if (groupedMessages.length > 0) {
      setVisibleDateLabel(groupedMessages[groupedMessages.length - 1].dateLabel);
    }
  }, [groupedMessages]);

  useEffect(() => {
    if (previousConversationRef.current !== conversation.id) {
      previousConversationRef.current = conversation.id;
      setHasOlderMessages(true);
      previousLastMessageIdRef.current = null;
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      return;
    }
  }, [conversation.id]);

  useEffect(() => {
    if (messages.length === 0 || loadingOlderRef.current) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    if (previousLastMessageIdRef.current === lastMessage.id) return;

    const findScrollableElement = (): HTMLElement | null => {
      if (!scrollContainerRef.current) return null;
      const allDivs = scrollContainerRef.current.querySelectorAll('div');
      for (const div of Array.from(allDivs)) {
        const style = window.getComputedStyle(div);
        if (
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflow === 'auto' ||
          style.overflow === 'scroll'
        ) {
          return div as HTMLElement;
        }
      }
      return scrollContainerRef.current;
    };

    const scrollEl = findScrollableElement();
    if (!scrollEl) {
      previousLastMessageIdRef.current = lastMessage.id;
      return;
    }

    // First payload after opening a conversation should always land on latest message.
    if (previousLastMessageIdRef.current === null) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      previousLastMessageIdRef.current = lastMessage.id;
      return;
    }

    const distanceFromBottom =
      scrollEl.scrollHeight - (scrollEl.scrollTop + scrollEl.clientHeight);
    const isNearBottom = distanceFromBottom <= 140;
    const isOwnNewMessage = lastMessage.senderId === currentUserId;

    if (isOwnNewMessage || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isOwnNewMessage ? 'smooth' : 'auto'
      });
    }

    previousLastMessageIdRef.current = lastMessage.id;
  }, [currentUserId, messages]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const findScrollableElement = (): HTMLElement | null => {
      if (!scrollContainerRef.current) return null;
      const allDivs = scrollContainerRef.current.querySelectorAll('div');
      for (const div of Array.from(allDivs)) {
        const style = window.getComputedStyle(div);
        if (
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflow === 'auto' ||
          style.overflow === 'scroll'
        ) {
          return div as HTMLElement;
        }
      }
      return scrollContainerRef.current;
    };

    let scrollEl: HTMLElement | null = null;
    let rafId: number | null = null;

    const onScroll = async () => {
      if (!scrollEl || loadingOlderRef.current || !hasOlderMessages || messages.length === 0) {
        return;
      }

      if (scrollEl.scrollTop > 120) {
        return;
      }

      const oldestMessageId = Number(messages[0]?.id);
      if (!Number.isFinite(oldestMessageId) || oldestMessageId <= 0) {
        return;
      }

      loadingOlderRef.current = true;
      setIsLoadingOlder(true);
      const previousHeight = scrollEl.scrollHeight;

      try {
        const chatType = conversation.type === 'individual' ? 'user' : 'group';
        const added = await fetchOlderMessages(chatType, numericChatId, oldestMessageId);
        if (added < 50) {
          setHasOlderMessages(false);
        }
      } finally {
        requestAnimationFrame(() => {
          if (scrollEl) {
            const newHeight = scrollEl.scrollHeight;
            scrollEl.scrollTop += newHeight - previousHeight;
          }
          setIsLoadingOlder(false);
          loadingOlderRef.current = false;
        });
      }
    };

    rafId = requestAnimationFrame(() => {
      scrollEl = findScrollableElement();
      if (scrollEl) {
        scrollEl.addEventListener('scroll', onScroll, { passive: true });
      }
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', onScroll);
      }
    };
  }, [conversation.type, fetchOlderMessages, hasOlderMessages, messages, numericChatId]);

  // Scroll tracking for sticky date header
  useEffect(() => {
    if (groupedMessages.length === 0 || !scrollContainerRef.current) return;

    let scrollableElement: HTMLElement | null = null;
    let rafId: number | null = null;

    const findScrollableElement = (): HTMLElement | null => {
      if (!scrollContainerRef.current) return null;

      // Find the scrollable element within MacScrollbar
      const allDivs = scrollContainerRef.current.querySelectorAll('div');
      for (const div of Array.from(allDivs)) {
        const style = window.getComputedStyle(div);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
          style.overflow === 'auto' || style.overflow === 'scroll') {
          return div as HTMLElement;
        }
      }
      return scrollContainerRef.current;
    };

    const updateVisibleDate = () => {
      if (!scrollableElement) {
        scrollableElement = findScrollableElement();
        if (!scrollableElement) return;
      }

      // Get the messages area container (parent of scrollContainerRef) to find sticky header position
      const messagesAreaContainer = scrollContainerRef.current?.parentElement;
      if (!messagesAreaContainer) return;

      const messagesAreaRect = messagesAreaContainer.getBoundingClientRect();

      // Sticky header is at top-0 with pt-4 (16px padding-top)
      // We want to switch when separator reaches the sticky header position
      const stickyHeaderTop = messagesAreaRect.top;
      const stickyHeaderOffset = 16; // pt-4 = 16px
      const stickyHeaderPosition = stickyHeaderTop + stickyHeaderOffset;

      // Find which date separator is currently at or past the sticky header position
      let currentDateLabel = groupedMessages[groupedMessages.length - 1].dateLabel;

      for (let i = groupedMessages.length - 1; i >= 0; i--) {
        const separatorElement = dateSeparatorRefs.current.get(i);
        if (!separatorElement) continue;

        const separatorRect = separatorElement.getBoundingClientRect();
        const separatorTop = separatorRect.top;

        // Only switch when separator actually reaches or passes the sticky header position
        if (separatorTop <= stickyHeaderPosition) {
          currentDateLabel = groupedMessages[i].dateLabel;
          break;
        }
      }

      setVisibleDateLabel(currentDateLabel);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    rafId = requestAnimationFrame(() => {
      scrollableElement = findScrollableElement();
      if (scrollableElement) {
        // Initial update
        updateVisibleDate();

        scrollableElement.addEventListener('scroll', updateVisibleDate, { passive: true });
      }
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', updateVisibleDate);
      }
    };
  }, [groupedMessages]);

  const updateMenuPosition = useCallback(() => {
    if (!dropdownButtonRef.current) return;

    const rect = dropdownButtonRef.current.getBoundingClientRect();
    const dropdownWidth = 180;
    const OFFSET_PX = 8;
    const padding = 10;

    // Position dropdown to the right of the button, aligned to the right edge
    let menuLeft = rect.right - dropdownWidth;

    // Ensure menu stays within viewport bounds
    const maxLeft = window.innerWidth - dropdownWidth - padding;
    const minLeft = padding;

    if (menuLeft < minLeft) {
      menuLeft = minLeft;
    } else if (menuLeft > maxLeft) {
      menuLeft = maxLeft;
    }

    setMenuPosition({
      top: rect.bottom + OFFSET_PX,
      left: menuLeft,
    });
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    updateMenuPosition();

    const handleWindowChange = () => {
      updateMenuPosition();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isDropdownOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        dropdownButtonRef.current?.contains(target) ||
        dropdownMenuRef.current?.contains(target)
      ) {
        return;
      }

      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
  };

  const handleSend = (content: string) => {
    onSendMessage(content);
  };

  const handlePickImage = () => {
    imageInputRef.current?.click();
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onSendFile) return;
    await onSendFile(conversation.id, file);
    event.target.value = '';
  };

  const handleAttachmentDownload = async (messageId: string, attachmentId: number, fileName: string) => {
    if (!onDownloadAttachment) return;
    await onDownloadAttachment(conversation.id, messageId, attachmentId, fileName);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 z-10">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={conversation.avatar || otherParticipant?.avatar || avatarPlaceholder}
              alt={conversation.name}
              className="w-12 h-12 rounded-full object-cover border-[1.5px] border-[#E6E6E6]"
            />
            {otherParticipant?.status && otherParticipant.status !== 'offline' && (
              <div className="absolute bottom-0 right-0">
                <StatusIndicator status={otherParticipant.status} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[16px] text-black truncate leading-tight">{conversation.name}</h3>
            {otherParticipant && (
              <p className="text-[14px] font-normal text-[#535352] truncate mt-0.5">{otherParticipant.position || 'Student'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            ref={dropdownButtonRef}
            type="button"
            onClick={handleDropdownToggle}
            className={cn(
              "p-2 text-[#71717A] hover:bg-[#E6E6E6] rounded-full transition-colors",
              isDropdownOpen && "bg-[#E6E6E6]"
            )}
            aria-label="More options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className={cn(
                "transition-transform duration-300",
                isDropdownOpen && "rotate-180"
              )}
            >
              <path d="M9.00043 7.0207C8.7403 7.0207 8.48271 7.07194 8.24237 7.17149C8.00204 7.27104 7.78367 7.41695 7.59972 7.6009C7.41578 7.78484 7.26987 8.00321 7.17032 8.24354C7.07077 8.48388 7.01953 8.74147 7.01953 9.0016C7.01953 9.26174 7.07077 9.51933 7.17032 9.75966C7.26987 9.99999 7.41578 10.2184 7.59972 10.4023C7.78367 10.5863 8.00204 10.7322 8.24237 10.8317C8.48271 10.9313 8.7403 10.9825 9.00043 10.9825C9.5258 10.9824 10.0296 10.7736 10.401 10.402C10.7724 10.0304 10.981 9.52652 10.9809 9.00115C10.9808 8.47579 10.7719 7.97198 10.4004 7.60058C10.0288 7.22917 9.5249 7.02058 8.99953 7.0207H9.00043ZM9.00043 4.6807C9.26045 4.68058 9.5179 4.62925 9.75808 4.52964C9.99826 4.43003 10.2165 4.28408 10.4002 4.10014C10.584 3.91619 10.7298 3.69785 10.8292 3.45758C10.9286 3.21731 10.9796 2.95982 10.9795 2.6998C10.9794 2.43979 10.9281 2.18234 10.8285 1.94216C10.7289 1.70198 10.5829 1.48377 10.399 1.3C10.215 1.11622 9.99668 0.970473 9.75641 0.871077C9.51614 0.771682 9.25865 0.720585 8.99863 0.720703C8.4735 0.720942 7.96998 0.929777 7.59882 1.30127C7.22767 1.67276 7.01929 2.17647 7.01953 2.7016C7.01977 3.22673 7.22861 3.73026 7.6001 4.10141C7.97159 4.47256 8.4753 4.68094 9.00043 4.6807ZM9.00043 13.3207C8.47506 13.3207 7.97121 13.5294 7.59972 13.9009C7.22823 14.2724 7.01953 14.7762 7.01953 15.3016C7.01953 15.827 7.22823 16.3308 7.59972 16.7023C7.97121 17.0738 8.47506 17.2825 9.00043 17.2825C9.5258 17.2825 10.0296 17.0738 10.4011 16.7023C10.7726 16.3308 10.9813 15.827 10.9813 15.3016C10.9813 14.7762 10.7726 14.2724 10.4011 13.9009C10.0296 13.5294 9.5258 13.3207 9.00043 13.3207Z" fill="#9A9A9A" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#71717A] hover:bg-[#E6E6E6] rounded-full transition-colors"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M6.575 7.975L1.675 12.875C1.49167 13.0583 1.25833 13.15 0.975 13.15C0.691667 13.15 0.458333 13.0583 0.275 12.875C0.0916663 12.6917 0 12.4583 0 12.175C0 11.8917 0.0916663 11.6583 0.275 11.475L5.175 6.575L0.275 1.675C0.0916663 1.49167 0 1.25833 0 0.975C0 0.691667 0.0916663 0.458333 0.275 0.275C0.458333 0.0916663 0.691667 0 0.975 0C1.25833 0 1.49167 0.0916663 1.675 0.275L6.575 5.175L11.475 0.275C11.6583 0.0916663 11.8917 0 12.175 0C12.4583 0 12.6917 0.0916663 12.875 0.275C13.0583 0.458333 13.15 0.691667 13.15 0.975C13.15 1.25833 13.0583 1.49167 12.875 1.675L7.975 6.575L12.875 11.475C13.0583 11.6583 13.15 11.8917 13.15 12.175C13.15 12.4583 13.0583 12.6917 12.875 12.875C12.6917 13.0583 12.4583 13.15 12.175 13.15C11.8917 13.15 11.6583 13.0583 11.475 12.875L6.575 7.975Z" fill="black" />
            </svg>
          </button>
        </div>
      </div>
      {isDropdownOpen && menuPosition && createPortal(
        <div
          ref={dropdownMenuRef}
          className="bg-[#232725] rounded-[10px] shadow-lg z-50 overflow-hidden"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <div className="p-2.5 flex flex-col">
            <button
              type="button"
              onClick={() => onMuteToggle && handleMenuAction(() => onMuteToggle(conversation.id))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              {conversation.isMuted ? (
                <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3C12 3 14 4.5 14 7C14 9.5 12 11 12 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15 1C15 1 17.5 3.25 17.5 7C17.5 10.75 15 13 15 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 12.4063C10 12.4063 10 12.9073 9.5 13.4073C9 13.9073 7.68244 13.987 7 13.4073L3.25391 10.4073H2C1.50001 10.4073 0.999992 10.4073 0.5 9.90732C6.76513e-06 9.40732 1.49123e-08 8.90731 0 7.90732C0.00298046 7.36039 0.000141762 6.92961 0 6.90732H10V12.4063Z" fill="white" />
                  <path d="M10 1.40634C9.99996 1.39812 9.99585 0.901212 9.5 0.405366C8.99996 -0.0945368 7.68242 -0.17424 7 0.405366L3.25391 3.40537H2C1.50003 3.40537 0.999965 3.40546 0.5 3.90537C3.0905e-05 4.40534 1.68101e-08 4.90549 0 5.90537C0.00297316 6.45095 0.000153652 6.88114 0 6.90537H10V1.40634Z" fill="white" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M3.3363 0.246001C3.16656 0.0863676 2.93921 -0.00196356 2.70324 3.3128e-05C2.46726 0.00202981 2.24153 0.0941944 2.07466 0.256676C1.9078 0.419158 1.81314 0.638956 1.81109 0.868731C1.80904 1.09851 1.89976 1.31987 2.0637 1.48515L14.6637 13.754C14.8334 13.9136 15.0608 14.002 15.2968 14C15.5327 13.998 15.7585 13.9058 15.9253 13.7433C16.0922 13.5808 16.1869 13.361 16.1889 13.1313C16.191 12.9015 16.1002 12.6801 15.9363 12.5148L15.9327 12.5105C17.613 10.9418 18 8.69836 18 7C18.0015 5.84896 17.7693 4.70898 17.3169 3.64556C16.8645 2.58214 16.2008 1.61624 15.3639 0.803357C15.2809 0.719657 15.1816 0.652895 15.0718 0.606967C14.962 0.561038 14.8439 0.536863 14.7244 0.535852C14.6049 0.534841 14.4863 0.557014 14.3757 0.601077C14.2651 0.645141 14.1646 0.710212 14.0801 0.792495C13.9956 0.874777 13.9288 0.972623 13.8836 1.08032C13.8383 1.18802 13.8155 1.30342 13.8166 1.41978C13.8176 1.53614 13.8424 1.65113 13.8896 1.75805C13.9368 1.86497 14.0053 1.96167 14.0913 2.04251C14.7611 2.69268 15.2922 3.4654 15.6541 4.31621C16.016 5.16701 16.2015 6.07911 16.2 7C16.2 8.53536 15.8373 10.1864 14.6592 11.2704L13.3695 10.0146C14.0544 9.07694 14.4 7.97011 14.4 7C14.4 5.52949 13.779 4.19832 12.78 3.24486C12.696 3.16238 12.5961 3.09697 12.4859 3.05244C12.3758 3.00791 12.2576 2.98514 12.1383 2.98546C12.0191 2.98578 11.901 3.00918 11.7911 3.05431C11.6812 3.09943 11.5816 3.16537 11.4982 3.2483C11.4147 3.33123 11.3489 3.42949 11.3048 3.53738C11.2606 3.64526 11.2389 3.76062 11.2409 3.87674C11.243 3.99286 11.2687 4.10743 11.3166 4.21379C11.3645 4.32014 11.4336 4.41617 11.52 4.49628C11.862 4.82269 12.1337 5.21225 12.3191 5.64217C12.5046 6.07208 12.6 6.5337 12.6 7C12.6 7.53107 12.4245 8.16992 12.069 8.74919L9.9 6.63719V1.86023C9.9 0.373948 8.1198 -0.437549 6.948 0.514163L5.1282 1.99081L3.3372 0.246001H3.3363ZM1.8 3.49462H2.3274L9.9 10.8682V12.1398C9.9 13.6261 8.1198 14.4375 6.948 13.4858L3.2742 10.5054H1.8C1.32261 10.5054 0.864773 10.3207 0.527207 9.99203C0.189642 9.66334 0 9.21754 0 8.75269V5.24731C0 4.78246 0.189642 4.33666 0.527207 4.00797C0.864773 3.67927 1.32261 3.49462 1.8 3.49462Z" fill="white" />
                </svg>
              )}
              <span className="whitespace-nowrap">{conversation.isMuted ? 'Allow Notifications' : 'Mute Notifications'}</span>
            </button>
            <button
              type="button"
              onClick={() => onPinToggle && handleMenuAction(() => onPinToggle(conversation.id))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              {conversation.isPinned ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.4053 8.40527L10.082 9.72852C10.1517 9.93211 10.2032 10.1412 10.2354 10.3555C10.2675 10.5699 10.2832 10.7846 10.2832 10.999C10.2832 11.3473 10.2483 11.6633 10.1787 11.9473C10.109 12.2313 10.0105 12.5 9.88184 12.752C9.75319 13.0039 9.59238 13.2426 9.39941 13.4678C9.20646 13.6929 8.99414 13.9258 8.76367 14.167L5.66016 11.0635L1.09375 15.6387L0 16L0.361328 14.9062L4.93652 10.3398L1.83301 7.23633L2.19531 6.87402C2.57044 6.49898 2.99918 6.21194 3.48145 6.01367C3.96373 5.81543 4.47293 5.71683 5.00879 5.7168C5.44832 5.7168 5.86947 5.78397 6.27148 5.91797L7.59375 4.59375L11.4053 8.40527ZM16 5.54785C15.8231 5.72471 15.6515 5.88557 15.4854 6.03027C15.3192 6.17496 15.1451 6.30102 14.9629 6.4082C14.7807 6.5154 14.585 6.59336 14.376 6.6416C14.167 6.68984 13.9257 6.71877 13.6523 6.72949C13.4702 6.72949 13.296 6.71377 13.1299 6.68164L12.9658 6.84473L9.1543 3.0332L9.31836 2.87012C9.28623 2.70403 9.27051 2.5298 9.27051 2.34766C9.27051 2.08523 9.29706 1.84954 9.35059 1.64062C9.40419 1.43158 9.48459 1.23253 9.5918 1.04492C9.69898 0.857378 9.82259 0.683219 9.96191 0.522461C10.1012 0.361712 10.2646 0.187529 10.4521 0L16 5.54785Z" fill="white" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M16 5.54774C15.8231 5.72462 15.6516 5.88543 15.4854 6.03015C15.3193 6.17487 15.1451 6.30084 14.9628 6.40804C14.7806 6.51524 14.5849 6.59297 14.3759 6.64121C14.1668 6.68945 13.9256 6.71893 13.6523 6.72965C13.47 6.72965 13.2958 6.71357 13.1296 6.68141L10.0824 9.72864C10.1521 9.93233 10.203 10.1414 10.2352 10.3558C10.2673 10.5702 10.2834 10.7846 10.2834 10.999C10.2834 11.3474 10.2486 11.6637 10.1789 11.9477C10.1092 12.2318 10.0101 12.4998 9.88141 12.7518C9.75276 13.0037 9.59196 13.2422 9.399 13.4673C9.20603 13.6925 8.99431 13.9256 8.76382 14.1668L5.6603 11.0633L1.09347 15.6382L0 16L0.361809 14.9065L4.93668 10.3397L1.83317 7.23618L2.19497 6.87437C2.57018 6.49916 2.999 6.2124 3.48141 6.01407C3.96382 5.81575 4.47303 5.71658 5.00905 5.71658C5.44858 5.71658 5.86935 5.78358 6.27136 5.91759L9.31859 2.87035C9.28643 2.70419 9.27035 2.52998 9.27035 2.34774C9.27035 2.08509 9.29715 1.84925 9.35075 1.6402C9.40436 1.43116 9.48476 1.23283 9.59196 1.04523C9.69916 0.857621 9.82245 0.683417 9.96181 0.522613C10.1012 0.361809 10.2647 0.187605 10.4523 0L16 5.54774Z" fill="white" />
                </svg>
              )}
              <span className="whitespace-nowrap">{conversation.isPinned ? `Unpin ${conversation.type === 'group' ? 'Group' : 'Chat'}` : `Pin ${conversation.type === 'group' ? 'Group' : 'Chat'}`}</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkAsReadToggle && handleMenuAction(() => onMarkAsReadToggle(conversation.id))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              {conversation.unreadCount === 0 ? (
                <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.4998 2.5554C18.5005 2.0638 18.3592 1.58246 18.0928 1.16926C17.8265 0.756054 17.4465 0.428582 16.9985 0.226219C16.5504 0.0238566 16.0535 -0.0447824 15.5674 0.0285561C15.0813 0.101895 14.6267 0.314088 14.2583 0.639621C14.0589 0.815536 13.888 1.02132 13.7516 1.24964V1.25203C13.7301 1.28792 13.7097 1.3246 13.6898 1.36128L13.6802 1.38081C13.6635 1.41231 13.6479 1.44421 13.6328 1.4765C13.628 1.48647 13.6236 1.49644 13.6192 1.50641C13.6061 1.53551 13.5933 1.56502 13.5813 1.59492C13.5762 1.60728 13.5714 1.61964 13.5666 1.632C13.5558 1.65991 13.5455 1.68782 13.5355 1.71613L13.5211 1.75839C13.5124 1.7855 13.504 1.81301 13.496 1.84052C13.4912 1.85607 13.4869 1.87122 13.4829 1.88677C13.4753 1.91349 13.4689 1.9406 13.4625 1.96651C13.4585 1.98286 13.4546 1.99921 13.451 2.01555C13.4454 2.04267 13.4402 2.07018 13.4354 2.0953C13.4322 2.11204 13.429 2.12879 13.4262 2.14553C13.4219 2.17344 13.4183 2.20175 13.4147 2.23006C13.4127 2.2464 13.4103 2.26275 13.4083 2.2795C13.4051 2.3102 13.4031 2.3409 13.4007 2.372C13.4007 2.38635 13.3983 2.4007 13.3975 2.41506C13.3951 2.46051 13.3936 2.50596 13.3936 2.55221C13.3936 2.59208 13.3936 2.63195 13.3967 2.66943V2.69495C13.3989 2.73243 13.4017 2.7699 13.4051 2.80738L13.4075 2.82652C13.4111 2.86041 13.4151 2.8939 13.4203 2.92699C13.4203 2.93377 13.4203 2.94095 13.4231 2.94773C13.4286 2.98401 13.4354 3.01989 13.4426 3.05578C13.4426 3.06455 13.4462 3.07292 13.4478 3.08169C13.455 3.11598 13.4629 3.15027 13.4717 3.18416V3.19173C13.4809 3.22722 13.4908 3.26191 13.5016 3.29659L13.51 3.32371C13.5207 3.3576 13.5319 3.39069 13.5439 3.42378C13.5463 3.43096 13.549 3.43813 13.5518 3.44531C13.5626 3.47362 13.5738 3.50193 13.5853 3.52984C13.5885 3.53821 13.5917 3.54618 13.5953 3.55416C13.6089 3.58566 13.6228 3.61715 13.6376 3.64825L13.6507 3.67497C13.6647 3.70288 13.6786 3.73078 13.6934 3.7583C13.9015 4.14509 14.2055 4.47196 14.5761 4.70761C14.6734 4.76979 14.7749 4.82508 14.8799 4.87308L14.8955 4.88025C14.9662 4.91215 15.0383 4.94086 15.112 4.96637L15.1499 4.97913L15.2097 4.99787C15.2276 5.00345 15.2455 5.00824 15.2639 5.01342L15.3404 5.03336L15.4094 5.0493L15.4553 5.05847L15.5282 5.07163L15.5657 5.07761C15.6016 5.0828 15.6379 5.08758 15.6742 5.09157L15.7049 5.09436C15.734 5.09675 15.7635 5.09914 15.793 5.10074L15.8273 5.10273C15.8671 5.10273 15.9046 5.10592 15.9437 5.10592C15.9899 5.10592 16.0354 5.10592 16.0808 5.10193L16.1239 5.09874C16.155 5.09635 16.1857 5.09436 16.2164 5.09117L16.2662 5.08479C16.2941 5.0812 16.3224 5.07761 16.3504 5.07323L16.4006 5.06406C16.4277 5.05927 16.4552 5.05409 16.4803 5.04851L16.5294 5.03694C16.5565 5.03056 16.5836 5.02419 16.6091 5.01661C16.6247 5.01262 16.6398 5.00824 16.6554 5.00345C16.6829 4.99548 16.7104 4.98711 16.7375 4.97833L16.7798 4.96398C16.8081 4.95401 16.836 4.94365 16.8639 4.93288L16.901 4.91813C16.9309 4.90617 16.9604 4.89341 16.9895 4.88025L17.0194 4.8667C17.0517 4.85155 17.0836 4.836 17.1151 4.81925L17.1346 4.80968C17.1713 4.78975 17.208 4.76981 17.2439 4.74788H17.2462C17.4764 4.6126 17.6841 4.44231 17.8618 4.24312C18.2736 3.77739 18.5005 3.17702 18.4998 2.5554Z" fill="#008080" />
                  <path d="M13.5313 5.52596L9.32253 8.79934C9.21058 8.88637 9.07281 8.93362 8.931 8.93362C8.7892 8.93362 8.65143 8.88637 8.53947 8.79934L2.79812 4.33383C2.73066 4.28289 2.674 4.21905 2.63143 4.14603C2.58886 4.073 2.56123 3.99224 2.55014 3.90844C2.53905 3.82464 2.54473 3.73947 2.56684 3.65789C2.58895 3.5763 2.62706 3.49992 2.67894 3.43319C2.73083 3.36646 2.79546 3.3107 2.86908 3.26917C2.9427 3.22763 3.02384 3.20113 3.10778 3.19123C3.19173 3.18132 3.27681 3.18819 3.35808 3.21145C3.43934 3.23471 3.51518 3.27388 3.58117 3.3267L8.931 7.48759L12.6876 4.56588C12.3241 3.97785 12.1269 3.30225 12.117 2.61102C12.1071 1.91979 12.2849 1.23882 12.6314 0.640625H2.23275C1.64078 0.641258 1.07324 0.876697 0.654657 1.29528C0.236072 1.71387 0.000633234 2.28141 0 2.87338V12.4423C0.000633234 13.0343 0.236072 13.6018 0.654657 14.0204C1.07324 14.439 1.64078 14.6744 2.23275 14.6751H15.6293C16.2212 14.6744 16.7888 14.439 17.2073 14.0204C17.6259 13.6018 17.8614 13.0343 17.862 12.4423V5.87124C17.1905 6.26023 16.4164 6.43554 15.6428 6.37386C14.8692 6.31218 14.1327 6.01644 13.5313 5.52596Z" fill="white" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
                  <path d="M7.929 0.30261C8.25033 0.104837 8.62138 0 9 0C9.37862 0 9.74966 0.104837 10.071 0.30261L17.046 4.5985C17.1156 4.64117 17.1819 4.68769 17.2449 4.73806L9 9.0224L0.7506 4.74072C0.8148 4.69035 0.8823 4.64295 0.9531 4.5985L7.929 0.30261ZM0.0432002 5.87936C0.0144412 6.0162 -3.46446e-05 6.15559 6.22604e-08 6.29535V13.1112C6.22604e-08 13.8773 0.308169 14.6121 0.856713 15.1539C1.40526 15.6956 2.14924 16 2.925 16H15.075C15.4591 16 15.8395 15.9253 16.1943 15.7801C16.5492 15.6349 16.8717 15.4221 17.1433 15.1539C17.4149 14.8856 17.6304 14.5672 17.7773 14.2167C17.9243 13.8662 18 13.4905 18 13.1112V6.29535C18 6.15254 17.985 6.01269 17.955 5.87581L9.315 10.3646C9.21809 10.4152 9.11017 10.4417 9.00056 10.4418C8.89095 10.442 8.78295 10.4158 8.6859 10.3655L0.0432002 5.87936Z" fill="white" />
                </svg>
              )}
              <span className="whitespace-nowrap">{conversation.unreadCount === 0 ? 'Mark as unread' : 'Mark as read'}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewMedia && handleMenuAction(() => onViewMedia(conversation.id))}
              className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M16.4286 2.92857H3.57143C3.40093 2.92857 3.23742 2.9963 3.11686 3.11686C2.9963 3.23742 2.92857 3.40093 2.92857 3.57143V16.4286C2.92857 16.5991 2.9963 16.7626 3.11686 16.8831C3.23742 17.0037 3.40093 17.0714 3.57143 17.0714H16.4286C16.5991 17.0714 16.7626 17.0037 16.8831 16.8831C17.0037 16.7626 17.0714 16.5991 17.0714 16.4286V3.57143C17.0714 3.40093 17.0037 3.23742 16.8831 3.11686C16.7626 2.9963 16.5991 2.92857 16.4286 2.92857ZM3.57143 1C2.88944 1 2.23539 1.27092 1.75315 1.75315C1.27092 2.23539 1 2.88944 1 3.57143V16.4286C1 17.1106 1.27092 17.7646 1.75315 18.2468C2.23539 18.7291 2.88944 19 3.57143 19H16.4286C17.1106 19 17.7646 18.7291 18.2468 18.2468C18.7291 17.7646 19 17.1106 19 16.4286V3.57143C19 2.88944 18.7291 2.23539 18.2468 1.75315C17.7646 1.27092 17.1106 1 16.4286 1H3.57143ZM15.1429 13.6733L11.9286 10L8.74514 13.6386L6.78571 11.2857L4.85714 13.6V15.1429H15.1429V13.6733ZM8.07143 10C8.58292 10 9.07346 9.79681 9.43513 9.43513C9.79681 9.07346 10 8.58292 10 8.07143C10 7.55994 9.79681 7.0694 9.43513 6.70772C9.07346 6.34605 8.58292 6.14286 8.07143 6.14286C7.55994 6.14286 7.0694 6.34605 6.70772 6.70772C6.34605 7.0694 6.14286 7.55994 6.14286 8.07143C6.14286 8.58292 6.34605 9.07346 6.70772 9.43513C7.0694 9.79681 7.55994 10 8.07143 10Z" fill="white" />
              </svg>
              <span className="whitespace-nowrap">View Media Files</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden bg-[#E6E6E6] relative">
        {/* Sticky Date Header */}
        {messages.length !== 0 && visibleDateLabel && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center pt-4 pb-1 pointer-events-none">
            <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
              <span className="text-xs font-medium text-[#535352]">
                {visibleDateLabel}
              </span>
            </div>
          </div>
        )}
        {messages.length !== 0 && (
          <MacScrollbar ref={scrollContainerRef} className="h-full">
            <div className="p-4">
              {isLoadingOlder && (
                <div className="flex justify-center mb-3">
                  <span className="text-xs text-[#6B7280] bg-white/80 px-3 py-1 rounded-full">Loading older messages...</span>
                </div>
              )}
              {groupedMessages.map((group, groupIndex) => {
                // Calculate the starting global index for this group
                let globalMessageIndex = 0;
                for (let i = 0; i < groupIndex; i++) {
                  globalMessageIndex += groupedMessages[i].messages.length;
                }

                return (
                  <React.Fragment key={`group-${groupIndex}`}>
                    {/* Date Separator */}
                    <div
                      ref={(el) => {
                        if (el) {
                          dateSeparatorRefs.current.set(groupIndex, el);
                        } else {
                          dateSeparatorRefs.current.delete(groupIndex);
                        }
                      }}
                      className="flex items-center justify-center mb-3"
                    >
                      <div className="px-3 py-1.5 bg-white/60 rounded-full">
                        <span className="text-xs font-medium text-[#535352]">
                          {group.dateLabel}
                        </span>
                      </div>
                    </div>
                    {/* Messages in this group */}
                    {group.messages.map((message, messageIndexInGroup) => {
                      const isOwnMessage = message.senderId === currentUserId;
                      const currentGlobalIndex = globalMessageIndex + messageIndexInGroup;
                      const isFirstUnreadMessage = currentGlobalIndex === unreadStartGlobalIndex;

                      return (
                        <React.Fragment key={message.id}>
                          {/* Unread Messages Separator */}
                          {isFirstUnreadMessage && conversation.unreadCount > 0 && (
                            <div className="relative flex items-center justify-center my-4 -mx-4 w-[calc(100%+2rem)] min-h-[40px]">
                              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-[#D1D5DB]"></div>
                              <div className="relative px-4 py-1.5 bg-[#E6E6E6] rounded-full z-10">
                                <span className="text-xs font-semibold text-[#008080] whitespace-nowrap">
                                  {conversation.unreadCount} {conversation.unreadCount === 1 ? 'unread message' : 'unread messages'}
                                </span>
                              </div>
                            </div>
                          )}
                          <div data-message-id={message.id}>
                            <MessageBubble
                                message={message}
                                isOwnMessage={isOwnMessage}
                                senderName={message.senderName}
                                isGroup={conversation.type === 'group'}
                                currentUserName={resolvedCurrentUserName}
                                onDownloadAttachment={handleAttachmentDownload}
                            />
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </MacScrollbar>
        )}

        {/* Typing Indicator (Absolute Position) */}
        {typingUser && (
          <div className="absolute bottom-2 left-6 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
            </div>
            <span className="text-xs font-medium text-gray-500">{typingUser.userName} is typing...</span>
          </div>
        )}
      </div>

      {/* Message Input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />
      {isReadOnlyLeftGroup ? (
        <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#E5E7EB] text-[#535352] text-sm text-center">
          You can&apos;t send messages to this group because you&apos;re no longer a member.
        </div>
      ) : (
        <MessageInput
          onSend={handleSend}
          onTyping={handleTyping}
          onAttachImage={handlePickImage}
          onAttachFile={handlePickFile}
          disabled={false}
          isGroup={conversation.type === 'group'}
          mentionUsers={mentionUsers}
        />
      )}
    </div>
  );
};

export default ChatWindow;
