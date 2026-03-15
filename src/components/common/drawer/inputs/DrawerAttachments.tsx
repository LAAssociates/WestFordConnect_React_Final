import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Paperclip, Link2, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';
import AddLinkModal from '../../../my-work/AddLinkModal';

export type AttachmentType = 'link' | 'file' | 'cloud';

export interface AttachmentItem {
    type: AttachmentType;
    title: string;
    url?: string;
    file?: File;
    id?: string;
}

export interface AttachmentOption {
    type: AttachmentType;
    label: string;
}

interface DrawerAttachmentsProps {
    label?: string;
    attachments: AttachmentItem[];
    onAttachmentsChange: (attachments: AttachmentItem[]) => void;
    options?: AttachmentOption[];
    disabled?: boolean;
    containerClassName?: string;
}

const ATTACHMENT_ICONS: Record<string, React.ReactNode> = {
    cloud: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14.419 5.47391C13.6342 3.34705 11.947 2 9.39853 2C6.15583 2 3.88701 4.45874 3.69203 7.66656C2.12862 8.17716 1 9.80578 1 11.6505C1 13.9087 2.73841 15.8163 4.79561 15.8163H6.42146C6.73211 15.8163 6.98423 15.5588 6.98423 15.2416C6.98423 14.9241 6.73211 14.6669 6.42146 14.6669H4.79561C3.34815 14.6669 2.1078 13.2857 2.1078 11.6505C2.1078 10.2055 3.09997 8.90182 4.34454 8.68344L4.85526 8.59351L4.80996 8.06682L4.80574 8.06021C4.80574 5.26098 6.6097 3.14963 9.39853 3.14963C11.6339 3.14963 12.8897 4.27427 13.4705 6.19252L13.5909 6.58819L13.9964 6.59709C16.0871 6.64192 17.92 8.374 17.92 10.5259C17.92 12.4843 16.649 14.667 14.7246 14.667H13.4387C13.128 14.667 12.8759 14.9244 12.8759 15.2416C12.8759 15.5591 13.128 15.8163 13.4387 15.8163L14.7204 15.8146C17.5343 15.7387 19 12.9938 19 10.5259C19 7.87321 16.9642 5.75353 14.419 5.47395L14.419 5.47391ZM10.4262 10.0529C10.4231 10.0494 10.4219 10.0465 10.4199 10.0437L10.2776 9.89166C10.1996 9.80747 10.0958 9.7658 9.99195 9.76638C9.8881 9.76552 9.78484 9.80747 9.70549 9.89164L9.56312 10.0436C9.56031 10.0465 9.55973 10.05 9.55721 10.0529L7.52588 12.3469C7.36859 12.5147 7.36859 12.7863 7.52588 12.9547L7.6677 13.0529C7.82501 13.2207 8.07993 13.1664 8.23695 12.9986L9.43483 11.6349V17.4253C9.43483 17.7425 9.68695 18 9.9976 18C10.3083 18 10.5604 17.7425 10.5604 17.4253V11.6404L11.7979 13.0345C11.9552 13.2023 12.2096 13.2566 12.3666 13.0888L12.5084 12.9906C12.6657 12.8222 12.6657 12.5506 12.5084 12.3828L10.4262 10.0529Z" fill="white" />
        </svg>
    ),
    file: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 11V14H2V11H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V11H14ZM3 5L4.41 6.41L7 3.83V12H9V3.83L11.59 6.41L13 5L8 0L3 5Z" fill="white" />
        </svg>
    ),
    link: (
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
            <path d="M5.14286 0C5.90062 0 6.62734 0.351189 7.16316 0.976311C7.69898 1.60143 8 2.44928 8 3.33333V11.3333C8 11.9462 7.89654 12.553 7.69552 13.1192C7.4945 13.6854 7.19986 14.1998 6.82843 14.6332C6.45699 15.0665 6.01604 15.4102 5.53073 15.6448C5.04543 15.8793 4.52529 16 4 16C3.47471 16 2.95457 15.8793 2.46927 15.6448C1.98396 15.4102 1.54301 15.0665 1.17157 14.6332C0.800139 14.1998 0.505501 13.6854 0.304482 13.1192C0.103463 12.553 -7.82739e-09 11.9462 0 11.3333V6H1.14286V11.3333C1.14286 12.2174 1.44388 13.0652 1.97969 13.6904C2.51551 14.3155 3.24224 14.6667 4 14.6667C4.75776 14.6667 5.48449 14.3155 6.02031 13.6904C6.55612 13.0652 6.85714 12.2174 6.85714 11.3333V3.33333C6.85714 3.07069 6.8128 2.81062 6.72665 2.56797C6.6405 2.32532 6.51423 2.10484 6.35504 1.91912C6.19585 1.7334 6.00687 1.58608 5.79889 1.48557C5.5909 1.38506 5.36798 1.33333 5.14286 1.33333C4.91773 1.33333 4.69482 1.38506 4.48683 1.48557C4.27884 1.58608 4.08986 1.7334 3.93067 1.91912C3.77149 2.10484 3.64521 2.32532 3.55906 2.56797C3.47291 2.81062 3.42857 3.07069 3.42857 3.33333V11.3333C3.42857 11.5101 3.48878 11.6797 3.59594 11.8047C3.7031 11.9298 3.84845 12 4 12C4.15155 12 4.2969 11.9298 4.40406 11.8047C4.51122 11.6797 4.57143 11.5101 4.57143 11.3333V4H5.71429V11.3333C5.71429 11.8638 5.53367 12.3725 5.21218 12.7475C4.89069 13.1226 4.45466 13.3333 4 13.3333C3.54534 13.3333 3.10931 13.1226 2.78782 12.7475C2.46633 12.3725 2.28571 11.8638 2.28571 11.3333V3.33333C2.28571 2.44928 2.58673 1.60143 3.12255 0.976311C3.65837 0.351189 4.3851 0 5.14286 0Z" fill="white" />
        </svg>
    ),
};

