import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils/cn';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface DateTimePickerProps {
    selectedDate?: Date;
    selectedTime?: string | { hour: number; minute: number; ampm: 'AM' | 'PM' };
    onSet?: (date: Date) => void;  // For notes/meetings pattern
    onSave?: (date: Date, timeString: string) => void;  // For tasks pattern
    onCancel: () => void;
    title?: string;
    width?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
    selectedDate,
    selectedTime,
    onSet,
    onSave,
    onCancel,
    title,
    width = '341px',
}) => {
    // Parse selectedTime - can be string or object
    const parseTime = () => {
        if (!selectedTime) {
            if (selectedDate) {
                const hours = selectedDate.getHours();
                const hour12 = hours % 12 || 12;
                return {
                    hour: hour12,
                    minute: selectedDate.getMinutes(),
                    ampm: hours >= 12 ? 'PM' : 'AM' as 'AM' | 'PM',
                };
            }
            return { hour: 11, minute: 0, ampm: 'AM' as 'AM' | 'PM' };
        }

        if (typeof selectedTime === 'string') {
            // Parse string like "11:00 AM" or "11:59 PM"
            const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                return {
                    hour: parseInt(match[1], 10),
                    minute: parseInt(match[2], 10),
                    ampm: (match[3].toUpperCase() as 'AM' | 'PM'),
                };
            }
            // Fallback to date if string doesn't match
            if (selectedDate) {
                const hours = selectedDate.getHours();
                const hour12 = hours % 12 || 12;
                return {
                    hour: hour12,
                    minute: selectedDate.getMinutes(),
                    ampm: hours >= 12 ? 'PM' : 'AM' as 'AM' | 'PM',
                };
            }
            return { hour: 11, minute: 0, ampm: 'AM' as 'AM' | 'PM' };
        }

        // It's an object
        return selectedTime;
    };

    const initialTime = parseTime();
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [selectedDay, setSelectedDay] = useState(selectedDate?.getDate() || new Date().getDate());
    const [hour, setHour] = useState(initialTime.hour);
    const [minute, setMinute] = useState(initialTime.minute);
    const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialTime.ampm);
    const [activePart, setActivePart] = useState<'hour' | 'minute' | null>(null);
    const [typedBuffer, setTypedBuffer] = useState('');

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Update state when selectedDate or selectedTime changes
    useEffect(() => {
        if (selectedDate) {
            setSelectedDay(selectedDate.getDate());
            setCurrentDate(selectedDate);
        }
        const parsed = parseTime();
        setHour(parsed.hour);
        setMinute(parsed.minute);
        setAmpm(parsed.ampm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, selectedTime]);

    // Reset buffer when active part changes
    useEffect(() => {
        setTypedBuffer('');
    }, [activePart]);

    const handleIncrement = (part: 'hour' | 'minute') => {
        if (part === 'hour') {
            setHour(prev => (prev % 12) + 1);
        } else {
            setMinute(prev => (prev + 1) % 60);
        }
    };

    const handleDecrement = (part: 'hour' | 'minute') => {
        if (part === 'hour') {
            setHour(prev => (prev === 1 ? 12 : prev - 1));
        } else {
            setMinute(prev => (prev === 0 ? 59 : prev - 1));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!activePart) return;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleIncrement(activePart);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDecrement(activePart);
        } else if (/^\d$/.test(e.key)) {
            const newBuffer = typedBuffer + e.key;
            const val = parseInt(newBuffer, 10);

            if (activePart === 'hour') {
                if (val >= 1 && val <= 12) {
                    setHour(val);
                    setTypedBuffer(newBuffer.length >= 2 ? '' : newBuffer);
                } else if (val > 12) {
                    // Start fresh if value exceeds range
                    const singleVal = parseInt(e.key, 10);
                    if (singleVal >= 1 && singleVal <= 9) {
                        setHour(singleVal);
                        setTypedBuffer(e.key);
                    }
                } else {
                    setTypedBuffer(newBuffer);
                }
            } else {
                if (val >= 0 && val <= 59) {
                    setMinute(val);
                    setTypedBuffer(newBuffer.length >= 2 ? '' : newBuffer);
                } else if (val > 59) {
                    const singleVal = parseInt(e.key, 10);
                    setMinute(singleVal);
                    setTypedBuffer(e.key);
                } else {
                    setTypedBuffer(newBuffer);
                }
            }
        }
    };

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

    const handleConfirm = () => {
        const date = new Date(currentYear, currentMonth, selectedDay);
        let hour24 = hour;
        if (ampm === 'PM' && hour !== 12) {
            hour24 = hour + 12;
        } else if (ampm === 'AM' && hour === 12) {
            hour24 = 0;
        }
        date.setHours(hour24, minute, 0, 0);

        if (onSave) {
            // Use onSave pattern - return date and formatted time string
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
            onSave(date, timeString);
        } else if (onSet) {
            // Use onSet pattern - return only date
            onSet(date);
        }
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

    const isSelectedDate = (day: number | null) => {
        if (day === null) return false;
        return (
            day === selectedDay &&
            currentMonth === currentDate.getMonth() &&
            currentYear === currentDate.getFullYear()
        );
    };

    const calendarDays = renderCalendarDays();
    const showTitle = title !== undefined;

    return (
        <div className="bg-[#232725] rounded-[10px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] relative pt-4" style={{ width }}>
            {showTitle && (
                <div className="px-4">
                    <p className="text-[14px] font-semibold text-white mb-4">
                        {title}
                    </p>
                </div>
            )}

            {/* Month Navigation */}
            <div className={cn(
                "flex items-center justify-center mb-4 relative h-[25px]",
                showTitle ? "mx-[65px]" : "mx-4"
            )}>
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="border-2 border-transparent hover:border-[#CACACA] rounded-full size-[25px] flex items-center justify-center cursor-pointer absolute left-0 hover:opacity-70"
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
                    className="border-2 border-transparent hover:border-[#CACACA] rounded-full size-[25px] flex items-center justify-center cursor-pointer absolute right-0 hover:opacity-70"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5 text-[#9A9A9A]" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="mb-4">
                {/* Day Headers */}
                <div className={cn(
                    "grid grid-cols-7 gap-0 mb-2",
                    showTitle ? "px-[47px]" : "px-4"
                )}>
                    {dayNames.map((day) => (
                        <div key={day} className="text-[12px] font-semibold text-white text-center tracking-[0.6px]">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className={cn(
                    "grid grid-cols-7 gap-2.5 mb-4",
                    showTitle ? "px-[47px]" : "px-4"
                )}>
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="h-6 w-6" />;
                        }

                        const isSelected = isSelectedDate(day);
                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    'h-6 w-6 flex items-center justify-center text-[12px] font-medium text-white tracking-[0.6px] cursor-pointer hover:opacity-70',
                                    isSelected && 'bg-[#008080] rounded-full'
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

            {/* Time Picker */}
            <div className={cn(
                "flex items-center gap-[10px] mb-4",
                showTitle ? "ps-[47px] pe-4" : "px-4"
            )}>
                {/* Clock Icon */}
                <div className="w-5 h-5 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 6V10L13 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Time Input */}
                <div
                    className="border border-[#535352] rounded-[5px] px-[10px] py-[5px] flex items-center gap-[15px] cursor-default focus:border-[#008080] outline-none"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                >
                    <div className="flex items-center tabular-nums text-[14px] font-medium text-white">
                        <span
                            className={cn(
                                "px-0.5 rounded transition-colors cursor-pointer hover:bg-[#008080]/20",
                                activePart === 'hour' && "bg-[#008080]/40"
                            )}
                            onClick={() => setActivePart('hour')}
                        >
                            {hour.toString().padStart(2, '0')}
                        </span>
                        <span className="mx-0.5">:</span>
                        <span
                            className={cn(
                                "px-0.5 rounded transition-colors cursor-pointer hover:bg-[#008080]/20",
                                activePart === 'minute' && "bg-[#008080]/40"
                            )}
                            onClick={() => setActivePart('minute')}
                        >
                            {minute.toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0 border-l border-[#535352] pl-2">
                        <button
                            type="button"
                            onClick={() => handleIncrement(activePart || 'minute')}
                            className="cursor-pointer hover:opacity-70"
                        >
                            <ChevronUp className="w-3 h-3 text-white" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDecrement(activePart || 'minute')}
                            className="cursor-pointer hover:opacity-70"
                        >
                            <ChevronDown className="w-3 h-3 text-white" />
                        </button>
                    </div>
                </div>

                {/* AM/PM Toggle */}
                <div className="border border-[#535352] rounded-[5px] p-[5px] flex gap-[5px]">
                    <button
                        type="button"
                        onClick={() => setAmpm('AM')}
                        className={cn(
                            'w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-colors',
                            ampm === 'AM' ? 'bg-[#008080]' : 'bg-transparent'
                        )}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmpm('PM')}
                        className={cn(
                            'w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-colors',
                            ampm === 'PM' ? 'bg-[#008080]' : 'bg-transparent'
                        )}
                    >
                        PM
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#535352] mb-4" />

            {/* Action Buttons */}
            <div className="px-4 pb-4 flex items-center justify-end gap-[10px]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border border-[#535352] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-70"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className={cn(
                        "rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-90",
                        onSave ? "bg-[#1677BC] w-[80px]" : "bg-[#1677bc] w-[80px]"
                    )}
                >
                    {onSave ? 'Save' : 'Set'}
                </button>
            </div>
        </div>
    );
};

export default DateTimePicker;

