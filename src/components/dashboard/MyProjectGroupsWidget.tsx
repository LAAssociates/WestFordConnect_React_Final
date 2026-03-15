import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import DashboardWidget from './DashboardWidget';
import { MacScrollbar } from 'mac-scrollbar';
import ConversationDropdown from '../common/ConversationDropdown';
import { useMessengerContext } from '../../contexts/MessengerContext';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardProjectGroupCard } from '../../types/dashboard';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import { formatToDateTimeOffset } from '../../utils/dateUtils';

interface MyProjectGroupsWidgetProps {
  onGroupClick?: (groupId: string) => void;
  onMuteNotifications?: (conversationId: string, currentMuted?: boolean) => void;
  onPinGroup?: (conversationId: string, currentPinned?: boolean) => void;
  onMarkAsRead?: (conversationId: string, currentUnreadCount?: number, lastMessageId?: number | null) => void;
  onExitGroup?: (conversationId: string) => void;
}

const MyProjectGroupsWidget: React.FC<MyProjectGroupsWidgetProps> = ({
  onGroupClick,
  onMuteNotifications,
  onPinGroup,
  onMarkAsRead,
  onExitGroup,
}) => {
  const navigate = useNavigate();
  const { conversations } = useMessengerContext();
  const [cards, setCards] = useState<DashboardProjectGroupCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    void dashboardService.getMyProjectGroups(20)
      .then((response) => {
        if (!mounted) return;
        if (!response.success || !Array.isArray(response.result)) {
          setCards([]);
          return;
        }
        setCards(response.result);
      })
      .catch((error) => {
        console.error('Failed to load dashboard project groups:', error);
        if (mounted) setCards([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mergedCards = useMemo(() => {
    const convById = new Map(
      conversations
        .filter((conv) => conv.type === 'group')
        .map((conv) => [conv.id, conv])
    );

    return cards
      .map((card) => {
        const conversationId = `conv-group-${card.chatId}`;
        const live = convById.get(conversationId);

        return {
          ...card,
          conversationId,
          title: live?.name || card.title,
          avatarUrl: live?.avatar || card.avatarUrl,
          unreadCount: typeof live?.unreadCount === 'number' ? live.unreadCount : card.unreadCount,
          isPinned: typeof live?.isPinned === 'boolean' ? live.isPinned : card.isPinned,
          isMuted: typeof live?.isMuted === 'boolean' ? live.isMuted : card.isMuted,
          lastMessage: live?.lastMessage?.content || card.lastMessage,
          lastMessageTime: live?.lastMessageTime
            ? formatToDateTimeOffset(live.lastMessageTime)
            : card.lastMessageTime,
          lastMessageSenderName: live?.lastMessage?.senderName || card.lastMessageSenderName,
          isLeft: live?.isLeft ?? card.isLeft,
          leftOn: live?.leftOn ? formatToDateTimeOffset(live.leftOn) : card.leftOn,
        };
      })
      .filter((card) => card.isLeft !== true)
      .sort((a, b) => {
        const aPinned = a.isPinned === true ? 1 : 0;
        const bPinned = b.isPinned === true ? 1 : 0;
        if (aPinned !== bPinned) {
          return bPinned - aPinned;
        }

        const at = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const bt = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return bt - at;
      });
  }, [cards, conversations]);

  const handleGroupClick = (card: { chatId: number; conversationId: string }) => {
    navigate(`/messenger?conversation=${card.conversationId}`);
    onGroupClick?.(card.conversationId);
  };

  return (
    <DashboardWidget title="My Project Groups" className="h-[430px] flex flex-col">
      <div className="flex-1 overflow-hidden bg-[#F2F7FA] rounded-[10px] p-2.5 relative flex flex-col">
        <MacScrollbar className="h-full">
          <div className="space-y-[10px]">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-[#1E88E5] border-t-transparent"
                  aria-label="Loading project groups"
                />
              </div>
            ) : mergedCards.length === 0 ? (
              <div className="text-center py-8 text-[#535352]">No project groups</div>
            ) : (
              mergedCards.map((card) => (
                <ProjectGroupItem
                  key={card.chatId}
                  card={card}
                  onGroupClick={() => handleGroupClick(card)}
                  onMuteNotifications={onMuteNotifications}
                  onPinGroup={onPinGroup}
                  onMarkAsRead={onMarkAsRead}
                  onExitGroup={onExitGroup}
                />
              ))
            )}
          </div>
        </MacScrollbar>
      </div>
    </DashboardWidget>
  );
};

interface ProjectGroupCardView extends DashboardProjectGroupCard {
  conversationId: string;
}

interface ProjectGroupItemProps {
  card: ProjectGroupCardView;
  onGroupClick: () => void;
  onMuteNotifications?: (conversationId: string, currentMuted?: boolean) => void;
  onPinGroup?: (conversationId: string, currentPinned?: boolean) => void;
  onMarkAsRead?: (conversationId: string, currentUnreadCount?: number, lastMessageId?: number | null) => void;
  onExitGroup?: (conversationId: string) => void;
}

const ProjectGroupItem: React.FC<ProjectGroupItemProps> = ({
  card,
  onGroupClick,
  onMuteNotifications,
  onPinGroup,
  onMarkAsRead,
  onExitGroup,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  const formatTimestamp = (value?: string | null): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const preview = card.lastMessage
    ? (card.lastMessageSenderName ? `${card.lastMessageSenderName}: ${card.lastMessage}` : card.lastMessage)
    : 'No messages yet';

  return (
    <div
      onClick={onGroupClick}
      className={cn(
        'flex flex-col gap-2.5 p-2.5 cursor-pointer transition-colors border border-[#E6E6E6] rounded-[5px] group shadow-[0_2px_4px_0_rgba(0,0,0,0.10)]',
        'bg-white'
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative flex-shrink-0">
          <img
            src={card.avatarUrl || avatarPlaceholder}
            alt={card.title}
            className="w-12 h-12 rounded-full object-cover border border-[#E6E6E6]"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between gap-[5px] min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={cn('text-[16px] leading-normal font-semibold truncate')}>
                {card.title}
              </h3>
              <p className="text-[11px] text-[#7A7A7A]">{card.memberCount} members</p>
            </div>
            <span className={cn('text-[12px] leading-normal font-semibold flex-shrink-0', card.unreadCount > 0 ? 'text-[#008080]' : 'text-[#535352]')}>
              {formatTimestamp(card.lastMessageTime)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={cn('text-[14px] line-clamp-2 flex-1 mr-2 text-[#535352] font-normal')}>
          {preview}
        </p>
        <div className="flex items-center gap-1">
          {card.unreadCount > 0 && (
            <div className="flex items-center justify-center bg-[#008080] text-white text-[14px] leading-normal font-semibold w-[21px] h-[21px] rounded-full">
              {card.unreadCount > 9 ? '9+' : card.unreadCount}
            </div>
          )}
          {card.isMuted && (
            <div className="w-[21px] h-[21px] rounded-full bg-[#E6E6E6] flex items-center justify-center" title="Notifications muted">
              <BellOff size={12} color="#000000" strokeWidth={2.2} />
            </div>
          )}
          {card.isPinned && (
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10.5" cy="10.5" r="10.5" fill="#E6E6E6" />
              <path d="M16 8.81407C15.8784 8.93568 15.7605 9.04623 15.6462 9.14573C15.532 9.24523 15.4122 9.33183 15.2869 9.40553C15.1616 9.47923 15.0271 9.53266 14.8834 9.56583C14.7397 9.599 14.5739 9.61926 14.3859 9.62663C14.2606 9.62663 14.1409 9.61558 14.0266 9.59347L11.9317 11.6884C11.9796 11.8285 12.0146 11.9722 12.0367 12.1196C12.0588 12.267 12.0698 12.4144 12.0698 12.5618C12.0698 12.8013 12.0459 13.0188 11.998 13.2141C11.9501 13.4094 11.8819 13.5936 11.7935 13.7668C11.705 13.94 11.5945 14.104 11.4618 14.2588C11.3291 14.4136 11.1836 14.5739 11.0251 14.7397L8.89146 12.606L5.75176 15.7513L5 16L5.24874 15.2482L8.39397 12.1085L6.2603 9.97487L6.50905 9.72613C6.767 9.46817 7.06181 9.27102 7.39347 9.13467C7.72513 8.99833 8.07521 8.93015 8.44372 8.93015C8.7459 8.93015 9.03518 8.97621 9.31156 9.06834L11.4065 6.97337C11.3844 6.85913 11.3734 6.73936 11.3734 6.61407C11.3734 6.4335 11.3918 6.27136 11.4286 6.12764C11.4655 5.98392 11.5208 5.84757 11.5945 5.71859C11.6682 5.58961 11.7529 5.46985 11.8487 5.3593C11.9446 5.24874 12.057 5.12898 12.1859 5L16 8.81407Z" fill="black" />
            </svg>
          )}
          <button
            ref={dropdownButtonRef}
            className={cn(
              'overflow-hidden transition-all duration-300 flex items-center justify-center py-1',
              isDropdownOpen ? 'w-4' : 'w-0 group-hover:w-4'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="7"
              viewBox="0 0 12 7"
              fill="none"
              className={cn(
                'transition-transform duration-300',
                isDropdownOpen && 'rotate-180'
              )}
            >
              <path d="M0.264138 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899076 11.1057 0.0110741C11.3422 0.0131569 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.67763 12 0.917343C12.002 1.15705 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264138 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671627 0.0950107 0.439126 0.264138 0.267679Z" fill="black" />
            </svg>
          </button>
        </div>
      </div>
      <ConversationDropdown
        conversationId={card.conversationId}
        conversationType="group"
        buttonRef={dropdownButtonRef}
        isMuted={card.isMuted}
        isPinned={card.isPinned}
        unreadCount={card.unreadCount}
        onMuteNotifications={onMuteNotifications ? (_conversationId: string) => onMuteNotifications(card.conversationId, card.isMuted) : undefined}
        onPinGroup={onPinGroup ? (_conversationId: string) => onPinGroup(card.conversationId, card.isPinned) : undefined}
        onMarkAsRead={onMarkAsRead ? (_conversationId: string) => onMarkAsRead(card.conversationId, card.unreadCount, card.lastMessageId) : undefined}
        onExitGroup={onExitGroup}
        onOpenChange={setIsDropdownOpen}
      />
    </div>
  );
};

export default MyProjectGroupsWidget;
