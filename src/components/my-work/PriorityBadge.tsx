import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { Priority } from './types';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  isMinimal?: boolean;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className, isMinimal = true }) => {
  const styles = {
    high: 'bg-[#d93025]',
    medium: 'bg-[#ffb74d]',
    low: 'bg-green-600',
  };

  if (isMinimal) {
    return (
      <div
        className={cn(
          'w-[15px] h-[15px] rounded-full flex items-center justify-center',
          styles[priority],
          className
        )}
        aria-label={`Priority: ${priority}`}
      />
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          'cursor-pointer rounded-[25px] text-[14px] font-semibold text-white transition-all h-[27px] w-[95px]',
          styles[priority]
        )}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </button>
      <div className="absolute -top-[4px] -left-[4px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+8px)] h-[calc(100%+8px)]"></div>
    </div>
  );
};

export default PriorityBadge;


