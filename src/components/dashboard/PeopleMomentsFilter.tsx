import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PeopleMomentsFilterProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onApply: (filters: { viewType: string; timeFrame: string }) => void;
  initialFilters?: { viewType: string; timeFrame: string };
  viewTypeOptions?: Array<{ value: string; label: string }>;
  timeFrameOptions?: Array<{ value: string; label: string }>;
}

const defaultViewTypeOptions = [
  { value: 'birthdays', label: 'Birthdays' },
  { value: 'anniversaries', label: 'Work Anniversaries' },
  { value: 'both', label: 'Both' },
];

const defaultTimeFrameOptions = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
];

// Radio Button Icon Component
const RadioIcon: React.FC<{ checked: boolean }> = ({ checked }) => {
  if (checked) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="8.5" cy="8.5" r="8" fill="#D9D9D9" stroke="white" />
        <circle cx="8.5" cy="8.5" r="8" fill="#0198F1" stroke="white" />
        <path d="M12.3951 4L7.35488 10.2136L4.375 7.42924L3 8.71496L7.58262 13L14 5.28571L12.3951 4Z" fill="white" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="8.5" cy="8.5" r="8" fill="#D9D9D9" stroke="white" />
    </svg>
  );
};

const PeopleMomentsFilter: React.FC<PeopleMomentsFilterProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onApply,
  initialFilters = { viewType: 'both', timeFrame: 'today' },
  viewTypeOptions = defaultViewTypeOptions,
  timeFrameOptions = defaultTimeFrameOptions,
}) => {
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [viewType, setViewType] = useState<string>(initialFilters.viewType);
  const [timeFrame, setTimeFrame] = useState<string>(initialFilters.timeFrame);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 218; // Approximate width from Figma
    // Position dropdown bottom right - align right edge of dropdown with right edge of button
    let menuLeft = rect.right - menuWidth;

    // Ensure menu stays within viewport bounds
    const padding = 10;
    const minLeft = padding;

    if (menuLeft < minLeft) {
      menuLeft = minLeft;
    }

    setMenuPosition({
      top: rect.bottom + 10,
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
    setViewType(initialFilters.viewType);
    setTimeFrame(initialFilters.timeFrame);
  }, [initialFilters, isOpen]);

  // Click outside handler - close without changing (filters already applied on selection)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target)) {
        return;
      }

      const filterPanel = document.querySelector('[data-filter-panel="people-moments"]');
      if (filterPanel?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !menuPosition) return null;

  return createPortal(
    <>
      {/* Filter Panel */}
      <div
        data-filter-panel="people-moments"
        className="fixed bg-[#232725] rounded-[10px] z-[9999] w-[218px] py-[20px] px-[5px]"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      >
        {/* Title */}
        <div className="mb-[12px] px-[10px]">
          <h3 className="text-[16px] font-semibold text-white leading-normal">Filter By</h3>
        </div>

        {/* View Type Section */}
        <div className="mb-[16px]">
          <div className="bg-[#535352] h-[19px] px-[10px] mb-[12px] flex items-center">
            <span className="text-[16px] font-semibold text-white leading-normal">View Type</span>
          </div>
          <div className="space-y-[12px] px-[10px]">
            {viewTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setViewType(opt.value);
                  onApply({ viewType: opt.value, timeFrame });
                }}
                className="w-full flex items-center gap-[10px] hover:opacity-80 transition-opacity"
              >
                <RadioIcon checked={viewType === opt.value} />
                <span className="text-[14px] font-medium text-white leading-normal">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Frame Section */}
        <div>
          <div className="bg-[#535352] h-[19px] px-[10px] mb-[12px] flex items-center">
            <span className="text-[16px] font-semibold text-white leading-normal">Time Frame</span>
          </div>
          <div className="space-y-[12px] px-[10px]">
            {timeFrameOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTimeFrame(opt.value);
                  onApply({ viewType, timeFrame: opt.value });
                }}
                className="w-full flex items-center gap-[10px] hover:opacity-80 transition-opacity"
              >
                <RadioIcon checked={timeFrame === opt.value} />
                <span className="text-[14px] font-medium text-white leading-normal">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>,
    document.body
  );
};

export default PeopleMomentsFilter;
