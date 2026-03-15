import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { MacScrollbar } from 'mac-scrollbar';
import StatusIndicator from '../../messenger/StatusIndicator';
import avatarPlaceholder from '../../../assets/images/avatar-placeholder-2.png';
import { cn } from '../../../lib/utils/cn';
import type { User } from '../../messenger/types';
import { useMessengerContext } from '../../../contexts/MessengerContext';
import { dashboardService } from '../../../services/dashboardService';
import { formatToDateTimeOffset } from '../../../utils/dateUtils';

interface SendDirectMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SendDirectMessageModal: React.FC<SendDirectMessageModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { users, currentUser, fetchBootstrap, isLoadingBootstrap } = useMessengerContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [_searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(isOpen);
    const [presenceByUserId, setPresenceByUserId] = useState<Record<string, User['status']>>({});
    const [isLoadingPresence, setIsLoadingPresence] = useState(false);

    const mapPresenceToUserStatus = (
        availabilityStatus?: number | null,
        isOnline?: boolean | null
    ): User['status'] => {
        if (!isOnline) return 'away';
        switch (availabilityStatus) {
            case 1:
                return 'busy';
            case 3:
                return 'away';
            case 2:
            default:
                return 'online';
        }
    };

    const mapStatusForDisplay = (status?: User['status']): 'active' | 'away' | 'do-not-disturb' | 'online' | 'busy' | undefined => {
        if (!status || status === 'offline') {
            return undefined;
        }
        return status;
    };

    useEffect(() => {
        if (!isOpen) return;
        void fetchBootstrap();
    }, [isOpen, fetchBootstrap]);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;

        const loadPresenceSnapshot = async () => {
            setIsLoadingPresence(true);
            try {
                const response = await dashboardService.getAll(formatToDateTimeOffset(new Date()));
                if (!response.success || !response.result?.users || cancelled) return;

                const next: Record<string, User['status']> = {};
                for (const u of response.result.users) {
                    next[String(u.id)] = mapPresenceToUserStatus(
                        typeof u.availabilityStatus === 'number' ? u.availabilityStatus : undefined,
                        typeof u.isOnline === 'boolean' ? u.isOnline : undefined
                    );
                }
                if (!cancelled) {
                    setPresenceByUserId(next);
                }
            } catch (error) {
                console.error('Failed to load direct message presence snapshot:', error);
            } finally {
                if (!cancelled) {
                    setIsLoadingPresence(false);
                }
            }
        };

        void loadPresenceSnapshot();
        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    // Filter out logged-in user
    const availableUsers = useMemo(() => {
        return users
            .filter((user) => user.id !== currentUser.id)
            .map((user) => ({
                ...user,
                // Live SignalR-driven status from context should win.
                // Snapshot is only a fallback for initial hard-refresh state.
                status:
                    (user.status && user.status !== 'offline')
                        ? user.status
                        : (presenceByUserId[user.id] ?? user.status),
            }));
    }, [users, currentUser.id, presenceByUserId]);

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return availableUsers;
        }

        const query = searchQuery.toLowerCase();
        return availableUsers.filter(
            (user) =>
                user.name.toLowerCase().includes(query) ||
                user.position.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
        );
    }, [availableUsers, searchQuery]);

    // Handle modal visibility transitions
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }

        setIsVisible(false);
        const timer = setTimeout(() => setShouldRender(false), 300);
        return () => clearTimeout(timer);
    }, [isOpen]);

    // Reset search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Handle user click
    const handleUserClick = (user: User) => {
        // Check if we're already on the messenger page
        if (location.pathname === '/messenger') {
            // Use setSearchParams to update the URL, which will trigger the useEffect in Messenger.tsx
            // The Messenger component will detect the userId change and reset hasAutoSelected
            setSearchParams({ user: user.id }, { replace: false });
        } else {
            // Navigate to messenger page if not already there
            navigate(`/messenger?user=${user.id}`);
        }
        onClose();
    };

    // Highlight matching text in search results
    const highlightText = (text: string, query: string) => {
        if (!query.trim()) {
            return text;
        }

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={index} className="bg-[#d4f1f4]">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-300',
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-[10px] w-[485px] shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-[25px] pb-0">
                    <h2 className="text-[18px] font-semibold text-black leading-normal">
                        Send Direct Message
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-[5px] right-[5px] cursor-pointer flex items-center justify-center"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            fill="none"
                        >
                            <mask
                                id="mask0_send_dm_close"
                                style={{ maskType: 'luminance' }}
                                maskUnits="userSpaceOnUse"
                                x="0"
                                y="0"
                                width="22"
                                height="22"
                            >
                                <path
                                    d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z"
                                    fill="white"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289"
                                    stroke="black"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </mask>
                            <g mask="url(#mask0_send_dm_close)">
                                <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
                            </g>
                        </svg>
                    </button>
                </div>

                {/* Search Input */}
                <div className="px-[25px] pt-[23px]">
                    <div className="relative">
                        <div className="relative flex items-center w-full max-w-[435px] h-[38px] pr-4 pl-[42px] border border-[#e6e6e6] rounded-[20px] bg-white">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4"
                            >
                                <path
                                    d="M14.75 14.75L18.75 18.75M0.75 8.75C0.75 10.8717 1.59285 12.9066 3.09315 14.4069C4.59344 15.9071 6.62827 16.75 8.75 16.75C10.8717 16.75 12.9066 15.9071 14.4069 14.4069C15.9071 12.9066 16.75 10.8717 16.75 8.75C16.75 6.62827 15.9071 4.59344 14.4069 3.09315C12.9066 1.59285 10.8717 0.75 8.75 0.75C6.62827 0.75 4.59344 1.59285 3.09315 3.09315C1.59285 4.59344 0.75 6.62827 0.75 8.75Z"
                                    stroke="black"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search people by name or email"
                                className="flex-1 text-[16px] text-black placeholder:text-black focus:outline-none focus:ring-0 bg-transparent"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                {/* User List */}
                <div className="px-[25px] pt-[15px] pb-[25px]">
                    <div className="h-[455px] w-[435px] overflow-hidden">
                        <MacScrollbar className="h-full">
                            <div>
                                {filteredUsers.length === 0 ? (
                                    isLoadingBootstrap ? (
                                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-[#535352]">
                                            <div className="w-6 h-6 border-2 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                                            <div className="text-[14px]">Loading staff...</div>
                                        </div>
                                    ) : isLoadingPresence ? (
                                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-[#535352]">
                                            <div className="w-6 h-6 border-2 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                                            <div className="text-[14px]">Loading status...</div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-[#535352]">
                                            No users found
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        {filteredUsers.map((user, index) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserClick(user)}
                                                className={cn(
                                                    'flex items-center h-[68px] px-[10px] cursor-pointer transition-colors border-b border-[#E6E6E6] hover:bg-[#E1E6EE]',
                                                    index === 0 && 'border-t-0'
                                                )}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={user.avatar || avatarPlaceholder}
                                                        alt={user.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                    <div className="absolute bottom-0 right-0">
                                                        <StatusIndicator status={mapStatusForDisplay(user.status)} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 ml-[10px]">
                                                    <div className="text-[16px] font-semibold text-black leading-normal">
                                                        {searchQuery.trim()
                                                            ? highlightText(user.name, searchQuery)
                                                            : user.name}
                                                    </div>
                                                    <div className="text-[14px] font-normal text-[#535352] leading-normal truncate">
                                                        {user.position}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </MacScrollbar>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SendDirectMessageModal;
