import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { User } from './types';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  selectedMembers?: User[];
  onRemoveMember?: (userId: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search staff or project groups...',
  className,
  selectedMembers = [],
  onRemoveMember,
}) => {
  const hasSelectedMembers = selectedMembers.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className={cn("relative flex items-center gap-2 w-full min-h-[40px] pr-4 py-2 border border-[#CACACA] rounded-[25px] bg-white transition-all duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20", hasSelectedMembers ? "pl-4" : "pl-10")}>
        {!hasSelectedMembers && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 flex-shrink-0">
            <path d="M14.75 14.75L18.75 18.75M0.75 8.75C0.75 10.8717 1.59285 12.9066 3.09315 14.4069C4.59344 15.9071 6.62827 16.75 8.75 16.75C10.8717 16.75 12.9066 15.9071 14.4069 14.4069C15.9071 12.9066 16.75 10.8717 16.75 8.75C16.75 6.62827 15.9071 4.59344 14.4069 3.09315C12.9066 1.59285 10.8717 0.75 8.75 0.75C6.62827 0.75 4.59344 1.59285 3.09315 3.09315C1.59285 4.59344 0.75 6.62827 0.75 8.75Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        <div className="flex flex-wrap items-center gap-x-[25px] gap-y-2.5 flex-1 min-w-0">
          {hasSelectedMembers && (
            <>
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-[5px] flex-shrink-0"
                >
                  <img
                    src={member.avatar || avatarPlaceholder}
                    alt={member.name}
                    className="size-[25px] rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = avatarPlaceholder;
                    }}
                  />
                  <span className="text-base font-semibold text-black whitespace-nowrap">{member.name}</span>
                  {onRemoveMember && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMember(member.id);
                      }}
                      className="transition-all duration-300 text-[#9A9A9A] hover:text-black flex-shrink-0 cursor-pointer"
                      aria-label={`Remove ${member.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 0C3.54286 0 0 3.54286 0 8C0 12.4571 3.54286 16 8 16C12.4571 16 16 12.4571 16 8C16 3.54286 12.4571 0 8 0ZM8 14.8571C4.22857 14.8571 1.14286 11.7714 1.14286 8C1.14286 4.22857 4.22857 1.14286 8 1.14286C11.7714 1.14286 14.8571 4.22857 14.8571 8C14.8571 11.7714 11.7714 14.8571 8 14.8571Z" fill="currentColor" />
                        <path d="M11.0857 12L8 8.91429L4.91429 12L4 11.0857L7.08571 8L4 4.91429L4.91429 4L8 7.08571L11.0857 4L12 4.91429L8.91429 8L12 11.0857L11.0857 12Z" fill="currentColor" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
          <input
            type="text"
            placeholder={hasSelectedMembers ? '' : placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-[120px] text-sm text-black placeholder:text-black focus:outline-none focus:ring-0 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
