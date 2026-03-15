import React, { useMemo, useState } from 'react';
import type { Message } from './types';

interface MediaFilesModalProps {
  isOpen: boolean;
  conversationName: string;
  messages: Message[];
  onClose: () => void;
  onDownload: (messageId: string, attachmentId: number, fileName: string) => Promise<void>;
}

interface AttachmentEntry {
  key: string;
  messageId: string;
  attachmentId?: number;
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: number;
  contentType?: string;
  timestamp: Date;
  senderName: string;
  downloadCount?: number;
}

interface LinkEntry {
  key: string;
  messageId: string;
  url: string;
  displayUrl: string;
  timestamp: Date;
  senderName: string;
}

const MediaFilesModal: React.FC<MediaFilesModalProps> = ({
  isOpen,
  conversationName,
  messages,
  onClose,
  onDownload
}) => {
  const [tab, setTab] = useState<'media' | 'links' | 'files'>('media');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const formatFileSize = (size?: number): string => {
    if (!size || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const attachments = useMemo<AttachmentEntry[]>(() => {
    const items: AttachmentEntry[] = [];

    messages.forEach((message) => {
      if (!message.attachments?.length) return;

      message.attachments.forEach((att) => {
        if (!att.url) return;
        items.push({
          key: `${message.id}-${att.id}`,
          messageId: message.id,
          attachmentId: att.attachmentId,
          name: att.name,
          url: att.url,
          type: att.type,
          size: att.size,
          contentType: att.contentType,
          timestamp: message.timestamp,
          senderName: message.senderName,
          downloadCount: att.downloadCount
        });
      });
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [messages]);

  const mediaItems = attachments.filter((item) => item.type === 'image');
  const fileItems = attachments.filter((item) => item.type === 'file');
  const linkItems = useMemo<LinkEntry[]>(() => {
    const items: LinkEntry[] = [];
    const seen = new Set<string>();
    const urlRegex = /((https?:\/\/|www\.)[^\s<>"']+)/gi;

    messages.forEach((message) => {
      if (!message.content) return;

      const matches = message.content.matchAll(urlRegex);
      for (const match of matches) {
        const rawUrl = (match[1] || '').trim();
        if (!rawUrl) continue;

        const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        const dedupeKey = `${message.id}-${normalizedUrl.toLowerCase()}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        items.push({
          key: dedupeKey,
          messageId: message.id,
          url: normalizedUrl,
          displayUrl: rawUrl,
          timestamp: message.timestamp,
          senderName: message.senderName
        });
      }
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [messages]);

  if (!isOpen) return null;

  const handleDownload = async (item: AttachmentEntry) => {
    if (typeof item.attachmentId === 'number') {
      await onDownload(item.messageId, item.attachmentId, item.name);
      return;
    }

    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const activeMedia = previewIndex !== null ? mediaItems[previewIndex] : null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[82vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E6E6]">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Media, links and docs</h2>
            <p className="text-sm text-[#6B7280] truncate">{conversationName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-[#F3F4F6] text-[#4B5563]"
            aria-label="Close media viewer"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-[#E6E6E6]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTab('media')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                tab === 'media' ? 'text-[#0F766E] border-[#0F766E]' : 'text-[#6B7280] border-transparent'
              }`}
            >
              Media ({mediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('links')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                tab === 'links' ? 'text-[#0F766E] border-[#0F766E]' : 'text-[#6B7280] border-transparent'
              }`}
            >
              Links ({linkItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('files')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                tab === 'files' ? 'text-[#0F766E] border-[#0F766E]' : 'text-[#6B7280] border-transparent'
              }`}
            >
              Files ({fileItems.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC]">
          {tab === 'media' && (
            <>
              {mediaItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#6B7280]">No media found</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mediaItems.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      className="group relative rounded-lg overflow-hidden bg-[#E5E7EB] aspect-square"
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'links' && (
            <>
              {linkItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#6B7280]">No links found</div>
              ) : (
                <div className="space-y-2">
                  {linkItems.map((item) => (
                    <div key={item.key} className="bg-white rounded-lg border border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#0F766E] hover:underline break-all"
                          title={item.url}
                        >
                          {item.displayUrl}
                        </a>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {item.senderName} • {item.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                        className="shrink-0 ml-2 px-3 py-1.5 text-xs rounded-md bg-[#0F766E] text-white hover:bg-[#0D5E58]"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'files' && (
            <>
              {fileItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#6B7280]">No files found</div>
              ) : (
                <div className="space-y-2">
                  {fileItems.map((item) => (
                    <div key={item.key} className="bg-white rounded-lg border border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{item.name}</p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {item.senderName} • {item.timestamp.toLocaleString()}
                          {formatFileSize(item.size) ? ` • ${formatFileSize(item.size)}` : ''}
                          {typeof item.downloadCount === 'number' ? ` • ${item.downloadCount} downloads` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="ml-3 px-3 py-1.5 text-xs rounded-md bg-[#0F766E] text-white hover:bg-[#0D5E58]"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {activeMedia && (
        <div
          className="fixed inset-0 z-[95] bg-black/85 flex items-center justify-center p-6"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              setPreviewIndex(null);
            }
          }}
        >
          <div className="absolute top-4 right-6 flex items-center gap-2 z-[96]">
            <button
              type="button"
              onClick={() => handleDownload(activeMedia)}
              className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
              aria-label="Download media"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v11" />
                <path d="m7 11 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
              aria-label="Close media preview"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 6-12 12" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="relative max-w-5xl max-h-full">
            <img src={activeMedia.url} alt={activeMedia.name} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaFilesModal;
