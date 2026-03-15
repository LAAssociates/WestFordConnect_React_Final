import React from 'react';
import { cn } from '../../../lib/utils/cn';
import NotificationIcon from '../../../assets/icons/navigation/bell.svg';

interface NotificationsProps {
  count?: number;
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({
  count = 3,
  className = "",
  onClick,
  isOpen = false
}) => {
  return (
    <div className="flex items-center gap-[25px] mx-[15px]">
      <div className='h-[38px] border-2 border-[#E6E6E6] rounded-full'></div>
      <button
        onClick={onClick}
        className={cn(
          "cursor-pointer relative p-2 text-gray-600 hover:text-gray-800 transition-colors outline-none rounded-md",
          isOpen && "text-[#DE4A2C]",
          className
        )}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <img src={NotificationIcon} alt="Notifications" className="w-[23px]" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <div className='h-[38px] border-2 border-[#E6E6E6] rounded-full'></div>
    </div>
  );
};

export default Notifications;