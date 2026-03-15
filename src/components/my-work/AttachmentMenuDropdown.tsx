import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface AttachmentMenuDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onOpen?: () => void;
    onDownload?: () => void;
    onDelete?: () => void;
}

const AttachmentMenuDropdown: React.FC<AttachmentMenuDropdownProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onOpen,
    onDownload,
    onDelete,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownWidth = 102; // 3 icons (24px each) + 2 gaps (10px each) + padding (5px * 2) = 72 + 20 + 10 = 102px
        const OFFSET_PX = 8;
        const padding = 10;

        // Position to the left of the button
        let menuLeft = rect.left - dropdownWidth - OFFSET_PX;

        // Ensure menu stays within viewport bounds
        const minLeft = padding;
        if (menuLeft < minLeft) {
            menuLeft = minLeft;
        }

        // Center vertically with the button
        const menuTop = rect.top + rect.height / 2 - 12; // 12px is half of icon height (24px)

        setMenuPosition({
            top: menuTop,
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

    if (!isOpen || !menuPosition) return null;

    const menuItems = [
        {
            id: 'open',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.25 0.75H2.25C1.85218 0.75 1.47064 0.908035 1.18934 1.18934C0.908035 1.47064 0.75 1.85218 0.75 2.25V11.25C0.75 11.6478 0.908035 12.0294 1.18934 12.3107C1.47064 12.592 1.85218 12.75 2.25 12.75H11.25C11.6478 12.75 12.0294 12.592 12.3107 12.3107C12.592 12.0294 12.75 11.6478 12.75 11.25V8.25M6.75 6.75L12.75 0.75M12.75 0.75V4.5M12.75 0.75H9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>,
            onClick: onOpen
        },
        {
            id: 'download',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M6.99999 10.1281C6.88333 10.1281 6.77395 10.11 6.67187 10.0739C6.56979 10.0377 6.47499 9.97558 6.3875 9.8875L3.2375 6.7375C3.0625 6.5625 2.9785 6.35833 2.9855 6.125C2.9925 5.89167 3.0765 5.6875 3.2375 5.5125C3.4125 5.3375 3.62046 5.2465 3.86137 5.2395C4.10229 5.2325 4.30995 5.31621 4.48437 5.49063L6.125 7.13125V0.875003C6.125 0.627086 6.20899 0.41942 6.377 0.252003C6.54499 0.0845864 6.75266 0.00058635 6.99999 3.01724e-06C7.24733 -0.000580316 7.45529 0.0834198 7.62387 0.252003C7.79245 0.420586 7.87616 0.628253 7.87499 0.875003V7.13125L9.51562 5.49063C9.69062 5.31563 9.89858 5.23163 10.1395 5.23863C10.3804 5.24563 10.5881 5.33692 10.7625 5.5125C10.9229 5.6875 11.0069 5.89167 11.0145 6.125C11.0221 6.35833 10.9381 6.5625 10.7625 6.7375L7.61249 9.8875C7.52499 9.975 7.4302 10.0371 7.32812 10.0739C7.22604 10.1106 7.11666 10.1287 6.99999 10.1281ZM1.75 14C1.26875 14 0.856916 13.8288 0.514499 13.4864C0.172083 13.144 0.000583333 12.7318 0 12.25V10.5C0 10.2521 0.084 10.0444 0.252 9.877C0.42 9.70958 0.627666 9.62558 0.874999 9.625C1.12233 9.62442 1.33029 9.70842 1.49887 9.877C1.66746 10.0456 1.75117 10.2533 1.75 10.5V12.25H12.25V10.5C12.25 10.2521 12.334 10.0444 12.502 9.877C12.67 9.70958 12.8777 9.62558 13.125 9.625C13.3723 9.62442 13.5803 9.70842 13.7489 9.877C13.9174 10.0456 14.0012 10.2533 14 10.5V12.25C14 12.7312 13.8288 13.1434 13.4864 13.4864C13.1439 13.8294 12.7318 14.0006 12.25 14H1.75Z" fill="white" />
            </svg>,
            onClick: onDownload
        },
        {
            id: 'delete',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4.22917 1.26H4.08333C4.16354 1.26 4.22917 1.197 4.22917 1.12V1.26ZM4.22917 1.26H9.77083V1.12C9.77083 1.197 9.83646 1.26 9.91667 1.26H9.77083V2.52H11.0833V1.12C11.0833 0.50225 10.5602 0 9.91667 0H4.08333C3.43984 0 2.91667 0.50225 2.91667 1.12V2.52H4.22917V1.26ZM13.4167 2.52H0.583333C0.260677 2.52 0 2.77025 0 3.08V3.64C0 3.717 0.065625 3.78 0.145833 3.78H1.24687L1.69714 12.9325C1.7263 13.5293 2.24036 14 2.86198 14H11.138C11.7615 14 12.2737 13.531 12.3029 12.9325L12.7531 3.78H13.8542C13.9344 3.78 14 3.717 14 3.64V3.08C14 2.77025 13.7393 2.52 13.4167 2.52ZM10.9977 12.74H3.00234L2.5612 3.78H11.4388L10.9977 12.74Z" fill="white" />
            </svg>,
            onClick: onDelete
        },
    ];

    return createPortal(
        <div
            ref={menuRef}
            className="bg-[#232725] rounded-[5px] shadow-lg z-50 overflow-hidden"
            style={{
                position: 'fixed',
                top: menuPosition.top,
                left: menuPosition.left,
            }}
        >
            <div className="p-[5px] flex items-center gap-[10px]">
                {menuItems.map((item) => {
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                item.onClick?.();
                                onClose();
                            }}
                            className="cursor-pointer w-6 h-6 flex items-center justify-center rounded-[3px] hover:bg-[#2F3432] transition-colors shrink-0"
                        >
                            {item.icon}
                        </button>
                    );
                })}
            </div>
        </div>,
        document.body
    );
};

export default AttachmentMenuDropdown;

