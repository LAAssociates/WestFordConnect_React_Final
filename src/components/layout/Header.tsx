import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import AvatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import Logo from '../common/Logo';
import CheckInToggle from '../common/header/CheckInToggle';
import NotificationPanel from '../common/header/NotificationPanel';
import Notifications from '../common/header/Notifications';
import QuickLinks from '../common/header/QuickLinks';
import SearchBar from '../common/header/SearchBar';
import StatusDropdown from '../common/header/StatusDropdown';
import UserProfile from '../common/header/UserProfile';
import type { StatusOption } from '../common/header/statusOptions';
import {
    DEFAULT_STATUS_ID,
    STATUS_STORAGE_KEY,
    getStatusById,
    getStatusByCode,
    isValidStatusId
} from '../common/header/statusOptions';
import type { AvailabilityStatusCode } from '../common/header/statusOptions';
import { notificationService } from '../../services/notificationService';
import { presenceService } from '../../services/presenceService';
import { useMessengerContext } from '../../contexts/MessengerContext';
import { useAuth } from '../../contexts/AuthContext';
import type { NotificationItem } from '../../types/notification';

interface HeaderProps {
    title: string;
    onToggleSidebar?: () => void;
}

const profileStatusMap: Record<StatusOption['id'], 'online' | 'away' | 'busy'> = {
    'do-not-disturb': 'busy',
    active: 'online',
    away: 'away'
};

