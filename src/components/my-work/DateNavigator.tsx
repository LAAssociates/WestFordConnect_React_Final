import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface DateNavigatorProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  className,
}) => {
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    const month = date.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    return `${date.toLocaleDateString('en-GB', { weekday: 'long' })}, ${day}${suffix} ${month} - ${year}`;
  };

  return (
    <div className={cn('flex items-center gap-[10px]', className)}>
      <button
        type="button"
        onClick={onPrevious}
        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:bg-[#E6E6E6] rounded transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-[#9A9A9A]" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:bg-[#E6E6E6] rounded transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-[#9A9A9A]" />
      </button>
      <div className="w-px h-[30px] bg-[#E6E6E6]" />
      <button
        type="button"
        onClick={onToday}
        className="px-[15px] py-[5px] rounded-[25px] bg-[#232725] text-white text-[14px] font-semibold hover:bg-[#2F3432] cursor-pointer transition-colors"
      >
        Today
      </button>
      <span className="text-[18px] font-normal text-black ml-[10px]">
        {formatDate(currentDate)}
      </span>
    </div>
  );
};

export default DateNavigator;


