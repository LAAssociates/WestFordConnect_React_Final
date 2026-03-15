import { Star, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';

interface NoteMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onPinClick?: () => Promise<void> | void;
  onReminderClick?: () => Promise<void> | void;
  onFavoriteClick?: () => Promise<void> | void;
  onDeleteClick?: () => Promise<void> | void;
  reminderButtonRef?: React.RefObject<HTMLButtonElement | null>;
  isPinned?: boolean;
  isFavorite?: boolean;
}

const NoteMenuDropdown: React.FC<NoteMenuDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onPinClick,
  onReminderClick,
  onFavoriteClick,
  onDeleteClick,
  reminderButtonRef,
  isPinned,
  isFavorite,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [loadingAction, setLoadingAction] = useState<'pin' | 'favorite' | 'delete' | 'reminder' | null>(null);

  const isLoading = loadingAction !== null;

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    // Calculate width: 4 icons (24px each) + 3 gaps (10px each) + padding (5px * 2) = 96 + 30 + 10 = 136px
    const dropdownWidth = 136;
    // Calculate height: icon (24px) + padding (5px * 2) = 34px
    const dropdownHeight = 34;
    const gap = 4; // Small gap between trigger and dropdown
    const padding = 10;

    // Always position to the left of the trigger button
    let menuLeft = rect.left - dropdownWidth - gap;

    // If it would overflow to the left, align the left edge of dropdown with viewport edge
    if (menuLeft < padding) {
      menuLeft = padding;
      // Ensure it doesn't overlap with the trigger button
      if (menuLeft + dropdownWidth > rect.left) {
        menuLeft = rect.left - dropdownWidth - gap; // Keep it to the left, even if it slightly overflows
      }
    }

    // Center vertically with the trigger button
    const menuTop = rect.top + rect.height / 2 - dropdownHeight / 2;

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

    const handleClickOutside = (event: MouseEvent) => {
      if (
        !loadingAction &&
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

  if (!isOpen || !menuPosition) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="bg-[#232725] box-border content-stretch flex gap-[10px] items-center p-[5px] rounded-[5px] z-50"
      style={{
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      {/* Pin Icon */}
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          if (onPinClick) {
            setLoadingAction('pin');
            try {
              await onPinClick();
            } finally {
              setLoadingAction(null);
            }
          }
          onClose();
        }}
        className={cn(
          "overflow-clip relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center cursor-pointer transition-colors",
          isPinned ? "bg-[#3A3D3F]" : "hover:bg-[#3A3D3F]",
          isLoading && "cursor-not-allowed opacity-50"
        )}
        aria-label={isPinned ? "Unpin note" : "Pin note"}
      >
        {loadingAction === 'pin' ? (
          <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M14 4.85427C13.8452 5.00905 13.6951 5.14975 13.5497 5.27638C13.4044 5.40302 13.2519 5.51323 13.0925 5.60704C12.933 5.70084 12.7618 5.76884 12.5789 5.81106C12.396 5.85327 12.1849 5.87906 11.9457 5.88844C11.7863 5.88844 11.6338 5.87437 11.4884 5.84623L8.82211 8.51256C8.88308 8.69079 8.92764 8.8737 8.95578 9.06131C8.98392 9.24891 8.99799 9.43652 8.99799 9.62412C8.99799 9.92898 8.9675 10.2057 8.90653 10.4543C8.84556 10.7028 8.75879 10.9374 8.64623 11.1578C8.53367 11.3782 8.39296 11.5869 8.22412 11.7839C8.05528 11.9809 7.87002 12.1849 7.66834 12.396L4.95276 9.6804L0.956784 13.6834L0 14L0.316583 13.0432L4.3196 9.04724L1.60402 6.33166L1.9206 6.01508C2.24891 5.68677 2.62412 5.43585 3.04623 5.26231C3.46834 5.08878 3.9139 5.00201 4.38291 5.00201C4.7675 5.00201 5.13568 5.06064 5.48744 5.17789L8.15377 2.51156C8.12563 2.36616 8.11156 2.21374 8.11156 2.05427C8.11156 1.82446 8.13501 1.61809 8.18191 1.43518C8.22881 1.25226 8.29916 1.07873 8.39296 0.914573C8.48677 0.750419 8.59464 0.59799 8.71658 0.457286C8.83853 0.316583 8.98157 0.164154 9.14573 0L14 4.85427Z" fill={isPinned ? "gray" : "white"} />
          </svg>
        )}
      </button>

      {/* Reminder Icon */}
      <button
        ref={reminderButtonRef}
        type="button"
        disabled={isLoading}
        onClick={async (e) => {
          e.stopPropagation();
          if (onReminderClick) {
            setLoadingAction('reminder');
            try {
              await onReminderClick();
            } finally {
              setLoadingAction(null);
            }
          }
          // Delay closing to ensure ref is captured
          setTimeout(() => {
            onClose();
          }, 0);
        }}
        className={cn(
          "overflow-clip relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center cursor-pointer hover:bg-[#3A3D3F] transition-colors",
          isLoading && "cursor-not-allowed opacity-50"
        )}
        aria-label="Set reminder"
      >
        {loadingAction === 'reminder' ? (
          <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M16.7633 13.5679L15.5258 12.9491V11.4754C15.5243 10.5989 15.213 9.75106 14.6469 9.08187C14.0807 8.41269 13.2962 7.96523 12.432 7.81858V6.52539H11.1945V7.81858C10.3303 7.96523 9.54584 8.41269 8.9797 9.08187C8.41355 9.75106 8.10224 10.5989 8.10078 11.4754V12.9491L6.86328 13.5679V16.4254H10.5758V17.6629H13.0508V16.4254H16.7633V13.5679ZM15.5258 15.1879H8.10078V14.3329L9.33828 13.7142V11.4754C9.33828 10.819 9.59904 10.1895 10.0632 9.7253C10.5273 9.26115 11.1569 9.00039 11.8133 9.00039C12.4697 9.00039 13.0992 9.26115 13.5634 9.7253C14.0275 10.1895 14.2883 10.819 14.2883 11.4754V13.7142L15.5258 14.3329V15.1879Z" fill="#DE4A2C" />
            <path d="M15.5258 2.81289C15.5258 2.48469 15.3954 2.16992 15.1633 1.93785C14.9312 1.70577 14.6165 1.57539 14.2883 1.57539H11.8133V0.337891H10.5758V1.57539H5.62578V0.337891H4.38828V1.57539H1.91328C1.58508 1.57539 1.27031 1.70577 1.03824 1.93785C0.80616 2.16992 0.675781 2.48469 0.675781 2.81289V15.1879C0.675781 15.5161 0.80616 15.8309 1.03824 16.0629C1.27031 16.295 1.58508 16.4254 1.91328 16.4254H4.38828V15.1879H1.91328V2.81289H4.38828V4.05039H5.62578V2.81289H10.5758V4.05039H11.8133V2.81289H14.2883V6.52539H15.5258V2.81289Z" fill="white" />
          </svg>
        )}
      </button>

      {/* Favorite Icon */}
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          if (onFavoriteClick) {
            setLoadingAction('favorite');
            try {
              await onFavoriteClick();
            } finally {
              setLoadingAction(null);
            }
          }
          onClose();
        }}
        className={cn(
          "overflow-clip relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center cursor-pointer transition-colors",
          isFavorite ? "bg-[#3A3D3F]" : "hover:bg-[#3A3D3F]",
          isLoading && "cursor-not-allowed opacity-50"
        )}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {loadingAction === 'favorite' ? (
          <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
        ) : (
          <Star
            className={cn(
              'w-[14px] h-[14px] text-[#FFB74D] transition-colors',
              isFavorite ? 'fill-[#FFB74D]' : 'hover:fill-[#FFB74D]'
            )}
          />
        )}
      </button>

      {/* Delete Icon */}
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          if (onDeleteClick) {
            setLoadingAction('delete');
            try {
              await onDeleteClick();
            } finally {
              setLoadingAction(null);
            }
          }
          onClose();
        }}
        className={cn(
          "cursor-pointer relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center hover:bg-[#3A3D3F] transition-colors",
          isLoading && "cursor-not-allowed opacity-50"
        )}
        aria-label="Delete note"
      >
        {loadingAction === 'delete' ? (
          <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4.22917 1.26H4.08333C4.16354 1.26 4.22917 1.197 4.22917 1.12V1.26ZM4.22917 1.26H9.77083V1.12C9.77083 1.197 9.83646 1.26 9.91667 1.26H9.77083V2.52H11.0833V1.12C11.0833 0.50225 10.5602 0 9.91667 0H4.08333C3.43984 0 2.91667 0.50225 2.91667 1.12V2.52H4.22917V1.26ZM13.4167 2.52H0.583333C0.260677 2.52 0 2.77025 0 3.08V3.64C0 3.717 0.065625 3.78 0.145833 3.78H1.24687L1.69714 12.9325C1.7263 13.5293 2.24036 14 2.86198 14H11.138C11.7615 14 12.2737 13.531 12.3029 12.9325L12.7531 3.78H13.8542C13.9344 3.78 14 3.717 14 3.64V3.08C14 2.77025 13.7393 2.52 13.4167 2.52ZM10.9977 12.74H3.00234L2.5612 3.78H11.4388L10.9977 12.74Z" fill="white" />
          </svg>
        )}
      </button>
    </div>,
    document.body
  );
};

export default NoteMenuDropdown;
