import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils/cn';
import type {
    AppLayoutContext
} from '../components/layout/AppLayout';
import type {
    Task,
    TaskStatus,
    TaskFilterState,
    TaskSortOption,
    TabType,
    Meeting,
    MeetingStatus,
    Lecture,
    User,
    Priority,
    MeetingFilterState,
} from '../components/my-work/types';
import { mockUsers } from '../components/my-work/mockData';
import KanbanColumn from '../components/my-work/KanbanColumn';
import TaskFilter from '../components/my-work/TaskFilter';
import MeetingFilter from '../components/my-work/MeetingFilter';
import TaskDrawer from '../components/my-work/TaskDrawer';
import DeleteTaskModal from '../components/my-work/DeleteTaskModal';
import ScheduleDetailsModal from '../components/my-work/ScheduleDetailsModal';
import MeetingKanbanColumn from '../components/my-work/MeetingKanbanColumn';
import CustomToast from '../components/common/CustomToast';
import LecturesCalendarWeek from '../components/my-work/LecturesCalendarWeek';
import { taskService } from '../services/taskService';
import { meetingService } from '../services/meetingService';
import type { BootstrapDrawerResult, TaskFilterRequest } from '../services/taskService';
import type { MeetingInitialLoadResult } from '../types/meeting';
import { parseUTCDate, formatToDateTimeOffset } from '../utils/dateUtils';