const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar }) => {
    const navigate = useNavigate();
    const { hubConnection } = useMessengerContext();
    const { user } = useAuth();

    const headerRef = React.useRef<HTMLElement | null>(null);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const [notificationFilter, setNotificationFilter] = React.useState<'all' | 'unread'>('all');
    const [notificationItems, setNotificationItems] = React.useState<NotificationItem[]>([]);
    const [notificationUnreadCount, setNotificationUnreadCount] = React.useState(0);
    const [isNotificationLoading, setIsNotificationLoading] = React.useState(false);

    const [statusId, setStatusId] = React.useState<StatusOption['id']>(() => {
        if (typeof window === 'undefined') {
            return DEFAULT_STATUS_ID;
        }

        const storedStatus = window.localStorage.getItem(STATUS_STORAGE_KEY);

        return storedStatus && isValidStatusId(storedStatus)
            ? storedStatus
            : DEFAULT_STATUS_ID;
    });
    const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
    const [mobileSearchTop, setMobileSearchTop] = React.useState<number | null>(null);

    const fetchNotificationList = React.useCallback(async (filter: 'all' | 'unread') => {
        setIsNotificationLoading(true);
        try {
            const response = await notificationService.getList(1, 25, filter === 'unread');
            if (response.success && Array.isArray(response.result)) {
                setNotificationItems(response.result);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsNotificationLoading(false);
        }
    }, [statusId]);

    const fetchNotificationUnreadCount = React.useCallback(async () => {
        try {
            const response = await notificationService.getUnreadCount();
            if (response.success) {
                setNotificationUnreadCount(response.result?.unreadCount ?? 0);
            }
        } catch (error) {
            console.error('Failed to fetch notification unread count:', error);
        }
    }, []);

    React.useEffect(() => {
        void fetchNotificationUnreadCount();
        void fetchNotificationList(notificationFilter);
    }, [fetchNotificationList, fetchNotificationUnreadCount, notificationFilter]);

    React.useEffect(() => {
        if (!hubConnection) {
            return;
        }

        const onNotificationReceived = (notification: NotificationItem) => {
            setNotificationItems((prev) => {
                if (prev.some((item) => item.notificationId === notification.notificationId)) {
                    return prev;
                }

                if (notificationFilter === 'unread' && notification.isRead) {
                    return prev;
                }

                return [notification, ...prev].slice(0, 50);
            });

            if (!notification.isRead) {
                setNotificationUnreadCount((prev) => prev + 1);
            }
        };

        const onNotificationCountUpdated = (unreadCount: number) => {
            setNotificationUnreadCount(unreadCount);
        };

        hubConnection.on('NotificationReceived', onNotificationReceived);
        hubConnection.on('NotificationCountUpdated', onNotificationCountUpdated);

        return () => {
            hubConnection.off('NotificationReceived', onNotificationReceived);
            hubConnection.off('NotificationCountUpdated', onNotificationCountUpdated);
        };
    }, [hubConnection, notificationFilter]);

    const handleToggleNotifications = React.useCallback(() => {
        setIsNotificationsOpen((prev) => !prev);
    }, []);

    const handleCloseNotifications = React.useCallback(() => {
        setIsNotificationsOpen(false);
    }, []);

    const handleNotificationFilterChange = React.useCallback((value: 'all' | 'unread') => {
        setNotificationFilter(value);
    }, []);

    const handleMarkNotificationRead = React.useCallback(async (notificationId: number) => {
        try {
            const response = await notificationService.markRead({ notificationId });
            if (!response.success) {
                return;
            }

            setNotificationItems((prev) => {
                if (notificationFilter === 'unread') {
                    return prev.filter((item) => item.notificationId !== notificationId);
                }

                return prev.map((item) =>
                    item.notificationId === notificationId
                        ? { ...item, isRead: true }
                        : item
                );
            });

            void fetchNotificationUnreadCount();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [fetchNotificationUnreadCount, notificationFilter]);

    const handleMarkAllNotificationsRead = React.useCallback(async () => {
        try {
            const response = await notificationService.markAllRead();
            if (!response.success) {
                return;
            }

            setNotificationUnreadCount(0);

            setNotificationItems((prev) => {
                if (notificationFilter === 'unread') {
                    return [];
                }

                return prev.map((item) => ({ ...item, isRead: true }));
            });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, [notificationFilter]);

    const resolveRouteFromPayload = React.useCallback((payloadJson?: string | null): string | null => {
        if (!payloadJson) {
            return null;
        }

        try {
            const parsed = JSON.parse(payloadJson) as { route?: string };
            if (typeof parsed.route === 'string' && parsed.route.trim()) {
                return parsed.route;
            }
        } catch {
            return null;
        }

        return null;
    }, []);

    const handleNotificationClick = React.useCallback(async (item: NotificationItem) => {
        if (!item.isRead) {
            await handleMarkNotificationRead(item.notificationId);
        }

        const route = resolveRouteFromPayload(item.payloadJson);
        if (route) {
            setIsNotificationsOpen(false);
            navigate(route);
        }
    }, [handleMarkNotificationRead, navigate, resolveRouteFromPayload]);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(STATUS_STORAGE_KEY, statusId);
    }, [statusId]);

    const currentStatus = React.useMemo(() => getStatusById(statusId), [statusId]);

    const handleStatusChange = React.useCallback(async (nextStatusId: StatusOption['id']) => {
        const safeStatusId = isValidStatusId(nextStatusId) ? nextStatusId : DEFAULT_STATUS_ID;
        const previousStatusId = statusId;
        setStatusId(safeStatusId);

        const statusCode = getStatusById(safeStatusId).code as AvailabilityStatusCode;

        try {
            const response = await presenceService.setStatus(statusCode);
            if (!response.success) {
                setStatusId(previousStatusId);
            }
        } catch (error) {
            console.error('Failed to update presence status:', error);
            setStatusId(previousStatusId);
        }
    }, []);

    React.useEffect(() => {
        if (!hubConnection || !user?.id) {
            return;
        }

        const onUserPresenceChanged = (evt: any) => {
            const eventUserId = Number(evt?.userId ?? evt?.UserId ?? 0);
            if (!eventUserId || eventUserId !== Number(user.id)) {
                return;
            }

            const code = Number(evt?.status ?? evt?.Status);
            if (Number.isFinite(code)) {
                setStatusId(getStatusByCode(code).id);
            }
        };

        const onPresenceStatusUpdated = (event: any) => {
            const code = event.detail?.statusCode;
            if (Number.isFinite(code)) {
                setStatusId(getStatusByCode(code).id);
            }
        };

        hubConnection.on('UserPresenceChanged', onUserPresenceChanged);
        window.addEventListener('presence:status-updated', onPresenceStatusUpdated);

        return () => {
            hubConnection.off('UserPresenceChanged', onUserPresenceChanged);
            window.removeEventListener('presence:status-updated', onPresenceStatusUpdated);
        };
    }, [hubConnection, user?.id]);

    const updateMobileSearchPosition = React.useCallback(() => {
        if (!headerRef.current) {
            return;
        }

        const rect = headerRef.current.getBoundingClientRect();

        setMobileSearchTop(rect.bottom);
    }, []);

    const handleToggleMobileSearch = React.useCallback(() => {
        setIsMobileSearchOpen((prev) => {
            const next = !prev;

            if (!next) {
                setMobileSearchTop(null);
            }

            return next;
        });
    }, []);

    const handleCloseMobileSearch = React.useCallback(() => {
        setIsMobileSearchOpen(false);
        setMobileSearchTop(null);
    }, []);

    const handleMobileSearch = React.useCallback((query: string) => {
        void query;
        setIsMobileSearchOpen(false);
        setMobileSearchTop(null);
    }, []);

    React.useEffect(() => {
        if (!isMobileSearchOpen) {
            return;
        }

        updateMobileSearchPosition();

        const handleWindowChange = () => {
            updateMobileSearchPosition();
        };

        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);

        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [isMobileSearchOpen, updateMobileSearchPosition]);

    return (
        <header
            ref={headerRef}
            className="relative z-10 flex flex-nowrap items-center overflow-x-auto overflow-y-visible bg-white px-4 py-3 lg:h-16 lg:justify-between lg:gap-0 lg:overflow-visible lg:px-[25px] lg:py-0"
        >
            <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex lg:items-center lg:gap-0 lg:divide-x-2 lg:divide-[#E6E6E6]">
                <div className="flex items-center gap-3 pr-2 lg:pr-[25px]">
                    <button
                        type="button"
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#E6E6E6] bg-white lg:hidden cursor-pointer"
                        onClick={onToggleSidebar}
                        aria-label="Toggle navigation menu"
                    >
                        <span className="text-[#262626]">
                            <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path
                                    d="M20.2632 15.6471C20.7092 15.6473 21.1381 15.8131 21.4609 16.1102C21.7837 16.4073 21.9757 16.8129 21.9971 17.243C22.0186 17.673 21.8678 18.0945 21.576 18.4202C21.2842 18.7458 20.8739 18.9506 20.4299 18.9922L20.2632 19H1.73684C1.2908 18.9998 0.861943 18.8339 0.539131 18.5368C0.21632 18.2397 0.0243019 17.8341 0.00286664 17.4041C-0.0185686 16.9741 0.132222 16.5525 0.423993 16.2269C0.715763 15.9012 1.12615 15.6964 1.57011 15.6549L1.73684 15.6471H20.2632ZM20.2632 7.82353C20.7238 7.82353 21.1656 8.00016 21.4913 8.31456C21.817 8.62895 22 9.05537 22 9.5C22 9.94463 21.817 10.371 21.4913 10.6854C21.1656 10.9998 20.7238 11.1765 20.2632 11.1765H1.73684C1.2762 11.1765 0.83443 10.9998 0.508709 10.6854C0.182988 10.371 0 9.94463 0 9.5C0 9.05537 0.182988 8.62895 0.508709 8.31456C0.83443 8.00016 1.2762 7.82353 1.73684 7.82353H20.2632ZM20.2632 0C20.7238 0 21.1656 0.176628 21.4913 0.491027C21.817 0.805426 22 1.23184 22 1.67647C22 2.1211 21.817 2.54752 21.4913 2.86191C21.1656 3.17631 20.7238 3.35294 20.2632 3.35294H1.73684C1.2762 3.35294 0.83443 3.17631 0.508709 2.86191C0.182988 2.54752 0 2.1211 0 1.67647C0 1.23184 0.182988 0.805426 0.508709 0.491027C0.83443 0.176628 1.2762 0 1.73684 0H20.2632Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                    </button>
                    <Logo width={112} height={39} className="h-auto w-[140px] flex-shrink-0 sm:w-[150px] lg:w-[112px]" />
                </div>
                <div className="hidden min-w-0 lg:block lg:px-[25px]">
                    <div className="relative">
                        <span className="truncate text-base font-semibold sm:text-lg">{title}</span>
                        <div className="absolute -bottom-0.5 left-0 h-[3px] w-2/5 rounded-full bg-[#DE4A2C]"></div>
                    </div>
                </div>
                <div className="hidden lg:block lg:pl-[25px]">
                    <CheckInToggle />
                </div>
            </div>

            <div className="flex flex-1 flex-nowrap items-center justify-start gap-2.5 overflow-x-auto overflow-y-visible lg:flex-none lg:justify-end lg:overflow-visible">
                <div className="flex flex-shrink-0 items-center gap-2 lg:hidden">
                    <div className="relative">
                        <span className="truncate text-base font-semibold sm:text-lg">{title}</span>
                        <div className="absolute -bottom-0.5 left-0 h-[3px] w-2/5 rounded-full bg-[#DE4A2C]"></div>
                    </div>
                    <div className="flex-shrink-0">
                        <CheckInToggle />
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <StatusDropdown value={currentStatus.id} onChange={handleStatusChange} />
                </div>
                <button
                    type="button"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#E6E6E6] bg-[#F5F5F5] text-[#262626] sm:hidden cursor-pointer"
                    onClick={handleToggleMobileSearch}
                    aria-label="Toggle search"
                >
                    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                <div className="hidden min-w-[220px] flex-shrink-0 sm:block lg:w-auto">
                    <SearchBar onSearch={handleMobileSearch} />
                </div>
                <div className="flex-shrink-0">
                    <QuickLinks />
                </div>
                <div className="flex-shrink-0">
                    <Notifications
                        count={notificationUnreadCount}
                        onClick={handleToggleNotifications}
                        isOpen={isNotificationsOpen}
                    />
                </div>
                <div className="flex-shrink-0">
                    <UserProfile
                        avatar={user?.picture || AvatarPlaceholder}
                        name={user ? `${user.firstName} ${user.lastName}`.trim() : 'User'}
                        status={profileStatusMap[currentStatus.id]}
                        statusIcon={currentStatus.icon()}
                    />
                </div>
            </div>

            {isMobileSearchOpen && mobileSearchTop !== null && typeof document !== 'undefined'
                ? createPortal(
                    <div
                        className="fixed inset-x-0 z-50 border-t border-[#E6E6E6] bg-white px-4 pb-3 pt-2 shadow-sm sm:hidden"
                        style={{ top: mobileSearchTop }}
                    >
                        <SearchBar className="w-full" onSearch={handleMobileSearch} />
                        <button
                            type="button"
                            className="mt-2 text-sm font-medium text-[#DE4A2C] cursor-pointer"
                            onClick={handleCloseMobileSearch}
                        >
                            Close search
                        </button>
                    </div>,
                    document.body
                )
                : null}

            {typeof document !== 'undefined'
                ? createPortal(
                    <NotificationPanel
                        open={isNotificationsOpen}
                        onClose={handleCloseNotifications}
                        items={notificationItems}
                        isLoading={isNotificationLoading}
                        unreadCount={notificationUnreadCount}
                        filter={notificationFilter}
                        onFilterChange={handleNotificationFilterChange}
                        onMarkRead={handleMarkNotificationRead}
                        onMarkAllRead={handleMarkAllNotificationsRead}
                        onNotificationClick={handleNotificationClick}
                    />,
                    document.body
                )
                : null}
        </header>
    );
};

export default Header;
