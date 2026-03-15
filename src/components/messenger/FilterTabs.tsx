import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { ConversationFilter } from './types';

interface FilterTabsProps {
  activeFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, onFilterChange }) => {
  const filters: { id: ConversationFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'project-groups', label: 'Project Groups' },
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'px-5 py-[6.5px] rounded-full text-[14px] leading-normal text-white font-semibold transition-all duration-200',
            activeFilter === filter.id
              ? 'bg-[#1E88E5] shadow-sm'
              : 'bg-[#232725] hover:bg-[#1E88E5]'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
