import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils/cn';
import {
  DEFAULT_STATUS_ID,
  statusOptions,
  isValidStatusId,
  getStatusById
} from './statusOptions';
import type { StatusOption } from './statusOptions';

interface StatusDropdownProps {
  value?: StatusOption['id'];
  onChange?: (statusId: StatusOption['id']) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption['id']>(
    () => value && isValidStatusId(value) ? value : DEFAULT_STATUS_ID
  );

  useEffect(() => {
    if (value && isValidStatusId(value)) {
      setSelectedStatus(value);
    }
  }, [value]);

  const currentStatus = getStatusById(selectedStatus);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const OFFSET_PX = 13;

    setMenuPosition({
      top: rect.bottom + OFFSET_PX,
      left: rect.left,
      width: rect.width
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
      setMenuPosition(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(prev => {
      const next = !prev;

      if (next) {
        updateMenuPosition();
      } else {
        setMenuPosition(null);
      }

      return next;
    });
  };

  const handleStatusChange = (statusId: StatusOption['id']) => {
    setSelectedStatus(statusId);
    onChange?.(statusId);
    setIsOpen(false);
    setMenuPosition(null);
  };

  return (
    <div className="flex items-center gap-4 relative mr-[25px]">
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        className="cursor-pointer flex items-center px-[10px] py-[9px] bg-[#E6E6E6] rounded-full w-[169px]"
      >
        <div className="flex items-center flex-1 gap-2">
          {currentStatus.icon()}
          <span className="text-sm font-semibold">{currentStatus.label}</span>
        </div>
        <svg
          className={cn(
            'w-4 h-4 text-black transition-transform duration-200',
            isOpen ? 'rotate-180' : ''
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="bg-[#232725] rounded-[10px] overflow-hidden shadow-lg z-50"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width
            }}
          >
            <div className="divide-y-[1px] divide-[#E6E6E6]">
              {statusOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleStatusChange(option.id)}
                  className={cn(
                    'cursor-pointer w-full flex items-center gap-3 p-2.5 text-sm text-white hover:bg-[#2A2D30] transition-colors',
                    option.id === currentStatus.id ? 'bg-[#2A2D30]' : ''
                  )}
                >
                  {option.icon()}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};

export default StatusDropdown;