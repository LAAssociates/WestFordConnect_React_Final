import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface ReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onSet: (date: Date) => void;
  noteId?: string;
  fallbackPosition?: { top: number; left: number; width: number; height: number };
  initialDate?: Date;
  title?: string;
}

const ReminderPopup: React.FC<ReminderPopupProps> = ({
  isOpen,
  onClose,
  onSet,
  initialDate,
  title = "Reminder On",
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const defaultDate = initialDate || new Date();
  const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
  const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedHour, setSelectedHour] = useState(defaultDate.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState(defaultDate.getMinutes());
  const [isAM, setIsAM] = useState(defaultDate.getHours() < 12);
  const [hourInput, setHourInput] = useState(String(defaultDate.getHours() % 12 || 12).padStart(2, '0'));
  const [minuteInput, setMinuteInput] = useState(String(defaultDate.getMinutes()).padStart(2, '0'));
  const [hourFocused, setHourFocused] = useState(false);
  const [minuteFocused, setMinuteFocused] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', delta: number) => {
    if (type === 'hour') {
      setSelectedHour((prev) => {
        const newHour = prev + delta;
        const clamped = Math.max(1, Math.min(12, newHour));
        setHourInput(String(clamped).padStart(2, '0'));
        return clamped;
      });
    } else {
      setSelectedMinute((prev) => {
        const newMinute = prev + delta;
        const clamped = Math.max(0, Math.min(59, newMinute));
        setMinuteInput(String(clamped).padStart(2, '0'));
        return clamped;
      });
    }
  };

  const handleHourInputChange = (value: string) => {
    // Allow empty string, single digit, or two digits
    if (value === '' || /^\d{1,2}$/.test(value)) {
      setHourInput(value);
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1 && num <= 12) {
        setSelectedHour(num);
      }
    }
  };

  const handleHourInputBlur = () => {
    setHourFocused(false);
    const num = parseInt(hourInput, 10);
    if (isNaN(num) || num < 1 || num > 12) {
      setHourInput(String(selectedHour).padStart(2, '0'));
    } else {
      setHourInput(String(num).padStart(2, '0'));
      setSelectedHour(num);
    }
  };

  const handleMinuteInputChange = (value: string) => {
    // Allow empty string, single digit, or two digits
    if (value === '' || /^\d{1,2}$/.test(value)) {
      setMinuteInput(value);
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 59) {
        setSelectedMinute(num);
      }
    }
  };

  const handleMinuteInputBlur = () => {
    setMinuteFocused(false);
    const num = parseInt(minuteInput, 10);
    if (isNaN(num) || num < 0 || num > 59) {
      setMinuteInput(String(selectedMinute).padStart(2, '0'));
    } else {
      setMinuteInput(String(num).padStart(2, '0'));
      setSelectedMinute(num);
    }
  };

  useEffect(() => {
    if (!hourFocused) {
      setHourInput(String(selectedHour).padStart(2, '0'));
    }
  }, [selectedHour, hourFocused]);

  useEffect(() => {
    if (!minuteFocused) {
      setMinuteInput(String(selectedMinute).padStart(2, '0'));
    }
  }, [selectedMinute, minuteFocused]);

  const handleSet = () => {
    const date = new Date(currentYear, currentMonth, selectedDate.getDate());
    let hour24 = selectedHour;
    if (!isAM && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (isAM && selectedHour === 12) {
      hour24 = 0;
    }
    date.setHours(hour24, selectedMinute, 0, 0);
    onSet(date);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialDate) {
      setCurrentMonth(initialDate.getMonth());
      setCurrentYear(initialDate.getFullYear());
      setSelectedDate(initialDate);
      setSelectedHour(initialDate.getHours() % 12 || 12);
      setSelectedMinute(initialDate.getMinutes());
      setIsAM(initialDate.getHours() < 12);
      setHourInput(String(initialDate.getHours() % 12 || 12).padStart(2, '0'));
      setMinuteInput(String(initialDate.getMinutes()).padStart(2, '0'));
    } else {
      const now = new Date();
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
      setSelectedDate(now);
      setSelectedHour(now.getHours() % 12 || 12);
      setSelectedMinute(now.getMinutes());
      setIsAM(now.getHours() < 12);
      setHourInput(String(now.getHours() % 12 || 12).padStart(2, '0'));
      setMinuteInput(String(now.getMinutes()).padStart(2, '0'));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, initialDate]);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        ref={popupRef}
        className="bg-[#232725] rounded-[10px] relative w-full max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <p className="text-[14px] font-semibold text-white mb-4 px-4 pt-4">
          {title}
        </p>

        {/* Month Navigation */}
        <div className="flex items-center justify-center mb-4 relative h-[25px] mx-[65px]">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="size-[25px] flex items-center justify-center cursor-pointer absolute left-0"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-[#9A9A9A]" />
          </button>
          <p className="text-[14px] font-semibold text-white">
            {monthNames[currentMonth]}, {currentYear}
          </p>
          <button
            type="button"
            onClick={handleNextMonth}
            className="size-[25px] flex items-center justify-center cursor-pointer absolute right-0"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-[#9A9A9A]" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-5 mb-[10px] px-[47px]">
            {dayNames.map((day) => (
              <div key={day} className="text-[12px] font-semibold text-white text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-5 px-[47px]">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-[30px]" />;
              }

              const isSelected =
                day === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() &&
                currentYear === selectedDate.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    'cursor-pointer h-6 w-6 text-[12px] font-medium text-white hover:bg-[#2F3432] transition-colors rounded-full',
                    isSelected && '!bg-[#008080]'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#535352] mb-4" />

        {/* Time Selector */}
        <div className="flex items-center gap-[5px] ps-[47px] mb-4">
          {/* Clock Icon */}
          <div className="w-[20px] h-[20px] me-[5px]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM9.5 5H10.5V10.25L14.5 12.33L13.83 13.25L9.5 10.75V5Z"
                fill="white"
              />
            </svg>
          </div>

          {/* Time Input */}
          <div className="flex items-center gap-[5px] border border-[#535352] rounded-[5px] px-[10px] py-[5px]">
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                data-hour-input
                value={hourInput}
                onChange={(e) => handleHourInputChange(e.target.value)}
                onFocus={() => setHourFocused(true)}
                onBlur={handleHourInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleTimeChange('hour', 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleTimeChange('hour', -1);
                  } else if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    const minuteInputEl = document.querySelector('[data-minute-input]') as HTMLInputElement;
                    minuteInputEl?.focus();
                  }
                }}
                className="bg-transparent text-[14px] font-medium text-white w-[20px] outline-none text-center border-none p-0 cursor-text"
                maxLength={2}
              />
              <span className="text-[14px] font-medium text-white">:</span>
              <input
                type="text"
                data-minute-input
                value={minuteInput}
                onChange={(e) => handleMinuteInputChange(e.target.value)}
                onFocus={() => setMinuteFocused(true)}
                onBlur={handleMinuteInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleTimeChange('minute', 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleTimeChange('minute', -1);
                  } else if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    const hourInputEl = document.querySelector('[data-hour-input]') as HTMLInputElement;
                    hourInputEl?.focus();
                  }
                }}
                className="bg-transparent text-[14px] font-medium text-white w-[20px] outline-none text-center border-none p-0 cursor-text"
                maxLength={2}
              />
            </div>
            <div className="flex flex-col h-[24px]">
              <button
                type="button"
                onClick={() => {
                  if (minuteFocused) {
                    handleTimeChange('minute', 1);
                  } else {
                    handleTimeChange('hour', 1);
                  }
                }}
                className="w-[12px] h-[12px] flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Increase"
              >
                <ChevronUp className="w-6 h-6 text-[#9A9A9A]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (minuteFocused) {
                    handleTimeChange('minute', -1);
                  } else {
                    handleTimeChange('hour', -1);
                  }
                }}
                className="w-[12px] h-[12px] flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Decrease"
              >
                <ChevronDown className="w-6 h-6 text-[#9A9A9A]" />
              </button>
            </div>
          </div>

          {/* AM/PM Toggle Switch */}
          <div className="relative flex gap-[5px] border border-[#535352] rounded-[5px] p-[5px] bg-[#232725]">
            {/* Sliding indicator */}
            <div
              className={cn(
                'absolute top-[5px] bottom-[5px] w-[28px] bg-[#008080] rounded-[2px] transition-all duration-300 ease-in-out',
                isAM ? 'left-[5px]' : 'left-[33px]'
              )}
            />
            <button
              type="button"
              onClick={() => setIsAM(true)}
              className={cn(
                'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                isAM && 'bg-[#008080]'
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setIsAM(false)}
              className={cn(
                'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                !isAM && 'bg-[#008080]'
              )}
            >
              PM
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#535352] mb-4" />

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#535352] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-[#d93025] tracking-[0.7px] cursor-pointer hover:opacity-90 transition w-[80px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSet}
            className="bg-[#1677bc] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-90 transition w-[80px]"
          >
            Set
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReminderPopup;
