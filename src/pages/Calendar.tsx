import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import type { Task, TaskStatus, Priority } from '../components/my-work/types';
import TaskDrawer from '../components/my-work/TaskDrawer';
import DeleteTaskModal from '../components/my-work/DeleteTaskModal';
import CustomToast from '../components/common/CustomToast';
import { CalendarDayView, CalendarWeekView, CalendarMonthView } from '../components/calendar/views';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarSidebar from '../components/calendar/CalendarSidebar';
import AddStaffModal from '../components/calendar/AddStaffModal';
import HolidayModal from '../components/calendar/HolidayModal';
import BirthdayModal from '../components/calendar/BirthdayModal';
import StaffPinnedSuccessModal from '../components/calendar/StaffPinnedSuccessModal';
import TaskInfoModal from '../components/calendar/TaskInfoModal';
import MeetingInfoModal from '../components/calendar/MeetingInfoModal';
import { isSameDay, getWeekDays, getPreviousDate, getNextDate } from '../components/calendar/utils';
import type { CalendarEvent, ViewType, Holiday, Birthday } from '../components/calendar/types';
import type { User, Meeting, MeetingStatus } from '../components/my-work/types';
import { calendarService } from '../services/calendarService';
import { taskService } from '../services/taskService';
import { meetingService } from '../services/meetingService';
import type { CalendarEventItem, CalendarStaffItem } from '../types/calendar';
import { parseUTCDate, formatToDateTimeOffset } from '../utils/dateUtils';
import { useMessengerContext } from '../contexts/MessengerContext';

