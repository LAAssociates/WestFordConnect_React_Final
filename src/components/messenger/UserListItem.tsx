import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { User } from './types';
import StatusIndicator from './StatusIndicator';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import { ChevronRight } from 'lucide-react';
import HighlightText from '../common/HighlightText';

interface UserListItemProps {
  user: User;
  isSelected?: boolean;
  onClick?: () => void;
  showActionIcon?: boolean;
  searchQuery?: string;
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  isSelected,
  onClick,
  showActionIcon = false,
  searchQuery = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#E6E6E6]', isSelected ? 'bg-blue-50/50' : '')}
    >
      <div className="relative flex-shrink-0">
        <img
          src={user.avatar || avatarPlaceholder}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = avatarPlaceholder;
          }}
        />
        {user.status && user.status !== 'offline' && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusIndicator status={user.status} />
          </div>
        )}
        {showActionIcon && (
          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-semibold truncate mb-0.5',
          )}
        >
          <HighlightText text={user.name} highlight={searchQuery} />
        </div>
        <div
          className={cn(
            'text-[#535352] font-normal text-sm truncate',
          )}
        >
          <HighlightText text={user.position} highlight={searchQuery} />
        </div>
      </div>
      {isSelected !== undefined && (
        <div className="flex-shrink-0 ml-2">
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected ? "border-primary bg-primary" : "border-gray-300"
          )}>
            {isSelected && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListItem;





