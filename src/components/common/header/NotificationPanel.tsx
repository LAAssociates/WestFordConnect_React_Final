import React from 'react';
import { cn } from '../../../lib/utils/cn';
import { CheckCheck, X } from 'lucide-react';
import type { NotificationItem } from '../../../types/notification';
import { NotificationCard } from './NotificationCard';

interface NotificationPanelProps {
    open: boolean;
    onClose: () => void;
    items: NotificationItem[];
    unreadCount: number;
    isLoading: boolean;
    filter: 'all' | 'unread';
    onFilterChange: (value: 'all' | 'unread') => void;
    onMarkRead: (notificationId: number) => void;
    onMarkAllRead: () => void;
    onNotificationClick: (item: NotificationItem) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
    open,
    onClose,
    items,
    unreadCount,
    isLoading,
    filter,
    onFilterChange,
    onMarkRead,
    onMarkAllRead,
    onNotificationClick
}) => {
    React.useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    return (
        <div
            className={cn(
                'fixed inset-0 z-[10000] flex justify-end transition pointer-events-none',
                open && 'pointer-events-auto'
            )}
            aria-hidden={!open}
        >
            <div
                className={cn(
                    'absolute inset-0 transition-opacity duration-300 ease-in-out cursor-pointer',
                    open ? 'opacity-100' : 'opacity-0'
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={cn(
                    'relative h-[calc(100%-64px)] mt-16 w-full max-w-96 bg-[#1C2745] shadow-2xl transition-transform duration-300 ease-in-out',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-panel-title"
            >
                <button
                    onClick={onClose}
                    className={cn(
                        'cursor-pointer absolute top-1.5 h-8 w-8 items-center justify-center rounded-full bg-[#535352] transition',
                        open ? ' -left-1.5 -translate-x-full' : ''
                    )}
                    aria-label="Close notifications"
                >
                    <X className="h-4 w-4 mx-auto text-white stroke-3" />
                </button>

                <div className="flex items-center justify-between px-8 py-6">
                    <div className="relative">
                        <h2 id="notification-panel-title" className="text-lg font-semibold text-white">
                            Notifications
                        </h2>
                        <div className="absolute top-1/2 -translate-y-1/2 -left-3 h-4/5 w-1 rounded-full bg-[#DE4A2C]"></div>
                    </div>

                    <button
                        type="button"
                        className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={onMarkAllRead}
                        disabled={unreadCount === 0}
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                    </button>
                </div>

                <div className="px-8 pb-3">
                    <div className="flex items-center gap-5">
                        <button
                            type="button"
                            className={cn(
                                'cursor-pointer flex items-center gap-2 text-sm font-medium transition',
                                filter === 'all' ? 'text-white' : 'text-gray-300 hover:text-white'
                            )}
                            onClick={() => onFilterChange('all')}
                        >
                            <div className={cn('w-[7px] h-[7px] rounded-full', filter === 'all' ? 'bg-white' : 'bg-gray-400')}></div>
                            All
                        </button>

                        <button
                            type="button"
                            className={cn(
                                'cursor-pointer flex items-center gap-2 text-sm font-medium transition',
                                filter === 'unread' ? 'text-white' : 'text-gray-300 hover:text-white'
                            )}
                            onClick={() => onFilterChange('unread')}
                        >
                            <div className={cn('w-[7px] h-[7px] rounded-full', filter === 'unread' ? 'bg-[#DE4A2C]' : 'bg-gray-400')}></div>
                            Unread
                            <div className="font-semibold bg-[#DE4A2C] text-white rounded-full min-w-[21px] h-[21px] px-1 flex justify-center items-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="h-[calc(100%-158px)] overflow-y-auto flex flex-col gap-2.5 mx-2.5 mb-2.5">
                    {isLoading ? (
                        <div className="bg-[#2D3857] text-white rounded-[5px] w-full px-5 py-4 text-sm">
                            Loading notifications...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="bg-[#2D3857] text-white rounded-[5px] w-full px-5 py-4 text-sm">
                            No notifications found.
                        </div>
                    ) : (
                        items.map((item) => (
                            <NotificationCard
                                key={item.notificationId}
                                item={item}
                                onMarkRead={onMarkRead}
                                onClick={onNotificationClick}
                            />
                        ))
                    )}
                </div>
            </aside>
        </div>
    );
};

export default NotificationPanel;
