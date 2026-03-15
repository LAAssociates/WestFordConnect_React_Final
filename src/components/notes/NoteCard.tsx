import React, { useState, useRef } from 'react';
import type { Note } from './types';
import { MoreVertical } from 'lucide-react';
import NoteMenuDropdown from './NoteMenuDropdown';
import { cn } from '../../lib/utils/cn';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import HighlightText from '../common/HighlightText';

interface NoteCardProps {
  note: Note;
  onPinToggle?: (noteId: string) => Promise<void> | void;
  onFavoriteToggle?: (noteId: string) => Promise<void> | void;
  onMenuClick?: (noteId: string) => void;
  onDelete?: (noteId: string) => Promise<void> | void;
  onReminder?: (noteId: string, reminderButtonRef: React.RefObject<HTMLButtonElement | null>) => Promise<void> | void;
  searchTerm?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPinToggle,
  onFavoriteToggle,
  onMenuClick,
  onDelete,
  onReminder,
  searchTerm,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reminderButtonRef = useRef<HTMLButtonElement>(null);

  const handleMenuClick = () => {
    setIsMenuOpen((prev) => !prev);
    onMenuClick?.(note.id);
  };

  const handlePinClick = async () => {
    return onPinToggle?.(note.id);
  };

  const handleFavoriteClick = async () => {
    return onFavoriteToggle?.(note.id);
  };

  const handleDeleteClick = async () => {
    return onDelete?.(note.id);
  };

  const handleReminderClick = async () => {
    return onReminder?.(note.id, reminderButtonRef);
  };

