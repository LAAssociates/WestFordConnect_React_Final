import React, { useEffect, useRef } from 'react';
import type { Conversation, ConversationFilter } from './types';
import ConversationItem from './ConversationItem';
import FilterTabs from './FilterTabs';
import SearchInput from './SearchInput';
import EmptyState from './EmptyState';
import { MacScrollbar } from 'mac-scrollbar';
import Tooltip from '../ui/Tooltip';

interface ConversationListProps {
  conversations: Conversation[];
  searchQuery: string;
  activeFilter: ConversationFilter;
  openConversationIds?: string[];
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateNewChat: () => void;
  onMuteNotifications?: (conversationId: string) => void;
  onPinGroup?: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  onExitGroup?: (conversationId: string) => void;
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  searchQuery,
  activeFilter,
  openConversationIds = [],
  onSearchChange,
  onFilterChange,
  onSelectConversation,
  onCreateNewChat,
  onMuteNotifications,
  onPinGroup,
  onMarkAsRead,
  onExitGroup,
  currentUserId,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    let scrollEl: HTMLElement | null = null;
    let rafId: number | null = null;

    const findScrollableElement = (): HTMLElement | null => {
      if (!scrollRootRef.current) return null;

      const allDivs = scrollRootRef.current.querySelectorAll('div');
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
      return scrollRootRef.current;
    };

    const onScroll = () => {
      if (!scrollEl || isLoadingMore || !hasMore) return;

      const remaining = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (remaining < 140) {
        onLoadMore();
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
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="w-[475px] flex-shrink-0 bg-white border-r-2 border-[#E6E6E6] flex flex-col h-full z-20 shadow-[4px_0px_24px_0px_rgba(0,0,0,0.02)]">
      {/* Search and Create Button */}
      <div className="p-5 pb-0">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search staff or project groups..."
            className="flex-1"
          />
          <Tooltip content="New chat" side="bottom">
            <button
              type="button"
              onClick={onCreateNewChat}
              className="flex-shrink-0 w-10 h-10 bg-[#1E88E5] rounded-full flex items-center justify-center text-white transition-colors shadow-sm cursor-pointer"
              aria-label="Create new chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M5.625 20.9375C6.55664 20.9375 7.3125 21.6934 7.3125 22.625V23.1875L9.86133 21.275C10.1531 21.057 10.5082 20.9375 10.8738 20.9375H15.75C16.0594 20.9375 16.3125 20.6844 16.3125 20.375V10.25C16.3125 9.94062 16.0594 9.6875 15.75 9.6875H2.25C1.94062 9.6875 1.6875 9.94062 1.6875 10.25V20.375C1.6875 20.6844 1.94062 20.9375 2.25 20.9375H5.625ZM7.3125 25.2969L7.30547 25.3039L7.12617 25.4375L6.525 25.8875C6.35625 26.0141 6.12773 26.0352 5.93438 25.9402C5.74102 25.8453 5.625 25.652 5.625 25.4375V22.625H2.25C1.00898 22.625 0 21.616 0 20.375V10.25C0 9.00898 1.00898 8 2.25 8H15.75C16.991 8 18 9.00898 18 10.25V20.375C18 21.616 16.991 22.625 15.75 22.625H10.8738L7.3125 25.2969Z" fill="white" />
                <circle cx="18.5" cy="7.5" r="7.5" fill="white" />
                <path d="M22.3571 8.14286H19.1429V11.3571C19.1429 11.5276 19.0751 11.6912 18.9546 11.8117C18.834 11.9323 18.6705 12 18.5 12C18.3295 12 18.166 11.9323 18.0454 11.8117C17.9249 11.6912 17.8571 11.5276 17.8571 11.3571V8.14286H14.6429C14.4724 8.14286 14.3088 8.07513 14.1883 7.95457C14.0677 7.83401 14 7.6705 14 7.5C14 7.3295 14.0677 7.16599 14.1883 7.04543C14.3088 6.92487 14.4724 6.85714 14.6429 6.85714H17.8571V3.64286C17.8571 3.47236 17.9249 3.30885 18.0454 3.18829C18.166 3.06773 18.3295 3 18.5 3C18.6705 3 18.834 3.06773 18.9546 3.18829C19.0751 3.30885 19.1429 3.47236 19.1429 3.64286V6.85714H22.3571C22.5276 6.85714 22.6912 6.92487 22.8117 7.04543C22.9323 7.16599 23 7.3295 23 7.5C23 7.6705 22.9323 7.83401 22.8117 7.95457C22.6912 8.07513 22.5276 8.14286 22.3571 8.14286Z" fill="#1E88E5" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-[15px]">
        <FilterTabs activeFilter={activeFilter} onFilterChange={onFilterChange} />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-hidden pt-[15px]">
        <MacScrollbar className="h-full" ref={scrollRootRef}>
          <div className="divide-y divide-gray-50 border-r-[6px] border-white">
            {conversations.length === 0 ? (
              <EmptyState message="No conversations found" />
            ) : (
              <>
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={openConversationIds.includes(conversation.id)}
                    onClick={() => onSelectConversation(conversation)}
                    onMuteNotifications={onMuteNotifications}
                    onPinGroup={onPinGroup}
                    onMarkAsRead={onMarkAsRead}
                    onExitGroup={onExitGroup}
                    currentUserId={currentUserId}
                    searchQuery={searchQuery}
                  />
                ))}
                {isLoadingMore && (
                  <div className="py-3 flex justify-center">
                    {activeFilter === 'project-groups' ? (
                      <div
                        className="h-5 w-5 animate-spin rounded-full border-2 border-[#1E88E5] border-t-transparent"
                        aria-label="Loading project groups"
                      />
                    ) : (
                      <div className="text-center text-[12px] text-[#535352]">Loading more...</div>
                    )}
                  </div>
                )}
                {!hasMore && conversations.length > 0 && (
                  <div className="py-3 text-center text-[12px] text-[#9B9A99]">No more chats</div>
                )}
              </>
            )}
          </div>
        </MacScrollbar>
      </div>
    </div>
  );
};

export default ConversationList;
