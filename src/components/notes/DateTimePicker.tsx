import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils/cn';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface DateTimePickerProps {
    selectedDate?: Date;
    selectedTime?: { hour: number; minute: number; ampm: 'AM' | 'PM' };
    onSet: (date: Date) => void;
    onCancel: () => void;
    title?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
    selectedDate,
    selectedTime,
    onSet,
    onCancel,
    title = 'Reminder Date & Time',
}) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [selectedDay, setSelectedDay] = useState(selectedDate?.getDate() || new Date().getDate());
    const [hour, setHour] = useState(selectedTime?.hour || 11);
    const [minute, setMinute] = useState(selectedTime?.minute || 0);
    const [ampm, setAmpm] = useState<'AM' | 'PM'>(selectedTime?.ampm || 'AM');
    const [hourInput, setHourInput] = useState(String(selectedTime?.hour || 11).padStart(2, '0'));
    const [minuteInput, setMinuteInput] = useState(String(selectedTime?.minute || 0).padStart(2, '0'));
    const [hourFocused, setHourFocused] = useState(false);
    const [minuteFocused, setMinuteFocused] = useState(false);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleDayClick = (day: number) => {
        setSelectedDay(day);
        const newDate = new Date(currentYear, currentMonth, day);
        setCurrentDate(newDate);
    };

    useEffect(() => {
        if (selectedDate) {
            setSelectedDay(selectedDate.getDate());
            setCurrentDate(selectedDate);
            const hours = selectedDate.getHours();
            const hour12 = hours % 12 || 12;
            setHour(hour12);
            setMinute(selectedDate.getMinutes());
            setAmpm(hours >= 12 ? 'PM' : 'AM');
            setHourInput(String(hour12).padStart(2, '0'));
            setMinuteInput(String(selectedDate.getMinutes()).padStart(2, '0'));
        }
    }, [selectedDate]);

    const handleTimeChange = (type: 'hour' | 'minute', delta: number) => {
        if (type === 'hour') {
            setHour((prev) => {
                const newHour = prev + delta;
                const clamped = Math.max(1, Math.min(12, newHour));
                setHourInput(String(clamped).padStart(2, '0'));
                return clamped;
            });
        } else {
            setMinute((prev) => {
                const newMinute = prev + delta;
                const clamped = Math.max(0, Math.min(59, newMinute));
                setMinuteInput(String(clamped).padStart(2, '0'));
                return clamped;
            });
        }
    };

    const handleHourInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setHourInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 1 && num <= 12) {
                setHour(num);
            }
        }
    };

    const handleHourInputBlur = () => {
        setHourFocused(false);
        const num = parseInt(hourInput, 10);
        if (isNaN(num) || num < 1 || num > 12) {
            setHourInput(String(hour).padStart(2, '0'));
        } else {
            setHourInput(String(num).padStart(2, '0'));
            setHour(num);
        }
    };

    const handleMinuteInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setMinuteInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 0 && num <= 59) {
                setMinute(num);
            }
        }
    };

    const handleMinuteInputBlur = () => {
        setMinuteFocused(false);
        const num = parseInt(minuteInput, 10);
        if (isNaN(num) || num < 0 || num > 59) {
            setMinuteInput(String(minute).padStart(2, '0'));
        } else {
            setMinuteInput(String(num).padStart(2, '0'));
            setMinute(num);
        }
    };

    useEffect(() => {
        if (!hourFocused) {
            setHourInput(String(hour).padStart(2, '0'));
        }
    }, [hour, hourFocused]);

    useEffect(() => {
        if (!minuteFocused) {
            setMinuteInput(String(minute).padStart(2, '0'));
        }
    }, [minute, minuteFocused]);

    const handleSet = () => {
        const date = new Date(currentYear, currentMonth, selectedDay);
        let hour24 = hour;
        if (ampm === 'PM' && hour !== 12) {
            hour24 = hour + 12;
        } else if (ampm === 'AM' && hour === 12) {
            hour24 = 0;
        }
        date.setHours(hour24, minute, 0, 0);
        onSet(date);
    };

    const renderCalendarDays = () => {
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    return (
        <div className="bg-[#232725] rounded-[10px] relative">
            <div className="px-4 pt-4">
                <p className="text-[14px] font-semibold text-white mb-4">
                    {title}
                </p>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-center mb-4 relative h-[25px] mx-[65px]">
                <button
                    type="button"
                    onClick={handlePrevMonth}
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
                <div className="grid grid-cols-7 gap-0 mb-[10px] px-[47px]">
                    {dayNames.map((day) => (
                        <div key={day} className="text-[12px] font-semibold text-white text-center py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2 px-[47px]">
                    {renderCalendarDays().map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="h-[30px]" />;
                        }

                        const isSelected =
                            day === selectedDay &&
                            currentMonth === currentDate.getMonth() &&
                            currentYear === currentDate.getFullYear();

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
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
                            ampm === 'AM' ? 'left-[5px]' : 'left-[33px]'
                        )}
                    />
                    <button
                        type="button"
                        onClick={() => setAmpm('AM')}
                        className={cn(
                            'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                            ampm === 'AM' && 'bg-[#008080]'
                        )}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmpm('PM')}
                        className={cn(
                            'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                            ampm === 'PM' && 'bg-[#008080]'
                        )}
                    >
                        PM
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#535352] mb-4" />

            {/* Action Buttons */}
            <div className="px-4 pb-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-[80px] border border-[#535352] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-[#d93025] tracking-[0.7px] cursor-pointer hover:opacity-90 transition"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSet}
                    className="w-[80px] bg-[#1677bc] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-90 transition"
                >
                    Set
                </button>
            </div>
        </div>
    );
};

export default DateTimePicker;
