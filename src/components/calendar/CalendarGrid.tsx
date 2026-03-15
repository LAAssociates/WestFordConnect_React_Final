import React, { useMemo, useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { CalendarEvent } from './types';
import MacScrollbar from '../common/MacScrollbar';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import HighlightText from '../common/HighlightText';

interface CalendarGridProps {
    days: Date[];
    events: CalendarEvent[];
    startHour?: number;
    endHour?: number;
    onEventClick?: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 60;
const TOTAL_HOURS = 24;

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const CalendarGrid: React.FC<CalendarGridProps> = ({
    days,
    events,
    onEventClick,
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    // Update current time every minute
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date());
        };

        // Update immediately
        updateTime();

        // Set up interval to update every minute
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    // Calculate current time position
    const currentTimePosition = useMemo(() => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        return (hours + minutes / 60) * HOUR_HEIGHT;
    }, [currentTime]);

    // Format current time for tooltip
    const formatCurrentTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Separate all-day events from timed events
    const { allDayEvents, timedEvents } = useMemo(() => {
        const allDay: CalendarEvent[] = [];
        const timed: CalendarEvent[] = [];

        events.forEach((event) => {
            const startHours = event.startTime.getHours() + event.startTime.getMinutes() / 60;
            const endHours = event.endTime.getHours() + event.endTime.getMinutes() / 60;
            const duration = endHours - startHours;

            // Consider all-day if it spans 24 hours or more, or if it's marked as all-day
            if (event.isAllDay || duration >= 24 || (startHours === 0 && endHours >= 23)) {
                allDay.push(event);
            } else {
                timed.push(event);
            }
        });

        return { allDayEvents: allDay, timedEvents: timed };
    }, [events]);

    const allDayEventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        const dayKeySet = new Set<string>();

        days.forEach((day) => {
            const key = day.toDateString();
            dayKeySet.add(key);
            map.set(key, []);
        });

        allDayEvents.forEach((event) => {
            const key = event.startTime.toDateString();
            if (!dayKeySet.has(key)) return;
            map.get(key)!.push(event);
        });

        return map;
    }, [days, allDayEvents]);

    const timedEventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        const dayKeySet = new Set<string>();

        days.forEach((day) => {
            const key = day.toDateString();
            dayKeySet.add(key);
            map.set(key, []);
        });

        timedEvents.forEach((event) => {
            const key = event.startTime.toDateString();
            if (!dayKeySet.has(key)) return;
            map.get(key)!.push(event);
        });

        return map;
    }, [days, timedEvents]);

    const formatHourLabel = (hour: number) => {
        return hour.toString().padStart(2, '0');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const calculateEventPosition = (event: CalendarEvent) => {
        const startHours = event.startTime.getHours() + event.startTime.getMinutes() / 60;
        const endHours = event.endTime.getHours() + event.endTime.getMinutes() / 60;

        // For 24-hour view, use full range
        const top = startHours * HOUR_HEIGHT;
        const height = Math.max((endHours - startHours) * HOUR_HEIGHT, 50);

        return { top, height };
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day Headers */}
            <div className="flex border-b border-[#e6e6e6]">
                <div className="w-[41px] border-r-2 border-[#e6e6e6]" />
                <div className="flex-1 grid grid-cols-7">
                    {days.map((day, index) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    'border-r-2 border-[#e6e6e6] px-[20px] pt-[20px] pb-[19px] text-center',
                                    index === 6 && 'border-r-0'
                                )}
                            >
                                <p className="text-[14px] font-semibold text-[#535352] leading-normal mb-px">
                                    {day.toLocaleDateString('en-US', { weekday: 'long' })}
                                </p>
                                {isToday ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-[30px] h-[30px] rounded-full bg-[#008080] flex items-center justify-center">
                                            <p className="text-[18px] font-semibold text-white">{day.getDate()}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[18px] font-semibold text-black">{day.getDate()}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* All-day Section */}
            <div className="flex border-b border-[#e6e6e6]">
                <div className="w-[41px] border-r-2 border-[#e6e6e6] px-2 py-2">
                    <p className="text-[12px] font-semibold text-[#535352]">All-day</p>
                </div>
                <div className="flex-1 grid grid-cols-7 divide-x-2 divide-[#e6e6e6]">
                    {days.map((day, index) => {
                        const dayAllDayEvents = allDayEventsByDay.get(day.toDateString()) ?? [];
                        return (
                            <div
                                key={day.toISOString()}
                                className={cn('relative min-h-[50px] p-1', index === 6 && 'border-r-0')}
                            >
                                {dayAllDayEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => {
                                            onEventClick?.(event);
                                            event.onClick?.();
                                        }}
                                        className="w-full rounded-[15px] px-2 py-1 text-white text-left cursor-pointer hover:opacity-90 transition shadow-sm text-[11px] font-medium mb-1"
                                        style={{
                                            backgroundColor: event.color,
                                        }}
                                    >
                                        <HighlightText text={event.title} highlight={event.searchTerm || ''} />
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Calendar Body with 24 hours */}
            <MacScrollbar className="flex-1 relative">
                <div className="flex">
                    {/* Time Labels */}
                    <div className="w-[39px] shrink-0 -mt-2.5">
                        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                            <div
                                key={i}
                                className="h-[60px] flex items-start justify-center"
                                style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                                <p className="text-[14px] font-semibold text-[#535352]">
                                    {formatHourLabel(i)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    <div
                        className="flex-1 relative border-l-2 border-[#e6e6e6]"
                        style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                    >
                        <div className="grid grid-cols-7 h-full divide-x-2 divide-[#e6e6e6]">
                            {days.map((day) => {
                                const dayEvents = timedEventsByDay.get(day.toDateString()) ?? [];
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div key={day.toISOString()} className="relative">
                                        {/* Hour Lines */}
                                        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                                            <div
                                                key={i}
                                                className="absolute border-t border-[#e6e6e6]"
                                                style={{
                                                    top: `${i * HOUR_HEIGHT}px`,
                                                    left: 0,
                                                    right: 0,
                                                }}
                                            />
                                        ))}

                                        {/* Events */}
                                        {dayEvents.map((event) => {
                                            const { top, height } = calculateEventPosition(event);
                                            return (
                                                <button
                                                    key={event.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onEventClick?.(event);
                                                        event.onClick?.();
                                                    }}
                                                    className="absolute left-0 right-[10px] rounded-[15px] px-[10px] py-[5px] text-white text-left cursor-pointer hover:opacity-90 transition shadow-sm flex flex-col"
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                        backgroundColor: event.color,
                                                    }}
                                                >
                                                    <p className="text-[12px] font-medium leading-tight mb-1 line-clamp-2">
                                                        <HighlightText text={event.title} highlight={event.searchTerm || ''} />
                                                    </p>
                                                    <p className="text-[12px] font-medium opacity-90">
                                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                                    </p>
                                                </button>
                                            );
                                        })}

                                        {/* Current Time Indicator - Only for today */}
                                        {isToday && (
                                            <div
                                                className="absolute left-0 right-0 pointer-events-none"
                                                style={{
                                                    top: `${currentTimePosition}px`,
                                                }}
                                            >
                                                {/* Time Line */}
                                                <div
                                                    className="absolute left-0 right-0 h-[2px] bg-black pointer-events-auto"
                                                    onMouseEnter={() => setIsTooltipVisible(true)}
                                                    onMouseLeave={() => setIsTooltipVisible(false)}
                                                />
                                                <div className="absolute -top-[3px] -left-1.5 h-2 w-2 bg-black pointer-events-auto rounded-full"></div>

                                                {/* Time Tooltip */}
                                                {isTooltipVisible && (
                                                    <div className="absolute left-0 -translate-x-1/2 bottom-full mb-[12px]">
                                                        <div className="bg-[#1c2745] flex items-center gap-[10px] px-[7px] py-[5px] rounded-[2px] relative">
                                                            <Clock className="w-[14px] h-[14px] text-white shrink-0" />
                                                            <p className="text-[12px] font-semibold text-white whitespace-nowrap">
                                                                {formatCurrentTime(currentTime)}
                                                            </p>
                                                            {/* Downward Arrow */}
                                                            <div className="absolute bottom-[-7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#1c2745]" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </MacScrollbar>
        </div>
    );
};

export default CalendarGrid;
