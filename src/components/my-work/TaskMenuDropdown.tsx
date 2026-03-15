import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface TaskMenuDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onEdit?: () => void;
    onDelete?: () => void;
}

const TaskMenuDropdown: React.FC<TaskMenuDropdownProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onEdit,
    onDelete,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const OFFSET_PX = 8;

        setMenuPosition({
            top: rect.bottom + OFFSET_PX,
            right: window.innerWidth - rect.right,
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
        { id: 'edit', label: 'Edit', icon: Edit, onClick: onEdit },
        { id: 'delete', label: 'Delete', icon: Trash2, onClick: onDelete, className: 'text-[#D93025]' },
    ];

    return createPortal(
        <div
            ref={menuRef}
            className="bg-[#232725] rounded-[10px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.25)] z-50 overflow-hidden"
            style={{
                position: 'fixed',
                top: menuPosition.top,
                right: menuPosition.right,
                width: '180px',
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
                                onClose();
                            }}
                            className={cn(
                                'cursor-pointer flex items-center gap-2 h-[40px] pl-2.5 pr-2.5 rounded-[5px] text-sm font-medium text-white transition-colors hover:bg-[#2F3432] w-full',
                                item.className
                            )}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span className="whitespace-nowrap">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>,
        document.body
    );
};

export default TaskMenuDropdown;