const Calendar: React.FC = () => {
    const { setPageTitle } = useOutletContext<AppLayoutContext>();
    const { users: messengerUsers, fetchBootstrap: fetchMessengerBootstrap, currentUser } = useMessengerContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewType, setViewType] = useState<ViewType>('week');
    const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isMeetingDrawerOpen, setIsMeetingDrawerOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [selectedMeetingForModal, setSelectedMeetingForModal] = useState<Meeting | null>(null);
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
    const [selectedBirthday, setSelectedBirthday] = useState<Birthday | null>(null);
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [newlyPinnedStaff, setNewlyPinnedStaff] = useState<User | null>(null);
    const [allStaff, setAllStaff] = useState<User[]>([]);
    const [pinnedStaffList, setPinnedStaffList] = useState<User[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
        show: false,
        title: '',
        message: '',
    });
    const [apiEvents, setApiEvents] = useState<CalendarEventItem[]>([]);
    const [isCalendarConnected, setIsCalendarConnected] = useState<boolean | null>(null);
    const [isCheckingCalendarStatus, setIsCheckingCalendarStatus] = useState(true);
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingTaskDetails, setIsFetchingTaskDetails] = useState(false);

    useEffect(() => {
        void fetchMessengerBootstrap();
    }, [fetchMessengerBootstrap]);

    const liveStatusByUserId = useMemo(() => {
        const map: Record<string, 'online' | 'away' | 'busy' | 'offline'> = {};
        for (const user of messengerUsers) {
            map[user.id] = user.status ?? 'offline';
        }
        return map;
    }, [messengerUsers]);

    const getStaffStatus = useCallback((staffId: string) => {
        return liveStatusByUserId[staffId] ?? 'away';
    }, [liveStatusByUserId]);

    const mapStaffToUser = (staff: CalendarStaffItem): User => ({
        id: String(staff.id),
        name: staff.name,
        position: staff.designation || 'Staff',
        email: staff.email || '',
        avatar: staff.profileImageUrl || undefined,
    });

    const fetchCalendarStatus = async () => {
        setIsCheckingCalendarStatus(true);
        try {
            const response = await calendarService.getStatus();
            if (response.success && response.result) {
                setIsCalendarConnected(response.result.isConnected);
                return;
            }

            setIsCalendarConnected(false);
        } catch (error) {
            console.error('Error fetching calendar status:', error);
            setIsCalendarConnected(false);
        } finally {
            setIsCheckingCalendarStatus(false);
        }
    };

    const fetchCalendarBootstrap = async () => {
        try {
            const response = await calendarService.getBootstrap();
            if (!response.success || !response.result) {
                return;
            }

            const users = (response.result.staffs || []).map(mapStaffToUser);
            const pinnedIdSet = new Set((response.result.pinnedStaffIds || []).map((id) => String(id)));

            setAllStaff(users);
            setPinnedStaffList(users.filter((user) => pinnedIdSet.has(user.id)));
        } catch (error) {
            console.error('Error fetching calendar bootstrap:', error);
            showToast('Error', 'Failed to load calendar staff');
        }
    };

    const pinnedStaffIds = useMemo(() => {
        return pinnedStaffList.map((staff) => staff.id);
    }, [pinnedStaffList]);

    const triggerCalendarConnect = useGoogleLogin({
        flow: 'auth-code',
        ux_mode: 'redirect',
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        scope: 'openid email profile https://www.googleapis.com/auth/calendar',
        prompt: 'consent',
        access_type: 'offline',
        include_granted_scopes: true,
        onError: () => {
            setIsConnectingCalendar(false);
            showToast('Calendar Connection Failed', 'Google authorization was cancelled or failed.');
        }
    } as any);

    const handleConnectCalendar = () => {
        setIsConnectingCalendar(true);
        sessionStorage.setItem('googleAuthSource', 'calendar_connect');
        sessionStorage.setItem('googlePostAuthRedirect', '/calendar?calendarConnected=1');
        triggerCalendarConnect();
    };

    useEffect(() => {
        setPageTitle('Calendar');
    }, [setPageTitle]);

    useEffect(() => {
        const calendarConnectError = searchParams.get('calendarConnectError');
        const calendarConnected = searchParams.get('calendarConnected');

        if (calendarConnectError) {
            setIsConnectingCalendar(false);
            showToast('Calendar Connection Failed', calendarConnectError);
            const params = new URLSearchParams(searchParams);
            params.delete('calendarConnectError');
            setSearchParams(params, { replace: true });
        }

        if (calendarConnected === '1') {
            setIsConnectingCalendar(false);
            void fetchCalendarStatus();
            showToast('Calendar Connected', 'Google Calendar connected successfully.');
            const params = new URLSearchParams(searchParams);
            params.delete('calendarConnected');
            setSearchParams(params, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        void fetchCalendarBootstrap();
        void fetchCalendarStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCalendarEvents = async () => {
        setIsLoading(true);

        let start = new Date(currentDate);
        let end = new Date(currentDate);

        if (viewType === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (viewType === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day;
            start = new Date(new Date(start).setDate(diff));
            start.setHours(0, 0, 0, 0);
            end = new Date(new Date(start).setDate(start.getDate() + 6));
            end.setHours(23, 59, 59, 999);
        } else if (viewType === 'month') {
            start = new Date(start.getFullYear(), start.getMonth(), 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        }

        const params = {
            from: formatToDateTimeOffset(start),
            to: formatToDateTimeOffset(end)
        };

        try {
            const response = await calendarService.getEvents(params);
            if (response.success && response.result?.items) {
                setApiEvents(response.result.items);
            }
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            showToast('Error', 'Failed to load calendar events');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isCalendarConnected !== true) {
            setApiEvents([]);
            setIsLoading(false);
            return;
        }

        fetchCalendarEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate, viewType, isCalendarConnected]);

    // Get the week days (Sunday to Saturday)
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Convert tasks, meetings, and lectures to calendar events
    const calendarEvents = useMemo<CalendarEvent[]>(() => {
        const events: CalendarEvent[] = [];
        const getBirthdayDisplayName = (event: CalendarEventItem): string => {
            if (event.personName?.trim()) {
                return event.personName.trim().split(' ')[0];
            }
            const raw = event.title.replace(/^birthday[\s:-]*/i, '').trim() || event.title;
            return raw.split(' ')[0] || raw;
        };

        // Add API events
        apiEvents.forEach((event) => {
            const typeMap: Record<string, 'task' | 'meeting' | 'lecture' | 'holiday' | 'birthday'> = {
                'MYTASK': 'task',
                'MEETING': 'meeting',
                'LECTURE': 'lecture',
                'HOLIDAY': 'holiday',
                'BIRTHDAY': 'birthday'
            };

            const colorMap: Record<string, string> = {
                'task': '#1E88E5',
                'meeting': '#1E88E5',
                'lecture': '#F59E0B',
                'holiday': '#16A34A',
                'birthday': '#7C62C4'
            };

            const type = typeMap[event.sourceEntityType.toUpperCase()] || 'task';
            const color = colorMap[type];

            const startTime = new Date(event.start);
            let endTime = new Date(event.end);

            // If duration is 0 for timed events, set it to 1 hour for visibility.
            if (!event.isAllDay && startTime.getTime() === endTime.getTime()) {
                endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            }

            const title =
                type === 'birthday'
                    ? `${getBirthdayDisplayName(event)}'s Birthday!`
                    : event.title;

            events.push({
                id: event.eventId,
                type: type,
                title,
                startTime: startTime,
                endTime: endTime,
                isAllDay: event.isAllDay,
                color: color,
                sourceEntityId: event.sourceEntityId,
                sourceEntityType: event.sourceEntityType,
                personName: event.personName || undefined,
                personPosition: event.personPosition || undefined,
                profileImageUrl: event.profileImageUrl || undefined,
                department: event.department || undefined,
                personEmail: event.personEmail || undefined,
            });
        });

        return events;
    }, [apiEvents]);

    // Get filtered events (currently no filtering applied)
    const filteredEvents = useMemo(() => {
        return calendarEvents;
    }, [calendarEvents]);

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

    const mapApiTaskToUITask = (apiTask: any): Task => {
        const statusMap: Record<number, TaskStatus> = {
            1: 'todo',
            2: 'in-progress',
            3: 'completed',
            4: 'overdue'
        };
        const priorityRevMap: Record<number, Priority> = {
            1: 'low',
            2: 'medium',
            3: 'high'
        };

        const dueDate = parseUTCDate(apiTask.dueStart) || new Date();

        const mapComment = (c: any, isReply: boolean = false): any => ({
            id: isReply ? `r-${c.replyId}` : `c-${c.commentId}`,
            text: (c.text || c.commentText || c.replyText || '').trim(),
            author: {
                id: (c.authorId || '').toString(),
                name: c.authorName || 'Unknown',
                avatar: c.authorProfileImageUrl,
                position: '',
                email: '',
            },
            createdAt: parseUTCDate(c.createdOn) || new Date(),
            likes: c.likes || 0,
            dislikes: c.dislikes || 0,
            userLiked: c.userLiked || false,
            userDisliked: c.userDisliked || false,
            replies: c.replies?.map((r: any) => mapComment(r, true)) || [],
        });

        return {
            id: apiTask.taskId.toString(),
            title: apiTask.title,
            description: apiTask.description,
            status: statusMap[apiTask.statusId] || 'todo',
            priority: priorityRevMap[apiTask.priorityId] || 'medium',
            dueDate: dueDate,
            dueTime: apiTask.isEndOfDay ? 'EOD' : (apiTask.isAllDay ? 'All Day' : undefined),
            assignedTo: apiTask.participants?.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                position: p.designation,
                email: '',
                avatar: p.imageUrl,
            })) || [],
            createdBy: {
                id: apiTask.createdById.toString(),
                name: apiTask.createdByName,
                position: 'User',
                email: '',
            },
            createdAt: parseUTCDate(apiTask.createdOn) || new Date(),
            updatedAt: parseUTCDate(apiTask.updatedOn) || new Date(),
            attachments: apiTask.attachments?.map((att: any) => ({
                id: att.attachmentId.toString(),
                name: att.fileName || att.displayText,
                type: att.attachmentType.toLowerCase() === 'file' ? 'pdf' : 'link', // Simplification
                url: att.url,
            })) || [],
            commentCount: apiTask.comments?.length || 0,
            comments: apiTask.comments?.map(mapComment) || [],
            showComments: apiTask.showComments ?? true,
            addToCalendar: apiTask.addToCalendar,
        };
    };

    const mapApiMeetingToUIMeeting = (apiMeeting: any): Meeting => {
        const statusMap: Record<number, MeetingStatus> = {
            1: 'todo',
            2: 'in-progress',
            3: 'completed',
            4: 'overdue'
        };
        const priorityMap: Record<number, Priority> = {
            1: 'low',
            2: 'medium',
            3: 'high'
        };

        const dueStart = parseUTCDate(apiMeeting.dueStart) || new Date();
        const dueEnd = parseUTCDate(apiMeeting.dueEnd) || dueStart;

        const mapComment = (c: any): any => ({
            id: (c.replyId || c.commentId || Math.random()).toString(),
            text: (c.text || c.commentText || c.replyText || '').trim(),
            author: {
                id: (c.authorId || '').toString(),
                name: c.authorName || 'Unknown',
                avatar: c.authorProfileImageUrl,
                position: '',
                email: '',
            },
            createdAt: parseUTCDate(c.createdOn) || new Date(),
            likes: c.likes || 0,
            dislikes: c.dislikes || 0,
            userLiked: c.userLiked || false,
            userDisliked: c.userDisliked || false,
            replies: c.replies?.map(mapComment) || [],
        });

        return {
            id: String(apiMeeting.taskId ?? apiMeeting.id),
            title: apiMeeting.title || '',
            description: apiMeeting.description || '',
            status: statusMap[apiMeeting.statusId] || 'todo',
            date: dueStart,
            time: `${dueStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${dueEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            attendees: (apiMeeting.participants || []).map((p: any) => ({
                id: String(p.id),
                name: p.name || '',
                position: p.designation || 'User',
                email: '',
                avatar: p.imageUrl
            })),
            createdBy: {
                id: String(apiMeeting.createdById || ''),
                name: apiMeeting.createdByName || 'User',
                position: 'User',
                email: ''
            },
            priority: priorityMap[apiMeeting.priorityId] || 'medium',
            attachments: (apiMeeting.attachments || []).map((att: any) => ({
                id: String(att.attachmentId),
                name: att.fileName || att.displayText,
                type: att.attachmentType?.toLowerCase?.() === 'link' ? 'link' : 'pdf',
                url: att.url
            })),
            commentCount: apiMeeting.comments?.length || 0,
            comments: apiMeeting.comments?.map(mapComment) || [],
            venue: apiMeeting.venueDesc || 'N/A',
            addToCalendar: apiMeeting.addToCalendar ?? true
        };
    };

    const handleEventClick = async (event: CalendarEvent) => {
        if (event.type === 'task') {
            if (event.sourceEntityId && event.sourceEntityType === 'MYTASK') {
                setIsFetchingTaskDetails(true);
                try {
                    const response = await taskService.getSingleTaskInfo(event.sourceEntityId);
                    if (response.success && response.result) {
                        const mappedTask = mapApiTaskToUITask(response.result);
                        setSelectedTaskForModal(mappedTask);
                        setIsTaskModalOpen(true);
                    } else {
                        showToast('Error', response.message || 'Failed to fetch task details');
                    }
                } catch (error) {
                    console.error('Error fetching task details:', error);
                    showToast('Error', 'Failed to fetch task details');
                } finally {
                    setIsFetchingTaskDetails(false);
                }
                return;
            }
        } else if (event.type === 'meeting') {
            if (event.sourceEntityId && event.sourceEntityType === 'MEETING') {
                try {
                    const response = await meetingService.getSingleMeeting(event.sourceEntityId);
                    if (response.success && response.result) {
                        const mappedMeeting = mapApiMeetingToUIMeeting(response.result);
                        setSelectedMeetingForModal(mappedMeeting);
                        setIsMeetingModalOpen(true);
                    } else {
                        showToast('Error', response.message || 'Failed to fetch meeting details');
                    }
                } catch (error) {
                    console.error('Error fetching meeting details:', error);
                    showToast('Error', 'Failed to fetch meeting details');
                }
                return;
            }
        } else if (event.type === 'holiday') {
            setSelectedHoliday({
                id: event.id,
                title: event.title,
                date: event.startTime,
                description: 'Holiday',
            });
        } else if (event.type === 'birthday') {
            const name =
                event.personName ||
                event.title.replace(/^birthday[\s:-]*/i, '').trim() ||
                event.title;
            setSelectedBirthday({
                id: event.id,
                title: event.title,
                date: event.startTime,
                person: {
                    name,
                    position: event.personPosition || event.department || '',
                    avatar: event.profileImageUrl,
                    email: event.personEmail,
                },
            });
        }
    };

    // Update currentDate when selectedDate changes in mini calendar
    useEffect(() => {
        if (!isSameDay(selectedDate, currentDate)) {
            setCurrentDate(selectedDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const showToast = (title: string, message: string) => {
        setToast({ show: true, title, message });
        setTimeout(() => {
            setToast({ show: false, title: '', message: '' });
        }, 3000);
    };

    const handleCreateTask = () => {
        showToast('Event Created', 'Your event has been created successfully.');
        setIsTaskDrawerOpen(false);
    };

    const handleUpdateTask = (updatedTask: Task) => {
        showToast('Event Updated', 'The event has been updated successfully.');
        setSelectedTask(updatedTask);
    };

    const handleTaskEdit = (task: Task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(false);
        setIsTaskDrawerOpen(true);
    };

    const handleTaskDelete = (taskId: string) => {
        setSelectedMeetingId(null);
        setSelectedTaskId(taskId);
        setIsTaskModalOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleMeetingEdit = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setIsMeetingModalOpen(false);
        setIsMeetingDrawerOpen(true);
    };

    const handleMeetingUpdate = (updatedMeeting: Meeting) => {
        showToast('Meeting Updated', 'The meeting has been updated successfully.');
        setSelectedMeeting(updatedMeeting);
    };

    const handleCreateMeeting = () => {
        showToast('Meeting Created', 'Your meeting has been created successfully.');
        setIsMeetingDrawerOpen(false);
    };

    const handleMeetingDelete = (meetingId: string) => {
        setSelectedTaskId(null);
        setSelectedMeetingId(meetingId);
        setIsMeetingModalOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedTaskId) {
            const taskId = parseInt(selectedTaskId, 10);
            if (Number.isNaN(taskId) || taskId <= 0) {
                showToast('Delete Failed', 'Invalid task id');
            } else {
                try {
                    const response = await taskService.deleteTask(taskId);
                    if (response.success) {
                        showToast('Task Deleted', 'The task has been permanently deleted.');
                        await fetchCalendarEvents();
                    } else {
                        showToast('Delete Failed', response.message || 'Failed to delete task.');
                    }
                } catch (error) {
                    console.error('Error deleting task:', error);
                    showToast('Delete Error', 'Unexpected error while deleting task.');
                }
            }
            setSelectedTaskId(null);
        } else if (selectedMeetingId) {
            const meetingId = parseInt(selectedMeetingId, 10);
            if (Number.isNaN(meetingId) || meetingId <= 0) {
                showToast('Delete Failed', 'Invalid meeting id');
            } else {
                try {
                    const response = await meetingService.deleteMeeting(meetingId);
                    if (response.success) {
                        showToast('Meeting Deleted', 'The meeting has been permanently deleted.');
                        await fetchCalendarEvents();
                    } else {
                        showToast('Delete Failed', response.message || 'Failed to delete meeting.');
                    }
                } catch (error) {
                    console.error('Error deleting meeting:', error);
                    showToast('Delete Error', 'Unexpected error while deleting meeting.');
                }
            }
            setSelectedMeetingId(null);
        }
        setIsDeleteModalOpen(false);
        setSelectedTaskForModal(null);
        setSelectedMeetingForModal(null);
    };

    const handleJoinMeeting = (meetingLink?: string) => {
        if (meetingLink) {
            window.open(meetingLink, '_blank');
        }
    };

    const handleMeetingStatusChange = (meetingId: string, newStatus: MeetingStatus) => {
        if (selectedMeetingForModal && selectedMeetingForModal.id === meetingId) {
            setSelectedMeetingForModal({
                ...selectedMeetingForModal,
                status: newStatus
            });
        }
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setCurrentDate(date);
        if (viewType === 'month') {
            setViewType('day');
        }
    };

    const handlePinStaff = async (staff: User) => {
        const staffUserId = Number(staff.id);
        if (!Number.isFinite(staffUserId) || staffUserId <= 0) {
            return;
        }

        try {
            const response = await calendarService.togglePinned({
                staffUserId,
                isPinned: true
            });

            if (!response.success) {
                showToast('Pin Failed', response.message || 'Unable to pin staff');
                return;
            }

            setPinnedStaffList((prev) =>
                prev.some((x) => x.id === staff.id) ? prev : [...prev, staff]
            );
            setNewlyPinnedStaff(staff);
            setIsAddStaffModalOpen(false);
            setIsSuccessModalOpen(true);
        } catch (error) {
            console.error('Error pinning staff:', error);
            showToast('Pin Failed', 'Unable to pin staff');
        }
    };

    return (
        <>
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
                    />

                    <div className="flex overflow-hidden flex-1">
                        {/* Sidebar */}
                        <CalendarSidebar
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            actionButtonsPosition="top"
                            pinnedStaff={pinnedStaffList}
                            onAddStaff={() => setIsAddStaffModalOpen(true)}
                            actionButtons={
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTask(null);
                                        setIsTaskDrawerOpen(true);
                                    }}
                                    className="bg-[#008080] flex items-center justify-center gap-[10px] py-[10px] rounded-[25px] text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="white" />
                                    </svg>
                                    <span>Create Task</span>
                                </button>
                            }
                        />

                        {/* Calendar Views */}
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {isCheckingCalendarStatus ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[14px] font-medium text-[#008080]">Checking calendar connection...</span>
                                    </div>
                                </div>
                            ) : isCalendarConnected === false ? (
                                <div className="h-full flex items-center justify-center px-6">
                                    <div className="max-w-md w-full text-center border border-[#D5E8E8] rounded-[14px] p-8 bg-[#F8FCFC]">
                                        <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-2">Google Calendar not connected</h3>
                                        <p className="text-[14px] text-[#4F4F4F] mb-6">
                                            Your Google Calendar is not connected. Connect now to view and sync your calendar events.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleConnectCalendar}
                                            disabled={isConnectingCalendar}
                                            className="bg-[#008080] text-white rounded-[25px] px-6 py-[10px] text-[14px] font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isConnectingCalendar ? 'Connecting...' : 'Connect Calendar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-[14px] font-medium text-[#008080]">Loading events...</span>
                                            </div>
                                        </div>
                                    )}
                                    {viewType === 'day' && (
                                        <CalendarDayView
                                            date={currentDate}
                                            events={filteredEvents}
                                            onEventClick={handleEventClick}
                                        />
                                    )}
                                    {viewType === 'week' && (
                                        <CalendarWeekView
                                            days={weekDays}
                                            events={filteredEvents}
                                            onEventClick={handleEventClick}
                                        />
                                    )}
                                    {viewType === 'month' && (
                                        <CalendarMonthView
                                            currentDate={currentDate}
                                            events={filteredEvents}
                                            onEventClick={handleEventClick}
                                            onDateSelect={handleDateSelect}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isFetchingTaskDetails && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[100] flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[16px] font-semibold text-[#008080]">Fetching Details...</span>
                    </div>
                </div>
            )}

            <TaskDrawer
                isOpen={isTaskDrawerOpen}
                task={selectedTask}
                onClose={() => {
                    setIsTaskDrawerOpen(false);
                    setSelectedTask(null);
                }}
                onSubmit={handleCreateTask}
                onUpdate={handleUpdateTask}
            />

            <TaskDrawer
                isOpen={isMeetingDrawerOpen}
                meeting={selectedMeeting}
                type="meeting"
                onClose={() => {
                    setIsMeetingDrawerOpen(false);
                    setSelectedMeeting(null);
                }}
                onMeetingSubmit={handleCreateMeeting}
                onMeetingUpdate={handleMeetingUpdate}
                onEdit={(meetingId: string) => {
                    if (selectedMeeting && selectedMeeting.id === meetingId) {
                        setSelectedMeeting(selectedMeeting);
                    }
                }}
                onDelete={(meetingId: string) => {
                    handleMeetingDelete(meetingId);
                    setIsMeetingDrawerOpen(false);
                    setSelectedMeeting(null);
                }}
            />

            <TaskInfoModal
                isOpen={isTaskModalOpen}
                task={selectedTaskForModal}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setSelectedTaskForModal(null);
                }}
                onEdit={handleTaskEdit}
                onDelete={handleTaskDelete}
            />

            <MeetingInfoModal
                isOpen={isMeetingModalOpen}
                meeting={selectedMeetingForModal}
                onClose={() => {
                    setIsMeetingModalOpen(false);
                    setSelectedMeetingForModal(null);
                }}
                onEdit={handleMeetingEdit}
                onDelete={handleMeetingDelete}
                onJoinMeeting={handleJoinMeeting}
                onStatusChange={handleMeetingStatusChange}
            />

            <HolidayModal
                isOpen={!!selectedHoliday}
                holiday={selectedHoliday}
                onClose={() => setSelectedHoliday(null)}
            />

            <BirthdayModal
                isOpen={!!selectedBirthday}
                birthday={selectedBirthday}
                onClose={() => setSelectedBirthday(null)}
            />

            <AddStaffModal
                isOpen={isAddStaffModalOpen}
                onClose={() => setIsAddStaffModalOpen(false)}
                onSelectStaff={handlePinStaff}
                staff={allStaff}
                pinnedStaffIds={pinnedStaffIds}
                getStaffStatus={getStaffStatus}
                currentUserId={currentUser.id}
            />

            <StaffPinnedSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => {
                    setIsSuccessModalOpen(false);
                    setNewlyPinnedStaff(null);
                }}
                staff={newlyPinnedStaff}
                onAddAnother={() => {
                    setIsSuccessModalOpen(false);
                    setNewlyPinnedStaff(null);
                    setIsAddStaffModalOpen(true);
                }}
            />

            <DeleteTaskModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedTaskId(null);
                    setSelectedMeetingId(null);
                }}
                onConfirm={handleConfirmDelete}
                type={selectedMeetingId ? 'meeting' : 'task'}
            />

            <CustomToast
                title={toast.title}
                message={toast.message}
                show={toast.show}
                onClose={() => setToast({ show: false, title: '', message: '' })}
            />
        </>
    );
};

export default Calendar;
