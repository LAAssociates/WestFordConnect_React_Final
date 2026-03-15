import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { CalendarEvent } from '../types';
import MacScrollbar from '../../common/MacScrollbar';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import HighlightText from '../../common/HighlightText';

interface CalendarDayViewProps {
    date: Date;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 60;
const TOTAL_HOURS = 24;

const CalendarDayView: React.FC<CalendarDayViewProps> = ({ date, events, onEventClick }) => {
    const calendarScrollRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    // Separate all-day events from timed events
    const { allDayEvents, timedEvents } = useMemo(() => {
        const allDay: CalendarEvent[] = [];
        const timed: CalendarEvent[] = [];

        events.forEach((event) => {
            if (!isSameDay(event.startTime, date)) return;

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
    }, [events, date]);

    // Scroll to current hour on mount
    useEffect(() => {
        if (calendarScrollRef.current && isSameDay(date, new Date())) {
            const now = new Date();
            const currentHour = now.getHours();
            const scrollPosition = currentHour * HOUR_HEIGHT - 200;
            calendarScrollRef.current.scrollTop = Math.max(0, scrollPosition);
        }
    }, [date]);

    // Update current time every minute
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date());
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    // Calculate current time position
    const currentTimePosition = useMemo(() => {
        if (!isSameDay(date, new Date())) return null;
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        return (hours + minutes / 60) * HOUR_HEIGHT;
    }, [currentTime, date]);

    const formatHourLabel = (hour: number) => {
        return hour.toString().padStart(2, '0');
    };

    const formatCurrentTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
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

        const top = startHours * HOUR_HEIGHT;
        const height = Math.max((endHours - startHours) * HOUR_HEIGHT, 50);

        return { top, height };
    };

    const isToday = isSameDay(date, new Date());

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day Header */}
            <div className="flex border-b border-[#e6e6e6] h-[92px]">
                <div className="w-[41px] border-r-2 border-[#e6e6e6]" />
                <div className="flex-1 text-center flex flex-col justify-center">
                    <p className="text-[14px] font-semibold text-[#535352] mb-0.5">
                        {date.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                    {isToday ? (
                        <div className="flex items-center justify-center">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#008080] flex items-center justify-center">
                                <p className="text-[18px] font-semibold text-white">{date.getDate()}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[18px] font-semibold text-black">{date.getDate()}</p>
                    )}
                </div>
            </div>

            {/* All-day Section - Google Calendar Style */}
            {allDayEvents.length > 0 && (
                <div className="flex border-b-2 border-[#e6e6e6] bg-[#fafafa]">
                    <div className="w-[41px] border-r-2 border-[#e6e6e6] px-2 py-2 flex items-center">
                        <p className="text-[12px] font-semibold text-[#535352]">All-day</p>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-1.5">
                        {allDayEvents.map((event) => (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => onEventClick?.(event)}
                                className="w-full rounded-[8px] px-3 py-1.5 text-white text-left cursor-pointer hover:opacity-95 transition-all duration-200 shadow-sm text-[12px] font-medium hover:shadow-md"
                                style={{
                                    backgroundColor: event.color,
                                }}
                            >
                                <HighlightText text={event.title} highlight={event.searchTerm || ''} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar Body with 24 hours */}
            <MacScrollbar className="flex-1 relative" ref={calendarScrollRef}>
                <div className="flex">
                    {/* Time Labels */}
                    <div className="w-[39px] shrink-0 -mt-2.5">
                        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                            <div
                                key={i}
                                className="h-[60px] flex items-start justify-center"
                                style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                                <p className="text-[13px] font-medium text-[#70757a]">{formatHourLabel(i)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Day Column */}
                    <div
                        className="flex-1 relative border-l-2 border-[#e6e6e6]"
                        style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                    >
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

                        {/* Events - Google Calendar Style */}
                        {timedEvents.map((event) => {
                            const { top, height } = calculateEventPosition(event);
                            return (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => onEventClick?.(event)}
                                    className="absolute left-1 right-[10px] rounded-[10px] px-3 py-2 text-white text-left cursor-pointer hover:opacity-95 transition-all duration-200 shadow-md hover:shadow-lg flex flex-col group"
                                    style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        backgroundColor: event.color,
                                    }}
                                >
                                    <p className="text-[13px] font-semibold leading-tight mb-0.5 line-clamp-2 group-hover:underline">
                                        <HighlightText text={event.title} highlight={event.searchTerm || ''} />
                                    </p>
                                    <p className="text-[11px] font-medium opacity-90">
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    </p>
                                </button>
                            );
                        })}

                        {/* Current Time Indicator - Google Calendar Style */}
                        {isToday && currentTimePosition !== null && (
                            <div
                                className="absolute left-0 right-0 pointer-events-none z-10"
                                style={{
                                    top: `${currentTimePosition}px`,
                                }}
                            >
                                {/* Time Line */}
                                <div
                                    className="absolute left-0 right-0 h-[2px] bg-[#ea4335] pointer-events-auto"
                                    onMouseEnter={() => setIsTooltipVisible(true)}
                                    onMouseLeave={() => setIsTooltipVisible(false)}
                                />
                                <div className="absolute -top-[4px] -left-1.5 h-3 w-3 bg-[#ea4335] pointer-events-auto rounded-full border-2 border-white shadow-sm"></div>

                                {/* Time Tooltip */}
                                {isTooltipVisible && (
                                    <div className="absolute left-0 -translate-x-1/2 bottom-full mb-[12px]">
                                        <div className="bg-[#1c2745] flex items-center gap-[10px] px-[8px] py-[6px] rounded-[6px] relative shadow-lg">
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
                </div>
            </MacScrollbar>
        </div>
    );
};

export default CalendarDayView;