const MyWork: React.FC = () => {
    const { setPageTitle } = useOutletContext<AppLayoutContext>();
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMeetingFilterOpen, setIsMeetingFilterOpen] = useState(false);
    const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
    const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [filters, setFilters] = useState<TaskFilterState | null>(null);
    const [meetingFilters, setMeetingFilters] = useState<MeetingFilterState | null>(null);
    const [sortBy, setSortBy] = useState<TaskSortOption>('due-nearest-first');
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
        show: false,
        title: '',
        message: '',
    });

    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
    const [taskBootstrapData, setTaskBootstrapData] = useState<BootstrapDrawerResult | null>(null);
    const [meetingBootstrapData, setMeetingBootstrapData] = useState<MeetingInitialLoadResult | null>(null);
    const [isLoadingBootstrap, setIsLoadingBootstrap] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const meetingFilterButtonRef = useRef<HTMLButtonElement>(null);

    const fetchTasks = async () => {
        setIsLoadingTasks(true);
        try {
            const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };

            const startOfDay = new Date(currentDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59, 0);

            const request: TaskFilterRequest = {
                searchQuery: searchTerm || null,
                pageNumber: 1,
                pageSize: 100, // Fetch enough for the Kanban view
                priorities: filters?.priorities?.map(p => priorityMap[p]) || null,
                departmentIds: filters?.departments?.map(d => parseInt(d, 10)).filter(id => !isNaN(id)) || null,
                assignedToIds: filters?.assignedTo?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || null,
                createdByIds: filters?.createdBy?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || null,
                dueFrom: filters?.dateRange?.from ? formatToDateTimeOffset(filters.dateRange.from) : formatToDateTimeOffset(startOfDay),
                dueTo: filters?.dateRange?.to ? formatToDateTimeOffset(filters.dateRange.to) : formatToDateTimeOffset(endOfDay),
            };

            const response = await taskService.getAllTasks(request);
            if (response.success) {
                const apiTasks = [
                    ...response.result.toDo.items,
                    ...response.result.inProgress.items,
                    ...response.result.completed.items,
                    ...response.result.overdue.items,
                ];

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

                const mappedTasks: Task[] = apiTasks.map(apiTask => {
                    const apiDueStart = parseUTCDate(apiTask.dueStart) || new Date();

                    return {
                        id: apiTask.id.toString(),
                        title: apiTask.title,
                        description: apiTask.description,
                        status: statusMap[apiTask.statusId] || 'todo',
                        priority: priorityRevMap[apiTask.priorityId] || 'medium',
                        dueDate: apiDueStart,
                        dueTime: apiTask.isEndOfDay ? 'EOD' : (apiTask.isAllDay ? 'All Day' : undefined),
                        assignedTo: [], // API doesn't provide list of users in GetAllTasks
                        createdBy: {
                            id: apiTask.createdById.toString(),
                            name: apiTask.createdByName,
                            position: 'User',
                            email: '',
                        },
                        createdAt: new Date(), // Mock date
                        updatedAt: apiTask.lastModifiedOn ? (parseUTCDate(apiTask.lastModifiedOn) || new Date()) : new Date(),
                        attachments: [], // API doesn't provide list of attachments in GetAllTasks items
                        audienceCount: apiTask.audienceCount,
                        commentCount: apiTask.commentCount,
                        showComments: apiTask.showComments,
                        addToCalendar: apiTask.addToCalendar,
                    };
                });

                setTasks(mappedTasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            showToast('Fetch Error', 'Failed to load tasks from server.');
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const fetchMeetings = async () => {
        setIsLoadingMeetings(true);
        try {
            const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };

            const startOfDay = new Date(currentDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59, 0);

            const request: any = {
                searchQuery: searchTerm || null,
                pageNumber: 1,
                pageSize: 100,
                priorities: meetingFilters?.priorities?.map(p => priorityMap[p]) || null,
                departmentIds: meetingFilters?.departments?.map(d => parseInt(d, 10)).filter(id => !isNaN(id)) || null,
                assignedToIds: meetingFilters?.assignedTo?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || null,
                createdByIds: meetingFilters?.createdBy?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || null,
                dueFrom: meetingFilters?.dateRange?.from ? formatToDateTimeOffset(meetingFilters.dateRange.from) : formatToDateTimeOffset(startOfDay),
                dueTo: meetingFilters?.dateRange?.to ? formatToDateTimeOffset(meetingFilters.dateRange.to) : formatToDateTimeOffset(endOfDay),
                sortBy: 1, // Default sort
            };

            const response = await meetingService.getAllMeetings(request);
            if (response.success) {
                const apiMeetings = [
                    ...response.result.toDo.items,
                    ...response.result.inProgress.items,
                    ...response.result.completed.items,
                    ...response.result.overdue.items,
                ];

                const statusMap: Record<number, MeetingStatus> = {
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

                const mappedMeetings: Meeting[] = apiMeetings.map(apiMeeting => {
                    const apiDueStart = parseUTCDate(apiMeeting.dueStart) || new Date();

                    return {
                        id: apiMeeting.id.toString(),
                        title: apiMeeting.title,
                        description: apiMeeting.description,
                        status: statusMap[apiMeeting.statusId] || 'todo',
                        priority: priorityRevMap[apiMeeting.priorityId] || 'medium',
                        date: apiDueStart,
                        time: apiMeeting.isEndOfDay ? 'EOD' : (apiMeeting.isAllDay ? 'All Day' : ''),
                        attendees: [],
                        createdBy: {
                            id: apiMeeting.createdById.toString(),
                            name: apiMeeting.createdByName,
                            position: 'User',
                            email: '',
                        },
                        attachments: [],
                        audienceCount: apiMeeting.audienceCount,
                        commentCount: apiMeeting.commentCount,
                        venue: 'N/A', // Default
                        addToCalendar: apiMeeting.addToCalendar,
                        onlineMeet: apiMeeting.onlineMeet as 'Teams' | 'Gmeet',
                    };
                });

                setMeetings(mappedMeetings);
            }
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
            showToast('Fetch Error', 'Failed to load meetings from server.');
        } finally {
            setIsLoadingMeetings(false);
        }
    };

    const fetchBootstrapData = async () => {
        if (taskBootstrapData && meetingBootstrapData) return;

        setIsLoadingBootstrap(true);
        try {
            const [taskResp, meetingResp] = await Promise.allSettled([
                taskService.getInitialLoad(),
                meetingService.getInitialLoad()
            ]);
            
            if (taskResp.status === 'fulfilled' && taskResp.value.success) {
                setTaskBootstrapData(taskResp.value.result);
            }
            if (meetingResp.status === 'fulfilled' && meetingResp.value.success) {
                setMeetingBootstrapData(meetingResp.value.result);
            }
        } catch (error) {
            console.error('MyWork: Failed to load bootstrap data', error);
        } finally {
            setIsLoadingBootstrap(false);
        }
    };

    useEffect(() => {
        setPageTitle('My Work');
    }, [setPageTitle]);

    useEffect(() => {
        fetchBootstrapData();
    }, []);

    useEffect(() => {
        if (activeTab === 'tasks') {
            fetchTasks();
        } else if (activeTab === 'meetings') {
            fetchMeetings();
        }
    }, [activeTab, searchTerm, filters, meetingFilters, sortBy, currentDate]);

    const filteredAndSortedTasks = useMemo(() => {
        let filtered = [...tasks];

        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
            );
        }

        if (filters) {
            if (filters.assignedTo?.length) {
                filtered = filtered.filter((task) => {
                    const assignedToIds = Array.isArray(task.assignedTo)
                        ? task.assignedTo.map((u) => u.id)
                        : [task.assignedTo.id];
                    return filters.assignedTo!.some((id) => assignedToIds.includes(id));
                });
            }
            if (filters.dateRange?.from) {
                const fromDate = filters.dateRange.from;
                filtered = filtered.filter((task) => {
                    const taskDate = new Date(task.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    const filterDate = new Date(fromDate);
                    filterDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() >= filterDate.getTime();
                });
            }
            if (filters.createdBy?.length) {
                filtered = filtered.filter((task) => filters.createdBy!.includes(task.createdBy.id));
            }
            if (filters.departments?.length) {
                filtered = filtered.filter((task) => {
                    if (!task.department) return false;
                    // Map department names to IDs (simplified - in real app would use proper mapping)
                    const deptMap: Record<string, string> = {
                        'WESTFORD': '1',
                        'Operations': '2',
                        'Student Services': '3',
                        'Faculty': '4',
                        'Admissions / BD': '5',
                        'Marcom': '6',
                        'Accounts': '7',
                        'Student Experience': '8',
                    };
                    const taskDeptId = deptMap[task.department];
                    return taskDeptId && filters.departments!.includes(taskDeptId);
                });
            }
            if (filters.priorities?.length) {
                filtered = filtered.filter((task) => filters.priorities!.includes(task.priority));
            }
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'due-nearest-first': {
                    const aTime = a.dueDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
                    const bTime = b.dueDate?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
                    return aTime - bTime;
                }
                case 'due-latest-first': {
                    const aTime = a.dueDate?.getTime?.() ?? 0;
                    const bTime = b.dueDate?.getTime?.() ?? 0;
                    return bTime - aTime;
                }
                case 'priority-high-to-low':
                    return priorityValue(b.priority) - priorityValue(a.priority);
                case 'priority-low-to-high':
                    return priorityValue(a.priority) - priorityValue(b.priority);
                case 'recently-updated': {
                    const aUpd = a.updatedAt?.getTime?.() ?? 0;
                    const bUpd = b.updatedAt?.getTime?.() ?? 0;
                    return bUpd - aUpd;
                }
                default:
                    return 0;
            }
        });

        return filtered;
    }, [tasks, searchTerm, filters, sortBy]);

    const tasksByStatus = useMemo(
        () => ({
            todo: filteredAndSortedTasks.filter((t) => t.status === 'todo'),
            'in-progress': filteredAndSortedTasks.filter((t) => t.status === 'in-progress'),
            completed: filteredAndSortedTasks.filter((t) => t.status === 'completed'),
            overdue: filteredAndSortedTasks.filter((t) => t.status === 'overdue'),
        }),
        [filteredAndSortedTasks]
    );

    // Meetings filtering and sorting logic
    const filteredAndSortedMeetings = useMemo(() => {
        let filtered = [...meetings];

        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(
                (meeting) =>
                    meeting.title.toLowerCase().includes(query) || meeting.description?.toLowerCase().includes(query)
            );
        }

        if (meetingFilters) {
            if (meetingFilters.assignedTo?.length) {
                filtered = filtered.filter((meeting) => {
                    const attendeeIds = meeting.attendees.map((u) => u.id);
                    return meetingFilters.assignedTo!.some((id) => attendeeIds.includes(id));
                });
            }
            if (meetingFilters.dateRange?.from) {
                const fromDate = meetingFilters.dateRange.from;
                filtered = filtered.filter((meeting) => {
                    const meetingDate = new Date(meeting.date);
                    meetingDate.setHours(0, 0, 0, 0);
                    const filterDate = new Date(fromDate);
                    filterDate.setHours(0, 0, 0, 0);
                    return meetingDate.getTime() >= filterDate.getTime();
                });
            }
            if (meetingFilters.dateRange?.to) {
                const toDate = meetingFilters.dateRange.to;
                filtered = filtered.filter((meeting) => {
                    const meetingDate = new Date(meeting.date);
                    meetingDate.setHours(0, 0, 0, 0);
                    const filterDate = new Date(toDate);
                    filterDate.setHours(0, 0, 0, 0);
                    return meetingDate.getTime() <= filterDate.getTime();
                });
            }
            if (meetingFilters.createdBy?.length) {
                filtered = filtered.filter((meeting) => meetingFilters.createdBy!.includes(meeting.createdBy.id));
            }
            if (meetingFilters.departments?.length) {
                filtered = filtered.filter((meeting) => {
                    if (!meeting.department) return false;
                    // Map department names to IDs (simplified - in real app would use proper mapping)
                    const deptMap: Record<string, string> = {
                        'WESTFORD': '1',
                        'Operations': '2',
                        'Student Services': '3',
                        'Faculty': '4',
                        'Admissions / BD': '5',
                        'Marcom': '6',
                        'Accounts': '7',
                        'Student Experience': '8',
                        'Finance Dashboard': '9',
                    };
                    const meetingDeptId = deptMap[meeting.department];
                    return meetingDeptId && meetingFilters.departments!.includes(meetingDeptId);
                });
            }
            if (meetingFilters.priorities?.length) {
                filtered = filtered.filter((meeting) => meeting.priority && meetingFilters.priorities!.includes(meeting.priority));
            }
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'due-nearest-first': {
                    const aTime = a.date?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
                    const bTime = b.date?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
                    return aTime - bTime;
                }
                case 'due-latest-first': {
                    const aTime = a.date?.getTime?.() ?? 0;
                    const bTime = b.date?.getTime?.() ?? 0;
                    return bTime - aTime;
                }
                case 'priority-high-to-low':
                    if (!a.priority || !b.priority) return 0;
                    return priorityValue(b.priority) - priorityValue(a.priority);
                case 'priority-low-to-high':
                    if (!a.priority || !b.priority) return 0;
                    return priorityValue(a.priority) - priorityValue(b.priority);
                case 'recently-updated':
                    // Meetings don't have updatedAt, so sort by date
                    const aDate = a.date?.getTime?.() ?? 0;
                    const bDate = b.date?.getTime?.() ?? 0;
                    return bDate - aDate;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [meetings, searchTerm, meetingFilters, sortBy]);

    const meetingsByStatus = useMemo(
        () => ({
            todo: filteredAndSortedMeetings.filter((m) => m.status === 'todo'),
            'in-progress': filteredAndSortedMeetings.filter((m) => m.status === 'in-progress'),
            completed: filteredAndSortedMeetings.filter((m) => m.status === 'completed'),
            overdue: filteredAndSortedMeetings.filter((m) => m.status === 'overdue'),
        }),
        [filteredAndSortedMeetings]
    );

    const showToast = (title: string, message: string) => {
        setToast({ show: true, title, message });
        setTimeout(() => {
            setToast({ show: false, title: '', message: '' });
        }, 3000);
    };

    const handleResetAll = () => {
        setFilters(null);
        setMeetingFilters(null);
        setSortBy('due-nearest-first');
        setSearchTerm('');
        setSelectedTask(null);
        setSelectedMeeting(null);
        setIsFilterOpen(false);
        setIsMeetingFilterOpen(false);
    };

    const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTask: Task = {
            ...taskData,
            id: `task-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setTasks((prev) => [newTask, ...prev]);
        showToast('Task Created', 'Your task has been created successfully.');
    };

    const handleCreateMeeting = (_meetingData?: any) => {
        fetchMeetings();
        showToast('Meeting Created', 'Your meeting has been created successfully.');
    };

    const handleScheduleEvent = (taskData: { title: string; description?: string; date: Date; time: string; assignedTo: User[]; venue: 'N/A' | 'Online' | 'On-site'; priority: Priority }) => {
        // Close task drawer and open meeting drawer
        setIsTaskDrawerOpen(false);

        // Parse time string to get start and end times
        const [startTimeStr, endTimeStr] = taskData.time.split(' - ');
        const startDate = new Date(taskData.date);
        const endDate = new Date(taskData.date);

        // Parse start time
        const startMatch = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (startMatch) {
            let hours = parseInt(startMatch[1], 10);
            const minutes = parseInt(startMatch[2], 10);
            const ampm = startMatch[3].toUpperCase();
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            startDate.setHours(hours, minutes, 0, 0);
        }

        // Parse end time (default to 1 hour after start if not provided)
        if (endTimeStr) {
            const endMatch = endTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (endMatch) {
                let hours = parseInt(endMatch[1], 10);
                const minutes = parseInt(endMatch[2], 10);
                const ampm = endMatch[3].toUpperCase();
                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                endDate.setHours(hours, minutes, 0, 0);
            } else {
                endDate.setHours(startDate.getHours() + 1, startDate.getMinutes(), 0, 0);
            }
        } else {
            endDate.setHours(startDate.getHours() + 1, startDate.getMinutes(), 0, 0);
        }

        // Create meeting with pre-filled data
        const meetingData: Omit<Meeting, 'id'> = {
            title: taskData.title,
            description: taskData.description,
            status: 'todo',
            date: startDate,
            time: taskData.time,
            attendees: taskData.assignedTo,
            createdBy: mockUsers[0],
            attachments: [],
            venue: taskData.venue,
            priority: taskData.priority,
            addToCalendar: true,
        };

        handleCreateMeeting(meetingData);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsTaskDrawerOpen(true);
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        setSelectedTask(updatedTask);
        showToast('Task Updated', 'The task has been updated successfully.');
    };

    const handleDeleteTask = (taskId: string) => {
        setSelectedMeetingId(null);
        setSelectedTaskId(taskId);
        setIsDeleteModalOpen(true);
    };


    const handleMeetingClick = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setIsCreateMeetingOpen(true);
    };

    const handleMeetingUpdate = (updatedMeeting?: Meeting) => {
        if (updatedMeeting?.id) {
            setMeetings((prev) =>
                prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
            );
            setSelectedMeeting(updatedMeeting);
        } else {
            fetchMeetings();
        }
        showToast('Meeting Updated', 'The meeting has been updated successfully.');
    };

    const handleMeetingEdit = (meetingId: string) => {
        const meeting = meetings.find((m) => m.id === meetingId);
        if (meeting) {
            setSelectedMeeting(meeting);
        }
    };

    const handleDeleteMeeting = (meetingId: string) => {
        setSelectedTaskId(null);
        setSelectedMeetingId(meetingId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedTaskId) {
            try {
                const selectedIdStr = String(selectedTaskId);
                const taskIdStr = selectedIdStr.startsWith('task-') ? selectedIdStr.replace('task-', '') : selectedIdStr;
                const response = await taskService.deleteTask(parseInt(taskIdStr, 10));
                if (response.success) {
                    setTasks((prev) => prev.filter((task) => task.id !== selectedTaskId));
                    showToast('Task Deleted', 'The task has been permanently deleted.');
                    setSelectedTaskId(null);
                } else {
                    showToast('Delete Failed', response.message || 'Failed to delete the task.');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showToast('Delete Error', 'An unexpected error occurred while deleting the task.');
            }
        } else if (selectedMeetingId) {
            try {
                const selectedIdStr = String(selectedMeetingId);
                const meetingIdStr = selectedIdStr.startsWith('meeting-') ? selectedIdStr.replace('meeting-', '') : selectedIdStr;
                const response = await meetingService.deleteMeeting(parseInt(meetingIdStr, 10));
                if (response.success) {
                    setMeetings((prev) => prev.filter((meeting) => meeting.id !== selectedMeetingId));
                    showToast('Meeting Deleted', 'The meeting has been permanently deleted.');
                    setSelectedMeetingId(null);
                } else {
                    showToast('Delete Failed', response.message || 'Failed to delete the meeting.');
                }
            } catch (error) {
                console.error('Error deleting meeting:', error);
                showToast('Delete Error', 'An unexpected error occurred while deleting the meeting.');
            }
        }
        setIsDeleteModalOpen(false);
    };

    const handlePreviousDate = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNextDate = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const tabs: Array<{ id: TabType; label: string, icon?: React.ReactNode }> = [
        {
            id: 'tasks', label: 'My Tasks', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9.85224 3.45455C8.58158 3.45455 7.33946 3.83843 6.28294 4.55765C5.22643 5.27688 4.40298 6.29914 3.91672 7.49516C3.43046 8.69119 3.30323 10.0073 3.55113 11.277C3.79902 12.5466 4.4109 13.7129 5.30939 14.6283C6.20788 15.5437 7.35262 16.1671 8.59887 16.4197C9.84511 16.6722 11.1369 16.5426 12.3108 16.0472C13.4847 15.5518 14.4881 14.7129 15.1941 13.6365C15.9 12.5601 16.2768 11.2946 16.2768 10V9.27273H17.7045V10C17.7045 14.4182 14.1888 18 9.85224 18C5.51566 18 2 14.4182 2 10C2 5.58182 5.51566 2 9.85224 2C10.9216 2 11.9424 2.21818 12.8732 2.61382L13.5321 2.89382L12.9824 4.23636L12.3235 3.95636C11.5404 3.62452 10.7004 3.45397 9.85224 3.45455ZM18 4.54545L9.85224 12.8465L5.63059 8.54545L6.63996 7.51709L9.85224 10.7898L16.9906 3.51709L18 4.54545Z" fill="white" />
            </svg>
        },
        {
            id: 'meetings', label: 'Meetings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.80078 13.9995C2.80078 14.4945 2.99745 14.9693 3.34752 15.3194C3.69758 15.6695 4.17238 15.8661 4.66745 15.8661C5.16252 15.8661 5.63731 15.6695 5.98738 15.3194C6.33745 14.9693 6.53411 14.4945 6.53411 13.9995C6.53411 13.5044 6.33745 13.0296 5.98738 12.6795C5.63731 12.3295 5.16252 12.1328 4.66745 12.1328C4.17238 12.1328 3.69758 12.3295 3.34752 12.6795C2.99745 13.0296 2.80078 13.5044 2.80078 13.9995Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M7.33333 17.9995C7.07556 17.5162 6.69129 17.112 6.22159 16.8302C5.75189 16.5483 5.21443 16.3995 4.66667 16.3995C4.11891 16.3995 3.58145 16.5483 3.11175 16.8302C2.64205 17.112 2.25777 17.5162 2 17.9995M13.4667 13.9995C13.4667 14.2446 13.5149 14.4873 13.6088 14.7138C13.7026 14.9403 13.8401 15.1461 14.0134 15.3194C14.1867 15.4927 14.3925 15.6302 14.619 15.7241C14.8455 15.8179 15.0882 15.8661 15.3333 15.8661C15.5785 15.8661 15.8212 15.8179 16.0477 15.7241C16.2742 15.6302 16.4799 15.4927 16.6533 15.3194C16.8266 15.1461 16.9641 14.9403 17.0579 14.7138C17.1517 14.4873 17.2 14.2446 17.2 13.9995C17.2 13.5044 17.0033 13.0296 16.6533 12.6795C16.3032 12.3295 15.8284 12.1328 15.3333 12.1328C14.8383 12.1328 14.3635 12.3295 14.0134 12.6795C13.6633 13.0296 13.4667 13.5044 13.4667 13.9995Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M18.0002 18C17.7424 17.5167 17.3581 17.1125 16.8884 16.8307C16.4187 16.5489 15.8813 16.4 15.3335 16.4C14.7858 16.4 14.2483 16.5489 13.7786 16.8307C13.3089 17.1125 12.9246 17.5167 12.6669 18M12.3106 7.33333C12.0255 6.99883 11.6713 6.73019 11.2722 6.54597C10.8732 6.36175 10.439 6.26635 9.99948 6.26635C9.55999 6.26635 9.12574 6.36175 8.72672 6.54597C8.3277 6.73019 7.97342 6.99883 7.68837 7.33333M7.90312 15.4805C9.26509 15.9996 10.7712 15.995 12.13 15.4677M5.9817 5.73333C5.39801 6.28018 4.93275 6.94101 4.61473 7.6749C4.2967 8.4088 4.13268 9.20016 4.13281 10C4.13281 10.1799 4.14348 10.3556 4.15983 10.5333M15.8398 10.5333C15.8555 10.357 15.8669 10.1778 15.8669 10C15.867 9.20016 15.703 8.4088 15.3849 7.6749C15.0669 6.94101 14.6017 6.28018 14.018 5.73333M8.13352 3.86667C8.13352 4.1118 8.18181 4.35453 8.27562 4.58101C8.36942 4.80748 8.50692 5.01326 8.68026 5.1866C8.85359 5.35994 9.05937 5.49743 9.28585 5.59124C9.51232 5.68505 9.75506 5.73333 10.0002 5.73333C10.2453 5.73333 10.4881 5.68505 10.7145 5.59124C10.941 5.49743 11.1468 5.35994 11.3201 5.1866C11.4935 5.01326 11.631 4.80748 11.7248 4.58101C11.8186 4.35453 11.8669 4.1118 11.8669 3.86667C11.8669 3.3716 11.6702 2.8968 11.3201 2.54673C10.9701 2.19667 10.4953 2 10.0002 2C9.50512 2 9.03033 2.19667 8.68026 2.54673C8.33019 2.8968 8.13352 3.3716 8.13352 3.86667Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        },
        {
            id: 'lectures', label: 'Lectures', icon: <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0.807826C0 0.593577 0.08511 0.388103 0.236607 0.236607C0.388103 0.08511 0.593577 0 0.807826 0H15.3487C15.5629 0 15.7684 0.08511 15.9199 0.236607C16.0714 0.388103 16.1565 0.593577 16.1565 0.807826C16.1565 1.02207 16.0714 1.22755 15.9199 1.37905C15.7684 1.53054 15.5629 1.61565 15.3487 1.61565V10.5017C15.3487 10.9302 15.1785 11.3412 14.8755 11.6442C14.5725 11.9472 14.1615 12.1174 13.733 12.1174H9.64948L11.5018 13.9697C11.649 14.1221 11.7304 14.3262 11.7286 14.538C11.7267 14.7498 11.6418 14.9524 11.492 15.1022C11.3422 15.2519 11.1396 15.3369 10.9278 15.3387C10.716 15.3406 10.5119 15.2592 10.3596 15.112L8.07503 12.8275L5.78969 15.112C5.63733 15.2592 5.43327 15.3406 5.22146 15.3387C5.00965 15.3369 4.80704 15.2519 4.65726 15.1022C4.50749 14.9524 4.42253 14.7498 4.42069 14.538C4.41885 14.3262 4.50027 14.1221 4.64742 13.9697L6.49977 12.1174H2.42348C1.99498 12.1174 1.58403 11.9472 1.28104 11.6442C0.978046 11.3412 0.807826 10.9302 0.807826 10.5017V1.61565C0.593577 1.61565 0.388103 1.53054 0.236607 1.37905C0.08511 1.22755 0 1.02207 0 0.807826ZM11.5059 3.37025C11.6582 3.2231 11.8623 3.14167 12.0741 3.14351C12.2859 3.14535 12.4885 3.23031 12.6383 3.38009C12.7881 3.52987 12.873 3.73248 12.8749 3.94429C12.8767 4.1561 12.7953 4.36016 12.6481 4.51252L9.22618 7.93447C9.07318 8.08739 8.86571 8.1733 8.64939 8.1733C8.43307 8.1733 8.22561 8.08739 8.07261 7.93447L6.36567 6.22753L4.65227 7.94012C4.50002 8.08739 4.29601 8.16896 4.0842 8.16727C3.87239 8.16558 3.66971 8.08076 3.51983 7.93109C3.36994 7.78142 3.28484 7.57886 3.28285 7.36705C3.28087 7.15524 3.36215 6.95113 3.5092 6.79866L5.78888 4.51898C5.94188 4.36606 6.14935 4.28015 6.36567 4.28015C6.58199 4.28015 6.78946 4.36606 6.94246 4.51898L8.64939 6.22591L11.5059 3.37025Z" fill="white" />
            </svg>
        },
        {
            id: 'attendance', label: 'Attendance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15.4444 16.4H4.55556V7.6H15.4444M15.4444 3.6H14.6667V2H13.1111V3.6H6.88889V2H5.33333V3.6H4.55556C4.143 3.6 3.74733 3.76857 3.45561 4.06863C3.16389 4.36869 3 4.77565 3 5.2V16.4C3 16.8243 3.16389 17.2313 3.45561 17.5314C3.74733 17.8314 4.143 18 4.55556 18H15.4444C15.857 18 16.2527 17.8314 16.5444 17.5314C16.8361 17.2313 17 16.8243 17 16.4V5.2C17 4.77565 16.8361 4.36869 16.5444 4.06863C16.2527 3.76857 15.857 3.6 15.4444 3.6ZM13.5233 10.048L12.6989 9.2L8.90333 13.104L7.25444 11.408L6.43 12.256L8.90333 14.8L13.5233 10.048Z" fill="white" />
            </svg>
        },
        {
            id: 'proposals', label: 'Proposals', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.4013 17.5H3.44408C3.3263 17.5 3.21335 17.4526 3.13007 17.3682C3.04678 17.2838 3 17.1693 3 17.05V2.95C3 2.83065 3.04678 2.71619 3.13007 2.63181C3.21335 2.54741 3.3263 2.5 3.44408 2.5H12.0681C12.1858 2.5001 12.2987 2.54759 12.3819 2.632L14.7118 4.993C14.7531 5.03484 14.7859 5.08452 14.8083 5.13922C14.8306 5.19392 14.8422 5.25255 14.8421 5.31175V9.25" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10.8945 2.5V5.18421C10.8945 5.30984 10.9444 5.43032 11.0332 5.51915C11.1221 5.60799 11.2426 5.65789 11.3682 5.65789H14.0524" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12.4727 14.4479L14.0516 15.9216L17.2095 12.7637" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M6.15625 15.1309V7.63086" stroke="white" stroke-width="2" />
                <path d="M8.92188 15.1312V10.7891" stroke="white" stroke-width="2" />
            </svg>
        },
        {
            id: 'mis', label: 'MIS', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15.8682 4.5C16.0505 4.50005 16.2074 4.57797 16.3164 4.72266L18.9482 8.21387C19.0777 8.38565 19.0971 8.60047 19 8.79199C18.9024 8.98298 18.7168 9.0957 18.5 9.0957H17.4941L17.2949 9.09668L17.2354 15.6318C17.2353 15.6573 17.2322 15.6822 17.2266 15.7061H17.4131C17.5313 15.7061 17.6279 15.8023 17.6279 15.9189V17.2881C17.6279 17.4047 17.5312 17.5 17.4131 17.5H5.44824C5.34981 17.4998 5.26953 17.4206 5.26953 17.3232V15.8828C5.26978 15.7857 5.34992 15.7063 5.44824 15.7061H5.61914C5.61739 15.6946 5.61623 15.6828 5.61621 15.6709V13.9336C5.90471 13.9762 6.19967 14 6.5 14C7.1829 14 7.83859 13.884 8.4502 13.6738V15.6709C8.45018 15.6828 8.44902 15.6945 8.44727 15.7061H10.0449C10.029 15.667 10.0195 15.6245 10.0195 15.5801V12.8574C11.0647 12.0988 11.8566 11.0126 12.2412 9.74805H12.5098C12.6988 9.74825 12.8535 9.90116 12.8535 10.0879V15.5801C12.8535 15.6246 12.8441 15.667 12.8281 15.7061H14.3896C14.384 15.6822 14.3809 15.6573 14.3809 15.6318L14.4414 9.09668H14.2422L13.2363 9.0957C13.0196 9.0957 12.8337 8.98296 12.7363 8.79199C12.6392 8.60056 12.6578 8.38555 12.7871 8.21387L15.4199 4.72266C15.5289 4.57792 15.6857 4.5 15.8682 4.5Z" fill="white" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6 2.00195C9.03752 2.00195 11.5 4.4645 11.5 7.50195C11.5 10.5394 9.03745 13.002 6 13.002C2.96255 13.002 0.5 10.5395 0.5 7.50195C0.5 4.46443 2.96255 2.00195 6 2.00195ZM3.86843 6.11668C3.86843 5.16624 4.49258 4.44621 5.38018 4.1837L5.37599 3.46144C5.37599 3.31024 5.49929 3.18721 5.65048 3.18721H6.34965C6.50071 3.18721 6.62388 3.31038 6.62388 3.46144L6.61921 4.15235C6.78828 4.19507 6.9474 4.25317 7.09981 4.33808C7.65706 4.64798 7.98485 5.18669 8.09122 5.80697C8.1053 5.88843 8.0837 5.96704 8.03028 6.03021C7.97686 6.09305 7.90339 6.12758 7.82072 6.12758H7.1793C7.05722 6.12758 6.9522 6.04944 6.91679 5.93257C6.67182 5.12195 5.15749 5.03617 5.15749 6.03279C5.15749 6.57643 5.86133 6.77908 6.27517 6.93014C7.26014 7.28968 8.13123 7.67001 8.13123 8.88729C8.13123 9.8376 7.50722 10.5578 6.61961 10.8203L6.62381 11.5425C6.62381 11.6935 6.50051 11.8168 6.34959 11.8168H5.65041C5.49935 11.8168 5.37592 11.6936 5.37592 11.5425L5.38059 10.8518C5.21138 10.8088 5.0524 10.7509 4.89978 10.6659C4.34253 10.356 4.01522 9.81702 3.90851 9.197C3.89443 9.11554 3.91603 9.03707 3.96925 8.97396C4.02247 8.91079 4.09627 8.8766 4.17881 8.8766H4.82022C4.94231 8.8766 5.04746 8.9546 5.08287 9.07147C5.32785 9.88222 6.84217 9.96788 6.84217 8.97112C6.84217 8.39552 6.03352 8.18765 5.60058 8.02846C4.65657 7.68152 3.86843 7.27038 3.86843 6.11668Z" fill="white" />
            </svg>
        },
        {
            id: 'extra-contributions', label: 'Extra Contributions', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14.1687 11.5301C16.4757 8.93811 17.4467 6.84611 17.8097 5.31211C18.0197 4.42511 18.0237 3.73211 17.9697 3.24711C17.9487 3.05687 17.9126 2.86861 17.8617 2.68411C17.8404 2.60594 17.8143 2.52913 17.7837 2.45411C17.7107 2.29011 17.6157 2.21911 17.4317 2.15811C17.379 2.1409 17.3256 2.12589 17.2717 2.11311C17.0842 2.06842 16.8937 2.03734 16.7017 2.02011C16.2117 1.97611 15.5117 1.99011 14.6217 2.20811C13.0857 2.58211 11.0037 3.55111 8.46069 5.81211L6.06069 6.05011H6.05469C5.47798 6.11425 4.94038 6.37317 4.53069 6.78411L2.14869 9.17011C2.07325 9.24609 2.02352 9.34381 2.00651 9.44952C1.98949 9.55523 2.00605 9.66362 2.05384 9.75943C2.10164 9.85524 2.17827 9.93366 2.27296 9.98365C2.36764 10.0336 2.47562 10.0527 2.58169 10.0381L4.47769 9.76711C4.75769 9.72711 5.06969 9.78011 5.43269 9.89911C5.66469 9.97511 5.86969 10.0591 6.08769 10.1471L6.29069 10.2301C6.48669 11.0461 6.95069 11.8101 7.56569 12.4251C8.17869 13.0391 8.94169 13.5051 9.75669 13.7021L9.83869 13.9041C9.92769 14.1221 10.0117 14.3281 10.0877 14.5611C10.2057 14.9241 10.2597 15.2371 10.2197 15.5171L9.94869 17.4171C9.93439 17.523 9.95356 17.6307 10.0035 17.7251C10.0535 17.8195 10.1317 17.896 10.2273 17.9437C10.3229 17.9914 10.431 18.0081 10.5365 17.9913C10.642 17.9745 10.7396 17.9252 10.8157 17.8501L13.1977 15.4641C13.6077 15.0541 13.8657 14.5151 13.9297 13.9381L14.1687 11.5301ZM14.2787 7.83111C13.4817 8.63111 12.3487 8.79211 11.7507 8.19311C11.1527 7.59311 11.3147 6.46011 12.1117 5.66111C12.9097 4.86211 14.0417 4.70111 14.6397 5.30011C15.2377 5.89911 15.0767 7.03211 14.2797 7.83111H14.2787Z" fill="white" />
                <path d="M7.20365 12.7863C7.73442 13.3242 8.34244 13.7799 9.00765 14.1383C7.88965 15.1453 4.07865 16.1663 3.95365 16.0413C3.82765 15.9143 4.69065 11.8523 5.79265 10.8613C6.13865 11.5513 6.62965 12.2113 7.20365 12.7863Z" fill="white" />
            </svg>
        },
    ];

    return (
        <>
            <div className="px-2.5 py-4">
                <div className="flex items-center gap-5 flex-wrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'cursor-pointer flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] transition text-[14px] font-semibold',
                                activeTab === tab.id ? 'bg-[#1e88e5] text-white' : 'bg-[#232725] text-white hover:opacity-90'
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-[calc(100%-63px)] overflow-hidden">
                {activeTab === 'tasks' ? (
                    <div className="h-full">
                        <div className="bg-white rounded-[10px] border-2 border-[#e6e6e6] shadow-[0_2px_4px_rgba(0,0,0,0.1)] h-full flex flex-col">
                            <div className="px-5 py-4 border-b-2 border-[#E6E6E6] flex flex-wrap gap-3 items-center justify-between">
                                <p className="text-[18px] font-semibold text-black flex-1">{formatFullDate(currentDate)}</p>
                                <div className="flex items-center gap-5">
                                    <div className="relative w-[399px]">
                                        <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-black pointer-events-none" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by task title, or description"
                                            className="bg-[#e6e6e6] border border-[#cacaca] h-[40px] w-full pl-[43px] pr-4 rounded-[25px] text-[14px] font-medium text-black placeholder:text-black focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        ref={filterButtonRef}
                                        type="button"
                                        onClick={() => setIsFilterOpen((prev) => !prev)}
                                        className={cn(
                                            "shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors bg-[#DE4A2C]",
                                            isLoadingBootstrap && "opacity-70 cursor-not-allowed"
                                        )}
                                        disabled={isLoadingBootstrap}
                                        aria-label="Filter tasks"
                                    >
                                        {isLoadingBootstrap ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path
                                                    d="M1.61274 1.6L6.84029 8.0808C7.06912 8.36466 7.1937 8.71734 7.19353 9.0808V14.4L8.80647 13.2V9.08C8.80648 8.71682 8.93105 8.36445 9.15971 8.0808L14.3873 1.6H1.61274ZM1.61274 0H14.3873C14.6911 3.76005e-05 14.9888 0.0852189 15.246 0.245733C15.5032 0.406246 15.7094 0.635563 15.841 0.90727C15.9725 1.17898 16.0241 1.48202 15.9896 1.7815C15.9551 2.08097 15.8361 2.3647 15.6462 2.6L10.4194 9.08V13.2C10.4194 13.4484 10.3611 13.6934 10.2491 13.9155C10.1371 14.1377 9.97456 14.331 9.77424 14.48L8.16129 15.68C7.92166 15.8583 7.63671 15.9669 7.33838 15.9935C7.04005 16.0202 6.74012 15.964 6.4722 15.8311C6.20428 15.6982 5.97896 15.4939 5.82148 15.2412C5.664 14.9884 5.58058 14.6971 5.58058 14.4V9.08L0.353841 2.6C0.163928 2.3647 0.0448808 2.08097 0.010412 1.7815C-0.0240568 1.48202 0.0274547 1.17898 0.159013 0.90727C0.290572 0.635563 0.496826 0.406246 0.754019 0.245733C1.01121 0.0852189 1.30888 3.76005e-05 1.61274 0Z"
                                                    fill="white"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <TaskFilter
                                    isOpen={isFilterOpen}
                                    onClose={() => setIsFilterOpen(false)}
                                    triggerRef={filterButtonRef}
                                    bootstrapData={meetingBootstrapData}
                                    initialFilters={filters ? { ...filters } as any : null}
                                    onApply={(newFilters) => {
                                        setFilters(newFilters);
                                        setIsFilterOpen(false);
                                    }}
                                    onReset={handleResetAll}
                                />

                                <div className="flex items-center justify-end gap-5 flex-wrap flex-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTask(null);
                                            setIsTaskDrawerOpen(true);
                                        }}
                                        className="bg-[#008080] flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5 stroke-3" />
                                        Create Task
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToday}
                                        className="px-[15px] border-2 border-[#CACACA] rounded-[25px] text-[14px] font-semibold text-black hover:bg-[#1E88E5] hover:border-[#1E88E5] hover:text-white transition duration-300 h-[30px] cursor-pointer"
                                    >
                                        Today
                                    </button>
                                    <div className="flex items-center gap-3 border-l border-[#E6E6E6] pl-5">
                                        <button
                                            type="button"
                                            onClick={handlePreviousDate}
                                            className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                                            aria-label="Previous day"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100">
                                                <path d="M6.73232 11.7359C6.90372 11.5667 7 11.3373 7 11.098C7 10.8588 6.90372 10.6294 6.73232 10.4602L2.2068 5.99455L6.73232 1.52889C6.89886 1.35874 6.99101 1.13086 6.98893 0.894314C6.98684 0.657772 6.89069 0.4315 6.72118 0.264234C6.55167 0.0969667 6.32237 0.0020895 6.08266 3.43323e-05C5.84295 -0.00202179 5.612 0.0889101 5.43958 0.253245L0.267679 5.35673C0.0962842 5.52591 0 5.75533 0 5.99455C0 6.23377 0.0962842 6.4632 0.267679 6.63238L5.43958 11.7359C5.61102 11.905 5.84352 12 6.08595 12C6.32837 12 6.56087 11.905 6.73232 11.7359Z" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextDate}
                                            className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                                            aria-label="Next day"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100">
                                                <path d="M0.267679 11.7359C0.0962844 11.5667 0 11.3373 0 11.098C0 10.8588 0.0962844 10.6294 0.267679 10.4602L4.7932 5.99455L0.267679 1.52889C0.101142 1.35874 0.00899076 1.13086 0.0110741 0.894314C0.0131569 0.657772 0.109307 0.4315 0.278816 0.264234C0.448325 0.0969667 0.67763 0.0020895 0.917343 3.43323e-05C1.15705 -0.00202179 1.388 0.0889101 1.56042 0.253245L6.73232 5.35673C6.90372 5.52591 7 5.75533 7 5.99455C7 6.23377 6.90372 6.4632 6.73232 6.63238L1.56042 11.7359C1.38898 11.905 1.15648 12 0.914052 12C0.671627 12 0.439126 11.905 0.267679 11.7359Z" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-hidden relative flex-1">
                                {isLoadingTasks && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[14px] font-medium text-[#1E88E5]">Loading tasks...</p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 gap-[6px] p-[5px] h-full">
                                    <KanbanColumn
                                        title="To Do"
                                        tasks={tasksByStatus.todo}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#FFB74D"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                                <path d="M6.49949 3H2.4999C1.94767 3 1.5 3.44767 1.5 3.9999V7.99949C1.5 8.55172 1.94767 8.99939 2.4999 8.99939H6.49949C7.05172 8.99939 7.49939 8.55172 7.49939 7.99949V3.9999C7.49939 3.44767 7.05172 3 6.49949 3Z" stroke="#FFB74D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M1.5 14.9989L3.4998 16.9987L7.49939 12.9991M11.499 4H19.4982M11.499 9.99939H19.4982M11.499 15.9988H19.4982" stroke="#FFB74D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        }
                                        onTaskClick={handleTaskClick}
                                        onTaskEdit={(taskId) => console.log('Edit task', taskId)}
                                        onTaskDelete={handleDeleteTask}
                                        searchTerm={searchTerm}
                                    />
                                    <KanbanColumn
                                        title="In Progress"
                                        tasks={tasksByStatus['in-progress']}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#1E88E5"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                                                <path d="M9.99999 20C8.63333 20 7.34166 19.7373 6.125 19.212C4.90833 18.6867 3.846 17.97 2.938 17.062C2.03 16.154 1.31333 15.0917 0.788 13.875C0.262667 12.6583 0 11.3667 0 10C0 8.61667 0.262667 7.321 0.788 6.113C1.31333 4.905 2.03 3.84667 2.938 2.938C3.846 2.02933 4.90833 1.31267 6.125 0.788C7.34166 0.263333 8.63333 0.000666667 9.99999 0C10.2833 0 10.521 0.0960001 10.713 0.288C10.905 0.48 11.0007 0.717333 11 1C10.9993 1.28267 10.9033 1.52033 10.712 1.713C10.5207 1.90567 10.2833 2.00133 9.99999 2C7.78333 2 5.89566 2.77933 4.337 4.338C2.77833 5.89667 1.99933 7.784 2 10C2.00067 12.216 2.78 14.1037 4.338 15.663C5.896 17.2223 7.78333 18.0013 9.99999 18C12.2167 17.9987 14.1043 17.2197 15.663 15.663C17.2217 14.1063 18.0007 12.2187 18 10C18 9.71667 18.096 9.47933 18.288 9.288C18.48 9.09667 18.7173 9.00067 19 9C19.2827 8.99933 19.5203 9.09533 19.713 9.288C19.9057 9.48067 20.0013 9.718 20 10C20 11.3667 19.7373 12.6583 19.212 13.875C18.6867 15.0917 17.97 16.1543 17.062 17.063C16.154 17.9717 15.0957 18.6883 13.887 19.213C12.6783 19.7377 11.3827 20 9.99999 20Z" fill="#1E88E5" />
                                            </svg>
                                        }
                                        onTaskClick={handleTaskClick}
                                        onTaskEdit={(taskId) => console.log('Edit task', taskId)}
                                        onTaskDelete={handleDeleteTask}
                                        searchTerm={searchTerm}
                                    />
                                    <KanbanColumn
                                        title="Completed"
                                        tasks={tasksByStatus.completed}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#16A34A"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.99961 2.63629C9.03264 2.63629 8.07515 2.82675 7.18179 3.19679C6.28843 3.56683 5.47671 4.10921 4.79296 4.79296C4.10921 5.47671 3.56683 6.28843 3.19679 7.18179C2.82675 8.07515 2.63629 9.03264 2.63629 9.99961C2.63629 10.9666 2.82675 11.9241 3.19679 12.8174C3.56683 13.7108 4.10921 14.5225 4.79296 15.2063C5.47671 15.89 6.28843 16.4324 7.18179 16.8024C8.07515 17.1725 9.03264 17.3629 9.99961 17.3629C11.9525 17.3629 13.8254 16.5871 15.2063 15.2063C16.5871 13.8254 17.3629 11.9525 17.3629 9.99961C17.3629 8.04674 16.5871 6.17385 15.2063 4.79296C13.8254 3.41207 11.9525 2.63629 9.99961 2.63629ZM1 9.99961C1 5.02937 5.02937 1 9.99961 1C14.9698 1 18.9992 5.02937 18.9992 9.99961C18.9992 14.9698 14.9698 18.9992 9.99961 18.9992C5.02937 18.9992 1 14.9698 1 9.99961Z" fill="#16A34A" />
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5869 7.54358L8.26589 13.8646L5.08984 10.0741L6.32606 9.00233L8.35179 11.465L13.43 6.38672L14.5869 7.54358Z" fill="#16A34A" />
                                            </svg>
                                        }
                                        onTaskClick={handleTaskClick}
                                        onTaskEdit={(taskId) => console.log('Edit task', taskId)}
                                        onTaskDelete={handleDeleteTask}
                                        searchTerm={searchTerm}
                                    />
                                    <KanbanColumn
                                        title="Overdue"
                                        tasks={tasksByStatus.overdue}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#8C2036"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.32669 0C5.59158 0 5.84561 0.105226 6.03292 0.292528C6.22022 0.479831 6.32544 0.733868 6.32544 0.998754V2.66335H12.9838V0.998754C12.9838 0.733868 13.089 0.479831 13.2763 0.292528C13.4636 0.105226 13.7177 0 13.9826 0C14.2474 0 14.5015 0.105226 14.6888 0.292528C14.8761 0.479831 14.9813 0.733868 14.9813 0.998754V2.66335H17.3117C17.6649 2.66335 18.0036 2.80365 18.2534 3.05338C18.5031 3.30312 18.6434 3.64184 18.6434 3.99502V9.65463C18.6434 9.91951 18.5382 10.1735 18.3509 10.3609C18.1636 10.5482 17.9095 10.6534 17.6447 10.6534C17.3798 10.6534 17.1257 10.5482 16.9384 10.3609C16.7511 10.1735 16.6459 9.91951 16.6459 9.65463V8.65587H1.99751V16.6459H9.65463C9.91951 16.6459 10.1735 16.7511 10.3609 16.9384C10.5482 17.1257 10.6534 17.3798 10.6534 17.6447C10.6534 17.9095 10.5482 18.1636 10.3609 18.3509C10.1735 18.5382 9.91951 18.6434 9.65463 18.6434H1.33167C0.978491 18.6434 0.639775 18.5031 0.390038 18.2534C0.140301 18.0036 0 17.6649 0 17.3117V3.99502C0 3.64184 0.140301 3.30312 0.390038 3.05338C0.639775 2.80365 0.978491 2.66335 1.33167 2.66335H4.32794V0.998754C4.32794 0.733868 4.43316 0.479831 4.62046 0.292528C4.80777 0.105226 5.0618 0 5.32669 0ZM1.99751 6.65836H16.6459V4.66085H1.99751V6.65836ZM13.6896 12.278C13.5982 12.1799 13.4879 12.1012 13.3654 12.0466C13.2429 11.992 13.1106 11.9627 12.9765 11.9603C12.8424 11.9579 12.7092 11.9826 12.5848 12.0328C12.4605 12.0831 12.3475 12.1578 12.2527 12.2527C12.1578 12.3475 12.0831 12.4605 12.0328 12.5848C11.9826 12.7092 11.9579 12.8424 11.9603 12.9765C11.9627 13.1106 11.992 13.2429 12.0466 13.3654C12.1012 13.4879 12.1799 13.5982 12.278 13.6896L14.5685 15.9801L12.278 18.2705C12.1799 18.362 12.1012 18.4722 12.0466 18.5948C11.992 18.7173 11.9627 18.8495 11.9603 18.9836C11.9579 19.1177 11.9826 19.2509 12.0328 19.3753C12.0831 19.4997 12.1578 19.6126 12.2527 19.7075C12.3475 19.8023 12.4605 19.8771 12.5848 19.9273C12.7092 19.9775 12.8424 20.0022 12.9765 19.9998C13.1106 19.9975 13.2429 19.9681 13.3654 19.9135C13.4879 19.859 13.5982 19.7802 13.6896 19.6821L15.9801 17.3916L18.2705 19.6821C18.362 19.7802 18.4722 19.859 18.5948 19.9135C18.7173 19.9681 18.8495 19.9975 18.9836 19.9998C19.1177 20.0022 19.2509 19.9775 19.3753 19.9273C19.4997 19.8771 19.6126 19.8023 19.7075 19.7075C19.8023 19.6126 19.8771 19.4997 19.9273 19.3753C19.9775 19.2509 20.0022 19.1177 19.9998 18.9836C19.9975 18.8495 19.9681 18.7173 19.9135 18.5948C19.859 18.4722 19.7802 18.362 19.6821 18.2705L17.3916 15.9801L19.6821 13.6896C19.7802 13.5982 19.859 13.4879 19.9135 13.3654C19.9681 13.2429 19.9975 13.1106 19.9998 12.9765C20.0022 12.8424 19.9775 12.7092 19.9273 12.5848C19.8771 12.4605 19.8023 12.3475 19.7075 12.2527C19.6126 12.1578 19.4997 12.0831 19.3753 12.0328C19.2509 11.9826 19.1177 11.9579 18.9836 11.9603C18.8495 11.9627 18.7173 11.992 18.5948 12.0466C18.4722 12.1012 18.362 12.1799 18.2705 12.278L15.9801 14.5685L13.6896 12.278Z" fill="#8C2036" />
                                            </svg>
                                        }
                                        onTaskClick={handleTaskClick}
                                        onTaskEdit={(taskId) => console.log('Edit task', taskId)}
                                        onTaskDelete={handleDeleteTask}
                                        searchTerm={searchTerm}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'meetings' ? (
                    <div className="h-full">
                        <div className="bg-white rounded-[10px] border-2 border-[#e6e6e6] shadow-[0_2px_4px_rgba(0,0,0,0.1)] h-full flex flex-col">
                            <div className="px-5 py-4 border-b-2 border-[#E6E6E6] flex flex-wrap gap-3 items-center justify-between">
                                <p className="text-[18px] font-semibold text-black flex-1">{formatFullDate(currentDate)}</p>
                                <div className="flex items-center gap-5">
                                    <div className="relative w-[399px]">
                                        <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-black pointer-events-none" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by task title, or description"
                                            className="bg-[#e6e6e6] border border-[#cacaca] h-[40px] w-full pl-[43px] pr-4 rounded-[25px] text-[14px] font-medium text-black placeholder:text-black focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        ref={meetingFilterButtonRef}
                                        type="button"
                                        onClick={() => setIsMeetingFilterOpen((prev) => !prev)}
                                        className={cn(
                                            "shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors bg-[#DE4A2C]",
                                            isLoadingBootstrap && "opacity-70 cursor-not-allowed"
                                        )}
                                        disabled={isLoadingBootstrap}
                                        aria-label="Filter meetings"
                                    >
                                        {isLoadingBootstrap ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path
                                                    d="M1.61274 1.6L6.84029 8.0808C7.06912 8.36466 7.1937 8.71734 7.19353 9.0808V14.4L8.80647 13.2V9.08C8.80648 8.71682 8.93105 8.36445 9.15971 8.0808L14.3873 1.6H1.61274ZM1.61274 0H14.3873C14.6911 3.76005e-05 14.9888 0.0852189 15.246 0.245733C15.5032 0.406246 15.7094 0.635563 15.841 0.90727C15.9725 1.17898 16.0241 1.48202 15.9896 1.7815C15.9551 2.08097 15.8361 2.3647 15.6462 2.6L10.4194 9.08V13.2C10.4194 13.4484 10.3611 13.6934 10.2491 13.9155C10.1371 14.1377 9.97456 14.331 9.77424 14.48L8.16129 15.68C7.92166 15.8583 7.63671 15.9669 7.33838 15.9935C7.04005 16.0202 6.74012 15.964 6.4722 15.8311C6.20428 15.6982 5.97896 15.4939 5.82148 15.2412C5.664 14.9884 5.58058 14.6971 5.58058 14.4V9.08L0.353841 2.6C0.163928 2.3647 0.0448808 2.08097 0.010412 1.7815C-0.0240568 1.48202 0.0274547 1.17898 0.159013 0.90727C0.290572 0.635563 0.496826 0.406246 0.754019 0.245733C1.01121 0.0852189 1.30888 3.76005e-05 1.61274 0Z"
                                                    fill="white"
                                                />
                                            </svg>
                                        )}
                                    </button>

                                    <MeetingFilter
                                        isOpen={isMeetingFilterOpen}
                                        onClose={() => setIsMeetingFilterOpen(false)}
                                        triggerRef={meetingFilterButtonRef}
                                        bootstrapData={meetingBootstrapData}
                                        initialFilters={meetingFilters ? { ...meetingFilters } as any : null}
                                        onApply={(newFilters) => {
                                            setMeetingFilters(newFilters);
                                            setIsMeetingFilterOpen(false);
                                        }}
                                        onReset={handleResetAll}
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-5 flex-wrap flex-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMeeting(null);
                                            setIsCreateMeetingOpen(true);
                                        }}
                                        className="bg-[#008080] flex items-center gap-[5px] px-[15px] py-[5px] rounded-[25px] text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5 stroke-3" />
                                        New Meeting
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToday}
                                        className="px-[15px] border-2 border-[#CACACA] rounded-[25px] text-[14px] font-semibold text-black hover:bg-[#1E88E5] hover:border-[#1E88E5] hover:text-white transition duration-300 h-[30px] cursor-pointer"
                                    >
                                        Today
                                    </button>
                                    <div className="flex items-center gap-3 border-l border-[#E6E6E6] pl-5">
                                        <button
                                            type="button"
                                            onClick={handlePreviousDate}
                                            className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                                            aria-label="Previous day"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100">
                                                <path d="M6.73232 11.7359C6.90372 11.5667 7 11.3373 7 11.098C7 10.8588 6.90372 10.6294 6.73232 10.4602L2.2068 5.99455L6.73232 1.52889C6.89886 1.35874 6.99101 1.13086 6.98893 0.894314C6.98684 0.657772 6.89069 0.4315 6.72118 0.264234C6.55167 0.0969667 6.32237 0.0020895 6.08266 3.43323e-05C5.84295 -0.00202179 5.612 0.0889101 5.43958 0.253245L0.267679 5.35673C0.0962842 5.52591 0 5.75533 0 5.99455C0 6.23377 0.0962842 6.4632 0.267679 6.63238L5.43958 11.7359C5.61102 11.905 5.84352 12 6.08595 12C6.32837 12 6.56087 11.905 6.73232 11.7359Z" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextDate}
                                            className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                                            aria-label="Next day"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100">
                                                <path d="M0.267679 11.7359C0.0962844 11.5667 0 11.3373 0 11.098C0 10.8588 0.0962844 10.6294 0.267679 10.4602L4.7932 5.99455L0.267679 1.52889C0.101142 1.35874 0.00899076 1.13086 0.0110741 0.894314C0.0131569 0.657772 0.109307 0.4315 0.278816 0.264234C0.448325 0.0969667 0.67763 0.0020895 0.917343 3.43323e-05C1.15705 -0.00202179 1.388 0.0889101 1.56042 0.253245L6.73232 5.35673C6.90372 5.52591 7 5.75533 7 5.99455C7 6.23377 6.90372 6.4632 6.73232 6.63238L1.56042 11.7359C1.38898 11.905 1.15648 12 0.914052 12C0.671627 12 0.439126 11.905 0.267679 11.7359Z" className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-hidden relative flex-1">
                                {isLoadingMeetings && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[14px] font-medium text-[#1E88E5]">Loading meetings...</p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 gap-[6px] p-[5px] h-full">
                                    <MeetingKanbanColumn
                                        title="To Do"
                                        meetings={meetingsByStatus.todo}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#FFB74D"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                                                <path d="M6.49949 3H2.4999C1.94767 3 1.5 3.44767 1.5 3.9999V7.99949C1.5 8.55172 1.94767 8.99939 2.4999 8.99939H6.49949C7.05172 8.99939 7.49939 8.55172 7.49939 7.99949V3.9999C7.49939 3.44767 7.05172 3 6.49949 3Z" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M1.5 14.9989L3.4998 16.9987L7.49939 12.9991M11.499 4H19.4982M11.499 9.99939H19.4982M11.499 15.9988H19.4982" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        }
                                        onMeetingClick={handleMeetingClick}
                                        searchTerm={searchTerm}
                                    />
                                    <MeetingKanbanColumn
                                        title="In Progress"
                                        meetings={meetingsByStatus['in-progress']}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#1E88E5"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                                                <path d="M9.99999 20C8.63333 20 7.34166 19.7373 6.125 19.212C4.90833 18.6867 3.846 17.97 2.938 17.062C2.03 16.154 1.31333 15.0917 0.788 13.875C0.262667 12.6583 0 11.3667 0 10C0 8.61667 0.262667 7.321 0.788 6.113C1.31333 4.905 2.03 3.84667 2.938 2.938C3.846 2.02933 4.90833 1.31267 6.125 0.788C7.34166 0.263333 8.63333 0.000666667 9.99999 0C10.2833 0 10.521 0.0960001 10.713 0.288C10.905 0.48 11.0007 0.717333 11 1C10.9993 1.28267 10.9033 1.52033 10.712 1.713C10.5207 1.90567 10.2833 2.00133 9.99999 2C7.78333 2 5.89566 2.77933 4.337 4.338C2.77833 5.89667 1.99933 7.784 2 10C2.00067 12.216 2.78 14.1037 4.338 15.663C5.896 17.2223 7.78333 18.0013 9.99999 18C12.2167 17.9987 14.1043 17.2197 15.663 15.663C17.2217 14.1063 18.0007 12.2187 18 10C18 9.71667 18.096 9.47933 18.288 9.288C18.48 9.09667 18.7173 9.00067 19 9C19.2827 8.99933 19.5203 9.09533 19.713 9.288C19.9057 9.48067 20.0013 9.718 20 10C20 11.3667 19.7373 12.6583 19.212 13.875C18.6867 15.0917 17.97 16.1543 17.062 17.063C16.154 17.9717 15.0957 18.6883 13.887 19.213C12.6783 19.7377 11.3827 20 9.99999 20Z" fill="#1E88E5" />
                                            </svg>
                                        }
                                        onMeetingClick={handleMeetingClick}
                                        searchTerm={searchTerm}
                                    />
                                    <MeetingKanbanColumn
                                        title="Completed"
                                        meetings={meetingsByStatus.completed}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#16A34A"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M9.99961 2.63629C9.03264 2.63629 8.07515 2.82675 7.18179 3.19679C6.28843 3.56683 5.47671 4.10921 4.79296 4.79296C4.10921 5.47671 3.56683 6.28843 3.19679 7.18179C2.82675 8.07515 2.63629 9.03264 2.63629 9.99961C2.63629 10.9666 2.82675 11.9241 3.19679 12.8174C3.56683 13.7108 4.10921 14.5225 4.79296 15.2063C5.47671 15.89 6.28843 16.4324 7.18179 16.8024C8.07515 17.1725 9.03264 17.3629 9.99961 17.3629C11.9525 17.3629 13.8254 16.5871 15.2063 15.2063C16.5871 13.8254 17.3629 11.9525 17.3629 9.99961C17.3629 8.04674 16.5871 6.17385 15.2063 4.79296C13.8254 3.41207 11.9525 2.63629 9.99961 2.63629ZM1 9.99961C1 5.02937 5.02937 1 9.99961 1C14.9698 1 18.9992 5.02937 18.9992 9.99961C18.9992 14.9698 14.9698 18.9992 9.99961 18.9992C5.02937 18.9992 1 14.9698 1 9.99961Z" fill="#16A34A" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M14.5869 7.54358L8.26589 13.8646L5.08984 10.0741L6.32606 9.00233L8.35179 11.465L13.43 6.38672L14.5869 7.54358Z" fill="#16A34A" />
                                            </svg>
                                        }
                                        onMeetingClick={handleMeetingClick}
                                        searchTerm={searchTerm}
                                    />
                                    <MeetingKanbanColumn
                                        title="Overdue"
                                        meetings={meetingsByStatus.overdue}
                                        selectedSort={sortBy}
                                        onSortChange={setSortBy}
                                        accentColor="#8C2036"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M5.32669 0C5.59158 0 5.84561 0.105226 6.03292 0.292528C6.22022 0.479831 6.32544 0.733868 6.32544 0.998754V2.66335H12.9838V0.998754C12.9838 0.733868 13.089 0.479831 13.2763 0.292528C13.4636 0.105226 13.7177 0 13.9826 0C14.2474 0 14.5015 0.105226 14.6888 0.292528C14.8761 0.479831 14.9813 0.733868 14.9813 0.998754V2.66335H17.3117C17.6649 2.66335 18.0036 2.80365 18.2534 3.05338C18.5031 3.30312 18.6434 3.64184 18.6434 3.99502V9.65463C18.6434 9.91951 18.5382 10.1735 18.3509 10.3609C18.1636 10.5482 17.9095 10.6534 17.6447 10.6534C17.3798 10.6534 17.1257 10.5482 16.9384 10.3609C16.7511 10.1735 16.6459 9.91951 16.6459 9.65463V8.65587H1.99751V16.6459H9.65463C9.91951 16.6459 10.1735 16.7511 10.3609 16.9384C10.5482 17.1257 10.6534 17.3798 10.6534 17.6447C10.6534 17.9095 10.5482 18.1636 10.3609 18.3509C10.1735 18.5382 9.91951 18.6434 9.65463 18.6434H1.33167C0.978491 18.6434 0.639775 18.5031 0.390038 18.2534C0.140301 18.0036 0 17.6649 0 17.3117V3.99502C0 3.64184 0.140301 3.30312 0.390038 3.05338C0.639775 2.80365 0.978491 2.66335 1.33167 2.66335H4.32794V0.998754C4.32794 0.733868 4.43316 0.479831 4.62046 0.292528C4.80777 0.105226 5.0618 0 5.32669 0ZM1.99751 6.65836H16.6459V4.66085H1.99751V6.65836ZM13.6896 12.278C13.5982 12.1799 13.4879 12.1012 13.3654 12.0466C13.2429 11.992 13.1106 11.9627 12.9765 11.9603C12.8424 11.9579 12.7092 11.9826 12.5848 12.0328C12.4605 12.0831 12.3475 12.1578 12.2527 12.2527C12.1578 12.3475 12.0831 12.4605 12.0328 12.5848C11.9826 12.7092 11.9579 12.8424 11.9603 12.9765C11.9627 13.1106 11.992 13.2429 12.0466 13.3654C12.1012 13.4879 12.1799 13.5982 12.278 13.6896L14.5685 15.9801L12.278 18.2705C12.1799 18.362 12.1012 18.4722 12.0466 18.5948C11.992 18.7173 11.9627 18.8495 11.9603 18.9836C11.9579 19.1177 11.9826 19.2509 12.0328 19.3753C12.0831 19.4997 12.1578 19.6126 12.2527 19.7075C12.3475 19.8023 12.4605 19.8771 12.5848 19.9273C12.7092 19.9775 12.8424 20.0022 12.9765 19.9998C13.1106 19.9975 13.2429 19.9681 13.3654 19.9135C13.4879 19.859 13.5982 19.7802 13.6896 19.6821L15.9801 17.3916L18.2705 19.6821C18.362 19.7802 18.4722 19.859 18.5948 19.9135C18.7173 19.9681 18.8495 19.9975 18.9836 19.9998C19.1177 20.0022 19.2509 19.9775 19.3753 19.9273C19.4997 19.8771 19.6126 19.8023 19.7075 19.7075C19.8023 19.6126 19.8771 19.4997 19.9273 19.3753C19.9775 19.2509 20.0022 19.1177 19.9998 18.9836C19.9975 18.8495 19.9681 18.7173 19.9135 18.5948C19.859 18.4722 19.7802 18.362 19.6821 18.2705L17.3916 15.9801L19.6821 13.6896C19.7802 13.5982 19.859 13.4879 19.9135 13.3654C19.9681 13.2429 19.9975 13.1106 19.9998 12.9765C20.0022 12.8424 19.9775 12.7092 19.9273 12.5848C19.8771 12.4605 19.8023 12.3475 19.7075 12.2527C19.6126 12.1578 19.4997 12.0831 19.3753 12.0328C19.2509 11.9826 19.1177 11.9579 18.9836 11.9603C18.8495 11.9627 18.7173 11.992 18.5948 12.0466C18.4722 12.1012 18.362 12.1799 18.2705 12.278L15.9801 14.5685L13.6896 12.278Z" fill="#8C2036" />
                                            </svg>
                                        }
                                        onMeetingClick={handleMeetingClick}
                                        searchTerm={searchTerm}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'lectures' ? (
                    <div className="h-full">
                        <LecturesCalendarWeek
                            onSelectLecture={(lecture) => {
                                setSelectedLecture(lecture);
                            }}
                            onNewSchedule={() => {
                                // TODO: Implement new schedule functionality
                                // showToast('New Schedule', 'New schedule functionality coming soon.');
                            }}
                            onRescheduleRequest={() => {
                                // TODO: Implement reschedule request functionality
                                // showToast('Reschedule Request', 'Reschedule request functionality coming soon.');
                            }}
                        />
                    </div>
                ) : (
                    <div className="p-5 flex items-center justify-center h-full">
                        <p className="text-[16px] font-normal text-[#535352]">
                            {tabs.find((t) => t.id === activeTab)?.label} view coming soon
                        </p>
                    </div>
                )}
            </div>

            <TaskDrawer
                isOpen={isTaskDrawerOpen}
                task={selectedTask}
                bootstrapData={taskBootstrapData}
                onClose={() => {
                    setIsTaskDrawerOpen(false);
                    setSelectedTask(null);
                }}
                onSubmit={handleCreateTask}
                onUpdate={handleTaskUpdate}
                onEdit={(taskId: string) => {
                    const task = tasks.find((t) => t.id === taskId);
                    if (task) {
                        setSelectedTask(task);
                    }
                }}
                onDelete={(taskId: string) => {
                    handleDeleteTask(taskId);
                    setIsTaskDrawerOpen(false);
                    setSelectedTask(null);
                }}
                onScheduleEvent={handleScheduleEvent}
            />
            <TaskDrawer
                isOpen={isCreateMeetingOpen}
                meeting={selectedMeeting}
                type="meeting"
                bootstrapData={taskBootstrapData}
                onClose={() => {
                    setIsCreateMeetingOpen(false);
                    setSelectedMeeting(null);
                }}
                onMeetingSubmit={handleCreateMeeting}
                onMeetingUpdate={handleMeetingUpdate}
                onEdit={(meetingId: string) => {
                    handleMeetingEdit(meetingId);
                }}
                onDelete={(meetingId: string) => {
                    handleDeleteMeeting(meetingId);
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

            <ScheduleDetailsModal
                isOpen={!!selectedLecture}
                lecture={selectedLecture}
                onClose={() => setSelectedLecture(null)}
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

export default MyWork;

const formatFullDate = (date: Date) => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    return `${weekday}, ${day}${getOrdinalSuffix(day)} ${month} - ${year}`;
};

const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
};

const priorityValue = (priority: 'high' | 'medium' | 'low') => {
    const map = { high: 3, medium: 2, low: 1 };
    return map[priority];
};