const DrawerAttachments: React.FC<DrawerAttachmentsProps> = ({
    label = "Attachments",
    attachments,
    onAttachmentsChange,
    options = [
        { type: 'cloud', label: 'Attach from Cloud' },
        { type: 'file', label: 'Upload File' },
        { type: 'link', label: 'Add Link' }
    ],
    disabled,
    containerClassName,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const [addLinkOpen, setAddLinkOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const portalMenu = document.getElementById('drawer-attachment-menu');
            if (portalMenu && portalMenu.contains(event.target as Node)) {
                return;
            }
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const handleScroll = () => {
            setMenuOpen(false);
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [menuOpen]);

    const handleOptionClick = (type: AttachmentType) => {
        setMenuOpen(false);
        if (type === 'link') {
            setAddLinkOpen(true);
        } else if (type === 'file') {
            fileInputRef.current?.click();
        } else if (type === 'cloud') {
            console.log('Cloud attachment not implemented yet');
        }
    };

    const handleAddLink = (displayText: string, url: string) => {
        const newAttachment: AttachmentItem = {
            type: 'link',
            title: displayText,
            url: url,
            id: Date.now().toString()
        };
        onAttachmentsChange([...attachments, newAttachment]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newAttachment: AttachmentItem = {
                type: 'file',
                title: file.name,
                file: file,
                id: Date.now().toString()
            };
            onAttachmentsChange([...attachments, newAttachment]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemove = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        onAttachmentsChange(newAttachments);
    };

    const getIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t === 'link' || t === 'url') return ATTACHMENT_ICONS.link;
        if (t === 'cloud') return ATTACHMENT_ICONS.cloud;
        if (t === 'file' || t === 'upload') return ATTACHMENT_ICONS.file;
        return <Paperclip className="w-4 h-4" />;
    };

    return (
        <div className={cn("flex items-start justify-between mb-6", containerClassName)}>
            <label className="text-[15px] font-semibold text-black mt-2.5 block">
                {label}
            </label>
            <div className="w-[419px]">
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            if (!disabled) {
                                if (!menuOpen && menuRef.current) {
                                    const rect = menuRef.current.getBoundingClientRect();
                                    setMenuPosition({
                                        top: rect.bottom + 2,
                                        left: rect.left,
                                        width: rect.width
                                    });
                                }
                                setMenuOpen(!menuOpen);
                            }
                        }}
                        disabled={disabled}
                        className={cn(
                            "w-full inline-flex items-center justify-between rounded-[5px] border border-[#E6E6E6] px-4 py-2.5 text-sm font-medium text-[#475467] transition",
                            disabled ? "bg-gray-100 cursor-not-allowed" : "hover:bg-[#F3F4F6] cursor-pointer"
                        )}
                    >
                        <span className="inline-flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            Add Attachment(s)
                        </span>
                    </button>

                    {menuOpen && menuPosition && createPortal(
                        <div
                            id="drawer-attachment-menu"
                            style={{
                                position: 'fixed',
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                                width: '200px',
                            }}
                            className="rounded-[10px] bg-[#232725] p-2.5 shadow-lg z-[100] overflow-hidden"
                        >
                            {options.map((option) => (
                                <button
                                    key={option.type}
                                    type="button"
                                    onClick={() => handleOptionClick(option.type)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-white rounded-[5px] hover:bg-[#42484B] transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-center w-5">
                                        {getIcon(option.type)}
                                    </div>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>,
                        document.body
                    )}
                </div>

                {attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {attachments.map((attachment, index) => (
                            <div key={attachment.id || index} className="flex items-center gap-2 px-4 py-1.5 border border-[#E6E6E6] rounded-[5px] text-black">
                                <div className="flex items-center justify-center w-5">
                                    {attachment.type === 'link' ? <Link2 className="w-4 h-4" /> : <Paperclip className="w-4 h-4 text-[#475467]" />}
                                </div>
                                <span className="text-sm text-[#111827] flex-1 truncate">{attachment.title}</span>
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(index)}
                                        className="flex items-center gap-1 text-[#D93025] hover:text-[#C62828] cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                <AddLinkModal
                    isOpen={addLinkOpen}
                    onClose={() => setAddLinkOpen(false)}
                    onInsert={handleAddLink}
                />
            </div>
        </div>
    );
};

export default DrawerAttachments;
