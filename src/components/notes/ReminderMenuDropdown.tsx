import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Star } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { Reminder } from './reminderTypes';

interface ReminderMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  reminder: Reminder;
  currentUserId: string;
  onReschedule?: () => Promise<void> | void;
  onReminderToggle?: () => Promise<void> | void;
  onFavoriteClick?: () => Promise<void> | void;
  onDeleteClick?: () => Promise<void> | void;
}

const ReminderMenuDropdown: React.FC<ReminderMenuDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  reminder,
  currentUserId,
  onReschedule,
  onReminderToggle,
  onFavoriteClick,
  onDeleteClick,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [loadingAction, setLoadingAction] = useState<'reschedule' | 'favorite' | 'delete' | null>(null);

  const isLoading = loadingAction !== null;

  // Determine if reminder belongs to current user
  const isOwn = reminder.author.id === currentUserId;
  const isOverdue = reminder.status === 'missed';
  const isShared = !isOwn; // Shared reminder = reminder from another user

  // Determine which actions to show based on the 3 types:
  // 1. Shared (other user's reminder): Reminder + Favourite
  // 2. Own Overdue: Reschedule + Favourite + Delete
  // 3. Own Upcoming: Reminder + Favourite + Delete
  const showReschedule = isOwn && isOverdue;
  const showReminderToggle = isShared || (isOwn && !isOverdue);
  const showFavorite = true;
  const showDelete = isOwn;

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;

    // Calculate actual width based on number of visible icons
    const iconCount = [showReschedule, showReminderToggle, showFavorite, showDelete].filter(Boolean).length;
    const iconWidth = 24;
    const iconGap = 10;
    const horizontalPadding = 5 * 2; // 5px on each side
    const dropdownWidth = iconCount * iconWidth + (iconCount - 1) * iconGap + horizontalPadding;

    const rect = triggerRef.current.getBoundingClientRect();
    // Calculate height: icon (24px) + padding (5px * 2) = 34px
    const dropdownHeight = 34;
    const gap = 0; // Small gap between trigger and dropdown
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
  }, [triggerRef, showReschedule, showReminderToggle, showFavorite, showDelete]);

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
  }, [isOpen, updateMenuPosition, reminder]);

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
  }, [isOpen, onClose, triggerRef, loadingAction]);

  return (
    <>
      {/* Dropdown Menu */}
      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="bg-[#232725] box-border content-stretch flex gap-[10px] items-center p-[5px] rounded-[5px] z-50"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {/* Reschedule Icon (Own Overdue only) */}
          {showReschedule && (
            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                if (onReschedule) {
                  setLoadingAction('reschedule');
                  try {
                    await onReschedule();
                  } finally {
                    setLoadingAction(null);
                  }
                }
                onClose();
              }}
              className={cn(
                "overflow-clip relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center cursor-pointer hover:bg-[#3A3D3F] transition-colors",
                isLoading && "cursor-not-allowed opacity-50"
              )}
              aria-label="Reschedule reminder"
            >
              {loadingAction === 'reschedule' ? (
                <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <g clip-path="url(#clip0_4279_4199)">
                    <g filter="url(#filter0_d_4279_4199)">
                      <path d="M3.5 8.5V6.33333C3.5 5.7587 3.7173 5.2076 4.10409 4.80127C4.49089 4.39494 5.01549 4.16667 5.5625 4.16667H14.5M14.5 4.16667L12.4375 2M14.5 4.16667L12.4375 6.33333M14.5 8.5V10.6667C14.5 11.2413 14.2827 11.7924 13.8959 12.1987C13.5091 12.6051 12.9845 12.8333 12.4375 12.8333H3.5M3.5 12.8333L5.5625 15M3.5 12.8333L5.5625 10.6667" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" shape-rendering="crispEdges" />
                    </g>
                  </g>
                  <defs>
                    <filter id="filter0_d_4279_4199" x="-1.25" y="1.25" width="20.5" height="22.5" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                      <feFlood flood-opacity="0" result="BackgroundImageFix" />
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                      <feOffset dy="4" />
                      <feGaussianBlur stdDeviation="2" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4279_4199" />
                      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4279_4199" result="shape" />
                    </filter>
                    <clipPath id="clip0_4279_4199">
                      <rect width="18" height="18" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              )}
            </button>
          )}

          {/* Reminder Toggle Icon (Shared or Own Upcoming) */}
          {showReminderToggle && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (onReminderToggle) {
                  onReminderToggle();
                }
                onClose();
              }}
              className={cn(
                "overflow-clip relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center cursor-pointer hover:bg-[#3A3D3F] transition-colors",
                isLoading && "cursor-not-allowed opacity-50"
              )}
              aria-label="Toggle reminder"
            >
              <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16.7633 13.5679L15.5258 12.9491V11.4754C15.5243 10.5989 15.213 9.75106 14.6469 9.08187C14.0807 8.41269 13.2962 7.96523 12.432 7.81858V6.52539H11.1945V7.81858C10.3303 7.96523 9.54584 8.41269 8.9797 9.08187C8.41355 9.75106 8.10224 10.5989 8.10078 11.4754V12.9491L6.86328 13.5679V16.4254H10.5758V17.6629H13.0508V16.4254H16.7633V13.5679ZM15.5258 15.1879H8.10078V14.3329L9.33828 13.7142V11.4754C9.33828 10.819 9.59904 10.1895 10.0632 9.7253C10.5273 9.26115 11.1569 9.00039 11.8133 9.00039C12.4697 9.00039 13.0992 9.26115 13.5634 9.7253C14.0275 10.1895 14.2883 10.819 14.2883 11.4754V13.7142L15.5258 14.3329V15.1879Z" fill="#DE4A2C" />
                  <path d="M15.5258 2.81289C15.5258 2.48469 15.3954 2.16992 15.1633 1.93785C14.9312 1.70577 14.6165 1.57539 14.2883 1.57539H11.8133V0.337891H10.5758V1.57539H5.62578V0.337891H4.38828V1.57539H1.91328C1.58508 1.57539 1.27031 1.70577 1.03824 1.93785C0.80616 2.16992 0.675781 2.48469 0.675781 2.81289V15.1879C0.675781 15.5161 0.80616 15.8309 1.03824 16.0629C1.27031 16.295 1.58508 16.4254 1.91328 16.4254H4.38828V15.1879H1.91328V2.81289H4.38828V4.05039H5.62578V2.81289H10.5758V4.05039H11.8133V2.81289H14.2883V6.52539H15.5258V2.81289Z" fill="white" />
                </svg>
              </div>
            </button>
          )}

          {/* Favorite Icon */}
          {showFavorite && (
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
                'overflow-clip relative rounded-[3px] shrink-0 size-[24px] flex items-center justify-center cursor-pointer hover:bg-[#3A3D3F] transition-colors',
                reminder.favorited && 'bg-[#42484b]',
                isLoading && "cursor-not-allowed opacity-50"
              )}
              aria-label={reminder.favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {loadingAction === 'favorite' ? (
                <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
              ) : (
                <Star
                  className={cn(
                    'w-[14px] h-[14px] hover:fill-[#FFB74D] hover:text-[#FFB74D]',
                    reminder.favorited ? 'fill-[#FFB74D] text-[#FFB74D]' : 'text-[#FFB74D]'
                  )}
                />
              )}
            </button>
          )}

          {/* Delete Icon (Own only) */}
          {showDelete && (
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
              aria-label="Delete reminder"
            >
              {loadingAction === 'delete' ? (
                <Loader2 className="w-[14px] h-[14px] text-white animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4.22917 1.26H4.08333C4.16354 1.26 4.22917 1.197 4.22917 1.12V1.26ZM4.22917 1.26H9.77083V1.12C9.77083 1.197 9.83646 1.26 9.91667 1.26H9.77083V2.52H11.0833V1.12C11.0833 0.50225 10.5602 0 9.91667 0H4.08333C3.43984 0 2.91667 0.50225 2.91667 1.12V2.52H4.22917V1.26ZM13.4167 2.52H0.583333C0.260677 2.52 0 2.77025 0 3.08V3.64C0 3.717 0.065625 3.78 0.145833 3.78H1.24687L1.69714 12.9325C1.7263 13.5293 2.24036 14 2.86198 14H11.138C11.7615 14 12.2737 13.531 12.3029 12.9325L12.7531 3.78H13.8542C13.9344 3.78 14 3.717 14 3.64V3.08C14 2.77025 13.7393 2.52 13.4167 2.52ZM10.9977 12.74H3.00234L2.5612 3.78H11.4388L10.9977 12.74Z" fill="white" />
                </svg>
              )}
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default ReminderMenuDropdown;

