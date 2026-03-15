import React, { useMemo, useState, useRef, useEffect } from 'react';
import LectureFilter from './LectureFilter';
import type { Lecture, LectureFilterState } from './types';
import { CalendarDayView, CalendarWeekView, CalendarMonthView } from '../calendar/views';
import CalendarHeader from '../calendar/CalendarHeader';
import CalendarSidebar from '../calendar/CalendarSidebar';
import { isSameDay, getWeekDays, getPreviousDate, getNextDate } from '../calendar/utils';
import type { CalendarEvent } from '../calendar/types';
import { formatToDateTimeOffset } from '../../utils/dateUtils';
import { lectureService } from '../../services/lectureService';
import type { LectureCalendarEventItem, ScheduleDto } from '../../types/lecture';

interface LecturesCalendarWeekProps {
    onSelectLecture?: (lecture: Lecture) => void;
    onNewSchedule?: () => void;
    onRescheduleRequest?: () => void;
}

type ViewType = 'day' | 'week' | 'month';

const LecturesCalendarWeek: React.FC<LecturesCalendarWeekProps> = ({
    onSelectLecture,
    onNewSchedule,
    onRescheduleRequest,
}) => {
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [showLectureLoading, setShowLectureLoading] = useState(false);
    const [showScheduleLoading, setShowScheduleLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewType, setViewType] = useState<ViewType>('week');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<LectureFilterState | null>(null);
    const filterButtonRef = useRef<HTMLButtonElement | null>(null);
    const lectureLoaderTimerRef = useRef<number | null>(null);
    const scheduleLoaderTimerRef = useRef<number | null>(null);
    const lectureLoaderHideTimerRef = useRef<number | null>(null);
    const scheduleLoaderHideTimerRef = useRef<number | null>(null);
    const lectureLoaderShownAtRef = useRef<number | null>(null);
    const scheduleLoaderShownAtRef = useRef<number | null>(null);
    const showLectureLoadingRef = useRef(false);
    const showScheduleLoadingRef = useRef(false);
    const lastFetchRangeKeyRef = useRef<string>('');

    const toDisplayTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };
    useEffect(() => {
        showLectureLoadingRef.current = showLectureLoading;
    }, [showLectureLoading]);

    useEffect(() => {
        showScheduleLoadingRef.current = showScheduleLoading;
    }, [showScheduleLoading]);

    const startLectureLoader = () => {
        if (lectureLoaderTimerRef.current) window.clearTimeout(lectureLoaderTimerRef.current);
        if (lectureLoaderHideTimerRef.current) window.clearTimeout(lectureLoaderHideTimerRef.current);
        lectureLoaderShownAtRef.current = Date.now();
        setShowLectureLoading(true);
    };

    const stopLectureLoader = () => {
        if (lectureLoaderTimerRef.current) {
            window.clearTimeout(lectureLoaderTimerRef.current);
            lectureLoaderTimerRef.current = null;
        }
        if (!showLectureLoadingRef.current) {
            setShowLectureLoading(false);
            return;
        }
        const minVisibleMs = 260;
        const elapsed = lectureLoaderShownAtRef.current ? Date.now() - lectureLoaderShownAtRef.current : minVisibleMs;
        const remaining = Math.max(0, minVisibleMs - elapsed);
        if (lectureLoaderHideTimerRef.current) window.clearTimeout(lectureLoaderHideTimerRef.current);
        lectureLoaderHideTimerRef.current = window.setTimeout(() => {
            setShowLectureLoading(false);
            lectureLoaderShownAtRef.current = null;
            lectureLoaderHideTimerRef.current = null;
        }, remaining);
    };

    const startScheduleLoader = () => {
        if (scheduleLoaderTimerRef.current) window.clearTimeout(scheduleLoaderTimerRef.current);
        if (scheduleLoaderHideTimerRef.current) window.clearTimeout(scheduleLoaderHideTimerRef.current);
        scheduleLoaderShownAtRef.current = Date.now();
        setShowScheduleLoading(true);
    };

    const stopScheduleLoader = () => {
        if (scheduleLoaderTimerRef.current) {
            window.clearTimeout(scheduleLoaderTimerRef.current);
            scheduleLoaderTimerRef.current = null;
        }
        if (!showScheduleLoadingRef.current) {
            setShowScheduleLoading(false);
            return;
        }
        const minVisibleMs = 260;
        const elapsed = scheduleLoaderShownAtRef.current ? Date.now() - scheduleLoaderShownAtRef.current : minVisibleMs;
        const remaining = Math.max(0, minVisibleMs - elapsed);
        if (scheduleLoaderHideTimerRef.current) window.clearTimeout(scheduleLoaderHideTimerRef.current);
        scheduleLoaderHideTimerRef.current = window.setTimeout(() => {
            setShowScheduleLoading(false);
            scheduleLoaderShownAtRef.current = null;
            scheduleLoaderHideTimerRef.current = null;
        }, remaining);
    };

    // Get the week days (Sunday to Saturday)
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Filter lectures based on search and filters
    const filteredLectures = useMemo(() => {
        let filtered = [...lectures];

        // Apply search filter
        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(
                (lecture) =>
                    lecture.module.toLowerCase().includes(query) ||
                    lecture.batchCode.toLowerCase().includes(query) ||
                    lecture.venue.toLowerCase().includes(query)
            );
        }

        // Apply filters
        if (filters) {
            if (filters.venue?.length) {
                filtered = filtered.filter((lecture) => filters.venue!.includes(lecture.venue));
            }
            if (filters.module?.length) {
                filtered = filtered.filter((lecture) => filters.module!.includes(lecture.module));
            }
            if (filters.batchCode?.length) {
                filtered = filtered.filter((lecture) => filters.batchCode!.includes(lecture.batchCode));
            }
            if (filters.date) {
                const filterDate = new Date(filters.date);
                filterDate.setHours(0, 0, 0, 0);
                filtered = filtered.filter((lecture) => {
                    if (!lecture.scheduleDate) return false;
                    const lectureDate = new Date(lecture.scheduleDate);
                    lectureDate.setHours(0, 0, 0, 0);
                    return lectureDate.getTime() === filterDate.getTime();
                });
            }
        }

        return filtered;
    }, [lectures, searchTerm, filters]);

    const getViewRange = (date: Date, currentView: ViewType) => {
        let start = new Date(date);
        let end = new Date(date);

        if (currentView === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (currentView === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day;
            start = new Date(start.setDate(diff));
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else {
            start = new Date(start.getFullYear(), start.getMonth(), 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        }

        return { start, end };
    };

    const formatScheduleTime = (start: Date, end: Date) => {
        return `${toDisplayTime(start)} - ${toDisplayTime(end)}`;
    };

    const mapApiEventToLecture = (event: LectureCalendarEventItem): Lecture => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const safeStart = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
        const safeEnd = Number.isNaN(endDate.getTime()) ? new Date(safeStart.getTime() + 60 * 60 * 1000) : endDate;

        return {
            id: event.id,
            level: '',
            program: '',
            module: event.title || 'Lecture',
            batchCode: event.batch_info || '',
            scheduleDate: safeStart,
            scheduleTime: formatScheduleTime(safeStart, safeEnd),
            days: [safeStart.toLocaleDateString('en-US', { weekday: 'long' })],
            venue: '',
            mode: '',
            noOfSessions: null,
            noOfStudents: null,
            courseAdmin: event.facultyName || '',
        };
    };

    const mapScheduleToLecture = (lectureId: string, schedule: ScheduleDto): Lecture => {
        const start = schedule?.scheduleFrom ? new Date(schedule.scheduleFrom) : null;
        const end = schedule?.scheduleTo ? new Date(schedule.scheduleTo) : null;
        const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
        const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;

        return {
            id: lectureId,
            level: '',
            program: '',
            module: schedule?.moduleName || schedule?.eventTitle || '',
            batchCode: schedule?.batchCode || '',
            scheduleDate: validStart,
            scheduleTime:
                validStart && validEnd
                    ? formatScheduleTime(validStart, validEnd)
                    : '',
            days: validStart
                ? [validStart.toLocaleDateString('en-US', { weekday: 'long' })]
                : [],
            venue: '',
            mode: '',
            noOfSessions: null,
            noOfStudents: null,
            courseAdmin: schedule?.facultyName || '',
        };
    };

    const fetchLectures = async (start: Date, end: Date) => {
        startLectureLoader();

        try {
            const response = await lectureService.getLectureCalendarInfo({
                viewStart: formatToDateTimeOffset(start),
                viewEnd: formatToDateTimeOffset(end),
                searchText: null,
                filter: null,
            });

            if (response.success && response.result?.events) {
                setLectures(response.result.events.map(mapApiEventToLecture));
            } else {
                setLectures([]);
            }
        } catch (error) {
            console.error('Failed to fetch lecture calendar:', error);
            setLectures([]);
        } finally {
            stopLectureLoader();
        }
    };

    useEffect(() => {
        const { start, end } = getViewRange(currentDate, viewType);
        const rangeKey = `${viewType}-${start.toISOString()}-${end.toISOString()}`;
        if (lastFetchRangeKeyRef.current === rangeKey) {
            return;
        }

        lastFetchRangeKeyRef.current = rangeKey;
        fetchLectures(start, end);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate, viewType]);

    useEffect(() => {
        return () => {
            if (lectureLoaderTimerRef.current) {
                window.clearTimeout(lectureLoaderTimerRef.current);
            }
            if (scheduleLoaderTimerRef.current) {
                window.clearTimeout(scheduleLoaderTimerRef.current);
            }
            if (lectureLoaderHideTimerRef.current) {
                window.clearTimeout(lectureLoaderHideTimerRef.current);
            }
            if (scheduleLoaderHideTimerRef.current) {
                window.clearTimeout(scheduleLoaderHideTimerRef.current);
            }
        };
    }, []);

    // Parse time range (e.g., "10:00 AM - 01:30 PM")
    const parseTimeRange = (timeRange: string, date: Date) => {
        const normalized = timeRange.replace('–', '-').replace('—', '-');
        const [startRaw, endRaw] = normalized.split('-').map((item) => item.trim());

        const parseTime = (value: string) => {
            const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (!match) {
                return { hours: 0, minutes: 0 };
            }
            let hour = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const period = match[3].toUpperCase() as 'AM' | 'PM';
            if (period === 'PM' && hour !== 12) {
                hour += 12;
            }
            if (period === 'AM' && hour === 12) {
                hour = 0;
            }
            return { hours: hour, minutes };
        };

        const start = parseTime(startRaw);
        const end = parseTime(endRaw);

        const startTime = new Date(date);
        startTime.setHours(start.hours, start.minutes, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(end.hours, end.minutes, 0, 0);

        return { startTime, endTime };
    };

    // Convert lectures to calendar events
    const calendarEvents = useMemo<CalendarEvent[]>(() => {
        return filteredLectures.reduce<CalendarEvent[]>((acc, lecture) => {
            if (!lecture.scheduleDate) return acc;
            const { startTime, endTime } = parseTimeRange(lecture.scheduleTime, lecture.scheduleDate);
            acc.push({
                id: lecture.id,
                type: 'lecture' as const,
                title: lecture.module,
                startTime,
                endTime,
                color: '#1E88E5', // Blue for lectures
                searchTerm, // pass the search term down
                onClick: () => onSelectLecture?.(lecture),
            });
            return acc;
        }, []);
    }, [filteredLectures, onSelectLecture, searchTerm]);

    const handleEventClick = async (event: CalendarEvent) => {
        if (event.type === 'lecture') {
            startScheduleLoader();

            const scheduleId = Number.parseInt(event.id, 10);
            if (!Number.isNaN(scheduleId)) {
                try {
                    const response = await lectureService.getScheduleInfo(scheduleId);
                    if (response.success && response.result?.schedule) {
                        onSelectLecture?.(mapScheduleToLecture(event.id, response.result.schedule));
                        stopScheduleLoader();
                        return;
                    }
                } catch (error) {
                    console.error('Failed to fetch schedule info:', error);
                }
            }

            // No fallback details from API event; show empty state fields when schedule info is unavailable.
            onSelectLecture?.({
                id: event.id,
                level: '',
                program: '',
                module: '',
                batchCode: '',
                scheduleDate: null,
                scheduleTime: '',
                days: [],
                venue: '',
                mode: '',
                noOfSessions: null,
                noOfStudents: null,
                courseAdmin: '',
            });
            stopScheduleLoader();
        }
    };

    const handlePreviousWeek = () => {
        setCurrentDate(getPreviousDate(currentDate, viewType));
    };

    const handleNextWeek = () => {
        setCurrentDate(getNextDate(currentDate, viewType));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Update currentDate when selectedDate changes in mini calendar
    useEffect(() => {
        if (!isSameDay(selectedDate, currentDate)) {
            setCurrentDate(selectedDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setCurrentDate(date);
        if (viewType === 'month') {
            setViewType('day');
        }
    };

    return (
        <div className="bg-white rounded-[10px] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)] w-full h-full flex">
            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <CalendarHeader
                    viewType={viewType}
                    currentDate={currentDate}
                    onViewChange={setViewType}
                    onToday={handleToday}
                    onPrevious={handlePreviousWeek}
                    onNext={handleNextWeek}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Start typing to look up sessions"
                    onFilterClick={() => setIsFilterOpen((prev) => !prev)}
                    filterButtonRef={filterButtonRef as React.RefObject<HTMLButtonElement | null>}
                />

                <div className="flex overflow-hidden flex-1">
                    {/* Sidebar */}
                    <CalendarSidebar
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        actionButtonsPosition="bottom"
                        actionButtons={
                            <>
                                <button
                                    type="button"
                                    onClick={onNewSchedule}
                                    className="bg-[#008080] flex items-center justify-center gap-[10px] py-[10px] rounded-[25px] text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="white" />
                                    </svg>
                                    <span>New Schedule</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onRescheduleRequest}
                                    className="bg-[#008080] flex items-center justify-center gap-[10px] py-[10px] rounded-[25px] text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="15" viewBox="0 0 13 15" fill="none">
                                        <path d="M0.75 7.25V5.08333C0.75 4.5087 0.967299 3.9576 1.35409 3.55127C1.74089 3.14494 2.26549 2.91667 2.8125 2.91667H11.75M11.75 2.91667L9.6875 0.75M11.75 2.91667L9.6875 5.08333M11.75 7.25V9.41667C11.75 9.9913 11.5327 10.5424 11.1459 10.9487C10.7591 11.3551 10.2345 11.5833 9.6875 11.5833H0.75M0.75 11.5833L2.8125 13.75M0.75 11.5833L2.8125 9.41667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Reschedule Request</span>
                                </button>
                            </>
                        }
                    />

                    {/* Calendar Views */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {(showLectureLoading || showScheduleLoading) && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[14px] font-medium text-[#1E88E5]">
                                        {showScheduleLoading ? 'Loading schedule info...' : 'Loading lectures...'}
                                    </p>
                                </div>
                            </div>
                        )}
                        {viewType === 'day' && (
                            <CalendarDayView
                                date={currentDate}
                                events={calendarEvents}
                                onEventClick={handleEventClick}
                            />
                        )}
                        {viewType === 'week' && (
                            <CalendarWeekView
                                days={weekDays}
                                events={calendarEvents}
                                onEventClick={handleEventClick}
                            />
                        )}
                        {viewType === 'month' && (
                            <CalendarMonthView
                                currentDate={currentDate}
                                events={calendarEvents}
                                onEventClick={handleEventClick}
                                onDateSelect={handleDateSelect}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Popover */}
            <LectureFilter
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                triggerRef={filterButtonRef}
                lectures={lectures}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setIsFilterOpen(false);
                }}
                onReset={() => {
                    setFilters(null);
                    setSearchTerm('');
                    setIsFilterOpen(false);
                }}
            />
        </div>
    );
};

export default LecturesCalendarWeek;
