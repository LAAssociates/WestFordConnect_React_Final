import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, Upload, Link2 } from 'lucide-react';

interface AttachmentDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onAttachFromCloud?: () => void;
    onUploadFile?: (files: FileList) => void;
    onAddLink?: () => void;
}

const AttachmentDropdown: React.FC<AttachmentDropdownProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onAttachFromCloud,
    onUploadFile,
    onAddLink,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownWidth = 180;
        const OFFSET_PX = 8;
        const padding = 10;

        // Align the dropdown to the left of the button
        let menuLeft = rect.left;

        // Ensure menu stays within viewport bounds
        const maxLeft = window.innerWidth - dropdownWidth - padding;
        const minLeft = padding;

        if (menuLeft < minLeft) {
            menuLeft = minLeft;
        } else if (menuLeft > maxLeft) {
            menuLeft = maxLeft;
        }

        setMenuPosition({
            top: rect.bottom + OFFSET_PX,
            left: menuLeft,
        });
    }, [triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();

        const handleWindowChange = () => {
            updateMenuPosition();
        };

        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);

        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [isOpen, updateMenuPosition]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return;
            }

            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
        onClose();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && onUploadFile) {
            // Debug: show selected file names
            const names = Array.from(files).map((f) => f.name).join(', ');
            console.log('AttachmentDropdown: selected files', names);
            onUploadFile(files);
        }
            // Reset the input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
    };

    const menuItems = [
        {
            id: 'cloud',
            label: 'Attach from Cloud',
            icon: UploadCloud,
            onClick: onAttachFromCloud
        },
        {
            id: 'upload',
            label: 'Upload File',
            icon: Upload,
            onClick: handleUploadClick
        },
        {
            id: 'link',
            label: 'Add Link',
            icon: Link2,
            onClick: onAddLink
        },
    ];

    return createPortal(
        <>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                onClick={() => {
                    // Debug: file input was clicked
                    console.info('AttachmentDropdown: file input clicked');
                }}
                multiple
            />
            {isOpen && menuPosition && (
                <div
                    ref={menuRef}
                    className="bg-[#232725] rounded-[10px] shadow-lg z-50 overflow-hidden"
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                    }}
                >
                    <div className="p-2.5 flex flex-col">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        item.onClick?.();
                                        if (item.id !== 'upload') {
                                            onClose();
                                        }
                                    }}
                                    className="cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full"
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

export default AttachmentDropdown;
