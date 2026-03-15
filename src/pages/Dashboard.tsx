import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import TodayWidget from '../components/dashboard/TodayWidget';
import type { TodayData } from '../components/dashboard/TodayWidget';
import UpcomingEventsWidget from '../components/dashboard/UpcomingEventsWidget';
import AvailabilityWidget from '../components/dashboard/AvailabilityWidget';
import type { AvailabilityItem } from '../components/dashboard/AvailabilityWidget';
import NewsUpdatesWidget from '../components/dashboard/NewsUpdatesWidget';
import PeopleMomentsWidget from '../components/dashboard/PeopleMomentsWidget';
import type { PeopleMoment } from '../components/dashboard/PeopleMomentsWidget';
import MyTasksWidget from '../components/dashboard/MyTasksWidget';
import MyProjectGroupsWidget from '../components/dashboard/MyProjectGroupsWidget';
import AvailabilityFilter from '../components/dashboard/AvailabilityFilter';
import UpcomingEventsFilter from '../components/dashboard/UpcomingEventsFilter';
import PeopleMomentsFilter from '../components/dashboard/PeopleMomentsFilter';
import WelcomePopup from '../components/news-updates/WelcomePopup';
import type { Post, UpdatesVariant } from '../components/news-updates/types';
import avatarPlaceholder from '../assets/images/avatar-placeholder-2.png';
import { useMessengerContext } from '../contexts/MessengerContext';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { dashboardService } from '../services/dashboardService';
import { STATUS_STORAGE_KEY, isValidStatusId } from '../components/common/header/statusOptions';
import type {
    DashboardDepartmentItem,
    DashboardLookupItem,
    DashboardPeopleMomentItem,
    DashboardNewsItem,
    DashboardTodayInfo,
    DashboardTaskApiAttachment,
    DashboardTaskApiItem,
    DashboardTaskCounts,
    DashboardTaskResult,
} from '../types/dashboard';
import type { Attachment as MyWorkAttachment, Priority as MyWorkPriority, Task as MyWorkTask, User as MyWorkUser } from '../components/my-work/types';
import { formatToDateTimeOffset } from '../utils/dateUtils';

const TODAY_UPDATED_EVENT = 'dashboard:today-updated';
const DEFAULT_UPCOMING_VIEW_TYPE_OPTIONS = [
    { value: 'myEvents', label: 'My Events' },
    { value: 'allEvents', label: 'All Events' },
];
const DEFAULT_PEOPLE_VIEW_TYPE_OPTIONS = [
    { value: 'birthdays', label: 'Birthdays' },
    { value: 'anniversaries', label: 'Work Anniversaries' },
    { value: 'both', label: 'Both' },
];
const DEFAULT_TIME_FRAME_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
];

