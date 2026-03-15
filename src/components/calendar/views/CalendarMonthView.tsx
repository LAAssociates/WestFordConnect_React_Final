import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '../../../lib/utils/cn';
import type { CalendarEvent } from '../types';
import HighlightText from '../../common/HighlightText';

interface CalendarMonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDateSelect?: (date: Date) => void;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
    currentDate,
    events,
    onEventClick,
    onDateSelect,
}) => {
    const [visibleMonth, setVisibleMonth] = useState(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    );

    // Sync visibleMonth with currentDate from parent (main header navigation)
    useEffect(() => {
        const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        setVisibleMonth(newMonth);
    }, [currentDate]);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const isCurrentMonth = (date: Date) =>
        date.getMonth() === visibleMonth.getMonth() && date.getFullYear() === visibleMonth.getFullYear();

    const days = useMemo(() => {
        const startOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
        const endOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
        const startDay = startOfMonth.getDay();
        const totalDays = endOfMonth.getDate();
        const cells: Date[] = [];

        const totalCells = Math.ceil((startDay + totalDays) / 7) * 7;
        for (let i = 0; i < totalCells; i++) {
            const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), i - startDay + 1);
            cells.push(date);
        }

        return cells;
    }, [visibleMonth]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        const dayKeySet = new Set<string>();

        days.forEach((day) => {
            const key = day.toDateString();
            dayKeySet.add(key);
            map.set(key, []);
        });

        events.forEach((event) => {
            const key = event.startTime.toDateString();
            if (!dayKeySet.has(key)) return;
            map.get(key)!.push(event);
        });

        return map;
    }, [days, events]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Calendar Grid - Google Calendar Style */}
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-7 gap-px bg-[#e6e6e6]">
                    {/* Day Labels */}
                    {dayLabels.map((label) => (
                        <div
                            key={label}
                            className="text-center text-[11px] font-medium text-[#70757a] py-2 bg-white"
                        >
                            {label}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {days.map((date) => {
                        const isSelected = isSameDay(date, currentDate);
                        const isToday = isSameDay(date, new Date());
                        const dayEvents = eventsByDay.get(date.toDateString()) ?? [];
                        const isCurrentMonthDay = isCurrentMonth(date);

                        return (
                            <div
                                key={date.toISOString()}
                                className={cn(
                                    'min-h-[120px] bg-white p-2 flex flex-col hover:bg-[#f8f9fa] transition-colors duration-150',
                                    !isCurrentMonthDay && 'bg-[#fafafa]'
                                )}
                            >
                                {/* Date Number - Google Calendar Style */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onDateSelect?.(date);
                                        setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                                    }}
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-medium mb-2 transition-all duration-200 self-start cursor-pointer',
                                        isToday &&
                                        'bg-[#1a73e8] text-white font-semibold shadow-sm hover:bg-[#1557b0]',
                                        isSelected &&
                                        !isToday &&
                                        'bg-[#e8f0fe] text-[#1a73e8] font-semibold hover:bg-[#d2e3fc]',
                                        !isSelected &&
                                        !isToday &&
                                        'text-[#3c4043] hover:bg-[#f1f3f4]',
                                        !isCurrentMonthDay && 'text-[#9aa0a6]'
                                    )}
                                >
                                    {date.getDate()}
                                </button>

                                {/* Event Indicators - Google Calendar Style (Dots) */}
                                <div className="flex-1 flex flex-col gap-1">
                                    {dayEvents.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-1">
                                            {dayEvents.slice(0, 3).map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="h-1.5 rounded-full flex-1 min-w-[4px]"
                                                    style={{ backgroundColor: event.color }}
                                                    title={event.title}
                                                />
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div
                                                    className="h-1.5 rounded-full flex-1 min-w-[4px] bg-[#dadce0]"
                                                    title={`${dayEvents.length - 3} more events`}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Event Titles (First 2 events) - Google Calendar Style */}
                                    {dayEvents.slice(0, 2).map((event) => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick?.(event);
                                            }}
                                            className="text-left text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] truncate hover:opacity-90 transition-all duration-150 hover:shadow-sm cursor-pointer"
                                            style={{
                                                backgroundColor: `${event.color}20`,
                                                color: event.color,
                                                borderLeft: `3px solid ${event.color}`,
                                            }}
                                            title={event.title}
                                        >
                                            <HighlightText text={event.title} highlight={event.searchTerm || ''} />
                                        </button>
                                    ))}

                                    {/* More Events Indicator */}
                                    {dayEvents.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Show all events for this day
                                                if (dayEvents.length > 2) {
                                                    onDateSelect?.(date);
                                                }
                                            }}
                                            className="text-left text-[11px] font-medium text-[#70757a] px-1.5 py-0.5 hover:text-[#1a73e8] transition-colors cursor-pointer"
                                        >
                                            {dayEvents.length > 2
                                                ? `+${dayEvents.length - 2} more`
                                                : `${dayEvents.length - 2} more`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarMonthView;
