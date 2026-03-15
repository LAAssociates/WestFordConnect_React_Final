import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Attachment } from '../my-work/types';
import Tooltip from '../ui/Tooltip';

interface AttachmentViewerDrawerProps {
    isOpen: boolean;
    attachment: Attachment | null;
    onClose: () => void;
    onDownload?: () => void;
}

const AttachmentViewerDrawer: React.FC<AttachmentViewerDrawerProps> = ({
    isOpen,
    attachment,
    onClose,
    onDownload,
}) => {
    if (!isOpen || !attachment) return null;

    const getExtension = (nameOrUrl?: string): string => {
        if (!nameOrUrl) return '';
        const clean = nameOrUrl.split('?')[0].split('#')[0];
        const ext = clean.includes('.') ? clean.split('.').pop() : '';
        return (ext || '').toLowerCase();
    };

    const extension = getExtension(attachment.name) || getExtension(attachment.url);
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(extension);
    const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(extension);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension);
    const isPdf = extension === 'pdf' || attachment.type === 'pdf';
    const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension);
    const isTextLike = ['txt', 'csv', 'json'].includes(extension);

    const previewUrl = attachment.url
        ? (isOfficeDoc
            ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(attachment.url)}`
            : attachment.url)
        : '';

    const handlePrint = () => {
        if (previewUrl) {
            const printWindow = window.open(previewUrl, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }
    };

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-[45] flex justify-end bg-black/40 transition-opacity duration-300',
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                className={cn(
                    'relative w-full max-w-[641px] bg-[#1C2745] shadow-xl max-h-[calc(100dvh-64px)] overflow-hidden transition-transform duration-300 ease-out mt-[64px]',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Border - Dark Blue */}
                <div className="h-[6px] bg-[#1C2745] w-full" />

                {/* Header - Dark Blue with filename and actions */}
                <div className="bg-[#1C2745] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Orange accent bar */}
                        <div className="w-1 h-5 bg-[#DE4A2C] rounded-full" />
                        <span className="text-white text-base font-medium">{attachment.name}</span>
                    </div>
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-5">
                            {/* Download Button */}
                            <Tooltip content="Download this file" side="bottom">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownload?.();
                                    }}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    aria-label="Download"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M9.99999 14.0219C9.84999 14.0219 9.70937 13.9986 9.57812 13.9521C9.44687 13.9056 9.32499 13.8258 9.21249 13.7125L5.1625 9.6625C4.9375 9.4375 4.8295 9.175 4.8385 8.875C4.8475 8.575 4.9555 8.3125 5.1625 8.0875C5.3875 7.8625 5.65487 7.7455 5.96462 7.7365C6.27437 7.7275 6.54137 7.83513 6.76562 8.05938L8.87499 10.1688V2.125C8.87499 1.80625 8.98299 1.53925 9.19899 1.324C9.41499 1.10875 9.68199 1.00075 9.99999 1C10.318 0.999254 10.5854 1.10725 10.8021 1.324C11.0189 1.54075 11.1265 1.80775 11.125 2.125V10.1688L13.2344 8.05938C13.4594 7.83438 13.7267 7.72638 14.0365 7.73538C14.3462 7.74438 14.6132 7.86175 14.8375 8.0875C15.0437 8.3125 15.1517 8.575 15.1615 8.875C15.1712 9.175 15.0632 9.4375 14.8375 9.6625L10.7875 13.7125C10.675 13.825 10.5531 13.9049 10.4219 13.9521C10.2906 13.9994 10.15 14.0226 9.99999 14.0219ZM3.25 19C2.63125 19 2.10175 18.7799 1.6615 18.3396C1.22125 17.8994 1.00075 17.3695 1 16.75V14.5C1 14.1813 1.108 13.9143 1.324 13.699C1.54 13.4838 1.807 13.3758 2.125 13.375C2.443 13.3743 2.71037 13.4823 2.92712 13.699C3.14387 13.9158 3.2515 14.1827 3.25 14.5V16.75H16.75V14.5C16.75 14.1813 16.858 13.9143 17.074 13.699C17.29 13.4838 17.557 13.3758 17.875 13.375C18.193 13.3743 18.4604 13.4823 18.6771 13.699C18.8939 13.9158 19.0015 14.1827 19 14.5V16.75C19 17.3687 18.7799 17.8986 18.3396 18.3396C17.8994 18.7806 17.3695 19.0007 16.75 19H3.25Z" fill="white"/>
                                    </svg>
                                </button>
                            </Tooltip>

                            {/* Printer Button */}
                            <Tooltip content="Print this file" side="bottom">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrint();
                                    }}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    aria-label="Print"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M15.9944 15.5V16.75C15.9944 17.3467 15.7574 17.919 15.3356 18.341C14.9138 18.7629 14.3417 19 13.7452 19H6.24781C5.65129 19 5.07919 18.7629 4.65738 18.341C4.23557 17.919 3.9986 17.3467 3.9986 16.75V15.499L2.24921 15.5C1.65268 15.5 1.08059 15.2629 0.658779 14.841C0.23697 14.419 0 13.8467 0 13.25V7.254C0 6.39205 0.34229 5.5654 0.95157 4.9559C1.56085 4.34641 2.38721 4.004 3.24886 4.004L3.9976 4.003L3.9986 3.25C3.9986 2.65326 4.23557 2.08097 4.65738 1.65901C5.07919 1.23705 5.65129 1 6.24781 1H13.7472C14.3437 1 14.9158 1.23705 15.3376 1.65901C15.7594 2.08097 15.9964 2.65326 15.9964 3.25V4.003H16.7461C17.6078 4.00353 18.4341 4.34605 19.0436 4.95537C19.653 5.56469 19.9959 6.39103 19.997 7.253L20 13.25C20 13.8464 19.7633 14.4184 19.3419 14.8403C18.9206 15.2622 18.349 15.4995 17.7528 15.5H15.9944ZM13.7452 11.5H6.24781C6.04897 11.5 5.85827 11.579 5.71767 11.7197C5.57707 11.8603 5.49808 12.0511 5.49808 12.25V16.75C5.49808 17.164 5.83396 17.5 6.24781 17.5H13.7452C13.944 17.5 14.1347 17.421 14.2753 17.2803C14.4159 17.1397 14.4949 16.9489 14.4949 16.75V12.25C14.4949 12.0511 14.4159 11.8603 14.2753 11.7197C14.1347 11.579 13.944 11.5 13.7452 11.5ZM13.7472 2.5H6.24781C6.04897 2.5 5.85827 2.57902 5.71767 2.71967C5.57707 2.86032 5.49808 3.05109 5.49808 3.25L5.49708 4.003H14.4969V3.25C14.4969 3.05109 14.4179 2.86032 14.2773 2.71967C14.1367 2.57902 13.946 2.5 13.7472 2.5Z" fill="white"/>
                                    </svg>
                                </button>
                            </Tooltip>
                        </div>

                        {/* Close Button - X in circle */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <mask id="mask0_1269_13654" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="28">
                                    <path d="M14 27C21.1799 27 27 21.1799 27 14C27 6.8201 21.1799 1 14 1C6.8201 1 1 6.8201 1 14C1 21.1799 6.8201 27 14 27Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                                    <path d="M17.6783 10.3242L10.3242 17.6783M10.3242 10.3242L17.6783 17.6783" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </mask>
                                <g mask="url(#mask0_1269_13654)">
                                    <path d="M-1.60156 -1.59961H29.5984V29.6004H-1.60156V-1.59961Z" fill="white"/>
                                </g>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Area - White background with PDF */}
                <div className="bg-white border-l border-r border-[#1C2745] rounded-[10px] flex-1 overflow-auto mx-[15px] mb-[15px]" style={{ height: 'calc(100dvh - (64px + 60px + 12px))' }}>
                    {previewUrl ? (
                        isImage ? (
                            <div className="w-full h-full flex items-center justify-center bg-[#f7f7f7]">
                                <img
                                    src={previewUrl}
                                    alt={attachment.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ) : isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <video src={previewUrl} controls className="max-w-full max-h-full" />
                            </div>
                        ) : isAudio ? (
                            <div className="w-full h-full flex items-center justify-center p-8">
                                <audio src={previewUrl} controls className="w-full max-w-[500px]" />
                            </div>
                        ) : (isPdf || isOfficeDoc || isTextLike || attachment.type === 'link') ? (
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border-0"
                                title={attachment.name}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                                <p className="text-[#535352] text-base">Preview not supported for this file type.</p>
                                <button
                                    type="button"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                    className="px-4 py-2 rounded-full bg-[#1E88E5] text-white text-sm font-medium hover:opacity-90"
                                >
                                    Open in new tab
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                            <p className="text-[#535352] text-base">No preview available for this attachment.</p>
                            <p className="text-[#777] text-sm text-center">File URL is missing. Click download to open the file.</p>
                        </div>
                    )}
                </div>

                {/* Bottom Border - Thicker dark blue bar */}
                <div className="h-[8px] bg-[#1C2745] w-full" />
            </div>
        </div>,
        document.body
    );
};

export default AttachmentViewerDrawer;
