import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { TaskSortOption } from './types';

interface TaskSortProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    selectedSort: TaskSortOption;
    onSortChange: (sort: TaskSortOption) => void;
}

const TaskSort: React.FC<TaskSortProps> = ({
    isOpen,
    onClose,
    triggerRef,
    selectedSort,
    onSortChange,
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

    const sortOptions: Array<{ value: TaskSortOption; label: string }> = [
        { value: 'due-nearest-first', label: 'Due: Nearest first' },
        { value: 'due-latest-first', label: 'Due: Latest first' },
        { value: 'priority-high-to-low', label: 'Priority: High to Low' },
        { value: 'priority-low-to-high', label: 'Priority: Low to High' },
        { value: 'recently-updated', label: 'Recently Updated' },
    ];

    const handleSortSelect = (sort: TaskSortOption) => {
        onSortChange(sort);
        onClose();
    };

    if (!isOpen || !menuPosition) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="bg-[#232725] rounded-[10px] shadow-lg z-50 w-[218px]"
            style={{
                position: 'fixed',
                top: menuPosition.top,
                left: menuPosition.left,
            }}
        >
            <div className="px-[15px] pt-[15px] pb-2.5">
                <span className="text-[16px] font-semibold text-white">Sort By</span>
            </div>
            <div className="h-px bg-white w-full" />
            <div className="px-[15px] py-2.5 flex flex-col gap-2">
                {sortOptions.map((option) => {
                    const isActive = selectedSort === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSortSelect(option.value)}
                            className={cn(
                                'w-full flex items-center gap-[6px] text-left text-[14px] font-medium text-white hover:bg-[#2F3432] cursor-pointer py-1'
                            )}
                        >
                            {isActive ? (
                                <div className="w-[17px] h-[17px] rounded-full bg-[#0198F1] border border-white shrink-0 flex items-center justify-center">
                                    <Check className="w-[12px] h-[12px] stroke-3 text-white" />
                                </div>
                            ) : (
                                <div className="w-[17px] h-[17px] shrink-0 rounded-full bg-[#D9D9D9] border border-white" />
                            )}
                            <span>{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>,
        document.body
    );
};

export default TaskSort;

