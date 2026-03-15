import React from 'react';
import { cn } from '../../../lib/utils/cn';
import type { NotificationItem } from '../../../types/notification';

interface NotificationCardProps {
    item: NotificationItem;
    onMarkRead: (notificationId: number) => void;
    onClick: (item: NotificationItem) => void;
}

const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

type NotificationPayload = {
    entityTitle?: string;
    createdByName?: string;
    resourceAddedOnUtc?: string;
    createdOnUtc?: string;
    dueStartUtc?: string;
    dueEndUtc?: string;
    isMeeting?: boolean;
};

const parsePayload = (payloadJson?: string | null): NotificationPayload | null => {
    if (!payloadJson) {
        return null;
    }

    try {
        return JSON.parse(payloadJson) as NotificationPayload;
    } catch {
        return null;
    }
};

const toIsoString = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
};

const getDisplayContent = (item: NotificationItem): { title: string; body: string; timestamp: string } => {
    const payload = parsePayload(item.payloadJson);
    const entityTitle = payload?.entityTitle?.trim();
    const actorName = payload?.createdByName?.trim() || 'Someone';
    const createdUtc =
        toIsoString(payload?.resourceAddedOnUtc) ??
        toIsoString(payload?.createdOnUtc) ??
        toIsoString(item.createdOn) ??
        new Date().toISOString();

    const fallbackTitle = item.title || 'Notification';
    const fallbackBody = item.body || '';

    if (item.type === 'TASK_ASSIGNED' || item.type === 'MEETING_ASSIGNED') {
        const effectiveTitle = entityTitle || fallbackTitle;
        const actionText = item.type === 'MEETING_ASSIGNED' ? 'created a meeting' : 'created a task';
        const effectiveBody = entityTitle
            ? `${actorName} ${actionText}: ${entityTitle}`
            : fallbackBody;

        return {
            title: effectiveTitle,
            body: effectiveBody,
            timestamp: createdUtc
        };
    }

    return {
        title: fallbackTitle,
        body: fallbackBody,
        timestamp: createdUtc
    };
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
    item,
    onMarkRead,
    onClick
}) => {
    const content = getDisplayContent(item);

    return (
        <button
            type="button"
            onClick={() => onClick(item)}
            className={cn(
                'relative cursor-pointer text-left bg-[#2D3857] text-white rounded-[5px] w-full px-[32px] py-2.5 text-sm border transition border-transparent opacity-85'
            )}
        >
            {!item.isRead ? (
                <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                        event.stopPropagation();
                        onMarkRead(item.notificationId);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            onMarkRead(item.notificationId);
                        }
                    }}
                    className="absolute top-3 right-[32px] text-[11px] text-[#DE4A2C] whitespace-nowrap hover:underline"
                >
                    Mark read
                </span>
            ) : null}

            <div className="mb-1">{formatDate(content.timestamp)}</div>
            <hr />
            <div className="min-w-0">
                <div className="flex items-center gap-2 relative mt-1">
                    <span className={cn("absolute -left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full", item.isRead ? "bg-white w-3 h-1 -left-5" : "bg-[#DE4A2C]")} />
                    <p className="font-semibold truncate">{content.title}</p>
                </div>
                <p className="mt-1 text-white/85 break-words line-clamp-2">{content.body}</p>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[14px] text-white">
                <span>{formatTime(content.timestamp)}</span>
            </div>
        </button>
    );
};