  return (
    <div className="bg-white border border-[#e6e6e6] border-solid rounded-[5px] p-[10px] relative shadow-[0_2px_4px_rgba(0,0,0,0.10)]">
      <div className="flex flex-col gap-[10px]">
        {/* Header with Author Info */}
        <div className="flex flex-col gap-[10px]">
          <div className="h-[48px] relative">
            <div className="absolute left-0 top-0 size-[48px]">
              <img
                src={note.author.avatar || avatarPlaceholder}
                alt={note.author.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
              />
            </div>
            <div className="absolute left-[58px] top-0">
              <p className="text-[16px] font-semibold text-black leading-normal">
                {note.author.name}
              </p>
            </div>
            <div className="absolute left-[58px] top-[27px] flex items-center gap-[5px]">
              <span className="text-[14px] font-normal text-[#535352]">
                {note.formattedDate} | {note.formattedTime}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[16px] font-semibold text-black leading-normal">
            <HighlightText text={note.title} highlight={searchTerm || ''} />
          </h3>

          {/* Content */}
          <p className="text-[14px] font-normal text-[#535352] leading-normal whitespace-pre-wrap line-clamp-3">
            <HighlightText text={note.content} highlight={searchTerm || ''} />
          </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-[10px] right-[10px] flex items-center gap-[10px]">
          {note.favorited && (
            <div
              className="size-[17px] flex items-center justify-center"
              aria-label="Favorited"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8.7364 0.478797L10.7634 4.77457L15.2959 5.46334C15.9695 5.5657 16.2385 6.4316 15.7512 6.92854L12.4714 10.2724L13.2456 14.9939C13.3606 15.6956 12.6565 16.2307 12.054 15.8994L8.00006 13.6702L3.94607 15.8994C3.34359 16.2307 2.6393 15.6956 2.75449 14.9939L3.52871 10.2724L0.248938 6.92854C-0.238528 6.4316 0.0304009 5.5657 0.70418 5.46334L5.23672 4.77457L7.26372 0.478797C7.56504 -0.159599 8.43508 -0.159599 8.7364 0.478797Z" fill="#FFB74D" />
              </svg>
            </div>
          )}
          {note.hasReminder && (
            <div className="size-[16px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M15.8305 12.8133L14.6617 12.229V10.8371C14.6603 10.0093 14.3663 9.20857 13.8316 8.57657C13.2969 7.94456 12.556 7.52195 11.7398 7.38345V6.16211H10.5711V7.38345C9.75492 7.52195 9.01399 7.94456 8.4793 8.57657C7.94461 9.20857 7.65059 10.0093 7.64922 10.8371V12.229L6.48047 12.8133V15.5121H9.98672V16.6809H12.3242V15.5121H15.8305V12.8133ZM14.6617 14.3434H7.64922V13.5359L8.81797 12.9515V10.8371C8.81797 10.2172 9.06424 9.62261 9.50261 9.18425C9.94097 8.74588 10.5355 8.49961 11.1555 8.49961C11.7754 8.49961 12.37 8.74588 12.8083 9.18425C13.2467 9.62261 13.493 10.2172 13.493 10.8371V12.9515L14.6617 13.5359V14.3434Z" fill="#DE4A2C" />
                <path d="M14.6617 2.65586C14.6617 2.34589 14.5386 2.04861 14.3194 1.82943C14.1002 1.61025 13.8029 1.48711 13.493 1.48711H11.1555V0.318359H9.98672V1.48711H5.31172V0.318359H4.14297V1.48711H1.80547C1.4955 1.48711 1.19822 1.61025 0.979038 1.82943C0.759855 2.04861 0.636719 2.34589 0.636719 2.65586V14.3434C0.636719 14.6533 0.759855 14.9506 0.979038 15.1698C1.19822 15.389 1.4955 15.5121 1.80547 15.5121H4.14297V14.3434H1.80547V2.65586H4.14297V3.82461H5.31172V2.65586H9.98672V3.82461H11.1555V2.65586H13.493V6.16211H14.6617V2.65586Z" fill="black" />
              </svg>
            </div>
          )}
          {note.pinned && (
            <div
              className={cn("w-[29px] h-[29px] flex items-center justify-center rounded-full bg-[#E6E6E6]")}
              aria-label="Pinned"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15.55 5.39171C15.3781 5.56362 15.2114 5.7199 15.0499 5.86055C14.8884 6.00121 14.7191 6.12363 14.542 6.22781C14.3649 6.332 14.1747 6.40754 13.9716 6.45442C13.7684 6.50131 13.534 6.52996 13.2683 6.54038C13.0912 6.54038 12.9219 6.52475 12.7604 6.49349L9.79884 9.45502C9.86657 9.65298 9.91606 9.85615 9.94731 10.0645C9.97857 10.2729 9.9942 10.4813 9.9942 10.6896C9.9942 11.0283 9.96033 11.3356 9.89261 11.6117C9.82489 11.8878 9.72852 12.1483 9.60349 12.3931C9.47847 12.638 9.32219 12.8698 9.13465 13.0886C8.94711 13.3074 8.74134 13.534 8.51734 13.7684L5.50111 10.7522L1.06271 15.1984L0 15.55L0.351633 14.4873L4.79784 10.0489L1.78161 7.03266L2.13324 6.68103C2.4979 6.31637 2.91465 6.03767 3.38349 5.84492C3.85234 5.65218 4.34723 5.5558 4.86817 5.5558C5.29533 5.5558 5.70427 5.62092 6.09497 5.75116L9.05651 2.78962C9.02525 2.62813 9.00962 2.45883 9.00962 2.28171C9.00962 2.02645 9.03567 1.79724 9.08776 1.59407C9.13986 1.3909 9.218 1.19816 9.32219 1.01583C9.42637 0.833501 9.54619 0.664196 9.68163 0.507915C9.81708 0.351633 9.97596 0.182328 10.1583 0L15.55 5.39171Z" fill="black" />
              </svg>
            </div>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={handleMenuClick}
            className="h-[29px] flex items-center justify-center cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Menu Dropdown */}
      <NoteMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        triggerRef={menuButtonRef}
        onPinClick={handlePinClick}
        onReminderClick={handleReminderClick}
        onFavoriteClick={handleFavoriteClick}
        onDeleteClick={handleDeleteClick}
        reminderButtonRef={reminderButtonRef}
        isPinned={note.pinned}
        isFavorite={note.favorited}
      />
    </div>
  );
};

export default NoteCard;
