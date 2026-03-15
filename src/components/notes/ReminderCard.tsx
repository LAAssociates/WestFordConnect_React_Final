import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils/cn';
import type { Reminder } from './reminderTypes';
import { MoreVertical } from 'lucide-react';
import ReminderMenuDropdown from './ReminderMenuDropdown';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import HighlightText from '../common/HighlightText';

interface ReminderCardProps {
  reminder: Reminder;
  currentUserId: string;
  onReschedule?: (reminderId: string) => Promise<void> | void;
  onReminderToggle?: (reminderId: string) => Promise<void> | void;
  onFavoriteToggle?: (reminderId: string) => Promise<void> | void;
  onDelete?: (reminderId: string) => Promise<void> | void;
  searchTerm?: string;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  currentUserId,
  onReschedule,
  onReminderToggle,
  onFavoriteToggle,
  onDelete,
  searchTerm,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleMenuClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const statusText = reminder.status === 'missed' ? 'Missed' : 'Upcoming';
  const statusColor = reminder.status === 'missed' ? 'text-[#d93025]' : 'text-[#16A34A]';

  return (
    <div className="bg-white border border-[#e6e6e6] border-solid rounded-[5px] p-[10px] relative shadow-[0_2px_4px_rgba(0,0,0,0.10)]">
      <div className="flex flex-col gap-[10px]">
        {/* Header with Author Info */}
        <div className="flex flex-col gap-[10px]">
          <div className="h-[48px] relative">
            <div className="absolute left-0 top-0 size-[48px]">
              <img
                src={reminder.author.avatar || avatarPlaceholder}
                alt={reminder.author.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
              />
            </div>
            <div className="absolute left-[58px] top-0">
              <p className="text-[16px] font-semibold text-black leading-normal">
                {reminder.author.name}
              </p>
            </div>
            <div className="absolute left-[58px] top-[27px] flex items-center gap-[10px]">
              <span className={cn('text-[14px] font-semibold', statusColor)}>
                {statusText}
              </span>
              <div className="w-0 h-[14px] border-l-2 border-[#CACACA]"></div>
              <span className="text-[14px] font-normal text-[#535352]">
                {reminder.formattedDate}, {reminder.formattedTime}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[16px] font-semibold text-black leading-normal">
            <HighlightText text={reminder.title} highlight={searchTerm || ''} />
          </h3>

          {/* Content */}
          <p className="text-[14px] font-normal text-[#535352] leading-normal whitespace-pre-wrap line-clamp-3">
            <HighlightText text={reminder.content} highlight={searchTerm || ''} />
          </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-[10px] right-[10px] flex items-center gap-[5px] py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14.9016 12.0608L13.8016 11.5108V10.2008C13.8003 9.42164 13.5235 8.66804 13.0203 8.07321C12.5171 7.47838 11.8197 7.08064 11.0516 6.95028V5.80078H9.95156V6.95028C9.1834 7.08064 8.48606 7.47838 7.98282 8.07321C7.47958 8.66804 7.20286 9.42164 7.20156 10.2008V11.5108L6.10156 12.0608V14.6008H9.40156V15.7008H11.6016V14.6008H14.9016V12.0608ZM13.8016 13.5008H7.20156V12.7408L8.30156 12.1908V10.2008C8.30156 9.61731 8.53335 9.05773 8.94593 8.64515C9.35851 8.23257 9.91809 8.00078 10.5016 8.00078C11.085 8.00078 11.6446 8.23257 12.0572 8.64515C12.4698 9.05773 12.7016 9.61731 12.7016 10.2008V12.1908L13.8016 12.7408V13.5008Z" fill="#DE4A2C" />
            <path d="M13.8016 2.50078C13.8016 2.20904 13.6857 1.92925 13.4794 1.72296C13.2731 1.51667 12.9933 1.40078 12.7016 1.40078H10.5016V0.300781H9.40156V1.40078H5.00156V0.300781H3.90156V1.40078H1.70156C1.40982 1.40078 1.13003 1.51667 0.923745 1.72296C0.717455 1.92925 0.601563 2.20904 0.601562 2.50078V13.5008C0.601563 13.7925 0.717455 14.0723 0.923745 14.2786C1.13003 14.4849 1.40982 14.6008 1.70156 14.6008H3.90156V13.5008H1.70156V2.50078H3.90156V3.60078H5.00156V2.50078H9.40156V3.60078H10.5016V2.50078H12.7016V5.80078H13.8016V2.50078Z" fill="black" />
          </svg>
          {reminder.favorited && (
            <div
              className="size-[16px] flex items-center justify-center"
              aria-label="Favorited"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8.7364 0.478797L10.7634 4.77457L15.2959 5.46334C15.9695 5.5657 16.2385 6.4316 15.7512 6.92854L12.4714 10.2724L13.2456 14.9939C13.3606 15.6956 12.6565 16.2307 12.054 15.8994L8.00006 13.6702L3.94607 15.8994C3.34359 16.2307 2.6393 15.6956 2.75449 14.9939L3.52871 10.2724L0.248938 6.92854C-0.238528 6.4316 0.0304009 5.5657 0.70418 5.46334L5.23672 4.77457L7.26372 0.478797C7.56504 -0.159599 8.43508 -0.159599 8.7364 0.478797Z" fill="#FFB74D" />
              </svg>
            </div>
          )}
          {/* {reminder.pinned && (
            <div
              className="size-[16px] flex items-center justify-center"
              aria-label="Pinned"
            >
              <Pin className="w-4 h-4 fill-black text-black" />
            </div>
          )} */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={handleMenuClick}
            className="size-[16px] flex items-center justify-center cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Menu Dropdown */}
      <ReminderMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        triggerRef={menuButtonRef}
        reminder={reminder}
        currentUserId={currentUserId}
        onReschedule={async () => { return onReschedule?.(reminder.id); }}
        onReminderToggle={async () => { return onReminderToggle?.(reminder.id); }}
        onFavoriteClick={async () => { return onFavoriteToggle?.(reminder.id); }}
        onDeleteClick={async () => { return onDelete?.(reminder.id); }}
      />
    </div>
  );
};

export default ReminderCard;

