import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface SortOption {
    value: string;
    label: string;
}

interface SortPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    selectedSort: string;
    onSortChange: (sort: string) => void;
    sortOptions: SortOption[];
}

const SortPopover: React.FC<SortPopoverProps> = ({
    isOpen,
    onClose,
    triggerRef,
    selectedSort,
    onSortChange,
    sortOptions,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownWidth = 218;
        const triggerCenter = rect.left + rect.width / 2;
        let menuLeft = triggerCenter - dropdownWidth / 2;

        const padding = 10;
        const maxLeft = window.innerWidth - dropdownWidth - padding;
        const minLeft = padding;

        if (menuLeft < minLeft) {
            menuLeft = minLeft;
        } else if (menuLeft > maxLeft) {
            menuLeft = maxLeft;
        }

        setMenuPosition({
            top: rect.bottom + 8,
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

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, triggerRef]);

    const handleSortSelect = (sort: string) => {
        onSortChange(sort);
        onClose();
    };

    if (!isOpen || !menuPosition) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Popover */}
            <div
                ref={menuRef}
                className="w-[218px] rounded-2xl border border-[#E4E7EC] bg-[#232725] shadow-lg z-50"
                style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    left: menuPosition.left,
                }}
            >
                <div className="p-[15px] pb-2.5 flex items-center justify-between">
                    <span className="text-base font-semibold text-white">Sort By</span>
                </div>
                <hr className="border-white" />
                <div className="p-2.5">
                    {sortOptions.map((option) => {
                        const isActive = String(selectedSort) === String(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSortSelect(option.value)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 p-2 text-sm text-left text-white hover:bg-[#3A3D3F] rounded-[5px] cursor-pointer'
                                )}
                            >
                                {isActive ? (
                                    <Check className="w-5 h-5 rounded-full bg-[#0198F1] border text-white" />
                                ) : (
                                    <span className="w-5 h-5 rounded-full bg-[#D9D9D9] border" />
                                )}
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>,
        document.body
    );
};

export default SortPopover;





