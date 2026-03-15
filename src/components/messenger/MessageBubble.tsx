import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { Message } from './types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName: string;
  isGroup: boolean;
  currentUserName?: string;
  onDownloadAttachment?: (messageId: string, attachmentId: number, fileName: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName,
  isGroup,
  currentUserName,
  onDownloadAttachment,
}) => {
  const [downloadingAttachmentId, setDownloadingAttachmentId] = React.useState<number | null>(null);
  const [downloadProgressByAttachment, setDownloadProgressByAttachment] = React.useState<Record<number, number>>({});
  const progressTimerRef = React.useRef<number | null>(null);
  const normalizeMentionName = (name: string): string => name.replace(/\s+/g, '').replace(/[^A-Za-z0-9_]/g, '');

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getFileExtension = (name: string): string => {
    const trimmed = (name || '').trim();
    const idx = trimmed.lastIndexOf('.');
    if (idx <= 0 || idx === trimmed.length - 1) return 'FILE';
    return trimmed.slice(idx + 1).toUpperCase();
  };

  const formatFileSize = (size?: number): string => {
    if (!size || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderContent = () => {
    const mentionRegex = /(@[A-Za-z0-9_]+)/g;
    const parts = message.content.split(mentionRegex);
    const currentUserMentionTokens = new Set<string>();
    if (currentUserName) {
      const fullToken = normalizeMentionName(currentUserName);
      const firstToken = normalizeMentionName(currentUserName.split(' ')[0] || '');
      if (fullToken) currentUserMentionTokens.add(`@${fullToken.toLowerCase()}`);
      if (firstToken) currentUserMentionTokens.add(`@${firstToken.toLowerCase()}`);
    }

    return parts.map((part, index) => {
      const isMention = /^@[A-Za-z0-9_]+$/.test(part);
      if (!isMention) {
        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
      }

      let mentionLabel = part;
      if (!isOwnMessage && currentUserMentionTokens.has(part.toLowerCase())) {
        mentionLabel = '@You';
      } else if (!isOwnMessage && part.toLowerCase() === '@all') {
        mentionLabel = '@All';
      }

      return (
        <span
          key={`${part}-${index}`}
          className={cn(
            'font-semibold',
            isOwnMessage ? 'text-[#8ED8FF]' : 'text-[#1E88E5]'
          )}
        >
          {mentionLabel}
        </span>
      );
    });
  };

  const isGroupLeaveSystemMessage =
    isGroup &&
    / left the group$/i.test((message.content || '').trim()) &&
    (!message.attachments || message.attachments.length === 0);

  const hasAttachments = !!message.attachments && message.attachments.length > 0;
  const shouldHideTextForAutoAttachmentName =
    hasAttachments &&
    message.attachments!.length === 1 &&
    message.content.trim().length > 0 &&
    message.content.trim() === (message.attachments![0].name || '').trim();
  const hasVisibleText = message.content.trim().length > 0 && !shouldHideTextForAutoAttachmentName;
  const hasOnlyImageAttachments =
    hasAttachments && message.attachments!.every((attachment) => attachment.type === 'image');
  const isImageOnlyBubble = hasOnlyImageAttachments && !hasVisibleText;

  const handleDownloadClick = async (attachmentId: number, fileName: string) => {
    if (!onDownloadAttachment) return;

    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    try {
      setDownloadingAttachmentId(attachmentId);
      setDownloadProgressByAttachment((prev) => ({ ...prev, [attachmentId]: 0 }));

      progressTimerRef.current = window.setInterval(() => {
        setDownloadProgressByAttachment((prev) => {
          const current = prev[attachmentId] ?? 0;
          if (current >= 95) return prev;
          const next = Math.min(95, current + Math.max(1, Math.round((95 - current) / 8)));
          return { ...prev, [attachmentId]: next };
        });
      }, 140);

      await Promise.resolve(onDownloadAttachment(message.id, attachmentId, fileName));
      setDownloadProgressByAttachment((prev) => ({ ...prev, [attachmentId]: 100 }));
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    } finally {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setDownloadingAttachmentId(null);
      setDownloadProgressByAttachment((prev) => {
        const next = { ...prev };
        delete next[attachmentId];
        return next;
      });
    }
  };

  React.useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  if (isGroupLeaveSystemMessage) {
    const text = isOwnMessage
      ? 'You left the group'
      : message.content;

    return (
      <div className="flex justify-center mb-4">
        <div className="px-3 py-1.5 rounded-full bg-[#E6E6E6] text-[#535352] text-xs font-medium">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col mb-4',
        isOwnMessage ? 'items-end' : 'items-start'
      )}
    >
      {!isOwnMessage && isGroup && (
        <span className="text-xs text-gray-500 mb-1 px-1">{senderName}</span>
      )}
      <div
        className={cn(
          'inline-block shadow-sm',
          isImageOnlyBubble
            ? 'max-w-[380px] p-1.5 relative'
            : 'max-w-[70%] px-4 py-2',
          isImageOnlyBubble
            ? (isOwnMessage
              ? 'bg-[#0E4F3A] text-white rounded-[14px]'
              : 'bg-[#ECEFF3] text-[#262626] rounded-[14px]')
            : (isOwnMessage
              ? 'bg-[#262626] text-white rounded-tl-[16px] rounded-tr-[4px] rounded-br-[16px] rounded-bl-[16px]'
              : 'bg-[#F2F4F7] text-[#262626] rounded-tl-[4px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px]')
        )}
      >
        {!shouldHideTextForAutoAttachmentName && (
          <p className="text-sm whitespace-pre-wrap break-words">{renderContent()}</p>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn(isImageOnlyBubble ? 'mt-0 space-y-1.5' : 'mt-2 space-y-2')}>
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  'rounded-xl border',
                  attachment.type === 'image' ? 'overflow-hidden p-0' : 'px-3 py-2',
                  isOwnMessage
                    ? 'bg-[#0E4F3A] border-[#1E7A59]'
                    : 'bg-white border-[#E7E7E7]'
                )}
              >
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className={cn(
                      'block w-full h-auto object-cover',
                      isImageOnlyBubble ? 'max-h-[420px] rounded-[10px]' : 'rounded'
                    )}
                  />
                ) : (
                  <div className="w-full flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold leading-none',
                      isOwnMessage ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#667085]'
                    )}>
                      {getFileExtension(attachment.name).slice(0, 3)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        'text-[15px] font-semibold truncate',
                        isOwnMessage ? 'text-white' : 'text-[#1D2939]'
                      )}>
                        {attachment.name}
                      </div>
                      <div className={cn(
                        'text-xs mt-0.5',
                        isOwnMessage ? 'text-white/80' : 'text-[#667085]'
                      )}>
                        {getFileExtension(attachment.name)}
                        {formatFileSize(attachment.size) ? ` • ${formatFileSize(attachment.size)}` : ''}
                        {downloadingAttachmentId === attachment.attachmentId && typeof attachment.attachmentId === 'number'
                          ? ` • ${Math.max(1, Math.min(100, downloadProgressByAttachment[attachment.attachmentId] ?? 1))}%`
                          : ''}
                      </div>
                      {typeof attachment.attachmentId === 'number' && downloadingAttachmentId === attachment.attachmentId && (
                        <div className={cn(
                          'mt-1 h-1.5 w-full rounded-full overflow-hidden',
                          isOwnMessage ? 'bg-white/20' : 'bg-[#EAECF0]'
                        )}>
                          <div
                            className={cn(
                              'h-full transition-all duration-150',
                              isOwnMessage ? 'bg-white/85' : 'bg-[#008080]'
                            )}
                            style={{ width: `${Math.max(1, Math.min(100, downloadProgressByAttachment[attachment.attachmentId] ?? 1))}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {typeof attachment.attachmentId === 'number' && onDownloadAttachment && (
                      <button
                        type="button"
                        onClick={() => handleDownloadClick(attachment.attachmentId!, attachment.name)}
                        disabled={downloadingAttachmentId === attachment.attachmentId}
                        className={cn(
                          'w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition',
                          isOwnMessage
                            ? 'border-white/40 text-white hover:bg-white/10'
                            : 'border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]',
                          downloadingAttachmentId === attachment.attachmentId && 'opacity-70 cursor-not-allowed'
                        )}
                        title="Download"
                      >
                        {downloadingAttachmentId === attachment.attachmentId ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3V12M10 12L6.5 8.5M10 12L13.5 8.5M4 15.5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isOwnMessage && message.status === 'pending' && typeof message.uploadProgress === 'number' && (
          <div className="mt-2">
            <div className="text-[11px] text-white/75 mb-1">Uploading {message.uploadProgress}%</div>
            <div className="h-1.5 w-full rounded bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white/80 transition-all duration-150"
                style={{ width: `${message.uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        {/* Time and tick inside bubble - positioned at bottom-right/left */}
        <div className={cn(
          'flex items-center gap-1',
          isImageOnlyBubble
            ? 'absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/45 justify-end'
            : 'mt-1',
          !isImageOnlyBubble && (isOwnMessage ? 'justify-end' : 'justify-start')
        )}>
          {!isOwnMessage && (
            <span className={cn(
              'text-[10px] leading-none',
              isImageOnlyBubble ? 'text-white/90' : 'text-[#535352]/70'
            )}>
              {formatTime(message.timestamp)}
            </span>
          )}
          {isOwnMessage && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-[10px] leading-none',
                isImageOnlyBubble ? 'text-white/90' : 'text-white/70'
              )}>
                {formatTime(message.timestamp)}
              </span>
              <span className="inline-flex items-center">
                {message.status === 'read' ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.75 9.75L4.25 12.25M7.75 8.25L10.25 5.75M5.75 9.75L8.25 12.25L14.25 5.75" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : message.status === 'delivered' ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.75 9.75L4.25 12.25M7.75 8.25L10.25 5.75M5.75 9.75L8.25 12.25L14.25 5.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.75 8.75L6.25 12.25L13.25 4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70"/>
                  </svg>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