const Dashboard: React.FC = () => {
    const { setPageTitle } = useOutletContext<AppLayoutContext>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        conversations,
        setConversations,
        hubConnection,
        toggleChatMuted,
        toggleChatPinned,
        toggleChatUnread,
    } = useMessengerContext();

    // Filter state
    const [availabilityFilterOpen, setAvailabilityFilterOpen] = useState(false);
    const [upcomingEventsFilterOpen, setUpcomingEventsFilterOpen] = useState(false);
    const [peopleMomentsFilterOpen, setPeopleMomentsFilterOpen] = useState(false);

    // Welcome Popup state
    const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
    const [welcomePopupVariant, setWelcomePopupVariant] = useState<UpdatesVariant>('Default');

    // Filter values
    const [availabilityFilters, setAvailabilityFilters] = useState<string[]>(['westford']);
    const [upcomingEventsFilters, setUpcomingEventsFilters] = useState({ viewType: 'myEvents', timeFrame: 'today' });
    const [peopleMomentsFilters, setPeopleMomentsFilters] = useState({ viewType: 'both', timeFrame: 'today' });
    const [atWorkItems, setAtWorkItems] = useState<AvailabilityItem[]>([]);
    const [atWorkLoading, setAtWorkLoading] = useState(true);
    const [dashboardTasks, setDashboardTasks] = useState<MyWorkTask[]>([]);
    const [dashboardTaskCounts, setDashboardTaskCounts] = useState<DashboardTaskCounts>({
        todo: 0,
        'in-progress': 0,
        completed: 0,
        overdue: 0,
    });
    const [dashboardTaskPage, setDashboardTaskPage] = useState(0);
    const [dashboardTaskHasMore, setDashboardTaskHasMore] = useState(true);
    const [dashboardTaskLoadingMore, setDashboardTaskLoadingMore] = useState(false);
    const [dashboardTaskSelectedDate, setDashboardTaskSelectedDate] = useState(new Date());
    const [dashboardNewsPosts, setDashboardNewsPosts] = useState<Post[]>([]);
    const [dashboardNewsLoading, setDashboardNewsLoading] = useState(true);
    const [dashboardTodayInfo, setDashboardTodayInfo] = useState<TodayData | undefined>(undefined);
    const [dashboardPeopleMoments, setDashboardPeopleMoments] = useState<PeopleMoment[]>([]);
    const [dashboardPeopleMomentsLoading, setDashboardPeopleMomentsLoading] = useState(true);
    const [upcomingViewTypeOptions, setUpcomingViewTypeOptions] = useState(DEFAULT_UPCOMING_VIEW_TYPE_OPTIONS);
    const [peopleViewTypeOptions, setPeopleViewTypeOptions] = useState(DEFAULT_PEOPLE_VIEW_TYPE_OPTIONS);
    const [timeFrameOptions, setTimeFrameOptions] = useState(DEFAULT_TIME_FRAME_OPTIONS);
    const [availabilityDepartmentOptions, setAvailabilityDepartmentOptions] = useState<DashboardDepartmentItem[]>([]);

    // Refs for filter buttons
    const availabilityFilterRef = useRef<HTMLButtonElement>(null);
    const upcomingEventsFilterRef = useRef<HTMLButtonElement>(null);
    const peopleMomentsFilterRef = useRef<HTMLButtonElement>(null);
    const peopleMomentsRequestIdRef = useRef(0);
    const dashboardTaskRequestIdRef = useRef(0);
    const currentUserId = Number(user?.id);
    const DASHBOARD_TASK_PAGE_SIZE = 20;

    const getStoredSelfAvailability = (): AvailabilityItem['status'] | null => {
        if (typeof window === 'undefined') return null;
        const stored = window.localStorage.getItem(STATUS_STORAGE_KEY);
        if (!stored || !isValidStatusId(stored)) return null;
        if (stored === 'away') return 'away';
        if (stored === 'do-not-disturb') return 'offline';
        return 'online';
    };

    const mapPresenceToAvailability = (
        statusCode?: number,
        isOnline?: boolean
    ): AvailabilityItem['status'] => {
        if (statusCode === 1) return 'offline'; // Do Not Disturb
        if (!isOnline) return 'away'; // Not logged in / not active
        if (statusCode === 3) return 'away';
        return 'online';
    };

    const mapPriorityIdToPriority = (priorityId?: number | null): MyWorkPriority => {
        if (priorityId === 1) return 'high';
        if (priorityId === 3) return 'low';
        return 'medium';
    };

    const mapAttachmentType = (attachmentType?: string): MyWorkAttachment['type'] => {
        const t = (attachmentType || '').toUpperCase();
        if (t.includes('PDF')) return 'pdf';
        if (t.includes('XLS')) return 'xlsx';
        if (t.includes('PPT')) return 'pptx';
        if (t.includes('DOC')) return 'doc';
        if (t.includes('LINK')) return 'link';
        return 'doc';
    };

    const mapApiAttachment = (a: DashboardTaskApiAttachment, idx: number): MyWorkAttachment => ({
        id: String(a.attachmentId ?? idx),
        name: a.displayText || a.fileName || 'Attachment',
        type: mapAttachmentType(a.attachmentType),
        url: a.url || undefined,
    });

    const mapApiTask = (item: DashboardTaskApiItem, status: MyWorkTask['status']): MyWorkTask => {
        const createdBy: MyWorkUser = {
            id: String(item.createdById ?? 0),
            name: item.createdByName || 'Unknown',
            position: '',
            email: '',
        };

        const dueDate = item.dueStart ? new Date(item.dueStart) : new Date();
        const updatedAt = item.lastModifiedOn ? new Date(item.lastModifiedOn) : dueDate;

        return {
            id: String(item.id),
            title: item.title || 'Untitled task',
            description: item.description || undefined,
            status,
            priority: mapPriorityIdToPriority(item.priorityId),
            dueDate,
            assignedTo: [],
            createdBy,
            createdAt: dueDate,
            updatedAt,
            attachments: Array.isArray(item.attachments)
                ? item.attachments.map(mapApiAttachment)
                : [],
            audienceCount: item.audienceCount ?? 0,
            commentCount: item.commentCount ?? 0,
            addToCalendar: false,
            showComments: true,
        };
    };

    const mapDashboardMyTasks = (myTask?: DashboardTaskResult | null): {
        tasks: MyWorkTask[];
        counts: DashboardTaskCounts;
        total: number;
    } => {
        const sections = myTask ?? {
            toDo: { totalCount: 0, items: [] },
            inProgress: { totalCount: 0, items: [] },
            completed: { totalCount: 0, items: [] },
            overdue: { totalCount: 0, items: [] },
        };

        const tasks: MyWorkTask[] = [
            ...(sections.toDo?.items || []).map((x) => mapApiTask(x, 'todo')),
            ...(sections.inProgress?.items || []).map((x) => mapApiTask(x, 'in-progress')),
            ...(sections.completed?.items || []).map((x) => mapApiTask(x, 'completed')),
            ...(sections.overdue?.items || []).map((x) => mapApiTask(x, 'overdue')),
        ];

        const counts: DashboardTaskCounts = {
            todo: sections.toDo?.totalCount ?? 0,
            'in-progress': sections.inProgress?.totalCount ?? 0,
            completed: sections.completed?.totalCount ?? 0,
            overdue: sections.overdue?.totalCount ?? 0,
        };

        const total = counts.todo + counts['in-progress'] + counts.completed + counts.overdue;
        return { tasks, counts, total };
    };

    const normalizeNewsCategory = (category?: string | null): string => {
        const value = (category || '').trim().toLowerCase();
        if (!value) return 'general';

        const mapped = value.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (mapped === 'it-system-update') return 'it-system-updates';
        if (mapped === 'event-activity') return 'events-activities';
        if (mapped === 'hr-updates') return 'hr-update';
        return mapped || 'general';
    };

    const formatNewsDateShort = (iso?: string | null): string => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const day = d.getDate();
        const month = d.toLocaleString('en-GB', { month: 'short' });
        const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${day} ${month}, ${time}`;
    };

    const formatNewsDateLong = (iso?: string | null): string => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const mapDashboardNewsPosts = (items?: DashboardNewsItem[] | null): Post[] => {
        if (!Array.isArray(items)) return [];

        return items
            .filter((x) => (x.title || x.description))
            .map((x) => {
                const timestamp = x.publishDate || x.createdOn || x.updatedOn || formatToDateTimeOffset(new Date());
                return {
                    id: String(x.newsId),
                    author: {
                        id: 'dashboard-news',
                        name: 'Westford Connect',
                        role: 'News & Updates',
                        avatar: '',
                        availability: 'offline',
                    },
                    category: normalizeNewsCategory(x.categoryDesc),
                    title: x.title || 'Untitled',
                    content: x.description || '',
                    timestamp,
                    formattedDate: formatNewsDateShort(timestamp),
                    formattedDateLong: formatNewsDateLong(timestamp),
                    pinned: Boolean(x.isPinned),
                    reactions: [],
                    commentCount: 0,
                    allowReactions: false,
                };
            });
    };

    const formatTodayTime = (value?: string | null): string | null => {
        if (!value) return null;
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return null;
        return dt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const mapDashboardTodayInfo = (item?: DashboardTodayInfo | null): TodayData | undefined => {
        if (!item) return undefined;

        const currentDate = item.currentDate ? new Date(item.currentDate) : new Date();
        const nameFromAuth = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
        const userName = (item.userName || nameFromAuth || 'User').trim();

        return {
            userName,
            currentDate,
            currentTime: new Date(),
            checkInTime: formatTodayTime(item.inTime),
            checkOutTime: formatTodayTime(item.outTime),
            daysAtWestford: Number(item.totalDaysAt ?? 0),
        };
    };

    const mapPeopleTimeFrameToPeriod = (timeFrame: string): 'today' | 'this-week' | 'this-month' => {
        if (timeFrame === 'thisWeek') return 'this-week';
        if (timeFrame === 'thisMonth') return 'this-month';
        return 'today';
    };

    const mapPeopleViewTypeToApi = (viewType: string): 'both' | 'birthdays' | 'anniversaries' => {
        if (viewType === 'birthdays') return 'birthdays';
        if (viewType === 'anniversaries') return 'anniversaries';
        return 'both';
    };

    const mapPeopleMoment = (item: DashboardPeopleMomentItem): PeopleMoment => ({
        id: String(item.id),
        employeeName: item.employeeName || 'Unknown',
        position: item.position || 'Staff',
        avatar: item.profileImageUrl || item.ProfileImageUrl || item.avatarUrl || avatarPlaceholder,
        date: item.date || '',
        eventType: item.eventType === 'birthday' ? 'birthday' : 'work-anniversary',
        years: item.years ?? undefined,
        // Keep undefined so widget won't re-filter using old birth/join year.
        eventDate: undefined,
    });

    const mapEventsViewOption = (x: DashboardLookupItem): { value: string; label: string } | null => {
        const key = (x.description || '').trim().toLowerCase();
        if (key.includes('my')) return { value: 'myEvents', label: x.description };
        if (key.includes('all')) return { value: 'allEvents', label: x.description };
        if (x.code === 1) return { value: 'myEvents', label: x.description || 'My Events' };
        if (x.code === 2) return { value: 'allEvents', label: x.description || 'All Events' };
        return null;
    };

    const mapPeopleViewOption = (x: DashboardLookupItem): { value: string; label: string } | null => {
        const key = (x.description || '').trim().toLowerCase();
        if (key.includes('birthday')) return { value: 'birthdays', label: x.description };
        if (key.includes('anniversary')) return { value: 'anniversaries', label: x.description };
        if (key.includes('both') || key.includes('all')) return { value: 'both', label: x.description };
        if (x.code === 1) return { value: 'birthdays', label: x.description || 'Birthdays' };
        if (x.code === 2) return { value: 'anniversaries', label: x.description || 'Work Anniversaries' };
        if (x.code === 3) return { value: 'both', label: x.description || 'Both' };
        return null;
    };

    const mapTimeFrameOption = (x: DashboardLookupItem): { value: string; label: string } | null => {
        const key = (x.description || '').trim().toLowerCase();
        if (key.includes('today')) return { value: 'today', label: x.description };
        if (key.includes('week')) return { value: 'thisWeek', label: x.description };
        if (key.includes('month')) return { value: 'thisMonth', label: x.description };
        if (x.code === 1) return { value: 'today', label: x.description || 'Today' };
        if (x.code === 2) return { value: 'thisWeek', label: x.description || 'This Week' };
        if (x.code === 3) return { value: 'thisMonth', label: x.description || 'This Month' };
        return null;
    };

    useEffect(() => {
        setPageTitle('Dashboard');
    }, [setPageTitle]);

    useEffect(() => {
        let mounted = true;

        const loadDashboardBootstrap = async () => {
            try {
                const response = await dashboardService.getBootstrap();
                if (!mounted || !response.success || !response.result) return;

                const eventViewOptions = (response.result.eventsFilterViewType || [])
                    .map(mapEventsViewOption)
                    .filter((x): x is { value: string; label: string } => Boolean(x));
                const peopleOptions = (response.result.peopleMomentsFilterViewType || [])
                    .map(mapPeopleViewOption)
                    .filter((x): x is { value: string; label: string } => Boolean(x));
                const timeframeOpts = (response.result.filterTimeFrame || [])
                    .map(mapTimeFrameOption)
                    .filter((x): x is { value: string; label: string } => Boolean(x));

                if (eventViewOptions.length > 0) setUpcomingViewTypeOptions(eventViewOptions);
                if (peopleOptions.length > 0) setPeopleViewTypeOptions(peopleOptions);
                if (timeframeOpts.length > 0) setTimeFrameOptions(timeframeOpts);
                if (Array.isArray(response.result.atWorkFilterDepartment)) {
                    setAvailabilityDepartmentOptions(response.result.atWorkFilterDepartment);
                }
            } catch (error) {
                console.error('Failed to load dashboard bootstrap:', error);
            }
        };

        void loadDashboardBootstrap();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadDashboardUsers = async () => {
            try {
                setAtWorkLoading(true);
                setDashboardNewsLoading(true);
                const response = await dashboardService.getAll(formatToDateTimeOffset(new Date()));
                if (!mounted || !response.success || !Array.isArray(response.result?.users)) {
                    return;
                }

                const mapped: AvailabilityItem[] = response.result.users.map((u) => {
                    const selfStoredStatus = Number(u.id) === currentUserId ? getStoredSelfAvailability() : null;
                    const status: AvailabilityItem['status'] =
                        selfStoredStatus ??
                        mapPresenceToAvailability(
                            typeof u.availabilityStatus === 'number' ? u.availabilityStatus : undefined,
                            typeof u.isOnline === 'boolean' ? u.isOnline : undefined
                        );

                    return {
                        id: String(u.id),
                        name: Number(u.id) === currentUserId ? 'You' : u.name,
                        avatar: u.profileImageUrl,
                        position: u.designation || 'Staff',
                        status,
                    };
                });

                mapped.sort((a, b) => {
                    const aIsSelf = Number(a.id) === currentUserId || a.name === 'You';
                    const bIsSelf = Number(b.id) === currentUserId || b.name === 'You';
                    if (aIsSelf === bIsSelf) return 0;
                    return aIsSelf ? -1 : 1;
                });

                setAtWorkItems(mapped);
                setDashboardNewsPosts(mapDashboardNewsPosts(response.result?.newsInfo));
                const mappedToday = mapDashboardTodayInfo(response.result?.todayInfo);
                if (mappedToday) {
                    setDashboardTodayInfo(mappedToday);
                }
            } catch (error) {
                console.error('Failed to load dashboard users:', error);
            } finally {
                if (mounted) {
                    setAtWorkLoading(false);
                    setDashboardNewsLoading(false);
                }
            }
        };

        loadDashboardUsers();

        return () => {
            mounted = false;
        };
    }, [currentUserId]);

    useEffect(() => {
        let mounted = true;
        const requestId = ++peopleMomentsRequestIdRef.current;

        const loadPeopleMoments = async () => {
            try {
                setDashboardPeopleMomentsLoading(true);
                const period = mapPeopleTimeFrameToPeriod(peopleMomentsFilters.timeFrame);
                const viewType = mapPeopleViewTypeToApi(peopleMomentsFilters.viewType);
                const response = await dashboardService.getPeopleMoments(period, viewType);

                if (!mounted || requestId !== peopleMomentsRequestIdRef.current) {
                    return;
                }

                if (!response.success) {
                    setDashboardPeopleMoments([]);
                    return;
                }

                const items = Array.isArray(response.result?.items) ? response.result.items : [];
                setDashboardPeopleMoments(items.map(mapPeopleMoment));
            } catch (error) {
                console.error('Failed to load people moments:', error);
                if (mounted) {
                    setDashboardPeopleMoments([]);
                }
            } finally {
                if (mounted && requestId === peopleMomentsRequestIdRef.current) {
                    setDashboardPeopleMomentsLoading(false);
                }
            }
        };

        void loadPeopleMoments();
        return () => {
            mounted = false;
        };
    }, [peopleMomentsFilters.timeFrame, peopleMomentsFilters.viewType, currentUserId]);

    useEffect(() => {
        const handler = (event: Event) => {
            const payload = (event as CustomEvent<DashboardTodayInfo>).detail;
            const mapped = mapDashboardTodayInfo(payload);
            if (mapped) {
                setDashboardTodayInfo(mapped);
            }
        };

        window.addEventListener(TODAY_UPDATED_EVENT, handler as EventListener);
        return () => {
            window.removeEventListener(TODAY_UPDATED_EVENT, handler as EventListener);
        };
    }, [user?.firstName, user?.lastName]);

    useEffect(() => {
        let mounted = true;
        const requestId = ++dashboardTaskRequestIdRef.current;

        const loadDashboardMyTasks = async () => {
            try {
                setDashboardTaskLoadingMore(true);
                const response = await dashboardService.getMyTasks(
                    formatToDateTimeOffset(dashboardTaskSelectedDate),
                    1,
                    DASHBOARD_TASK_PAGE_SIZE
                );

                if (!mounted || requestId !== dashboardTaskRequestIdRef.current || !response.success) {
                    return;
                }

                const mappedTasks = mapDashboardMyTasks(response.result);
                setDashboardTasks(mappedTasks.tasks);
                setDashboardTaskCounts(mappedTasks.counts);
                setDashboardTaskPage(1);
                setDashboardTaskHasMore(mappedTasks.tasks.length < mappedTasks.total);
            } catch (error) {
                console.error('Failed to load dashboard my tasks:', error);
            } finally {
                if (mounted) {
                    setDashboardTaskLoadingMore(false);
                }
            }
        };

        setDashboardTasks([]);
        setDashboardTaskPage(0);
        setDashboardTaskHasMore(true);
        void loadDashboardMyTasks();

        return () => {
            mounted = false;
        };
    }, [currentUserId, dashboardTaskSelectedDate]);

    useEffect(() => {
        if (!hubConnection) return;

        const onUserPresenceChanged = (evt: any) => {
            const userId = Number(evt?.userId ?? evt?.UserId);
            const statusCode = Number(evt?.status ?? evt?.Status);
            const isOnline = Boolean(evt?.isOnline ?? evt?.IsOnline);

            if (!Number.isFinite(userId)) return;

            const mappedStatus = mapPresenceToAvailability(
                Number.isFinite(statusCode) ? statusCode : undefined,
                isOnline
            );

            setAtWorkItems((prev) =>
                prev.map((item) =>
                    Number(item.id) === userId
                        ? { ...item, status: mappedStatus }
                        : item
                )
            );
        };

        hubConnection.on('UserPresenceChanged', onUserPresenceChanged);
        return () => {
            hubConnection.off('UserPresenceChanged', onUserPresenceChanged);
        };
    }, [hubConnection]);

    const handleLoadMoreDashboardTasks = async () => {
        if (dashboardTaskLoadingMore || !dashboardTaskHasMore) {
            return;
        }

        const nextPage = dashboardTaskPage + 1;

        try {
            setDashboardTaskLoadingMore(true);

            const response = await dashboardService.getMyTasks(
                formatToDateTimeOffset(dashboardTaskSelectedDate),
                nextPage,
                DASHBOARD_TASK_PAGE_SIZE
            );

            if (!response.success) {
                return;
            }

            const mappedTasks = mapDashboardMyTasks(response.result);

            setDashboardTaskCounts(mappedTasks.counts);
            setDashboardTasks((prev) => {
                const mergedById = new Map<string, MyWorkTask>();
                prev.forEach((task) => mergedById.set(task.id, task));
                mappedTasks.tasks.forEach((task) => mergedById.set(task.id, task));

                const merged = Array.from(mergedById.values());
                setDashboardTaskHasMore(merged.length < mappedTasks.total);
                return merged;
            });
            setDashboardTaskPage(nextPage);
        } catch (error) {
            console.error('Failed to load more dashboard my tasks:', error);
        } finally {
            setDashboardTaskLoadingMore(false);
        }
    };

    const handleDashboardTaskDateChange = (date: Date) => {
        setDashboardTaskSelectedDate(date);
    };

    const handleAvailabilityFilterClick = () => {
        setAvailabilityFilterOpen(true);
    };

    const handleUpcomingEventsFilterClick = () => {
        setUpcomingEventsFilterOpen(true);
    };

    const handlePeopleMomentsFilterClick = () => {
        setPeopleMomentsFilterOpen(true);
    };

    const handleAvailabilityFilterApply = (selectedDepartments: string[]) => {
        setAvailabilityFilters(selectedDepartments);
    };

    const handleUpcomingEventsFilterApply = (filters: { viewType: string; timeFrame: string }) => {
        setUpcomingEventsFilters(filters);
    };

    const handlePeopleMomentsFilterApply = (filters: { viewType: string; timeFrame: string }) => {
        setPeopleMomentsFilters(filters);
    };

    const handleGroupClick = (groupId: string) => {
        // Navigation is handled in MyProjectGroupsWidget
        console.log('Group clicked:', groupId);
    };

    const handleMuteNotifications = (conversationId: string, currentMuted?: boolean) => {
        const conversation = conversations.find((c) => c.id === conversationId && c.type === 'group');

        const chatId = parseInt(conversationId.replace('conv-group-', ''), 10);
        if (!Number.isFinite(chatId) || chatId <= 0) return;

        const baseMuted = conversation?.isMuted ?? currentMuted ?? false;
        const nextMuted = !baseMuted;
        setConversations((prev) => prev.map((c) =>
            c.id === conversationId ? { ...c, isMuted: nextMuted } : c
        ));

        void toggleChatMuted('group', chatId, nextMuted).catch((err) => {
            console.error('Failed to toggle mute from dashboard:', err);
            setConversations((prev) => prev.map((c) =>
                c.id === conversationId ? { ...c, isMuted: !nextMuted } : c
            ));
        });
    };

    const handlePinGroup = (conversationId: string, currentPinned?: boolean) => {
        const conversation = conversations.find((c) => c.id === conversationId && c.type === 'group');

        const chatId = parseInt(conversationId.replace('conv-group-', ''), 10);
        if (!Number.isFinite(chatId) || chatId <= 0) return;

        const basePinned = conversation?.isPinned ?? currentPinned ?? false;
        const nextPinned = !basePinned;
        setConversations((prev) => prev.map((c) =>
            c.id === conversationId ? { ...c, isPinned: nextPinned } : c
        ));

        void toggleChatPinned('group', chatId, nextPinned).catch((err) => {
            console.error('Failed to toggle pin from dashboard:', err);
            setConversations((prev) => prev.map((c) =>
                c.id === conversationId ? { ...c, isPinned: !nextPinned } : c
            ));
        });
    };

    const handleMarkAsRead = (
        conversationId: string,
        currentUnreadCount?: number,
        currentLastMessageId?: number | null
    ) => {
        const conversation = conversations.find((c) => c.id === conversationId && c.type === 'group');

        const chatId = parseInt(conversationId.replace('conv-group-', ''), 10);
        if (!Number.isFinite(chatId) || chatId <= 0) return;

        const baseUnreadCount = conversation?.unreadCount ?? currentUnreadCount ?? 0;
        const willBeUnread = baseUnreadCount === 0;
        const lastMessageId = conversation?.lastMessage?.id
            ? Number(conversation.lastMessage.id)
            : (currentLastMessageId ?? undefined);
        const hasLastMessageId = Number.isFinite(lastMessageId);
        if (willBeUnread && !hasLastMessageId) {
            return;
        }

        setConversations((prev) => prev.map((c) =>
            c.id === conversationId
                ? { ...c, unreadCount: willBeUnread ? 1 : 0 }
                : c
        ));

        void toggleChatUnread('group', chatId, willBeUnread, hasLastMessageId ? lastMessageId : undefined)
            .catch((err) => {
                console.error('Failed to toggle read/unread from dashboard:', err);
                setConversations((prev) => prev.map((c) =>
                    c.id === conversationId
                        ? { ...c, unreadCount: willBeUnread ? 0 : 1 }
                        : c
                ));
            });
    };

    const handleExitGroup = (conversationId: string) => {
        const chatId = parseInt(conversationId.replace('conv-group-', ''), 10);
        if (!Number.isFinite(chatId) || chatId <= 0) return;

        const snapshot = conversations;
        const leftOn = new Date();
        setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, isLeft: true, leftOn } : c))
        );

        void chatService.exitGroup({ groupId: chatId })
            .then(() => hubConnection?.invoke('LeaveGroupChat', chatId).catch(() => undefined))
            .catch((err) => {
                console.error('Failed to exit group from dashboard:', err);
                setConversations(snapshot);
            });
    };

    const handleTaskClick = (task: any) => {
        // TODO: Navigate to task details
        console.log('Task clicked:', task);
    };

    const handleEventClick = (eventId: string) => {
        // TODO: Navigate to event details
        console.log('Event clicked:', eventId);
    };

    const handlePostClick = (postId: string) => {
        navigate('/news-and-updates', {
            state: {
                focusPostId: postId,
            },
        });
    };

    const handleWelcomePopupNext = () => {
        if (welcomePopupVariant === 'Default') {
            setWelcomePopupVariant('Variant2');
        } else if (welcomePopupVariant === 'Variant2') {
            setWelcomePopupVariant('Variant3');
        }
    };

    const handleWelcomePopupPrevious = () => {
        if (welcomePopupVariant === 'Variant3') {
            setWelcomePopupVariant('Variant2');
        } else if (welcomePopupVariant === 'Variant2') {
            setWelcomePopupVariant('Default');
        }
    };

    const handleWelcomePopupReaction = (type: 'celebrate' | 'applaud' | 'support') => {
        // TODO: Handle reaction
        console.log('Reaction clicked:', type);
    };

    const handleWelcomePopupComment = (comment: string) => {
        // TODO: Handle comment submission
        console.log('Comment submitted:', comment);
    };

    const handleWelcomePopupLearnMore = () => {
        // TODO: Handle learn more action
        console.log('Learn more clicked');
    };

    return (
        <div className="h-full overflow-auto pt-3.5">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-[16px] gap-y-[26px]">
                <div className="lg:col-span-1 lg:row-span-2 space-y-[26px] flex flex-col">
                    <TodayWidget data={dashboardTodayInfo} />
                    <AvailabilityWidget
                        items={atWorkItems}
                        count={atWorkItems.length}
                        isLoading={atWorkLoading}
                        currentUserId={currentUserId}
                        onFilterClick={handleAvailabilityFilterClick}
                        filterButtonRef={availabilityFilterRef}
                        selectedDepartments={availabilityFilters}
                    />
                </div>
                <NewsUpdatesWidget
                    posts={dashboardNewsPosts}
                    isLoading={dashboardNewsLoading}
                    onPostClick={handlePostClick}
                />
                <UpcomingEventsWidget
                    onFilterClick={handleUpcomingEventsFilterClick}
                    onEventClick={handleEventClick}
                    filterButtonRef={upcomingEventsFilterRef}
                    filters={upcomingEventsFilters}
                />
                <MyProjectGroupsWidget
                    onGroupClick={handleGroupClick}
                    onMuteNotifications={handleMuteNotifications}
                    onPinGroup={handlePinGroup}
                    onMarkAsRead={handleMarkAsRead}
                    onExitGroup={handleExitGroup}
                />
                <MyTasksWidget
                    tasks={dashboardTasks}
                    taskCounts={dashboardTaskCounts}
                    hasMore={dashboardTaskHasMore}
                    isLoadingMore={dashboardTaskLoadingMore}
                    onLoadMore={handleLoadMoreDashboardTasks}
                    onTaskClick={handleTaskClick}
                    selectedDate={dashboardTaskSelectedDate}
                    onDateChange={handleDashboardTaskDateChange}
                />
                <PeopleMomentsWidget
                    moments={dashboardPeopleMoments}
                    isLoading={dashboardPeopleMomentsLoading}
                    onFilterClick={handlePeopleMomentsFilterClick}
                    filterButtonRef={peopleMomentsFilterRef}
                    filters={peopleMomentsFilters}
                />
            </div>

            {/* Filter Components */}
            <AvailabilityFilter
                isOpen={availabilityFilterOpen}
                onClose={() => setAvailabilityFilterOpen(false)}
                triggerRef={availabilityFilterRef}
                onApply={handleAvailabilityFilterApply}
                items={atWorkItems}
                selectedDepartments={availabilityFilters}
                departmentOptions={availabilityDepartmentOptions}
            />
            <UpcomingEventsFilter
                isOpen={upcomingEventsFilterOpen}
                onClose={() => setUpcomingEventsFilterOpen(false)}
                triggerRef={upcomingEventsFilterRef}
                onApply={handleUpcomingEventsFilterApply}
                initialFilters={upcomingEventsFilters}
                viewTypeOptions={upcomingViewTypeOptions}
                timeFrameOptions={timeFrameOptions}
            />
            <PeopleMomentsFilter
                isOpen={peopleMomentsFilterOpen}
                onClose={() => setPeopleMomentsFilterOpen(false)}
                triggerRef={peopleMomentsFilterRef}
                onApply={handlePeopleMomentsFilterApply}
                initialFilters={peopleMomentsFilters}
                viewTypeOptions={peopleViewTypeOptions}
                timeFrameOptions={timeFrameOptions}
            />

            {/* Welcome Popup */}
            <WelcomePopup
                isOpen={welcomePopupOpen}
                onClose={() => setWelcomePopupOpen(false)}
                variant={welcomePopupVariant}
                onNext={handleWelcomePopupNext}
                onPrevious={handleWelcomePopupPrevious}
                onReactionClick={handleWelcomePopupReaction}
                onCommentSubmit={handleWelcomePopupComment}
                onLearnMore={handleWelcomePopupLearnMore}
            />
        </div>
    );
};

export default Dashboard;
