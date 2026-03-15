import React, { useMemo } from 'react';
import type { Lecture } from './types';

interface LecturesCalendarProps {
    days: Date[];
    lectures: Lecture[];
    startHour?: number;
    endHour?: number;
    onSelectLecture?: (lecture: Lecture) => void;
}

const HOUR_HEIGHT = 60;

const LecturesCalendar: React.FC<LecturesCalendarProps> = ({
    days,
    lectures,
    startHour = 7,
    endHour = 18,
    onSelectLecture,
}) => {
    const hours = useMemo(() => {
        const list: number[] = [];
        for (let h = startHour; h <= endHour; h++) {
            list.push(h);
        }
        return list;
    }, [startHour, endHour]);

    const dayLectures = useMemo(() => {
        const map = new Map<string, Lecture[]>();
        days.forEach((day) => {
            const key = day.toDateString();
            const dayEvents = lectures.filter((lecture) => lecture.scheduleDate && isSameDay(lecture.scheduleDate, day));
            map.set(key, dayEvents);
        });
        return map;
    }, [days, lectures]);

    return (
        <div className="border border-[#e6e6e6] rounded-[10px] overflow-hidden bg-white">
            <div className="flex border-b border-[#e6e6e6] bg-[#f7f8f9]">
                <div className="w-[60px]" />
                <div
                    className="flex-1 grid"
                    style={{
                        gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                    }}
                >
                    {days.map((day) => (
                        <div key={day.toISOString()} className="py-3 text-center border-l border-[#e6e6e6] first:border-l-0">
                            <p className="text-[14px] font-semibold text-[#535352]">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className="text-[18px] font-semibold text-black">{day.getDate()}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex">
                <div className="w-[60px] border-r border-[#e6e6e6] bg-[#f7f8f9]">
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="h-[60px] text-[12px] text-[#535352] flex items-start justify-end pr-2"
                        >
                            {formatHourLabel(hour)}
                        </div>
                    ))}
                </div>
                <div className="flex-1 relative" style={{ height: `${(endHour - startHour) * HOUR_HEIGHT}px` }}>
                    <div className="absolute inset-0 pointer-events-none">
                        {hours.map((_, index) => (
                            <div
                                key={index}
                                className="border-t border-[#e6e6e6]"
                                style={{ position: 'absolute', top: `${index * HOUR_HEIGHT}px`, left: 0, right: 0 }}
                            />
                        ))}
                    </div>
                    <div
                        className="grid h-full"
                        style={{
                            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {days.map((day) => {
                            const key = day.toDateString();
                            const events = dayLectures.get(key) ?? [];
                            return (
                                <div key={key} className="border-l border-[#e6e6e6] relative first:border-l-0">
                                    {events.map((lecture) => {
                                        const { start, end } = parseTimeRange(lecture.scheduleTime);
                                        const clampedStart = Math.max(start, startHour);
                                        const clampedEnd = Math.min(end, endHour);
                                        const top = (clampedStart - startHour) * HOUR_HEIGHT;
                                        const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 50);
                                        return (
                                            <button
                                                type="button"
                                                key={lecture.id}
                                                onClick={() => onSelectLecture?.(lecture)}
                                                className="absolute left-[10%] right-[10%] rounded-[10px] bg-[#0B7BFF] text-white p-3 flex flex-col text-left shadow-[0_10px_15px_-3px_rgba(15,23,42,0.25)] cursor-pointer hover:opacity-90"
                                                style={{
                                                    top,
                                                    height,
                                                }}
                                            >
                                                <p className="text-[13px] font-semibold leading-tight">{lecture.module}</p>
                                                <p className="text-[12px] font-medium">{lecture.scheduleTime}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const parseTimeRange = (range: string) => {
    const normalized = range.replace('–', '-');
    const [startRaw, endRaw] = normalized.split('-').map((item) => item.trim());
    const end = parseTime(endRaw);
    const start = parseTime(startRaw.includes('AM') || startRaw.includes('PM') ? startRaw : `${startRaw} ${end.period}`);

    return {
        start: start.hours,
        end: end.hours,
    };
};

const parseTime = (value: string) => {
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
        return { hours: 0, period: 'AM' as const };
    }
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase() as 'AM' | 'PM';
    if (period === 'PM' && hour !== 12) {
        hour += 12;
    }
    if (period === 'AM' && hour === 12) {
        hour = 0;
    }
    return { hours: hour + minute / 60, period };
};

const formatHourLabel = (hour: number) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalized = hour % 12 === 0 ? 12 : hour % 12;
    return `${normalized}:00 ${suffix}`;
};

export default LecturesCalendar;



