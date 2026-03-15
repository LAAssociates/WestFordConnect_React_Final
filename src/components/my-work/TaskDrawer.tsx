import React, { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { X, Send, MoreVertical, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Task, TaskStatus, Meeting, Priority, User, Comment } from './types';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import AttachmentDropdown from './AttachmentDropdown';
import AddLinkModal from './AddLinkModal';
import AttachmentMenuDropdown from './AttachmentMenuDropdown';
import DeleteAttachmentModal from './DeleteAttachmentModal';
import { mockUsers } from './mockData';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import type { Attachment } from './types';
import Tooltip from '../ui/Tooltip';
import AssignedToField from './AssignedToField';
import { taskService, type BootstrapDrawerResult, type TaskSaveRequest } from '../../services/taskService';
import { meetingService } from '../../services/meetingService';
import type { MeetingSaveRequest } from '../../types/meeting';
import { useAuth } from '../../contexts/AuthContext';

import { parseUTCDate, formatToDateTimeOffset } from '../../utils/dateUtils';
import { API_BASE_URL } from '../../services/apiClient';

interface DateTimePopoverProps {
    selectedDate: Date;
    selectedTime: string;
    onSave: (date: Date, time: string) => void;
    onCancel: () => void;
}

const DateTimePopover: React.FC<DateTimePopoverProps> = ({ selectedDate, selectedTime, onSave, onCancel }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const [selectedDateState, setSelectedDateState] = useState(selectedDate);
    const [hours, setHours] = useState(() => {
        if (selectedTime) {
            const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                return parseInt(match[1], 10);
            }
        }
        return selectedDate.getHours() % 12 || 12;
    });
    const [minutes, setMinutes] = useState(() => {
        if (selectedTime) {
            const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                return parseInt(match[2], 10);
            }
        }
        return selectedDate.getMinutes();
    });
    const [isAm, setIsAm] = useState(() => {
        if (selectedTime) {
            return selectedTime.toUpperCase().includes('AM');
        }
        return selectedDate.getHours() < 12;
    });
    const [hourInput, setHourInput] = useState(() => {
        if (selectedTime) {
            const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                return String(parseInt(match[1], 10)).padStart(2, '0');
            }
        }
        const hour12 = selectedDate.getHours() % 12 || 12;
        return String(hour12).padStart(2, '0');
    });
    const [minuteInput, setMinuteInput] = useState(() => {
        if (selectedTime) {
            const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                return String(parseInt(match[2], 10)).padStart(2, '0');
            }
        }
        return String(selectedDate.getMinutes()).padStart(2, '0');
    });
    const [hourFocused, setHourFocused] = useState(false);
    const [minuteFocused, setMinuteFocused] = useState(false);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDateState(newDate);
    };

    const handleTimeChange = (type: 'hour' | 'minute', delta: number) => {
        if (type === 'hour') {
            setHours((prev) => {
                const newHour = prev + delta;
                const clampedHour = Math.max(1, Math.min(12, newHour));
                setHourInput(String(clampedHour).padStart(2, '0'));
                return clampedHour;
            });
        } else {
            setMinutes((prev) => {
                const newMinute = prev + delta;
                const clampedMinute = Math.max(0, Math.min(59, newMinute));
                setMinuteInput(String(clampedMinute).padStart(2, '0'));
                return clampedMinute;
            });
        }
    };

    const handleHourInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setHourInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 1 && num <= 12) {
                setHours(num);
            }
        }
    };

    const handleHourInputBlur = () => {
        setHourFocused(false);
        const num = parseInt(hourInput, 10);
        if (isNaN(num) || num < 1 || num > 12) {
            setHourInput(String(hours).padStart(2, '0'));
        } else {
            setHourInput(String(num).padStart(2, '0'));
            setHours(num);
        }
    };

    const handleMinuteInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setMinuteInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 0 && num <= 59) {
                setMinutes(num);
            }
        }
    };

    const handleMinuteInputBlur = () => {
        setMinuteFocused(false);
        const num = parseInt(minuteInput, 10);
        if (isNaN(num) || num < 0 || num > 59) {
            setMinuteInput(String(minutes).padStart(2, '0'));
        } else {
            setMinuteInput(String(num).padStart(2, '0'));
            setMinutes(num);
        }
    };

    useEffect(() => {
        if (!hourFocused) {
            setHourInput(String(hours).padStart(2, '0'));
        }
    }, [hours, hourFocused]);

    useEffect(() => {
        if (!minuteFocused) {
            setMinuteInput(String(minutes).padStart(2, '0'));
        }
    }, [minutes, minuteFocused]);

    const handleSave = () => {
        const hour24 = isAm ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
        const newDate = new Date(selectedDateState);
        newDate.setHours(hour24, minutes, 0, 0);
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${isAm ? 'AM' : 'PM'}`;
        onSave(newDate, timeString);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const isSelectedDate = (day: number | null) => {
        if (day === null) return false;
        return (
            selectedDateState.getDate() === day &&
            selectedDateState.getMonth() === currentMonth.getMonth() &&
            selectedDateState.getFullYear() === currentMonth.getFullYear()
        );
    };

    const calendarDays = renderCalendar();

    return (
        <div className="bg-[#232725] rounded-[10px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] w-[341px] p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:opacity-70"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <p className="text-[14px] font-semibold text-white">
                    {monthNames[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
                </p>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:opacity-70"
                >
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-0 mb-2">
                {dayNames.map((day) => (
                    <div key={day} className="text-[12px] font-semibold text-white text-center tracking-[0.6px]">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-4 mb-4">
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="h-6 w-6" />;
                    }
                    const isSelected = isSelectedDate(day);
                    return (
                        <div className="w-full flex items-center justify-center">
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDateClick(day)}
                                className={cn(
                                    'h-6 w-6 text-[12px] font-medium text-white tracking-[0.6px] cursor-pointer',
                                    isSelected && 'bg-[#008080] rounded-full'
                                )}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#535352] mb-4" />

            {/* Time Picker */}
            <div className="flex items-center gap-[10px] mb-4">
                {/* Clock Icon */}
                <div className="w-5 h-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 6V10L13 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Time Input */}
                <div className="border border-[#535352] rounded-[5px] px-[10px] py-[5px] flex items-center gap-[20px]">
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
                    <div className="flex flex-col gap-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (minuteFocused) {
                                    handleTimeChange('minute', 1);
                                } else {
                                    handleTimeChange('hour', 1);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <ChevronUp className="w-3 h-3 text-white" />
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
                            className="cursor-pointer"
                        >
                            <ChevronDown className="w-3 h-3 text-white" />
                        </button>
                    </div>
                </div>

                {/* AM/PM Toggle */}
                <div className="border border-[#535352] rounded-[5px] p-[5px] flex gap-[5px]">
                    <button
                        type="button"
                        onClick={() => setIsAm(true)}
                        className={cn(
                            'w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-colors',
                            isAm ? 'bg-[#008080]' : 'bg-transparent'
                        )}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAm(false)}
                        className={cn(
                            'w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-colors',
                            !isAm ? 'bg-[#008080]' : 'bg-transparent'
                        )}
                    >
                        PM
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#535352] mb-4" />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-[10px]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border border-[#535352] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-70"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="bg-[#1677BC] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-90 w-[80px]"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

interface TaskDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null; // If provided, view/edit mode; if null/undefined, create mode
    meeting?: Meeting | null; // Alternative to task for meetings
    type?: 'task' | 'meeting'; // Type of drawer, defaults to 'task' if task is provided, 'meeting' if meeting is provided
    onSubmit?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void; // For create mode (tasks)
    onUpdate?: (task: Task) => void; // For edit mode (tasks)
    onMeetingSubmit?: (meeting: Omit<Meeting, 'id'>) => void; // For create mode (meetings)
    onMeetingUpdate?: (meeting: Meeting) => void; // For edit mode (meetings)
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onScheduleEvent?: (taskData: { title: string; description?: string; date: Date; time: string; assignedTo: User[]; venue: 'N/A' | 'Online' | 'On-site'; priority: Priority }) => void;
    bootstrapData?: BootstrapDrawerResult | null;
    meetingBootstrapData?: any; // For additional context if needed
}

const TaskDrawer: React.FC<TaskDrawerProps> = ({
    isOpen,
    onClose,
    task,
    meeting,
    type,
    onSubmit,
    onUpdate,
    onMeetingSubmit,
    onMeetingUpdate,
    onEdit,
    onDelete,
    bootstrapData: externalBootstrapData,
}) => {
    // Determine if this is a meeting or task
    const drawerType = type || (meeting ? 'meeting' : 'task');
    const isMeeting = drawerType === 'meeting';
    const isCreateMode = isMeeting ? !meeting : !task;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [status, setStatus] = useState<'todo' | 'in-progress' | 'completed' | 'overdue' | undefined>(undefined);
    const [dueDate, setDueDate] = useState(new Date());
    const [dueTime, setDueTime] = useState('');
    const [assignedTo, setAssignedTo] = useState<User[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [activeAudienceTab, setActiveAudienceTab] = useState<'individual' | 'project-groups'>('individual');
    const [venueType, setVenueType] = useState<'N/A' | 'Online' | 'On-site'>('N/A');
    const [venueDesc, setVenueDesc] = useState('');
    const [addToCalendar, setAddToCalendar] = useState(true);
    const [isEndOfDay, setIsEndOfDay] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [dateTimeMode, setDateTimeMode] = useState<'deadline' | 'event'>('deadline');
    const [startDate, setStartDate] = useState(new Date());
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState(new Date());
    const [endTime, setEndTime] = useState('');
    const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
    const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
    const [attachmentDropdownOpen, setAttachmentDropdownOpen] = useState(false);
    const attachmentButtonRef = useRef<HTMLButtonElement>(null);
    const [addLinkModalOpen, setAddLinkModalOpen] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    // (handleUploadFiles now defined once inside component below)
    const [isEditMode, setIsEditMode] = useState(false);
    const [showComments, setShowComments] = useState(task?.showComments ?? true);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [attachmentMenus, setAttachmentMenus] = useState<Record<string, boolean>>({});
    const attachmentMenuRefs = useRef<Record<string, React.RefObject<HTMLButtonElement | null>>>({});
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [deleteAttachmentModalOpen, setDeleteAttachmentModalOpen] = useState(false);
    const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const dueDateButtonRef = useRef<HTMLButtonElement>(null);
    const dueDatePopoverRef = useRef<HTMLDivElement>(null);
    const startDateButtonRef = useRef<HTMLButtonElement>(null);
    const startDatePopoverRef = useRef<HTMLDivElement>(null);
    const endDateButtonRef = useRef<HTMLButtonElement>(null);
    const endDatePopoverRef = useRef<HTMLDivElement>(null);
    const [dueDatePopoverPosition, setDueDatePopoverPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
    const [startDatePopoverPosition, setStartDatePopoverPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
    const [endDatePopoverPosition, setEndDatePopoverPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
    const [bootstrapData, setBootstrapData] = useState<BootstrapDrawerResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDetailedTask, setIsLoadingDetailedTask] = useState(false);
    const [isBootstrapLoading, setIsBootstrapLoading] = useState(false);
    const wasOpenRef = useRef(isOpen);
    const commentConnectionRef = useRef<HubConnection | null>(null);
    const joinedEntityRef = useRef<{ entityType: 'MYTASK' | 'MEETING'; entityId: number } | null>(null);

    const { user: authUser } = useAuth();
    const currentUser: User = authUser ? {
        id: authUser.id.toString(),
        name: `${authUser.firstName} ${authUser.lastName}`,
        position: 'Officer',
        email: authUser.email,
        avatar: authUser.picture
    } : mockUsers[0];

    const mapApiReplyToComment = (reply: any): Comment => ({
        id: (reply.replyId ?? reply.commentId ?? `reply-${Math.random()}`).toString(),
        text: reply.text,
        author: {
            id: reply.authorId?.toString() || '',
            name: reply.authorName || 'Unknown',
            avatar: reply.authorProfileImageUrl,
            position: '',
            email: ''
        },
        createdAt: parseUTCDate(reply.createdOn) || new Date(),
        likes: reply.likes || 0,
        dislikes: reply.dislikes || 0,
        userLiked: reply.userLiked || false,
        userDisliked: reply.userDisliked || false,
        replies: []
    });

    const mapApiCommentToComment = (comment: any): Comment => ({
        id: comment.commentId?.toString() || `comment-${Math.random()}`,
        text: comment.text,
        author: {
            id: comment.authorId?.toString() || '',
            name: comment.authorName || 'Unknown',
            avatar: comment.authorProfileImageUrl,
            position: '',
            email: ''
        },
        createdAt: parseUTCDate(comment.createdOn) || new Date(),
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        userLiked: comment.userLiked || false,
        userDisliked: comment.userDisliked || false,
        replies: (comment.replies || []).map(mapApiReplyToComment)
    });
    // Upload handler for attachments (scoped to component)
    const handleUploadFiles = (files: FileList) => {
        if (!files || files.length === 0) {
            console.log('TaskDrawer: no files selected');
            return;
        }
        console.log('TaskDrawer: received files for upload:', files.length);
        const newAttachments = Array.from(files).map((file) => {
            let fileType: Attachment['type'] = 'pdf';
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'doc' || ext === 'docx') fileType = 'doc';
            else if (ext === 'xls' || ext === 'xlsx') fileType = 'xlsx';
            else if (ext === 'ppt' || ext === 'pptx') fileType = 'pptx';
            else if (ext === 'pdf') fileType = 'pdf';
            return {
                id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: fileType,
                url: URL.createObjectURL(file),
                file,
            } as Attachment;
        });
        setAttachments((prev) => {
            const next = [...prev, ...newAttachments];
            console.log('TaskDrawer: attachments total after add', next.length);
            return next;
        });
    };

    // Initialize form state from task or meeting when provided
    useEffect(() => {
        const initializeOrFetch = async () => {
            // Only run when drawer transitions from closed to open
            if (!wasOpenRef.current && isOpen) {
                wasOpenRef.current = true;

                // Clear state immediately to avoid stale data
                setTitle('');
                setDescription('');
                setAssignedTo([]);
                setSelectedGroups([]);
                setActiveAudienceTab('individual');
                setAttachments([]);
                setComments([]);
                setIsEndOfDay(false);
                setValidationErrors([]);

                // 1. Use external bootstrap data if available, otherwise fetch
                setIsBootstrapLoading(true);
                try {
                    let bData: BootstrapDrawerResult | null = null;
                    if (externalBootstrapData) {
                        // Check if it's the initialload format (has filterAssignedToType)
                        const rawData = externalBootstrapData as any;
                        if (rawData.filterAssignedToType) {
                            // Map the initialload API response to BootstrapDrawerResult
                            bData = {
                                assignedToType: rawData.filterAssignedToType.map((f: any) => ({
                                    id: f.code,
                                    description: f.description
                                })),
                                attachments: [], // Missing in initialload, will be empty or handle gracefully
                                individualUsers: rawData.filterAssignedTo.map((u: any) => ({
                                    id: u.id,
                                    name: u.name,
                                    department: u.department,
                                    departmentId: u.departmentId,
                                    designation: u.designation,
                                    designationId: u.designationId,
                                    profileImageUrl: u.profileImageUrl || u.avatar
                                })),
                                groups: rawData.groups || [], // Add if available, else empty
                                status: rawData.status || [], // Add if available, else empty
                                priority: rawData.filterPriorities ? rawData.filterPriorities.map((p: any) => ({
                                    id: p.code,
                                    description: p.description
                                })) : [],
                                venue: rawData.venue || [] // Add if available
                            };
                        } else {
                            bData = externalBootstrapData as BootstrapDrawerResult;
                        }
                    }

                    if (!bData) {
                        const response = await taskService.getBootstrapDrawer();
                        bData = response.result;
                    }
                    setBootstrapData(bData);

                    // 2. NOW load specific task/meeting info using the fetched bootstrap data
                    if (isMeeting && meeting && meeting.id && !meeting.id.startsWith('meeting-')) {
                        // Fetch detailed meeting info for existing meeting
                        setIsLoadingDetailedTask(true);
                        try {
                            const meetingId = parseInt(meeting.id, 10);
                            const response = await meetingService.getSingleMeeting(meetingId);
                            if (response.success && response.result) {
                                const apiMeeting = response.result;

                                // Mappings
                                const statusMapping: Record<number, TaskStatus> = {
                                    1: 'todo',
                                    2: 'in-progress',
                                    3: 'completed',
                                    4: 'overdue'
                                };
                                const priorityReverseMap: Record<number, Priority> = {
                                    1: 'low',
                                    2: 'medium',
                                    3: 'high'
                                };

                                setTitle(apiMeeting.title);
                                setDescription(apiMeeting.description || '');
                                setPriority(priorityReverseMap[apiMeeting.priorityId]);
                                setStatus(statusMapping[apiMeeting.statusId]);

                                const apiDueStart = parseUTCDate(apiMeeting.dueStart) || new Date();
                                const apiDueEnd = parseUTCDate(apiMeeting.dueEnd) || apiDueStart;

                                setDueDate(apiDueStart);
                                // For meetings, we might not have a separate 'time' field, 
                                // it's derived from dueStart/dueEnd if scheduled
                                if (apiMeeting.isScheduled) {
                                    const timeStr = `${formatTime(apiDueStart)} - ${formatTime(apiDueEnd)}`;
                                    setDueTime(timeStr);
                                } else {
                                    setDueTime('');
                                }

                                // Resolve Audience using bootstrapData
                                if (apiMeeting.audience.userIds && bootstrapData) {
                                    const resolvedUsers = apiMeeting.audience.userIds.map(id => {
                                        const found = bootstrapData.individualUsers.find(u => u.id === id);
                                        if (found) {
                                            return {
                                                id: found.id.toString(),
                                                name: found.name,
                                                position: found.designation,
                                                email: '',
                                                avatar: found.profileImageUrl
                                            };
                                        }
                                        return {
                                            id: id.toString(),
                                            name: `User ${id}`,
                                            position: 'User',
                                            email: ''
                                        };
                                    });
                                    setAssignedTo(resolvedUsers);
                                } else {
                                    setAssignedTo([]);
                                }

                                // Resolve Project Groups
                                if (apiMeeting.audience.groupIds && apiMeeting.audience.groupIds.length > 0) {
                                    setSelectedGroups(apiMeeting.audience.groupIds.map(id => id.toString()));
                                    if (apiMeeting.audience.audienceType === 3) {
                                        setActiveAudienceTab('project-groups');
                                    }
                                } else {
                                    setSelectedGroups([]);
                                }

                                const existingVenueDesc = (apiMeeting.venueDesc || '').trim();
                                const looksLikeOnline = /^https?:\/\//i.test(existingVenueDesc);
                                setVenueType(existingVenueDesc ? (looksLikeOnline ? 'Online' : 'On-site') : 'N/A');
                                setVenueDesc(existingVenueDesc);
                                setAddToCalendar(apiMeeting.addToCalendar ?? false);

                                // Fetch Comments
                                const commentResponse = await meetingService.getComments(meetingId);
                                if (commentResponse.success && commentResponse.result) {
                                    setComments((commentResponse.result || []).map(mapApiCommentToComment));
                                }

                                // Attachments
                                if (apiMeeting.attachments) {
                                    const mappedAttachments: Attachment[] = apiMeeting.attachments.map(att => ({
                                        id: att.attachmentId.toString(),
                                        name: att.displayText,
                                        type: att.attachmentType === 'LINK' ? 'link' : (att.contentType?.includes('pdf') ? 'pdf' : 'doc'),
                                        url: att.url,
                                    }));
                                    setAttachments(mappedAttachments);
                                }

                                const isEventMode = apiMeeting.isScheduled;
                                setDateTimeMode(isEventMode ? 'event' : 'deadline');

                                if (isEventMode) {
                                    setStartDate(apiDueStart);
                                    setStartTime(formatTime(apiDueStart));
                                    setEndDate(apiDueEnd);
                                    setEndTime(formatTime(apiDueEnd));
                                } else {
                                    setStartDate(apiDueStart);
                                    setStartTime('');
                                    setEndDate(apiDueEnd);
                                    setEndTime('');
                                }
                            }
                        } catch (err) {
                            console.error('TaskDrawer: error fetching single meeting info', err);
                        } finally {
                            setIsLoadingDetailedTask(false);
                        }
                    } else if (isMeeting && meeting) {
                        // (Meeting initialization from local data)
                        setTitle(meeting.title);
                        setDescription(meeting.description || '');
                        setPriority(meeting.priority);
                        setStatus(meeting.status);
                        setDueDate(meeting.date);
                        setDueTime(meeting.time || '');
                        setAssignedTo(meeting.attendees);
                        const incomingVenue = (meeting.venue || 'N/A') as 'N/A' | 'Online' | 'On-site';
                        setVenueType(incomingVenue);
                        setVenueDesc('');
                        setAddToCalendar(meeting.addToCalendar ?? false);
                        setShowComments(true);
                        setComments([]);
                        setAttachments(meeting.attachments || []);
                        setIsEditMode(false);
                        setCommentText('');
                        setReplyingTo(null);

                        const isEventMode = meeting.time && meeting.time.includes(' - ');
                        setDateTimeMode(isEventMode ? 'event' : 'deadline');

                        if (isEventMode && meeting.time) {
                            const [startTimeStr, endTimeStr] = meeting.time.split(' - ');
                            setStartDate(meeting.date);
                            setStartTime(startTimeStr || '');
                            setEndDate(meeting.date);
                            setEndTime(endTimeStr || '');
                        } else {
                            setStartDate(meeting.date);
                            setStartTime('');
                            setEndDate(meeting.date);
                            setEndTime('');
                        }
                    }
                    else if (!isMeeting && task && task.id) {
                        // Fetch detailed task info for existing task
                        setIsLoadingDetailedTask(true);
                        try {
                            const taskResponse = await taskService.getSingleTaskInfo(parseInt(task.id, 10));
                            if (taskResponse.success && taskResponse.result) {
                                const apiTask = taskResponse.result;

                                // Mappings
                                const statusMapping: Record<number, TaskStatus> = {
                                    1: 'todo',
                                    2: 'in-progress',
                                    3: 'completed',
                                    4: 'overdue'
                                };
                                const priorityReverseMap: Record<number, Priority> = {
                                    1: 'low',
                                    2: 'medium',
                                    3: 'high'
                                };

                                setTitle(apiTask.title);
                                setDescription(apiTask.description || '');
                                setPriority(priorityReverseMap[apiTask.priorityId]);
                                setStatus(statusMapping[apiTask.statusId]);

                                const apiDueStart = parseUTCDate(apiTask.dueStart) || new Date();
                                const apiDueEnd = parseUTCDate(apiTask.dueEnd) || apiDueStart;

                                setDueDate(apiDueStart);
                                setIsEndOfDay(apiTask.isEndOfDay);
                                if (apiTask.isEndOfDay) {
                                    setDueTime('EOD');
                                } else if (apiTask.isAllDay) {
                                    setDueTime('All Day');
                                } else {
                                    setDueTime(formatTime(apiDueStart));
                                }

                                // Map Audience using the bData we just fetched
                                if (apiTask.audience.userIds && bData) {
                                    const resolvedUsers = apiTask.audience.userIds.map(id => {
                                        const found = bData.individualUsers.find(u => u.id === id);
                                        if (found) {
                                            return {
                                                id: found.id.toString(),
                                                name: found.name,
                                                position: found.designation,
                                                email: '',
                                                avatar: found.profileImageUrl
                                            };
                                        }
                                        return {
                                            id: id.toString(),
                                            name: `User ${id}`,
                                            position: 'User',
                                            email: ''
                                        };
                                    });
                                    setAssignedTo(resolvedUsers);
                                } else {
                                    setAssignedTo(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]);
                                }

                                // Map Project Groups
                                if (apiTask.audience.groupIds && apiTask.audience.groupIds.length > 0) {
                                    setSelectedGroups(apiTask.audience.groupIds.map(id => id.toString()));
                                    if (apiTask.audience.audienceType === 3) {
                                        setActiveAudienceTab('project-groups');
                                    }
                                } else {
                                    setSelectedGroups([]);
                                }

                                setVenueType('N/A');
                                setVenueDesc('');
                                setAddToCalendar(apiTask.addToCalendar);
                                const taskIdValue = parseInt(task.id, 10);
                                const commentResponse = await taskService.getTaskComments(taskIdValue);
                                if (commentResponse.success && commentResponse.result) {
                                    setComments((commentResponse.result || []).map(mapApiCommentToComment));
                                } else {
                                    setComments((apiTask.comments || []).map(mapApiCommentToComment));
                                }

                                const mappedAttachments: Attachment[] = apiTask.attachments.map(att => ({
                                    id: att.attachmentId.toString(),
                                    name: att.displayText,
                                    type: att.attachmentType === 'LINK' ? 'link' : (att.contentType?.includes('pdf') ? 'pdf' : 'doc'),
                                    url: att.url,
                                }));
                                setAttachments(mappedAttachments);

                                const isEventMode = apiTask.isScheduled;
                                setDateTimeMode(isEventMode ? 'event' : 'deadline');

                                if (isEventMode) {
                                    setStartDate(apiDueStart);
                                    setStartTime(formatTime(apiDueStart));
                                    setEndDate(apiDueEnd);
                                    setEndTime(formatTime(apiDueEnd));
                                } else {
                                    setStartDate(apiDueStart);
                                    setStartTime('');
                                    setEndDate(apiDueEnd);
                                    setEndTime('');
                                }
                            }
                        } catch (err) {
                            console.error('TaskDrawer: error fetching single task info', err);
                            setTitle(task.title);
                            setPriority(task.priority);
                            setStatus(task.status);
                            setDueDate(task.dueDate);
                        } finally {
                            setIsLoadingDetailedTask(false);
                        }
                    } else if (!isMeeting && task) {
                        // Initial data only
                        setTitle(task.title);
                        setDescription(task.description || '');
                        setPriority(task.priority);
                        setStatus(task.status);
                        setDueDate(task.dueDate);
                        setDueTime(task.dueTime || '');
                        setAssignedTo(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]);
                        setVenueType('N/A');
                        setVenueDesc('');
                        setAddToCalendar(task.addToCalendar ?? false);
                        setShowComments(task.showComments ?? true);
                        setComments(task.comments || []);
                        setAttachments(task.attachments || []);
                        setIsEndOfDay(task.dueTime === 'EOD');
                        setIsEditMode(false);
                        setCommentText('');
                        setReplyingTo(null);

                        const isEventMode = task.dueTime && task.dueTime.includes(' - ');
                        setDateTimeMode(isEventMode ? 'event' : 'deadline');

                        if (isEventMode && task.dueTime) {
                            const [startTimeStr, endTimeStr] = task.dueTime.split(' - ');
                            setStartDate(task.dueDate);
                            setStartTime(startTimeStr || '');
                            setEndDate(task.dueDate);
                            setEndTime(endTimeStr || '');
                        } else {
                            setStartDate(task.dueDate);
                            setStartTime('');
                            setEndDate(task.dueDate);
                            setEndTime('');
                        }
                    } else {
                        // Reset for create mode
                        const now = new Date();
                        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
                        setTitle('');
                        setDescription('');
                        setPriority(undefined);
                        setStatus('todo');
                        setDueDate(now);
                        setDueTime('');
                        setAssignedTo([]);
                        setVenueType('N/A');
                        setVenueDesc('');
                        setAddToCalendar(true);
                        setShowComments(true);
                        setComments([]);
                        setAttachments([]);
                        setIsEditMode(false);
                        setCommentText('');
                        setReplyingTo(null);
                        setDateTimeMode(isMeeting ? 'event' : 'deadline');
                        setIsEndOfDay(false);
                        setStartDate(now);
                        setStartTime(formatTime(now));
                        setEndDate(nextHour);
                        setEndTime(formatTime(nextHour));
                    }
                } catch (error) {
                    console.error('Failed to bootstrap drawer:', error);
                } finally {
                    setIsBootstrapLoading(false);
                }

                setStartDatePickerOpen(false);
                setEndDatePickerOpen(false);
            }
        };

        if (isOpen) {
            initializeOrFetch();
        } else {
            wasOpenRef.current = false;
        }
    }, [isOpen, task, meeting, isMeeting]);

    useEffect(() => {
        const manageCommentRealtime = async () => {
            const currentEntityType: 'MYTASK' | 'MEETING' = isMeeting ? 'MEETING' : 'MYTASK';
            const currentEntityIdRaw = isMeeting ? meeting?.id : task?.id;
            const currentEntityId = currentEntityIdRaw ? parseInt(currentEntityIdRaw, 10) : NaN;

            if (!isOpen || Number.isNaN(currentEntityId) || currentEntityId <= 0) {
                if (commentConnectionRef.current) {
                    try {
                        if (joinedEntityRef.current) {
                            await commentConnectionRef.current.invoke(
                                'LeaveEntity',
                                joinedEntityRef.current.entityType,
                                joinedEntityRef.current.entityId
                            );
                        }
                    } catch (error) {
                        console.warn('TaskDrawer: failed to leave comment entity group', error);
                    }

                    try {
                        await commentConnectionRef.current.stop();
                    } catch (error) {
                        console.warn('TaskDrawer: failed to stop comment hub connection', error);
                    }
                }

                commentConnectionRef.current = null;
                joinedEntityRef.current = null;
                return;
            }

            let connection = commentConnectionRef.current;

            if (!connection) {
                connection = new HubConnectionBuilder()
                    .withUrl(`${API_BASE_URL}/hubs/comment`, {
                        withCredentials: true
                    })
                    .withAutomaticReconnect()
                    .configureLogging(LogLevel.Information)
                    .build();

                commentConnectionRef.current = connection;
            }

            const onCommentAdded = (apiComment: any) => {
                const incoming = mapApiCommentToComment(apiComment);
                setComments((prev) => {
                    if (prev.some((c) => c.id === incoming.id)) {
                        return prev;
                    }
                    return [...prev, incoming];
                });
            };

            const onReplyAdded = (apiReply: any) => {
                const incomingReply = mapApiReplyToComment(apiReply);
                const parentId = apiReply.commentId?.toString();
                if (!parentId) return;

                setComments((prev) =>
                    prev.map((comment) => {
                        if (comment.id !== parentId) return comment;
                        if (comment.replies?.some((r) => r.id === incomingReply.id)) return comment;
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), incomingReply]
                        };
                    })
                );
            };

            const onCommentDeleted = (commentId: number) => {
                const targetId = commentId.toString();
                const removeCommentRecursive = (items: Comment[]): Comment[] =>
                    items
                        .filter((item) => item.id !== targetId)
                        .map((item) => ({
                            ...item,
                            replies: item.replies ? removeCommentRecursive(item.replies) : []
                        }));

                setComments((prev) => removeCommentRecursive(prev));
            };

            const onReplyDeleted = (commentId: number, replyId: number) => {
                const parentId = commentId.toString();
                const targetId = replyId.toString();
                setComments((prev) =>
                    prev.map((comment) => {
                        if (comment.id !== parentId) return comment;
                        return {
                            ...comment,
                            replies: (comment.replies || []).filter((reply) => reply.id !== targetId)
                        };
                    })
                );
            };

            const onReactionUpdated = (
                payloadOrCommentId: { commentId: number; replyId?: number | null; likes: number; dislikes: number } | number,
                likesArg?: number,
                dislikesArg?: number
            ) => {
                const payload =
                    typeof payloadOrCommentId === 'number'
                        ? {
                            commentId: payloadOrCommentId,
                            replyId: null,
                            likes: likesArg ?? 0,
                            dislikes: dislikesArg ?? 0
                        }
                        : payloadOrCommentId;
                const targetId = (payload.replyId ?? payload.commentId).toString();
                const updateReactionRecursive = (items: Comment[]): Comment[] =>
                    items.map((item) => {
                        if (item.id === targetId) {
                            return { ...item, likes: payload.likes, dislikes: payload.dislikes };
                        }
                        return {
                            ...item,
                            replies: item.replies ? updateReactionRecursive(item.replies) : []
                        };
                    });

                setComments((prev) => updateReactionRecursive(prev));
            };

            connection.off('CommentAdded');
            connection.off('ReplyAdded');
            connection.off('CommentDeleted');
            connection.off('ReplyDeleted');
            connection.off('ReactionUpdated');

            connection.on('CommentAdded', onCommentAdded);
            connection.on('ReplyAdded', onReplyAdded);
            connection.on('CommentDeleted', onCommentDeleted);
            connection.on('ReplyDeleted', onReplyDeleted);
            connection.on('ReactionUpdated', onReactionUpdated);

            if (connection.state !== HubConnectionState.Connected) {
                await connection.start();
            }

            if (
                joinedEntityRef.current &&
                (joinedEntityRef.current.entityType !== currentEntityType ||
                    joinedEntityRef.current.entityId !== currentEntityId)
            ) {
                try {
                    await connection.invoke(
                        'LeaveEntity',
                        joinedEntityRef.current.entityType,
                        joinedEntityRef.current.entityId
                    );
                } catch (error) {
                    console.warn('TaskDrawer: failed to switch comment entity group', error);
                }
            }

            if (
                !joinedEntityRef.current ||
                joinedEntityRef.current.entityType !== currentEntityType ||
                joinedEntityRef.current.entityId !== currentEntityId
            ) {
                await connection.invoke('JoinEntity', currentEntityType, currentEntityId);
                joinedEntityRef.current = { entityType: currentEntityType, entityId: currentEntityId };
            }
        };

        manageCommentRealtime().catch((error) => {
            console.error('TaskDrawer: failed to initialize comment realtime', error);
        });
    }, [isOpen, isMeeting, meeting?.id, task?.id]);

    useEffect(() => {
        return () => {
            if (commentConnectionRef.current) {
                commentConnectionRef.current.stop().catch((error) => {
                    console.warn('TaskDrawer: failed to stop comment hub on unmount', error);
                });
                commentConnectionRef.current = null;
                joinedEntityRef.current = null;
            }
        };
    }, []);

    // Debug: log attachments whenever they change
    useEffect(() => {
        // eslint-disable-next-line no-console
        // console.log('TaskDrawer: attachments count changed:', attachments.length);
    }, [attachments]);


    // Close due date picker when clicking outside
    useEffect(() => {
        if (!datePickerOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                dueDateButtonRef.current &&
                !dueDateButtonRef.current.contains(event.target as Node) &&
                dueDatePopoverRef.current &&
                !dueDatePopoverRef.current.contains(event.target as Node)
            ) {
                setDatePickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [datePickerOpen]);

    // Close start date picker when clicking outside
    useEffect(() => {
        if (!startDatePickerOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                startDateButtonRef.current &&
                !startDateButtonRef.current.contains(event.target as Node) &&
                startDatePopoverRef.current &&
                !startDatePopoverRef.current.contains(event.target as Node)
            ) {
                setStartDatePickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [startDatePickerOpen]);

    // Close end date picker when clicking outside
    useEffect(() => {
        if (!endDatePickerOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                endDateButtonRef.current &&
                !endDateButtonRef.current.contains(event.target as Node) &&
                endDatePopoverRef.current &&
                !endDatePopoverRef.current.contains(event.target as Node)
            ) {
                setEndDatePickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [endDatePickerOpen]);

    // Update due date popover position
    useEffect(() => {
        if (!datePickerOpen) return;

        // Use requestAnimationFrame to ensure refs are set after render
        requestAnimationFrame(() => {
            updateDueDatePopoverPosition();
        });

        const handleWindowChange = () => {
            updateDueDatePopoverPosition();
        };

        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);

        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [datePickerOpen]);

    // Update start date popover position
    useEffect(() => {
        if (!startDatePickerOpen) return;

        // Use requestAnimationFrame to ensure refs are set after render
        requestAnimationFrame(() => {
            updateStartDatePopoverPosition();
        });

        const handleWindowChange = () => {
            updateStartDatePopoverPosition();
        };

        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);

        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [startDatePickerOpen]);

    // Update end date popover position
    useEffect(() => {
        if (!endDatePickerOpen) return;

        // Use requestAnimationFrame to ensure refs are set after render
        requestAnimationFrame(() => {
            updateEndDatePopoverPosition();
        });

        const handleWindowChange = () => {
            updateEndDatePopoverPosition();
        };

        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);

        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [endDatePickerOpen]);

    // Position calculation functions
    const updateDueDatePopoverPosition = () => {
        if (!dueDateButtonRef.current || !dueDatePopoverRef.current) return;

        const buttonRect = dueDateButtonRef.current.getBoundingClientRect();
        const parentElement = dueDateButtonRef.current.parentElement;
        if (!parentElement) return;

        const parentRect = parentElement.getBoundingClientRect();
        const popoverWidth = 341;
        const popoverHeight = 450; // Estimated height
        const padding = 10;
        const gap = 8; // mt-2 equivalent

        // Calculate position relative to parent container
        let left = 0; // Align left with button (relative to parent)
        let top: number | undefined = buttonRect.bottom - parentRect.top + gap;
        let bottom: number | undefined = undefined;

        // Check viewport boundaries
        const viewportBottom = window.innerHeight - padding;
        const viewportRight = window.innerWidth - padding;
        const viewportLeft = padding;

        // Calculate absolute position in viewport
        const absoluteLeft = parentRect.left + left;
        const absoluteTop = buttonRect.bottom + gap;

        // Check if popover would overflow bottom of viewport
        if (absoluteTop + popoverHeight > viewportBottom) {
            // Position above button instead
            // Calculate bottom relative to parent container
            bottom = parentRect.bottom - buttonRect.top + gap;
            top = undefined;
        }

        // Check if popover would overflow right of viewport
        if (absoluteLeft + popoverWidth > viewportRight) {
            // Align to right edge of viewport with extra spacing, then convert to relative
            const extraRightPadding = 20; // Additional spacing when repositioned
            left = viewportRight - parentRect.left - popoverWidth - extraRightPadding;
        }

        // Check if popover would overflow left of viewport
        if (absoluteLeft < viewportLeft) {
            // Align to left edge of viewport, then convert to relative
            left = viewportLeft - parentRect.left;
        }

        setDueDatePopoverPosition({ top, bottom, left });
    };

    const updateStartDatePopoverPosition = () => {
        if (!startDateButtonRef.current || !startDatePopoverRef.current) return;

        const buttonRect = startDateButtonRef.current.getBoundingClientRect();
        const parentElement = startDateButtonRef.current.parentElement;
        if (!parentElement) return;

        const parentRect = parentElement.getBoundingClientRect();
        const popoverWidth = 341;
        const popoverHeight = 450; // Estimated height
        const padding = 10;
        const gap = 8; // mt-2 equivalent

        // Calculate position relative to parent container
        let left = 0; // Align left with button (relative to parent)
        let top: number | undefined = buttonRect.bottom - parentRect.top + gap;
        let bottom: number | undefined = undefined;

        // Check viewport boundaries
        const viewportBottom = window.innerHeight - padding;
        const viewportRight = window.innerWidth - padding;
        const viewportLeft = padding;

        // Calculate absolute position in viewport
        const absoluteLeft = parentRect.left + left;
        const absoluteTop = buttonRect.bottom + gap;

        // Check if popover would overflow bottom of viewport
        if (absoluteTop + popoverHeight > viewportBottom) {
            // Position above button instead
            // Calculate bottom relative to parent container
            bottom = parentRect.bottom - buttonRect.top + gap;
            top = undefined;
        }

        // Check if popover would overflow right of viewport
        if (absoluteLeft + popoverWidth > viewportRight) {
            // Align to right edge of viewport with extra spacing, then convert to relative
            const extraRightPadding = 20; // Additional spacing when repositioned
            left = viewportRight - parentRect.left - popoverWidth - extraRightPadding;
        }

        // Check if popover would overflow left of viewport
        if (absoluteLeft < viewportLeft) {
            // Align to left edge of viewport, then convert to relative
            left = viewportLeft - parentRect.left;
        }

        setStartDatePopoverPosition({ top, bottom, left });
    };

    const updateEndDatePopoverPosition = () => {
        if (!endDateButtonRef.current || !endDatePopoverRef.current) return;

        const buttonRect = endDateButtonRef.current.getBoundingClientRect();
        const parentElement = endDateButtonRef.current.parentElement;
        if (!parentElement) return;

        const parentRect = parentElement.getBoundingClientRect();
        const popoverWidth = 341;
        const popoverHeight = 450; // Estimated height
        const padding = 10;
        const gap = 8; // mt-2 equivalent

        // Calculate position relative to parent container
        let left = 0; // Align left with button (relative to parent)
        let top: number | undefined = buttonRect.bottom - parentRect.top + gap;
        let bottom: number | undefined = undefined;

        // Check viewport boundaries
        const viewportBottom = window.innerHeight - padding;
        const viewportRight = window.innerWidth - padding;
        const viewportLeft = padding;

        // Calculate absolute position in viewport
        const absoluteLeft = parentRect.left + left;
        const absoluteTop = buttonRect.bottom + gap;

        // Check if popover would overflow bottom of viewport
        if (absoluteTop + popoverHeight > viewportBottom) {
            // Position above button instead
            // Calculate bottom relative to parent container
            bottom = parentRect.bottom - buttonRect.top + gap;
            top = undefined;
        }

        // Check if popover would overflow right of viewport
        if (absoluteLeft + popoverWidth > viewportRight) {
            // Align to right edge of viewport with extra spacing, then convert to relative
            const extraRightPadding = 20; // Additional spacing when repositioned
            left = viewportRight - parentRect.left - popoverWidth - extraRightPadding;
        }

        // Check if popover would overflow left of viewport
        if (absoluteLeft < viewportLeft) {
            // Align to left edge of viewport, then convert to relative
            left = viewportLeft - parentRect.left;
        }

        setEndDatePopoverPosition({ top, bottom, left });
    };


    const formatDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        const minuteStr = minutes.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${ampm}`;
    };

    const formatCommentTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return formatTime(date);
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return formatDate(date);
        }
    };

    const handleInsertLink = (displayText: string, url: string) => {
        const newAttachment: Attachment = {
            id: `att-${Date.now()}`,
            name: displayText,
            type: 'link',
            url: url,
        };
        setAttachments([...attachments, newAttachment]);
    };

    const handleSubmit = () => {
        const performSave = async () => {
            const resolveOptimisticStatus = (
                selectedStatus: TaskStatus,
                targetDate: Date,
                timeLabel?: string
            ): TaskStatus => {
                if (selectedStatus === 'completed' || selectedStatus === 'overdue') {
                    return selectedStatus;
                }

                const compareDate = new Date(targetDate);
                const raw = (timeLabel || '').trim();
                const label = raw.toLowerCase();

                if (label === '' || label === 'eod' || label === 'all day') {
                    compareDate.setHours(23, 59, 59, 999);
                } else {
                    const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (match) {
                        let hour = parseInt(match[1], 10);
                        const minute = parseInt(match[2], 10);
                        const ampm = match[3].toUpperCase();
                        if (ampm === 'PM' && hour !== 12) hour += 12;
                        if (ampm === 'AM' && hour === 12) hour = 0;
                        compareDate.setHours(hour, minute, 59, 999);
                    } else {
                        compareDate.setHours(23, 59, 59, 999);
                    }
                }

                return compareDate.getTime() < Date.now() ? 'overdue' : selectedStatus;
            };

            const currentValidationErrors = [];
            if (!title.trim()) currentValidationErrors.push('title');
            if (activeAudienceTab === 'individual' && assignedTo.length === 0) currentValidationErrors.push('assignedTo');
            if (activeAudienceTab === 'project-groups' && selectedGroups.length === 0) currentValidationErrors.push('assignedTo');
            if (!status) currentValidationErrors.push('status');
            if (!isMeeting && !priority) currentValidationErrors.push('priority');
            if (isMeeting && venueType !== 'N/A' && !venueDesc.trim()) currentValidationErrors.push('venueDesc');

            setValidationErrors(currentValidationErrors);

            if (currentValidationErrors.length > 0) {
                console.log(`TaskDrawer: ${drawerType} validation failed`, currentValidationErrors);
                return;
            }

            setIsSaving(true);
            try {
                // Mappings
                const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
                const statusMap: Record<string, number> = { 'todo': 1, 'in-progress': 2, 'completed': 3, 'overdue': 4 };
                const fallbackVenueMap: Record<'N/A' | 'Online' | 'On-site', number> = { 'N/A': 1, 'Online': 2, 'On-site': 3 };
                const venueIdFromBootstrap =
                    bootstrapData?.venue?.find((v) => v.description.toLowerCase() === venueType.toLowerCase())?.id;
                const resolvedVenueId = isMeeting
                    ? (venueIdFromBootstrap ?? fallbackVenueMap[venueType])
                    : null;
                const finalDueDate = dateTimeMode === 'deadline' ? dueDate : startDate;

                const audience: any = activeAudienceTab === 'project-groups'
                    ? {
                        audienceType: 3, // Project Group
                        groupIds: selectedGroups.map(id => parseInt(id, 10)).filter(id => !isNaN(id)),
                    }
                    : {
                        audienceType: 2, // Individual
                        userIds: assignedTo.map(u => parseInt(u.id, 10)).filter(id => !isNaN(id)),
                    };

                const attachmentRequests = attachments.map(att => ({
                    type: att.type === 'link' ? 'LINK' : 'FILE',
                    displayText: att.name,
                    url: att.type === 'link' ? att.url : undefined,
                    fileName: att.name,
                    contentType: att.file?.type,
                }));

                const fileList = attachments
                    .filter(att => att.file)
                    .map(att => att.file as File);

                // Debug: Log date values before building request
                // eslint-disable-next-line no-console
                console.debug('TaskDrawer Save - Date Debug', {
                    dateTimeMode,
                    startDate: startDate?.toISOString?.(),
                    endDate: endDate?.toISOString?.(),
                    dueDate: dueDate?.toISOString?.(),
                    finalDueDate: finalDueDate?.toISOString?.(),
                });

                let effectiveStartDate = startDate;
                let effectiveEndDate = endDate;

                // Safety guard: for meetings/events avoid sending identical/invalid ranges.
                if (dateTimeMode === 'event' && effectiveEndDate.getTime() <= effectiveStartDate.getTime()) {
                    effectiveEndDate = new Date(effectiveStartDate.getTime() + 60 * 60 * 1000);
                }

                const dueStartValue = dateTimeMode === 'event'
                    ? formatToDateTimeOffset(effectiveStartDate)
                    : formatToDateTimeOffset(finalDueDate);
                const dueEndValue = dateTimeMode === 'event'
                    ? formatToDateTimeOffset(effectiveEndDate)
                    : formatToDateTimeOffset(finalDueDate);

                // Debug: Log final values being sent
                // eslint-disable-next-line no-console
                console.debug('TaskDrawer Save - Final Values', {
                    dueStart: dueStartValue,
                    dueEnd: dueEndValue,
                    isMeeting,
                });

                const commonRequest = {
                    isMeeting: isMeeting,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    dueStart: dueStartValue,
                    dueEnd: dueEndValue,
                    isScheduled: dateTimeMode === 'event',
                    isAllDay: dueTime === 'All Day',
                    isEndOfDay: isEndOfDay,
                    priorityId: (!isMeeting && priority) ? priorityMap[priority] : (priority ? priorityMap[priority] : 2),
                    statusId: statusMap[status!],
                    addToCalendar,
                    audience,
                    attachments: attachmentRequests,
                    venueId: resolvedVenueId,
                    venueDesc: isMeeting && venueType !== 'N/A' ? venueDesc.trim() : null,
                };

                let response;
                if (isMeeting) {
                    const request: MeetingSaveRequest = {
                        ...commonRequest,
                        taskId: meeting?.id ? parseInt(meeting.id, 10) : undefined,
                    } as any; // Cast as any because of minor property differences if any
                    response = await meetingService.saveMeeting(request, fileList);
                } else {
                    const request: TaskSaveRequest = {
                        ...commonRequest,
                        taskId: task?.id ? parseInt(task.id, 10) : undefined,
                    };
                    response = await taskService.saveTask(request, fileList);
                }

                if (response.success) {
                    console.log(`TaskDrawer: ${drawerType} saved successfully`);

                    if (isMeeting) {
                        if (isCreateMode) {
                            onMeetingSubmit?.({} as any);
                        } else {
                            const optimisticMeetingStatus = resolveOptimisticStatus(
                                (status || meeting?.status || 'todo') as TaskStatus,
                                dateTimeMode === 'event' ? endDate : finalDueDate,
                                dateTimeMode === 'event' ? formatTime(endDate) : dueTime
                            );
                            const optimisticUpdatedMeeting: Meeting = {
                                ...(meeting as Meeting),
                                title: title.trim(),
                                description: description.trim() || undefined,
                                status: optimisticMeetingStatus as Meeting['status'],
                                priority: (priority || meeting?.priority || 'medium') as Priority,
                                date: dateTimeMode === 'event' ? startDate : finalDueDate,
                                time:
                                    dateTimeMode === 'event'
                                        ? `${formatTime(startDate)} - ${formatTime(endDate)}`
                                        : dueTime || '',
                                attendees: assignedTo,
                                attachments,
                                venue: venueType === 'N/A' ? 'N/A' : venueDesc.trim(),
                                addToCalendar,
                            };
                            onMeetingUpdate?.(optimisticUpdatedMeeting);
                        }
                    } else {
                        if (isCreateMode) {
                            onSubmit?.({} as any);
                        } else {
                            const optimisticTaskStatus = resolveOptimisticStatus(
                                (status || task?.status || 'todo') as TaskStatus,
                                dateTimeMode === 'event' ? endDate : finalDueDate,
                                dateTimeMode === 'event' ? formatTime(endDate) : dueTime
                            );
                            const optimisticUpdatedTask: Task = {
                                ...(task as Task),
                                title: title.trim(),
                                description: description.trim() || undefined,
                                status: optimisticTaskStatus,
                                priority: (priority || task?.priority || 'medium') as Priority,
                                dueDate: dateTimeMode === 'event' ? startDate : finalDueDate,
                                dueTime:
                                    dateTimeMode === 'event'
                                        ? `${formatTime(startDate)} - ${formatTime(endDate)}`
                                        : dueTime,
                                assignedTo,
                                attachments,
                                addToCalendar,
                                showComments,
                                updatedAt: new Date(),
                            };
                            onUpdate?.(optimisticUpdatedTask);
                        }
                    }
                    onClose();
                } else {
                    console.error(`TaskDrawer: failed to save ${drawerType}`, response.message);
                    alert(`Failed to save ${drawerType}: ${response.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error(`TaskDrawer: error during ${drawerType} save`, error);
                alert(`An error occurred while saving the ${drawerType}.`);
            } finally {
                setIsSaving(false);
            }
        };

        performSave();
    };

    const handleCancel = () => {
        if (isMeeting && meeting) {
            setTitle(meeting.title);
            setDescription(meeting.description || '');
            setPriority(meeting.priority);
            setStatus(meeting.status);
            setDueDate(meeting.date);
            setDueTime(meeting.time || '');
            setAssignedTo(meeting.attendees);
            const incomingVenue = (meeting.venue || 'N/A') as 'N/A' | 'Online' | 'On-site';
            setVenueType(incomingVenue);
            setVenueDesc('');
            setAttachments(meeting.attachments || []);
        } else if (!isMeeting && task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.dueDate);
            setDueTime(task.dueTime || '');
            setAssignedTo(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]);
            setVenueType('N/A');
            setVenueDesc('');
            setAttachments(task.attachments || []);
        }
        setIsEditMode(false);
    };

    const handleAddComment = async () => {
        const entityId = isMeeting ? (meeting?.id ? parseInt(meeting.id, 10) : null) : (task?.id ? parseInt(task.id, 10) : null);
        if (!replyText.trim() || !replyingTo || !entityId) return;

        try {
            const commentId = parseInt(replyingTo, 10);
            let response;
            if (isMeeting) {
                response = await meetingService.addCommentReply(entityId, {
                    commentId: commentId,
                    replyText: replyText.trim(),
                    replyToReplyId: null,
                    replyToUserId: null
                });
            } else {
                response = await taskService.addTaskCommentReply(entityId, {
                    commentId: commentId,
                    replyText: replyText.trim(),
                    replyToReplyId: null,
                    replyToUserId: null
                });
            }

            if (response.success && response.result) {
                const apiReply = response.result;
                const newReply: Comment = {
                    id: apiReply.replyId.toString(),
                    text: apiReply.text,
                    author: {
                        id: apiReply.authorId.toString(),
                        name: apiReply.authorName,
                        avatar: apiReply.authorProfileImageUrl,
                        position: '',
                        email: ''
                    },
                    createdAt: parseUTCDate(apiReply.createdOn) || new Date(),
                    likes: 0,
                    dislikes: 0,
                    userLiked: false,
                    userDisliked: false,
                    replies: [],
                };

                const addReplyToState = (commentsList: Comment[]): Comment[] => {
                    return commentsList.map((comment) => {
                        if (comment.id === replyingTo) {
                            const existingReplies = comment.replies || [];
                            if (existingReplies.some((r) => r.id === newReply.id)) {
                                return comment;
                            }
                            return {
                                ...comment,
                                replies: [...existingReplies, newReply],
                            };
                        }
                        if (comment.replies) {
                            return {
                                ...comment,
                                replies: addReplyToState(comment.replies),
                            };
                        }
                        return comment;
                    });
                };

                setComments((prev) => addReplyToState(prev));
                setReplyText('');
                setReplyingTo(null);
            }
        } catch (error) {
            console.error(`TaskDrawer: error adding ${drawerType} reply`, error);
        }
    };

    const handleAddNewComment = async () => {
        const entityId = isMeeting ? (meeting?.id ? parseInt(meeting.id, 10) : null) : (task?.id ? parseInt(task.id, 10) : null);
        if (!commentText.trim() || replyingTo || !entityId) return;

        try {
            let response;
            if (isMeeting) {
                response = await meetingService.addComment(entityId, {
                    entityType: 'MEETING',
                    entityId: entityId,
                    commentText: commentText.trim()
                });
            } else {
                response = await taskService.addTaskComment(entityId, {
                    entityType: 'MYTASK',
                    entityId: entityId,
                    commentText: commentText.trim()
                });
            }

            if (response.success && response.result) {
                const apiComment = response.result;
                const newComment: Comment = {
                    id: apiComment.commentId.toString(),
                    text: apiComment.text,
                    author: {
                        id: apiComment.authorId.toString(),
                        name: apiComment.authorName,
                        avatar: apiComment.authorProfileImageUrl,
                        position: '', // Designation not directly in comment result
                        email: '' // Not provided by API
                    },
                    createdAt: parseUTCDate(apiComment.createdOn) || new Date(),
                    likes: apiComment.likes || 0,
                    dislikes: apiComment.dislikes || 0,
                    userLiked: false,
                    userDisliked: false,
                    replies: (apiComment.replies || []).map(mapApiReplyToComment),
                };

                setComments((prev) => {
                    if (prev.some((c) => c.id === newComment.id)) {
                        return prev;
                    }
                    return [...prev, newComment];
                });
                setCommentText('');
            }
        } catch (error) {
            console.error(`TaskDrawer: error adding ${drawerType} comment`, error);
        }
    };

    const handleLike = async (commentId: string, isReply: boolean = false, parentCommentId?: string) => {
        const entityId = isMeeting ? (meeting?.id ? parseInt(meeting.id, 10) : null) : (task?.id ? parseInt(task.id, 10) : null);
        if (!entityId) return;

        const findRecursive = (list: Comment[]): Comment | undefined => {
            for (const c of list) {
                if (c.id === commentId) return c;
                if (c.replies) {
                    const found = findRecursive(c.replies);
                    if (found) return found;
                }
            }
        };

        const currentComment = findRecursive(comments);
        if (!currentComment) return;

        // Determine intended state before triggering async update
        const willBeLiked = !currentComment.userLiked;

        setComments(prevComments => {
            const toggleLike = (list: Comment[]): Comment[] => {
                return list.map((comment) => {
                    if (comment.id === commentId) {
                        const wasDisliked = comment.userDisliked;
                        return {
                            ...comment,
                            userLiked: willBeLiked,
                            userDisliked: false,
                            likes: willBeLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1),
                            dislikes: wasDisliked ? Math.max(0, comment.dislikes - 1) : comment.dislikes,
                        };
                    }
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: toggleLike(comment.replies),
                        };
                    }
                    return comment;
                });
            };
            return toggleLike(prevComments);
        });

        try {
            if (isMeeting) {
                await meetingService.reactToComment(entityId, {
                    commentId: parseInt(isReply ? (parentCommentId || '0') : commentId, 10),
                    replyId: isReply ? parseInt(commentId, 10) : null,
                    reaction: 1
                });
            } else {
                await taskService.reactToTaskComment(entityId, {
                    commentId: parseInt(isReply ? (parentCommentId || '0') : commentId, 10),
                    replyId: isReply ? parseInt(commentId, 10) : null,
                    reaction: 1
                });
            }
        } catch (error) {
            console.error(`TaskDrawer: error liking ${drawerType} comment`, error);
        }
    };

    const handleDislike = async (commentId: string, isReply: boolean = false, parentCommentId?: string) => {
        const entityId = isMeeting ? (meeting?.id ? parseInt(meeting.id, 10) : null) : (task?.id ? parseInt(task.id, 10) : null);
        if (!entityId) return;

        const findRecursive = (list: Comment[]): Comment | undefined => {
            for (const c of list) {
                if (c.id === commentId) return c;
                if (c.replies) {
                    const found = findRecursive(c.replies);
                    if (found) return found;
                }
            }
        };

        const currentComment = findRecursive(comments);
        if (!currentComment) return;

        // Determine intended state before triggering async update
        const willBeDisliked = !currentComment.userDisliked;

        setComments(prevComments => {
            const toggleDislike = (list: Comment[]): Comment[] => {
                return list.map((comment) => {
                    if (comment.id === commentId) {
                        const wasLiked = comment.userLiked;
                        return {
                            ...comment,
                            userDisliked: willBeDisliked,
                            userLiked: false,
                            dislikes: willBeDisliked ? comment.dislikes + 1 : Math.max(0, comment.dislikes - 1),
                            likes: wasLiked ? Math.max(0, comment.likes - 1) : comment.likes,
                        };
                    }
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: toggleDislike(comment.replies),
                        };
                    }
                    return comment;
                });
            };
            return toggleDislike(prevComments);
        });

        try {
            if (isMeeting) {
                await meetingService.reactToComment(entityId, {
                    commentId: parseInt(isReply ? (parentCommentId || '0') : commentId, 10),
                    replyId: isReply ? parseInt(commentId, 10) : null,
                    reaction: 2
                });
            } else {
                await taskService.reactToTaskComment(entityId, {
                    commentId: parseInt(isReply ? (parentCommentId || '0') : commentId, 10),
                    replyId: isReply ? parseInt(commentId, 10) : null,
                    reaction: 2
                });
            }
        } catch (error) {
            console.error(`TaskDrawer: error disliking ${drawerType} comment`, error);
        }
    };

    const handleDeleteComment = async (commentId: string, isReply: boolean = false) => {
        const entityId = isMeeting ? (meeting?.id ? parseInt(meeting.id, 10) : null) : (task?.id ? parseInt(task.id, 10) : null);
        if (!entityId) return;

        // Optimistic update
        const deleteCommentFromState = (comments: Comment[]): Comment[] => {
            return comments
                .filter((comment) => comment.id !== commentId)
                .map((comment) => {
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: deleteCommentFromState(comment.replies),
                        };
                    }
                    return comment;
                });
        };
        const previousComments = [...comments];
        setComments(deleteCommentFromState(comments));

        try {
            if (isMeeting) {
                if (isReply) {
                    await meetingService.deleteCommentReply(entityId, parseInt(commentId, 10));
                } else {
                    await meetingService.deleteComment(entityId, parseInt(commentId, 10));
                }
            } else {
                if (isReply) {
                    await taskService.deleteTaskCommentReply(entityId, parseInt(commentId, 10));
                } else {
                    await taskService.deleteTaskComment(entityId, parseInt(commentId, 10));
                }
            }
        } catch (error) {
            console.error(`TaskDrawer: error deleting ${drawerType} comment`, error);
            // Revert state if needed
            setComments(previousComments);
        }
    };

    const handleDownloadAttachment = async (attachment: Attachment, openInNewTab: boolean = false) => {
        try {
            if (attachment.type === 'link' && attachment.url) {
                window.open(attachment.url, '_blank');
                return;
            }

            const attachmentId = parseInt(attachment.id, 10);
            if (Number.isNaN(attachmentId) || attachmentId <= 0) {
                if (attachment.url) {
                    window.open(attachment.url, '_blank');
                }
                return;
            }

            const entityIdRaw = isMeeting ? meeting?.id : task?.id;
            const entityId = entityIdRaw ? parseInt(entityIdRaw, 10) : NaN;
            if (Number.isNaN(entityId) || entityId <= 0) return;

            const response = isMeeting
                ? await meetingService.downloadMeetingAttachment(entityId, attachmentId)
                : await taskService.downloadTaskAttachment(entityId, attachmentId);

            const url = response.result?.url;
            if (!url) return;

            window.open(url, openInNewTab ? '_blank' : '_self');
        } catch (error) {
            console.error(`TaskDrawer: failed to download ${drawerType} attachment`, error);
        }
    };

    const handleDeleteAttachment = async () => {
        if (!attachmentToDelete) return;

        const targetAttachment = attachmentToDelete;
        const previousAttachments = attachments;
        setAttachments((prev) => prev.filter((att) => att.id !== targetAttachment.id));

        const attachmentId = parseInt(targetAttachment.id, 10);
        const hasServerAttachmentId = !Number.isNaN(attachmentId) && attachmentId > 0;
        const entityIdRaw = isMeeting ? meeting?.id : task?.id;
        const entityId = entityIdRaw ? parseInt(entityIdRaw, 10) : NaN;
        const hasServerEntity = !Number.isNaN(entityId) && entityId > 0;

        try {
            if (hasServerAttachmentId && hasServerEntity) {
                const response = isMeeting
                    ? await meetingService.deleteMeetingAttachment(entityId, attachmentId)
                    : await taskService.deleteTaskAttachment(entityId, attachmentId);

                if (!response.success) {
                    console.error(`TaskDrawer: failed to delete ${drawerType} attachment`);
                    setAttachments(previousAttachments);
                    return;
                }
            }
        } catch (error) {
            console.error(`TaskDrawer: failed to delete ${drawerType} attachment`, error);
            setAttachments(previousAttachments);
        } finally {
            setAttachmentToDelete(null);
        }
    };

    const getAttachmentIcon = (type: string) => {
        switch (type) {
            case 'link':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                        <path d="M5.14286 0C5.90062 0 6.62734 0.351189 7.16316 0.976311C7.69898 1.60143 8 2.44928 8 3.33333V11.3333C8 11.9462 7.89654 12.553 7.69552 13.1192C7.4945 13.6854 7.19986 14.1998 6.82843 14.6332C6.45699 15.0665 6.01604 15.4102 5.53073 15.6448C5.04543 15.8793 4.52529 16 4 16C3.47471 16 2.95457 15.8793 2.46927 15.6448C1.98396 15.4102 1.54301 15.0665 1.17157 14.6332C0.800139 14.1998 0.505501 13.6854 0.304482 13.1192C0.103463 12.553 -7.82739e-09 11.9462 0 11.3333V6H1.14286V11.3333C1.14286 12.2174 1.44388 13.0652 1.97969 13.6904C2.51551 14.3155 3.24224 14.6667 4 14.6667C4.75776 14.6667 5.48449 14.3155 6.02031 13.6904C6.55612 13.0652 6.85714 12.2174 6.85714 11.3333V3.33333C6.85714 3.07069 6.8128 2.81062 6.72665 2.56797C6.6405 2.32532 6.51423 2.10484 6.35504 1.91912C6.19585 1.7334 6.00687 1.58608 5.79889 1.48557C5.5909 1.38506 5.36798 1.33333 5.14286 1.33333C4.91773 1.33333 4.69482 1.38506 4.48683 1.48557C4.27884 1.58608 4.08986 1.7334 3.93067 1.91912C3.77149 2.10484 3.64521 2.32532 3.55906 2.56797C3.47291 2.81062 3.42857 3.07069 3.42857 3.33333V11.3333C3.42857 11.5101 3.48878 11.6797 3.59594 11.8047C3.7031 11.9298 3.84845 12 4 12C4.15155 12 4.2969 11.9298 4.40406 11.8047C4.51122 11.6797 4.57143 11.5101 4.57143 11.3333V4H5.71429V11.3333C5.71429 11.8638 5.53367 12.3725 5.21218 12.7475C4.89069 13.1226 4.45466 13.3333 4 13.3333C3.54534 13.3333 3.10931 13.1226 2.78782 12.7475C2.46633 12.3725 2.28571 11.8638 2.28571 11.3333V3.33333C2.28571 2.44928 2.58673 1.60143 3.12255 0.976311C3.65837 0.351189 4.3851 0 5.14286 0Z" fill="#535352" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                        <path d="M2.45751 16H10.8758C12.5169 16 13.3333 15.2164 13.3333 13.6642V6.88812H7.59407C6.57941 6.88812 6.10387 6.4328 6.10387 5.47757V0H2.45751C0.824582 0 0 0.790925 0 2.34348V13.6642C0 15.2237 0.824582 16 2.45751 16ZM7.61808 5.86571H13.2461C13.1906 5.55972 12.9606 5.26105 12.5882 4.89552L8.21233 0.709095C7.84773 0.350886 7.51492 0.134368 7.18178 0.0818308V5.46292C7.18178 5.73134 7.33262 5.86571 7.61808 5.86571Z" fill="#FFB74D" />
                    </svg>
                );
        }
    };

    const renderComment = (comment: Comment, isReply: boolean = false, _parentId?: string, isLast: boolean = false) => {
        const isOwnComment = comment.author.id === currentUser.id;
        return (
            <div key={comment.id} className={cn('mb-4', isReply && 'ml-7')}>
                <div className="flex items-start gap-[10px]">
                    <img
                        src={comment.author.avatar || avatarPlaceholder}
                        alt={comment.author.name}
                        className="w-7 h-7 rounded-full shrink-0"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-[10px] mb-1">
                            <span className="text-[16px] font-semibold text-black">
                                {comment.author.name}
                                {isOwnComment && (
                                    <span className="ml-1 text-[12px] font-normal text-[#535352]">
                                        (You)
                                    </span>
                                )}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-[#535352]" />
                            <span className="text-[12px] font-semibold text-[#535352]">
                                {formatCommentTime(comment.createdAt)}
                            </span>
                        </div>
                        <p className="text-[14px] font-normal text-[#535352] mb-2">{comment.text}</p>
                        <div className="flex items-center gap-[13px]">
                            <button
                                type="button"
                                onClick={() => handleLike(comment.id, isReply, _parentId)}
                                className="flex items-center gap-[5px] cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <g clipPath="url(#clip0_1276_9450)">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.04097 14.8124C5.425 14.9957 5.84513 15.091 6.27069 15.0912H12.3804C13.0617 15.0912 13.7206 14.8477 14.2382 14.4047C14.7558 13.9617 15.0981 13.3483 15.2033 12.6752L15.9187 8.10035C15.9699 7.7742 15.9498 7.44083 15.8598 7.12319C15.7698 6.80554 15.6121 6.51115 15.3975 6.26028C15.1829 6.0094 14.9165 5.80799 14.6166 5.6699C14.3168 5.53181 13.9905 5.46032 13.6604 5.46035H9.90954V2.76778C9.91008 2.35643 9.77404 1.95654 9.52275 1.63086C9.27147 1.30519 8.91917 1.07215 8.52114 0.968331C8.12311 0.864508 7.70187 0.895771 7.32352 1.05722C6.94518 1.21866 6.63114 1.50115 6.43069 1.86035L4.05697 6.10035C3.91374 6.35632 3.83858 6.64475 3.83869 6.93807V13.1575C3.83864 13.4813 3.93028 13.7984 4.103 14.0723C4.27573 14.3461 4.52248 14.5655 4.81469 14.7049L5.04097 14.8124ZM1.19412 6.30949C1.04454 6.30934 0.896397 6.33868 0.758162 6.39581C0.619927 6.45295 0.494308 6.53677 0.388488 6.64249C0.282667 6.7482 0.198719 6.87373 0.141444 7.01191C0.0841679 7.15009 0.0546874 7.2982 0.0546875 7.44778V13.2901C0.0546875 13.5923 0.174734 13.8821 0.388418 14.0958C0.602103 14.3094 0.891921 14.4295 1.19412 14.4295H1.76097C1.91253 14.4295 2.05787 14.3693 2.16503 14.2621C2.2722 14.155 2.3324 14.0096 2.3324 13.8581V6.87978C2.3324 6.72823 2.2722 6.58288 2.16503 6.47572C2.05787 6.36856 1.91253 6.30835 1.76097 6.30835L1.19412 6.30949Z" className={cn("transition duration-300", comment.userLiked ? "fill-[#1E88E5]" : "fill-[#535352]")} />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_1276_9450">
                                            <rect width="16" height="16" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span
                                    className={cn(
                                        'text-[12px] font-semibold',
                                        comment.userLiked ? 'text-[#1e88e5]' : 'text-[#535352]'
                                    )}
                                >
                                    {comment.likes}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDislike(comment.id, isReply, _parentId)}
                                className="flex items-center gap-[5px] cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <g clipPath="url(#clip0_4455_14088)">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.04097 1.18765C5.425 1.00428 5.84513 0.909005 6.27069 0.908793H12.3804C13.0617 0.908798 13.7206 1.15226 14.2382 1.59527C14.7558 2.03827 15.0981 2.65166 15.2033 3.32479L15.9187 7.89965C15.9699 8.2258 15.9498 8.55917 15.8598 8.87681C15.7698 9.19446 15.6121 9.48885 15.3975 9.73972C15.1829 9.9906 14.9165 10.192 14.6166 10.3301C14.3168 10.4682 13.9905 10.5397 13.6604 10.5396H9.90954V13.2322C9.91008 13.6436 9.77404 14.0435 9.52275 14.3691C9.27147 14.6948 8.91917 14.9278 8.52114 15.0317C8.12311 15.1355 7.70187 15.1042 7.32352 14.9428C6.94518 14.7813 6.63114 14.4989 6.43069 14.1396L4.05697 9.89965C3.91374 9.64368 3.83858 9.35525 3.83869 9.06193V2.84251C3.83864 2.51873 3.93028 2.20156 4.103 1.92771C4.27573 1.65386 4.52248 1.43452 4.81469 1.29508L5.04097 1.18765ZM1.19412 9.69051C1.04454 9.69066 0.896397 9.66132 0.758162 9.60419C0.619927 9.54705 0.494308 9.46323 0.388488 9.35751C0.282667 9.2518 0.198719 9.12627 0.141444 8.98809C0.0841679 8.84991 0.0546874 8.7018 0.0546875 8.55222V2.70994C0.0546875 2.40774 0.174734 2.11792 0.388418 1.90424C0.602103 1.69055 0.891921 1.57051 1.19412 1.57051H1.76097C1.91253 1.57051 2.05787 1.63071 2.16503 1.73787C2.2722 1.84504 2.3324 1.99038 2.3324 2.14193V9.12022C2.3324 9.27177 2.2722 9.41712 2.16503 9.52428C2.05787 9.63145 1.91253 9.69165 1.76097 9.69165L1.19412 9.69051Z" className={cn("transition duration-300", comment.userDisliked ? "fill-[#1E88E5]" : "fill-[#535352]")} />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_4455_14088">
                                            <rect width="16" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span
                                    className={cn(
                                        'text-[12px] font-semibold',
                                        comment.userDisliked ? 'text-[#1e88e5]' : 'text-[#535352]'
                                    )}
                                >
                                    {comment.dislikes}
                                </span>
                            </button>
                            {!isReply && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (replyingTo === comment.id) {
                                            setReplyingTo(null);
                                            setReplyText('');
                                        } else {
                                            setReplyingTo(comment.id);
                                            setCommentText('');
                                            setReplyText('');
                                        }
                                    }}
                                    className="flex items-center gap-[5px] cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M5.375 11.0629C6.09961 11.0629 6.6875 11.6508 6.6875 12.3755V12.813L8.66992 11.3254C8.89688 11.1559 9.17305 11.0629 9.45742 11.0629H13.25C13.4906 11.0629 13.6875 10.8661 13.6875 10.6254V2.75008C13.6875 2.50944 13.4906 2.31256 13.25 2.31256H2.75C2.50937 2.31256 2.3125 2.50944 2.3125 2.75008V10.6254C2.3125 10.8661 2.50937 11.0629 2.75 11.0629H5.375ZM6.6875 14.4537L6.68203 14.4592L6.54258 14.5631L6.075 14.9131C5.94375 15.0115 5.76602 15.0279 5.61563 14.9541C5.46523 14.8803 5.375 14.7299 5.375 14.5631V12.3755H2.75C1.78477 12.3755 1 11.5907 1 10.6254V2.75008C1 1.7848 1.78477 1 2.75 1H13.25C14.2152 1 15 1.7848 15 2.75008V10.6254C15 11.5907 14.2152 12.3755 13.25 12.3755H9.45742L6.6875 14.4537Z" fill="#535352" />
                                    </svg>
                                    <span className="text-[12px] font-semibold text-[#535352]">Reply</span>
                                </button>
                            )}
                            {isOwnComment && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id, isReply)}
                                    className="cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M5.04435 1.84809H4.88833C4.97414 1.84809 5.04435 1.78068 5.04435 1.6983V1.84809ZM5.04435 1.84809H10.9734V1.6983C10.9734 1.78068 11.0436 1.84809 11.1295 1.84809H10.9734V3.19617H12.3777V1.6983C12.3777 1.03736 11.8179 0.5 11.1295 0.5H4.88833C4.19985 0.5 3.6401 1.03736 3.6401 1.6983V3.19617H5.04435V1.84809ZM14.8741 3.19617H1.14364C0.798432 3.19617 0.519531 3.46392 0.519531 3.79532V4.39447C0.519531 4.47685 0.589744 4.54426 0.67556 4.54426H1.85357L2.33531 14.3366C2.36652 14.9751 2.91652 15.4787 3.58159 15.4787H12.4362C13.1032 15.4787 13.6513 14.9769 13.6825 14.3366L14.1642 4.54426H15.3422C15.428 4.54426 15.4983 4.47685 15.4983 4.39447V3.79532C15.4983 3.46392 15.2194 3.19617 14.8741 3.19617ZM12.286 14.1306H3.73177L3.25978 4.54426H12.758L12.286 14.1306Z" fill="#D93025" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {!isReply && replyingTo === comment.id && (
                            <div className="flex items-center gap-[10px] mt-3">
                                <img
                                    src={currentUser.avatar || avatarPlaceholder}
                                    alt={currentUser.name}
                                    className="w-10 h-10 rounded-full shrink-0"
                                />
                                <div className="flex-1 border border-[#E6E6E6] rounded-[10px] px-[20px] py-[12px]">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                        placeholder="Reply to comment..."
                                        className="w-full text-[14px] font-medium text-black placeholder:text-black focus:outline-none bg-transparent"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddComment}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#008080] text-white hover:opacity-90 transition cursor-pointer shrink-0"
                                    aria-label="Send reply"
                                >
                                    <Send className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="pt-[30px] relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="34" viewBox="0 0 18 34" fill="none" className="absolute top-2.5 left-0">
                                    <path d="M1 24C1 28.9706 5.02944 33 10 33H18V34H10L9.48535 33.9873C4.37212 33.7281 0.271903 29.6279 0.0126953 24.5146L0 24V0H1V24Z" fill="#E6E6E6" />
                                </svg>

                                {comment.replies.map((reply, replyIndex) => renderComment(reply, true, comment.id, replyIndex === (comment.replies?.length ?? 0) - 1))}
                            </div>
                        )}
                    </div>
                </div>

                {!isReply && !isLast && <div className="h-px bg-[#E6E6E6] my-5" />}
            </div>
        );
    };

    const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({
        checked,
        onChange,
        disabled = false,
    }) => {
        return (
            <button
                type="button"
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                className={cn(
                    'relative w-[35.5px] h-[21px] rounded-full transition-colors duration-300',
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                    checked ? 'bg-[#008080]' : 'bg-gray-300'
                )}
            >
                <span
                    className={cn(
                        'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full transition-transform duration-300',
                        checked ? 'translate-x-5 left-0' : 'translate-x-1 left-0'
                    )}
                />
            </button>
        );
    };

    return createPortal(
        <>
            <div
                className={cn(
                    'fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            >
                <div
                    className={cn(
                        'relative w-full max-w-[641px] bg-[#1C2745] text-white shadow-xl max-h-[calc(100dvh-64px)] overflow-hidden mt-16 transition-transform duration-300 ease-out',
                        isOpen ? 'translate-x-0' : 'translate-x-full'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top Border */}
                    <div className="h-[6px] bg-[#232725] w-full" />

                    {/* Header */}
                    <div className="px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-px h-5 border-2 border-[#DE4A2C] rounded-full" />
                            <h2 className="text-lg font-semibold text-white">
                                {isMeeting
                                    ? (isCreateMode ? 'New Meeting' : (isEditMode ? 'Edit Meeting' : 'Meeting Details'))
                                    : (isCreateMode ? 'Create Task' : (isEditMode ? 'Edit Task' : 'Task Details'))}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] cursor-pointer transition"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className={cn(
                        "bg-white mx-[15px] mb-[15px] rounded-[5px] relative",
                        isCreateMode ? "py-[35px] ps-[23px] pr-[30px]" : "p-[23px]", "pb-[15px]"
                    )}>
                        {(isLoadingDetailedTask || isBootstrapLoading) && (
                            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-[5px]">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[14px] font-medium text-[#1E88E5]">
                                        {isLoadingDetailedTask ? 'Loading task details...' : 'Loading...'}
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* Created By - Only show when task is provided (not for meetings) */}
                        {!isCreateMode && !isMeeting && task && (
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-[10px]">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4ZM8 10C6.89543 10 6 10.8954 6 12C6 13.1046 6.89543 14 8 14C9.10457 14 10 13.1046 10 12C10 10.8954 9.10457 10 8 10Z"
                                            fill="#535352"
                                        />
                                    </svg>
                                    <span className="text-[14px] font-normal text-black">
                                        Created by: {task.createdBy.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    {!isEditMode && (
                                        <Tooltip content="Edit Task" side="top">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditMode(true);
                                                    onEdit?.(task.id);
                                                }}
                                                className="w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#1E88E5] text-black hover:bg-[#1372B2] cursor-pointer transition"
                                                aria-label="Edit"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M0 3.63758C0 2.67284 0.383244 1.7476 1.06542 1.06542C1.7476 0.383244 2.67284 0 3.63758 0H7.48936C7.68799 0 7.87849 0.0789055 8.01894 0.219358C8.15939 0.359811 8.2383 0.550306 8.2383 0.748936C8.2383 0.947567 8.15939 1.13806 8.01894 1.27851C7.87849 1.41897 7.68799 1.49787 7.48936 1.49787H3.63758C3.0701 1.49787 2.52585 1.72331 2.12458 2.12458C1.72331 2.52585 1.49787 3.0701 1.49787 3.63758V11.3411C1.49787 11.9086 1.72331 12.4529 2.12458 12.8541C2.52585 13.2554 3.0701 13.4809 3.63758 13.4809H11.3411C11.9086 13.4809 12.4529 13.2554 12.8541 12.8541C13.2554 12.4529 13.4809 11.9086 13.4809 11.3411V7.48936C13.4809 7.29073 13.5598 7.10024 13.7002 6.95978C13.8407 6.81933 14.0312 6.74043 14.2298 6.74043C14.4284 6.74043 14.6189 6.81933 14.7594 6.95978C14.8998 7.10024 14.9787 7.29073 14.9787 7.48936V11.3411C14.9787 12.3059 14.5955 13.2311 13.9133 13.9133C13.2311 14.5955 12.3059 14.9787 11.3411 14.9787H3.63758C2.67284 14.9787 1.7476 14.5955 1.06542 13.9133C0.383244 13.2311 0 12.3059 0 11.3411V3.63758Z" fill="white" />
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M9.83568 8.40092L8.18427 9.39701L7.41062 8.11408L9.06203 7.11799L9.06427 7.1165C9.12757 7.07838 9.18593 7.03259 9.23803 6.98019L12.9902 3.20855C13.0278 3.17065 13.064 3.13143 13.0988 3.09096C13.3467 2.80187 13.7137 2.22969 13.2696 1.78332C12.8943 1.40586 12.3566 1.76235 12.0083 2.06867C11.9149 2.15102 11.825 2.23722 11.7387 2.32705L11.7133 2.35251L8.01352 6.07098C7.92567 6.15831 7.85683 6.26285 7.8113 6.37804L7.19418 7.93059C7.18248 7.9598 7.18027 7.99196 7.18788 8.0225C7.19549 8.05304 7.21252 8.0804 7.23656 8.10071C7.2606 8.12102 7.29043 8.13324 7.32181 8.13564C7.35318 8.13804 7.38377 8.1305 7.41062 8.11408L8.18427 9.39701C6.83244 10.2118 5.21849 8.84279 5.80266 7.37638L6.42053 5.82458C6.54083 5.52134 6.72177 5.24584 6.95227 5.01498L10.6513 1.29576L10.673 1.27404C10.7831 1.1617 11.1531 0.782742 11.6017 0.510129C11.8466 0.362589 12.2375 0.167116 12.7206 0.129669C13.2748 0.085482 13.8665 0.259984 14.3308 0.726571C14.6862 1.07766 14.9097 1.54055 14.9636 2.03721C15.0007 2.42433 14.9416 2.81462 14.7914 3.17335C14.5742 3.71033 14.2117 4.10502 14.0522 4.26455L10.3 8.03619C10.1602 8.17649 10.0054 8.29807 9.83568 8.40092ZM13.1707 3.064C13.1707 3.064 13.1677 3.06625 13.161 3.0685L13.1707 3.064Z" fill="white" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                    )}
                                    <Tooltip content="Delete Task" side="top">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onDelete?.(task.id);
                                                onClose();
                                            }}
                                            className="w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#D93025] text-white hover:bg-[#C62828] cursor-pointer transition"
                                            aria-label="Delete"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.52482 1.34809H4.36879C4.45461 1.34809 4.52482 1.28068 4.52482 1.1983V1.34809ZM4.52482 1.34809H10.4539V1.1983C10.4539 1.28068 10.5241 1.34809 10.6099 1.34809H10.4539V2.69617H11.8582V1.1983C11.8582 0.537362 11.2984 0 10.6099 0H4.36879C3.68032 0 3.12057 0.537362 3.12057 1.1983V2.69617H4.52482V1.34809ZM14.3546 2.69617H0.624114C0.278901 2.69617 0 2.96392 0 3.29532V3.89447C0 3.97685 0.0702128 4.04426 0.156028 4.04426H1.33404L1.81578 13.8366C1.84699 14.4751 2.39699 14.9787 3.06206 14.9787H11.9167C12.5837 14.9787 13.1317 14.4769 13.1629 13.8366L13.6447 4.04426H14.8227C14.9085 4.04426 14.9787 3.97685 14.9787 3.89447V3.29532C14.9787 2.96392 14.6998 2.69617 14.3546 2.69617ZM11.7665 13.6306H3.21223L2.74025 4.04426H12.2385L11.7665 13.6306Z" fill="white" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}

                        {/* Created By - Only show when meeting is provided (not for tasks) */}
                        {!isCreateMode && isMeeting && meeting && (
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-[10px]">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4ZM8 10C6.89543 10 6 10.8954 6 12C6 13.1046 6.89543 14 8 14C9.10457 14 10 13.1046 10 12C10 10.8954 9.10457 10 8 10Z"
                                            fill="#535352"
                                        />
                                    </svg>
                                    <span className="text-[14px] font-normal text-black">
                                        Created by: {meeting.createdBy.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    {!isEditMode && (
                                        <Tooltip content="Edit Meeting" side="top">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditMode(true);
                                                    onEdit?.(meeting.id);
                                                }}
                                                className="w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#1E88E5] text-black hover:bg-[#1372B2] cursor-pointer transition"
                                                aria-label="Edit"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M0 3.63758C0 2.67284 0.383244 1.7476 1.06542 1.06542C1.7476 0.383244 2.67284 0 3.63758 0H7.48936C7.68799 0 7.87849 0.0789055 8.01894 0.219358C8.15939 0.359811 8.2383 0.550306 8.2383 0.748936C8.2383 0.947567 8.15939 1.13806 8.01894 1.27851C7.87849 1.41897 7.68799 1.49787 7.48936 1.49787H3.63758C3.0701 1.49787 2.52585 1.72331 2.12458 2.12458C1.72331 2.52585 1.49787 3.0701 1.49787 3.63758V11.3411C1.49787 11.9086 1.72331 12.4529 2.12458 12.8541C2.52585 13.2554 3.0701 13.4809 3.63758 13.4809H11.3411C11.9086 13.4809 12.4529 13.2554 12.8541 12.8541C13.2554 12.4529 13.4809 11.9086 13.4809 11.3411V7.48936C13.4809 7.29073 13.5598 7.10024 13.7002 6.95978C13.8407 6.81933 14.0312 6.74043 14.2298 6.74043C14.4284 6.74043 14.6189 6.81933 14.7594 6.95978C14.8998 7.10024 14.9787 7.29073 14.9787 7.48936V11.3411C14.9787 12.3059 14.5955 13.2311 13.9133 13.9133C13.2311 14.5955 12.3059 14.9787 11.3411 14.9787H3.63758C2.67284 14.9787 1.7476 14.5955 1.06542 13.9133C0.383244 13.2311 0 12.3059 0 11.3411V3.63758Z" fill="white" />
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M9.83568 8.40092L8.18427 9.39701L7.41062 8.11408L9.06203 7.11799L9.06427 7.1165C9.12757 7.07838 9.18593 7.03259 9.23803 6.98019L12.9902 3.20855C13.0278 3.17065 13.064 3.13143 13.0988 3.09096C13.3467 2.80187 13.7137 2.22969 13.2696 1.78332C12.8943 1.40586 12.3566 1.76235 12.0083 2.06867C11.9149 2.15102 11.825 2.23722 11.7387 2.32705L11.7133 2.35251L8.01352 6.07098C7.92567 6.15831 7.85683 6.26285 7.8113 6.37804L7.19418 7.93059C7.18248 7.9598 7.18027 7.99196 7.18788 8.0225C7.19549 8.05304 7.21252 8.0804 7.23656 8.10071C7.2606 8.12102 7.29043 8.13324 7.32181 8.13564C7.35318 8.13804 7.38377 8.1305 7.41062 8.11408L8.18427 9.39701C6.83244 10.2118 5.21849 8.84279 5.80266 7.37638L6.42053 5.82458C6.54083 5.52134 6.72177 5.24584 6.95227 5.01498L10.6513 1.29576L10.673 1.27404C10.7831 1.1617 11.1531 0.782742 11.6017 0.510129C11.8466 0.362589 12.2375 0.167116 12.7206 0.129669C13.2748 0.085482 13.8665 0.259984 14.3308 0.726571C14.6862 1.07766 14.9097 1.54055 14.9636 2.03721C15.0007 2.42433 14.9416 2.81462 14.7914 3.17335C14.5742 3.71033 14.2117 4.10502 14.0522 4.26455L10.3 8.03619C10.1602 8.17649 10.0054 8.29807 9.83568 8.40092ZM13.1707 3.064C13.1707 3.064 13.1677 3.06625 13.161 3.0685L13.1707 3.064Z" fill="white" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                    )}
                                    <Tooltip content="Delete Meeting" side="top">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onDelete?.(meeting.id);
                                                onClose();
                                            }}
                                            className="w-[27.676px] h-[27.676px] flex items-center justify-center rounded-full bg-[#D93025] text-white hover:bg-[#C62828] cursor-pointer transition"
                                            aria-label="Delete"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.52482 1.34809H4.36879C4.45461 1.34809 4.52482 1.28068 4.52482 1.1983V1.34809ZM4.52482 1.34809H10.4539V1.1983C10.4539 1.28068 10.5241 1.34809 10.6099 1.34809H10.4539V2.69617H11.8582V1.1983C11.8582 0.537362 11.2984 0 10.6099 0H4.36879C3.68032 0 3.12057 0.537362 3.12057 1.1983V2.69617H4.52482V1.34809ZM14.3546 2.69617H0.624114C0.278901 2.69617 0 2.96392 0 3.29532V3.89447C0 3.97685 0.0702128 4.04426 0.156028 4.04426H1.33404L1.81578 13.8366C1.84699 14.4751 2.39699 14.9787 3.06206 14.9787H11.9167C12.5837 14.9787 13.1317 14.4769 13.1629 13.8366L13.6447 4.04426H14.8227C14.9085 4.04426 14.9787 3.97685 14.9787 3.89447V3.29532C14.9787 2.96392 14.6998 2.69617 14.3546 2.69617ZM11.7665 13.6306H3.21223L2.74025 4.04426H12.2385L11.7665 13.6306Z" fill="white" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}

                        <div className={cn(
                            "overflow-y-auto",
                            (isCreateMode ? 'h-[calc(100dvh-273px)]' : (
                                isEditMode
                                    ? 'h-[calc(100dvh-313px)]'
                                    : 'h-[calc(100dvh-255px)]'
                            ))
                        )}>
                            {/* Title */}
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black block mt-2.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <div className="w-[399px]">
                                    {(isCreateMode || isEditMode) ? (
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                if (validationErrors.includes('title')) setValidationErrors(prev => prev.filter(err => err !== 'title'));
                                            }}
                                            placeholder="e.g. Prepare slides for Board Meeting"
                                            className={cn("w-full rounded-[5px] border px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2", validationErrors.includes('title') ? "border-red-500 focus:ring-red-500/40" : "border-[#E6E6E6] focus:ring-[#2563EB]/40")}
                                        />
                                    ) : (
                                        <div className="w-[399px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-black">
                                            {title}
                                        </div>
                                    )}
                                    {validationErrors.includes('title') && (
                                        <p className="text-red-500 text-xs mt-1">Title is required.</p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black mt-2.5 block">Description</label>
                                {(isCreateMode || isEditMode) ? (
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add details, objectives, or context for the task..."
                                        rows={4}
                                        className="w-[399px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none min-h-[105px]"
                                    />
                                ) : (
                                    <div className="w-[399px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-black min-h-[85px] max-h-[85px] overflow-y-auto">
                                        {description || ''}
                                    </div>
                                )}
                            </div>

                            {/* Due Date & Time / Date & Time */}
                            <div className="mb-6">
                                {dateTimeMode === 'deadline' ? (
                                    // Deadline Mode
                                    <div className="flex items-start justify-between">
                                        <label className="text-[15px] font-semibold text-black mt-[10px] shrink-0">
                                            {isMeeting ? 'Date & Time' : 'Due Date & Time'} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="w-[399px]">
                                            {isMeeting ? (
                                                (isCreateMode || isEditMode) ? (
                                                    <>
                                                        <div className="flex items-center gap-[10px]">
                                                            <div className="relative">
                                                                <button
                                                                    ref={startDateButtonRef}
                                                                    type="button"
                                                                    className="w-full min-w-[180px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between gap-2.5"
                                                                >
                                                                    <span>
                                                                        {startTime
                                                                            ? `${formatDate(startDate)}, ${startTime}`
                                                                            : `${formatDate(startDate)}, ${formatTime(startDate)}`}
                                                                    </span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="cursor-pointer shrink-0"
                                                                        onClick={() => setStartDatePickerOpen(!startDatePickerOpen)}>
                                                                        <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                        <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                                    </svg>
                                                                </button>
                                                                {startDatePickerOpen && (
                                                                    <div
                                                                        ref={startDatePopoverRef}
                                                                        className="absolute z-10"
                                                                        style={{
                                                                            left: `${startDatePopoverPosition.left}px`,
                                                                            ...(startDatePopoverPosition.top !== undefined
                                                                                ? { top: `${startDatePopoverPosition.top}px` }
                                                                                : { bottom: `${startDatePopoverPosition.bottom}px` }),
                                                                        }}
                                                                    >
                                                                        <DateTimePopover
                                                                            selectedDate={startDate}
                                                                            selectedTime={startTime}
                                                                            onSave={(date, time) => {
                                                                                setStartDate(date);
                                                                                setStartTime(time);
                                                                                setStartDatePickerOpen(false);
                                                                            }}
                                                                            onCancel={() => setStartDatePickerOpen(false)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[15px] text-[#535352] shrink-0">to</span>
                                                            <div className="relative">
                                                                <button
                                                                    ref={endDateButtonRef}
                                                                    type="button"
                                                                    className="w-full min-w-[180px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between gap-2.5"
                                                                >
                                                                    <span>
                                                                        {endTime
                                                                            ? `${formatDate(endDate)}, ${endTime}`
                                                                            : `${formatDate(endDate)}, ${formatTime(endDate)}`}
                                                                    </span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="cursor-pointer shrink-0"
                                                                        onClick={() => setEndDatePickerOpen(!endDatePickerOpen)}>
                                                                        <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                        <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                                    </svg>
                                                                </button>
                                                                {endDatePickerOpen && (
                                                                    <div
                                                                        ref={endDatePopoverRef}
                                                                        className="absolute z-10"
                                                                        style={{
                                                                            left: `${endDatePopoverPosition.left}px`,
                                                                            ...(endDatePopoverPosition.top !== undefined
                                                                                ? { top: `${endDatePopoverPosition.top}px` }
                                                                                : { bottom: `${endDatePopoverPosition.bottom}px` }),
                                                                        }}
                                                                    >
                                                                        <DateTimePopover
                                                                            selectedDate={endDate}
                                                                            selectedTime={endTime}
                                                                            onSave={(date, time) => {
                                                                                setEndDate(date);
                                                                                setEndTime(time);
                                                                                setEndDatePickerOpen(false);
                                                                            }}
                                                                            onCancel={() => setEndDatePickerOpen(false)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-[10px]">
                                                        <div className="relative flex items-center justify-between gap-2.5 rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352]">
                                                            <span>
                                                                {startTime
                                                                    ? `${formatDate(startDate)}, ${startTime}`
                                                                    : `${formatDate(startDate)}, ${formatTime(startDate)}`}
                                                            </span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                                                                <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-[15px] text-[#535352] shrink-0">to</span>
                                                        <div className="relative flex items-center justify-between gap-2.5 rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352]">
                                                            <span>
                                                                {endTime
                                                                    ? `${formatDate(endDate)}, ${endTime}`
                                                                    : `${formatDate(endDate)}, ${formatTime(endDate)}`}
                                                            </span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                                                                <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                (isCreateMode || isEditMode) ? (
                                                    <div className="flex items-start gap-[30px]">
                                                        <div className="relative">
                                                            <button
                                                                ref={dueDateButtonRef}
                                                                type="button"
                                                                className="w-full min-w-[180px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between gap-2.5"
                                                            >
                                                                <span>
                                                                    {dueTime === 'EOD'
                                                                        ? `${formatDate(dueDate)}, 11:59 PM`
                                                                        : dueTime
                                                                            ? `${formatDate(dueDate)}, ${dueTime}`
                                                                            : `${formatDate(dueDate)}, ${formatTime(dueDate)}`}
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="cursor-pointer shrink-0"
                                                                    onClick={() => setDatePickerOpen(!datePickerOpen)}>
                                                                    <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                    <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                                </svg>
                                                            </button>
                                                            {datePickerOpen && (
                                                                <div
                                                                    ref={dueDatePopoverRef}
                                                                    className="absolute z-10"
                                                                    style={{
                                                                        left: `${dueDatePopoverPosition.left}px`,
                                                                        ...(dueDatePopoverPosition.top !== undefined
                                                                            ? { top: `${dueDatePopoverPosition.top}px` }
                                                                            : { bottom: `${dueDatePopoverPosition.bottom}px` }),
                                                                    }}
                                                                >
                                                                    <DateTimePopover
                                                                        selectedDate={dueDate}
                                                                        selectedTime={dueTime}
                                                                        onSave={(date, time) => {
                                                                            setDueDate(date);
                                                                            setDueTime(time);
                                                                            setDatePickerOpen(false);
                                                                        }}
                                                                        onCancel={() => setDatePickerOpen(false)}
                                                                    />
                                                                </div>
                                                            )}
                                                            {isEditMode && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Switch to event mode and sync dates
                                                                        setStartDate(dueDate);
                                                                        // Convert EOD to 11:59 PM for start time
                                                                        const startTimeValue = dueTime === 'EOD' ? '11:59 PM' : (dueTime || formatTime(dueDate));
                                                                        setStartTime(startTimeValue);
                                                                        const endDateTime = dueTime === 'EOD'
                                                                            ? new Date(dueDate.getTime())
                                                                            : new Date(dueDate.getTime() + 60 * 60 * 1000);
                                                                        endDateTime.setHours(23, 59, 0, 0);
                                                                        setEndDate(endDateTime);
                                                                        setEndTime(dueTime === 'EOD' ? '11:59 PM' : formatTime(endDateTime));
                                                                        setDateTimeMode('event');
                                                                    }}
                                                                    className="block mt-[15px] text-[15px] font-normal text-[#1677BC] underline underline-offset-3 cursor-pointer hover:opacity-80"
                                                                >
                                                                    Schedule Event
                                                                </button>
                                                            )}
                                                            {isCreateMode && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Switch to event mode and sync dates
                                                                        setStartDate(dueDate);
                                                                        // Convert EOD to 11:59 PM for start time
                                                                        const startTimeValue = dueTime === 'EOD' ? '11:59 PM' : (dueTime || formatTime(dueDate));
                                                                        setStartTime(startTimeValue);
                                                                        const endDateTime = dueTime === 'EOD'
                                                                            ? new Date(dueDate.getTime())
                                                                            : new Date(dueDate.getTime() + 60 * 60 * 1000);
                                                                        endDateTime.setHours(23, 59, 0, 0);
                                                                        setEndDate(endDateTime);
                                                                        setEndTime(dueTime === 'EOD' ? '11:59 PM' : formatTime(endDateTime));
                                                                        setDateTimeMode('event');
                                                                    }}
                                                                    className="block mt-[15px] text-[15px] font-normal text-[#1677BC] underline underline-offset-3 cursor-pointer hover:opacity-80"
                                                                >
                                                                    Schedule Event
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isEndOfDay ? (
                                                            <Tooltip content="Currently set to EOD" side="bottom">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsEndOfDay(false);
                                                                        setDueTime('');
                                                                    }}
                                                                    className="bg-[#535352] rounded-[25px] px-[15px] py-[10px] text-[14px] font-medium text-white tracking-[0.7px] transition shrink-0 cursor-pointer"
                                                                >
                                                                    Set as EOD
                                                                </button>
                                                            </Tooltip>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsEndOfDay(true);
                                                                    setDueTime('EOD');
                                                                    const eodDate = new Date(dueDate);
                                                                    eodDate.setHours(23, 59, 0, 0);
                                                                    setDueDate(eodDate);
                                                                }}
                                                                className="bg-[#008080] rounded-[25px] px-[15px] py-[10px] text-[14px] font-medium text-white tracking-[0.7px] cursor-pointer hover:opacity-90 transition shrink-0"
                                                            >
                                                                Set as EOD
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-[30px]">
                                                        <div className="relative flex items-center justify-between gap-2.5 rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352]">
                                                            <span>
                                                                {dueTime === 'EOD'
                                                                    ? `${formatDate(dueDate)}, 11:59 PM`
                                                                    : dueTime
                                                                        ? `${formatDate(dueDate)}, ${dueTime}`
                                                                        : formatDate(dueDate)}
                                                            </span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                                                                <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                            </svg>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="bg-[#535352] rounded-[25px] px-[15px] py-[10px] text-[14px] font-medium text-white tracking-[0.7px] transition shrink-0"
                                                        >
                                                            Set as EOD
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // Event Mode (Date & Time with start/end)
                                    <div className="flex items-start justify-between">
                                        <label className="text-[15px] font-semibold text-black mt-[10px] shrink-0">
                                            Date & Time <span className="text-red-500">*</span>
                                        </label>
                                        <div className="w-[399px]">
                                            {(isCreateMode || isEditMode) ? (
                                                <>
                                                    <div className="flex items-center gap-[10px]">
                                                        <div className="relative">
                                                            <button
                                                                ref={startDateButtonRef}
                                                                type="button"
                                                                className="w-full min-w-[180px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between gap-2.5"
                                                                onClick={() => setStartDatePickerOpen(!startDatePickerOpen)}
                                                            >
                                                                <span>
                                                                    {startTime
                                                                        ? `${formatDate(startDate)}, ${startTime}`
                                                                        : `${formatDate(startDate)}, ${formatTime(startDate)}`}
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="cursor-pointer shrink-0">
                                                                    <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                    <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                                </svg>
                                                            </button>
                                                            {startDatePickerOpen && (
                                                                <div
                                                                    ref={startDatePopoverRef}
                                                                    className="absolute z-10"
                                                                    style={{
                                                                        left: `${startDatePopoverPosition.left}px`,
                                                                        ...(startDatePopoverPosition.top !== undefined
                                                                            ? { top: `${startDatePopoverPosition.top}px` }
                                                                            : { bottom: `${startDatePopoverPosition.bottom}px` }),
                                                                    }}
                                                                >
                                                                    <DateTimePopover
                                                                        selectedDate={startDate}
                                                                        selectedTime={startTime}
                                                                        onSave={(date, time) => {
                                                                            setStartDate(date);
                                                                            setStartTime(time);
                                                                            setStartDatePickerOpen(false);
                                                                        }}
                                                                        onCancel={() => setStartDatePickerOpen(false)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[15px] text-[#535352] shrink-0">to</span>
                                                        <div className="relative">
                                                            <button
                                                                ref={endDateButtonRef}
                                                                type="button"
                                                                className="w-full min-w-[180px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between gap-2.5"
                                                                onClick={() => setEndDatePickerOpen(!endDatePickerOpen)}
                                                            >
                                                                <span>
                                                                    {endTime
                                                                        ? `${formatDate(endDate)}, ${endTime}`
                                                                        : `${formatDate(endDate)}, ${formatTime(endDate)}`}
                                                                </span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="cursor-pointer shrink-0">
                                                                    <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                                    <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                                </svg>
                                                            </button>
                                                            {endDatePickerOpen && (
                                                                <div
                                                                    ref={endDatePopoverRef}
                                                                    className="absolute z-10"
                                                                    style={{
                                                                        left: `${endDatePopoverPosition.left}px`,
                                                                        ...(endDatePopoverPosition.top !== undefined
                                                                            ? { top: `${endDatePopoverPosition.top}px` }
                                                                            : { bottom: `${endDatePopoverPosition.bottom}px` }),
                                                                    }}
                                                                >
                                                                    <DateTimePopover
                                                                        selectedDate={endDate}
                                                                        selectedTime={endTime}
                                                                        onSave={(date, time) => {
                                                                            setEndDate(date);
                                                                            setEndTime(time);
                                                                            setEndDatePickerOpen(false);
                                                                        }}
                                                                        onCancel={() => setEndDatePickerOpen(false)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!isMeeting && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Sync deadline mode with start date/time when switching
                                                                setDueDate(startDate);
                                                                setDueTime(startTime || formatTime(startDate));
                                                                setDateTimeMode('deadline');
                                                            }}
                                                            className="block mt-[15px] text-[15px] font-normal text-[#1677BC] underline underline-offset-3 cursor-pointer hover:opacity-80"
                                                        >
                                                            Switch to Deadline Mode
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-[10px]">
                                                    <div className="relative flex items-center justify-between gap-2.5 rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352]">
                                                        <span>
                                                            {startTime
                                                                ? `${formatDate(startDate)}, ${startTime}`
                                                                : `${formatDate(startDate)}, ${formatTime(startDate)}`}
                                                        </span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                                                            <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                            <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[15px] text-[#535352] shrink-0">to</span>
                                                    <div className="relative flex items-center justify-between gap-2.5 rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352]">
                                                        <span>
                                                            {endTime
                                                                ? `${formatDate(endDate)}, ${endTime}`
                                                                : `${formatDate(endDate)}, ${formatTime(endDate)}`}
                                                        </span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                                                            <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                                                            <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Assigned To / Attendees */}
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black block mt-[10px]">
                                    {isMeeting ? 'Attendees' : 'Assigned To'} <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-col w-[399px]">
                                    <div className={cn("rounded-[5px] transition-colors duration-300", validationErrors.includes('assignedTo') ? "border border-red-500" : "border border-transparent")}>
                                        <AssignedToField
                                            assignedTo={assignedTo}
                                            onAssignedToChange={(users) => {
                                                setAssignedTo(users);
                                                if (validationErrors.includes('assignedTo')) setValidationErrors(prev => prev.filter(err => err !== 'assignedTo'));
                                            }}
                                            selectedGroups={selectedGroups}
                                            onSelectedGroupsChange={(groups) => {
                                                setSelectedGroups(groups);
                                                if (validationErrors.includes('assignedTo')) setValidationErrors(prev => prev.filter(err => err !== 'assignedTo'));
                                            }}
                                            activeTab={activeAudienceTab}
                                            onActiveTabChange={(tab) => {
                                                setActiveAudienceTab(tab);
                                                if (validationErrors.includes('assignedTo')) setValidationErrors(prev => prev.filter(err => err !== 'assignedTo'));
                                            }}
                                            readOnly={!isCreateMode && !isEditMode}
                                            users={bootstrapData?.individualUsers.map(u => ({
                                                id: String(u.id),
                                                name: u.name,
                                                email: `${u.name.toLowerCase().replace(/\s+/g, '.')}@westford.edu`,
                                                position: u.designation,
                                                avatar: u.profileImageUrl
                                            })) || []}
                                            groups={bootstrapData?.groups.map(g => ({
                                                id: String(g.groupId),
                                                name: g.groupName,
                                                iconUrl: g.iconUrl || undefined,
                                                avatar: g.iconUrl || avatarPlaceholder,
                                                members: [],
                                                memberCount: g.memberCount
                                            })) || []}
                                        />
                                    </div>
                                    {validationErrors.includes('assignedTo') && (
                                        <p className="text-red-500 text-xs mt-1">Assignment is required.</p>
                                    )}
                                </div>
                            </div>

                            {/* Venue - Only show for meetings */}
                            {isMeeting && (
                                <div className="flex items-start justify-between mb-6">
                                    <label className="text-[15px] font-semibold text-black block">
                                        Venue <span className="text-red-500">*</span>
                                    </label>
                                    {(isCreateMode || isEditMode) ? (
                                        <div className="flex flex-col gap-[15px]">
                                            <div className="flex items-center gap-[30px] w-[399px]">
                                                {(['N/A', 'Online', 'On-site'] as const).map((v) => (
                                                    <button
                                                        key={v}
                                                        type="button"
                                                        onClick={() => {
                                                            setVenueType(v);
                                                            if (v === 'N/A') {
                                                                setVenueDesc('');
                                                            }
                                                            if (validationErrors.includes('venueDesc')) setValidationErrors(prev => prev.filter(err => err !== 'venueDesc'));
                                                        }}
                                                        className="cursor-pointer flex items-center gap-[5px] text-[15px] font-semibold transition"
                                                    >
                                                        <div className="w-[19px] h-[19px] flex items-center justify-center shrink-0">
                                                            {venueType === v ? (
                                                                <div className="w-[19px] h-[19px] p-0.5 rounded-full border border-white bg-[#0198F1] flex items-center justify-center">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="11" viewBox="0 0 13 11" fill="none">
                                                                        <path d="M10.5004 0L4.86722 6.94463L1.53676 3.83268L0 5.26966L5.12175 10.0588L12.2941 1.43697L10.5004 0Z" fill="white" />
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <div className="w-[19px] h-[19px] rounded-full border border-white bg-[#D9D9D9]" />
                                                            )}
                                                        </div>
                                                        <span className={cn("text-[15px] font-semibold leading-normal", venueType === v ? 'text-[#535352]' : 'text-[#535352]')}>{v}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="min-h-[45px] flex-1">
                                                {venueType === 'Online' && (
                                                    <div className="flex flex-col w-[399px]">
                                                        <input
                                                            type="text"
                                                            placeholder="Enter meeting link (Teams / Meet)"
                                                            value={venueDesc}
                                                            onChange={(e) => {
                                                                setVenueDesc(e.target.value);
                                                                if (validationErrors.includes('venueDesc')) setValidationErrors(prev => prev.filter(err => err !== 'venueDesc'));
                                                            }}
                                                            className={cn("w-full rounded-[5px] border px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2", validationErrors.includes('venueDesc') ? "border-red-500 focus:ring-red-500/40" : "border-[#E6E6E6] focus:ring-[#2563EB]/40")}
                                                        />
                                                        {validationErrors.includes('venueDesc') && (
                                                            <p className="text-red-500 text-xs mt-1">Meeting link is required.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {venueType === 'On-site' && (
                                                    <div className="flex flex-col w-[399px]">
                                                        <input
                                                            type="text"
                                                            placeholder="Enter location"
                                                            value={venueDesc}
                                                            onChange={(e) => {
                                                                setVenueDesc(e.target.value);
                                                                if (validationErrors.includes('venueDesc')) setValidationErrors(prev => prev.filter(err => err !== 'venueDesc'));
                                                            }}
                                                            className={cn("w-full rounded-[5px] border px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2", validationErrors.includes('venueDesc') ? "border-red-500 focus:ring-red-500/40" : "border-[#E6E6E6] focus:ring-[#2563EB]/40")}
                                                        />
                                                        {validationErrors.includes('venueDesc') && (
                                                            <p className="text-red-500 text-xs mt-1">Location is required.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[15px] font-semibold text-[#535352] w-[399px]">
                                            {venueType === 'N/A'
                                                ? 'N/A'
                                                : `${venueType}${venueDesc ? ` - ${venueDesc}` : ''}`}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Attachments */}
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black mt-2.5 block">Attachments</label>
                                <div className="w-[399px]">
                                    {attachments.length > 0 && (
                                        <div className="border border-[#E6E6E6] rounded-[5px] py-[15px] px-[10px] flex flex-col gap-[10px] mb-[10px]">
                                            {attachments.map((attachment) => {
                                                // Get or create ref for this attachment
                                                if (!attachmentMenuRefs.current[attachment.id]) {
                                                    attachmentMenuRefs.current[attachment.id] = React.createRef<HTMLButtonElement>();
                                                }
                                                const menuButtonRef = attachmentMenuRefs.current[attachment.id];

                                                return (
                                                    <div
                                                        key={attachment.id}
                                                        className="flex items-center justify-between gap-[10px] relative"
                                                    >
                                                        <div className="flex items-center gap-[10px] flex-1 min-w-0">
                                                            {getAttachmentIcon(attachment.type)}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadAttachment(attachment, true)}
                                                                className={cn(
                                                                    'text-[14px] font-normal truncate text-left cursor-pointer hover:underline',
                                                                    attachment.type === 'link' ? 'text-[#1e88e5]' : 'text-[#535352]'
                                                                )}
                                                            >
                                                                {attachment.name}
                                                            </button>
                                                        </div>
                                                        {(isCreateMode || isEditMode) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isCreateMode) {
                                                                        setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
                                                                    } else {
                                                                        setAttachmentToDelete(attachment);
                                                                        setDeleteAttachmentModalOpen(true);
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1 text-[#D93025] hover:text-[#C62828] cursor-pointer shrink-0"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {(!isCreateMode && !isEditMode) && (
                                                            <>
                                                                <button
                                                                    ref={menuButtonRef}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setAttachmentMenus({
                                                                            ...attachmentMenus,
                                                                            [attachment.id]: !attachmentMenus[attachment.id],
                                                                        })
                                                                    }
                                                                    className="cursor-pointer shrink-0"
                                                                >
                                                                    <MoreVertical className="w-4 h-4 text-[#535352]" />
                                                                </button>
                                                                <AttachmentMenuDropdown
                                                                    isOpen={attachmentMenus[attachment.id] || false}
                                                                    onClose={() =>
                                                                        setAttachmentMenus({
                                                                            ...attachmentMenus,
                                                                            [attachment.id]: false,
                                                                        })
                                                                    }
                                                                    triggerRef={menuButtonRef}
                                                                    onOpen={() => {
                                                                        handleDownloadAttachment(attachment, true);
                                                                    }}
                                                                    onDownload={() => {
                                                                        handleDownloadAttachment(attachment, true);
                                                                    }}
                                                                    onDelete={() => {
                                                                        setAttachmentToDelete(attachment);
                                                                        setDeleteAttachmentModalOpen(true);
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {(isCreateMode || isEditMode) && (
                                        <div className="relative">
                                            <button
                                                ref={attachmentButtonRef}
                                                type="button"
                                                onClick={() => setAttachmentDropdownOpen(!attachmentDropdownOpen)}
                                                className="border border-[#E6E6E6] rounded-[5px] px-[10px] py-[10px] w-full flex items-center gap-[5px] cursor-pointer hover:bg-gray-50 transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="18" viewBox="0 0 10 18" fill="none">
                                                    <path d="M6.42857 0C7.37577 0 8.28418 0.395088 8.95395 1.09835C9.62373 1.80161 10 2.75544 10 3.75V12.75C10 13.4394 9.87067 14.1221 9.6194 14.7591C9.36812 15.396 8.99983 15.9748 8.53553 16.4623C8.07124 16.9498 7.52005 17.3365 6.91342 17.6004C6.30679 17.8642 5.65661 18 5 18C4.34339 18 3.69321 17.8642 3.08658 17.6004C2.47995 17.3365 1.92876 16.9498 1.46447 16.4623C1.00017 15.9748 0.631876 15.396 0.380602 14.7591C0.129329 14.1221 -9.78424e-09 13.4394 0 12.75V6.75H1.42857V12.75C1.42857 13.7446 1.80485 14.6984 2.47462 15.4017C3.14439 16.1049 4.0528 16.5 5 16.5C5.9472 16.5 6.85561 16.1049 7.52538 15.4017C8.19515 14.6984 8.57143 13.7446 8.57143 12.75V3.75C8.57143 3.45453 8.516 3.16194 8.40831 2.88896C8.30062 2.61598 8.14278 2.36794 7.9438 2.15901C7.74482 1.95008 7.50859 1.78434 7.24861 1.67127C6.98862 1.5582 6.70998 1.5 6.42857 1.5C6.14717 1.5 5.86852 1.5582 5.60854 1.67127C5.34855 1.78434 5.11233 1.95008 4.91334 2.15901C4.71436 2.36794 4.55652 2.61598 4.44883 2.88896C4.34114 3.16194 4.28571 3.45453 4.28571 3.75V12.75C4.28571 12.9489 4.36097 13.1397 4.49492 13.2803C4.62888 13.421 4.81056 13.5 5 13.5C5.18944 13.5 5.37112 13.421 5.50508 13.2803C5.63903 13.1397 5.71429 12.9489 5.71429 12.75V4.5H7.14286V12.75C7.14286 13.3467 6.91709 13.919 6.51523 14.341C6.11337 14.7629 5.56832 15 5 15C4.43168 15 3.88663 14.7629 3.48477 14.341C3.08291 13.919 2.85714 13.3467 2.85714 12.75V3.75C2.85714 2.75544 3.23342 1.80161 3.90319 1.09835C4.57296 0.395088 5.48137 0 6.42857 0Z" fill="#008080" />
                                                </svg>
                                                <span className="text-[15px] font-normal text-[#535352]">Add Attachment(s)</span>
                                            </button>
                                            <AttachmentDropdown
                                                isOpen={attachmentDropdownOpen}
                                                onClose={() => setAttachmentDropdownOpen(false)}
                                                triggerRef={attachmentButtonRef}
                                                onAttachFromCloud={() => {
                                                    // TODO: Implement attach from cloud functionality
                                                    console.log('Attach from Cloud clicked');
                                                }}
                                                onUploadFile={handleUploadFiles}
                                                onAddLink={() => {
                                                    setAddLinkModalOpen(true);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black block mt-1">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-col w-[399px]">
                                    {(isCreateMode || isEditMode) ? (
                                        <div className="flex items-center gap-[19px] w-[399px]">
                                            {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                                                const colors = {
                                                    high: 'bg-[#d93025]',
                                                    medium: 'bg-[#ffb74d]',
                                                    low: 'bg-green-600',
                                                };
                                                return (
                                                    <div key={p} className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPriority(p);
                                                                if (validationErrors.includes('priority')) setValidationErrors(prev => prev.filter(err => err !== 'priority'));
                                                            }}
                                                            className={cn(
                                                                'cursor-pointer rounded-[25px] text-[14px] font-semibold text-white transition-all h-[27px] w-[95px]',
                                                                colors[p]
                                                            )}
                                                        >
                                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                                        </button>
                                                        {priority === p && (
                                                            <div className="absolute -top-[4px] -left-[4px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+8px)] h-[calc(100%+8px)]"></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-[10px] w-[399px]">
                                            {priority && <PriorityBadge priority={priority} isMinimal={false} />}
                                        </div>
                                    )}
                                    {validationErrors.includes('priority') && (
                                        <p className="text-red-500 text-xs mt-1">Priority is required.</p>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-start justify-between mb-6">
                                <label className="text-[15px] font-semibold text-black block mt-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-col w-[399px]">
                                    {(isCreateMode || isEditMode) ? (
                                        <div className="flex items-start gap-[10px] w-[399px]">
                                            <div className="relative">
                                                <button
                                                    key='todo'
                                                    type="button"
                                                    onClick={() => {
                                                        setStatus('todo');
                                                        if (validationErrors.includes('status')) setValidationErrors(prev => prev.filter(err => err !== 'status'));
                                                    }}
                                                    className={cn(
                                                        'cursor-pointer ps-1 h-[28px] w-[83px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#232725]',
                                                    )}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M7.16667 4.16602H3.83333C3.3731 4.16602 3 4.53911 3 4.99935V8.33268C3 8.79292 3.3731 9.16602 3.83333 9.16602H7.16667C7.6269 9.16602 8 8.79292 8 8.33268V4.99935C8 4.53911 7.6269 4.16602 7.16667 4.16602Z" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M3 14.1667L4.66667 15.8333L8 12.5M11.3333 5H18M11.3333 10H18M11.3333 15H18" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    To do
                                                </button>
                                                {status === 'todo' && (
                                                    <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]"></div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <button
                                                    key='in-progress'
                                                    type="button"
                                                    onClick={() => {
                                                        setStatus('in-progress');
                                                        if (validationErrors.includes('status')) setValidationErrors(prev => prev.filter(err => err !== 'status'));
                                                    }}
                                                    className={cn(
                                                        'cursor-pointer ps-1 h-[28px] w-[119px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#1e88e5]',
                                                    )}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M9.99999 19C8.76999 19 7.6075 18.7636 6.5125 18.2908C5.4175 17.818 4.4614 17.173 3.6442 16.3558C2.827 15.5386 2.182 14.5825 1.7092 13.4875C1.2364 12.3925 1 11.23 1 10C1 8.755 1.2364 7.5889 1.7092 6.5017C2.182 5.4145 2.827 4.462 3.6442 3.6442C4.4614 2.8264 5.4175 2.1814 6.5125 1.7092C7.6075 1.237 8.76999 1.0006 9.99999 1C10.255 1 10.4689 1.0864 10.6417 1.2592C10.8145 1.432 10.9006 1.6456 10.9 1.9C10.8994 2.1544 10.813 2.3683 10.6408 2.5417C10.4686 2.7151 10.255 2.8012 9.99999 2.8C8.005 2.8 6.3061 3.5014 4.9033 4.9042C3.5005 6.307 2.7994 8.0056 2.8 10C2.8006 11.9944 3.502 13.6933 4.9042 15.0967C6.3064 16.5001 8.005 17.2012 9.99999 17.2C11.995 17.1988 13.6939 16.4977 15.0967 15.0967C16.4995 13.6957 17.2006 11.9968 17.2 10C17.2 9.745 17.2864 9.5314 17.4592 9.3592C17.632 9.187 17.8456 9.1006 18.1 9.1C18.3544 9.0994 18.5683 9.1858 18.7417 9.3592C18.9151 9.5326 19.0012 9.7462 19 10C19 11.23 18.7636 12.3925 18.2908 13.4875C17.818 14.5825 17.173 15.5389 16.3558 16.3567C15.5386 17.1745 14.5861 17.8195 13.4983 18.2917C12.4105 18.7639 11.2444 19 9.99999 19Z" fill="white" />
                                                    </svg>
                                                    In Progress
                                                </button>
                                                {status === 'in-progress' && (
                                                    <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]"></div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <button
                                                    key='completed'
                                                    type="button"
                                                    onClick={() => {
                                                        setStatus('completed');
                                                        if (validationErrors.includes('status')) setValidationErrors(prev => prev.filter(err => err !== 'status'));
                                                    }}
                                                    className={cn(
                                                        'cursor-pointer ps-1 h-[28px] w-[118px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#607d8b]',
                                                    )}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M9.99961 2.63629C9.03264 2.63629 8.07515 2.82675 7.18179 3.19679C6.28843 3.56683 5.47671 4.10921 4.79296 4.79296C4.10921 5.47671 3.56683 6.28843 3.19679 7.18179C2.82675 8.07515 2.63629 9.03264 2.63629 9.99961C2.63629 10.9666 2.82675 11.9241 3.19679 12.8174C3.56683 13.7108 4.10921 14.5225 4.79296 15.2063C5.47671 15.89 6.28843 16.4324 7.18179 16.8024C8.07515 17.1725 9.03264 17.3629 9.99961 17.3629C11.9525 17.3629 13.8254 16.5871 15.2063 15.2063C16.5871 13.8254 17.3629 11.9525 17.3629 9.99961C17.3629 8.04674 16.5871 6.17385 15.2063 4.79296C13.8254 3.41207 11.9525 2.63629 9.99961 2.63629ZM1 9.99961C1 5.02937 5.02937 1 9.99961 1C14.9698 1 18.9992 5.02937 18.9992 9.99961C18.9992 14.9698 14.9698 18.9992 9.99961 18.9992C5.02937 18.9992 1 14.9698 1 9.99961Z" fill="white" />
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M14.5888 7.54358L8.26784 13.8646L5.0918 10.0741L6.32802 9.00233L8.35375 11.465L13.432 6.38672L14.5888 7.54358Z" fill="white" />
                                                    </svg>
                                                    Completed
                                                </button>
                                                {status === 'completed' && (
                                                    <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]"></div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-[10px] w-[399px]">
                                            {status && <StatusBadge status={status} />}
                                        </div>
                                    )}
                                    {validationErrors.includes('status') && (
                                        <p className="text-red-500 text-xs mt-1">Status is required.</p>
                                    )}
                                </div>
                            </div>

                            {/* Toggle Switches - Only show when task is provided (not for meetings) */}
                            {!isCreateMode && !isMeeting && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-[15px] font-semibold text-black">Add to Calendar</label>
                                        <div className="w-[399px]">
                                            <ToggleSwitch checked={addToCalendar} onChange={setAddToCalendar} disabled={!isEditMode} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[15px] font-semibold text-black">Show Comments</label>
                                        <div className="w-[399px]">
                                            <ToggleSwitch checked={showComments} onChange={setShowComments} disabled={!isEditMode} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Add to Calendar and Show Comments for meetings in edit mode */}
                            {!isCreateMode && isMeeting && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-[15px] font-semibold text-black">Add to Calendar</label>
                                        <div className="w-[399px]">
                                            <ToggleSwitch checked={addToCalendar} onChange={setAddToCalendar} disabled={!isEditMode} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[15px] font-semibold text-black">Show Comments</label>
                                        <div className="w-[399px]">
                                            <ToggleSwitch checked={showComments} onChange={setShowComments} disabled={!isEditMode} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Add to Calendar - Only show in create mode */}
                            {isCreateMode && (
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-[15px] font-semibold text-black">Add to Calendar</label>
                                    <div className="w-[399px] flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setAddToCalendar(!addToCalendar)}
                                            className={cn(
                                                'relative w-[35.5px] h-[20px] rounded-full transition-colors duration-300 cursor-pointer',
                                                addToCalendar ? 'bg-[#008080]' : 'bg-gray-300'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full transition-transform duration-300',
                                                    addToCalendar ? 'translate-x-5 left-0' : 'translate-x-1 left-0'
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Comments Section - Only show when task is provided */}
                            {showComments && !isCreateMode && (
                                <div className="border border-[#E6E6E6] rounded-[10px] p-[10px]">
                                    {/* Comment Input */}
                                    <div className="flex items-center gap-[10px] mb-4">
                                        <img
                                            src={currentUser.avatar || avatarPlaceholder}
                                            alt={currentUser.name}
                                            className="w-12 h-12 rounded-full shrink-0"
                                        />
                                        <div className="flex-1 border border-[#E6E6E6] rounded-[10px] px-[25px] py-[15px]">
                                            <input
                                                type="text"
                                                value={replyingTo ? '' : commentText}
                                                onChange={(e) => {
                                                    if (replyingTo) {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }
                                                    setCommentText(e.target.value);
                                                }}
                                                onFocus={() => {
                                                    if (replyingTo) {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey && !replyingTo) {
                                                        e.preventDefault();
                                                        handleAddNewComment();
                                                    }
                                                }}
                                                placeholder="Add a comment…"
                                                disabled={!!replyingTo}
                                                className="w-full text-[14px] font-medium text-black placeholder:text-black focus:outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddNewComment}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#008080] text-white hover:opacity-90 transition cursor-pointer shrink-0"
                                            aria-label="Send comment"
                                        >
                                            <Send className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-[#E6E6E6] mb-4" />

                                    {/* Comments List */}
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {comments.length === 0 ? (
                                            <p className="text-[14px] text-[#535352] text-center py-4">No comments yet</p>
                                        ) : (
                                            comments.map((comment, index) => renderComment(comment, false, undefined, index === comments.length - 1))
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Action Buttons */}
                        {isCreateMode ? (
                            <div className="flex items-center justify-end gap-5 mt-[15px]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="border border-[#CACACA] rounded-full px-[15px] py-[10px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition w-[130px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className={cn(
                                        "bg-[#DE4A2C] rounded-full px-[25px] py-[10px] text-[14px] font-semibold text-white hover:bg-[#C62828] cursor-pointer transition w-[130px]",
                                        isSaving && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isSaving ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        ) : (
                            isEditMode && (
                                <div className="flex items-center justify-end gap-5 mt-[15px]">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="border border-[#CACACA] rounded-full px-[15px] py-[10px] text-[14px] font-semibold text-black hover:bg-[#F3F4F6] cursor-pointer transition w-[130px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSaving}
                                        className={cn(
                                            "bg-[#DE4A2C] rounded-full px-[25px] py-[10px] text-[14px] font-semibold text-white hover:bg-[#C62828] cursor-pointer transition w-[130px]",
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
                <AddLinkModal
                    isOpen={addLinkModalOpen}
                    onClose={() => setAddLinkModalOpen(false)}
                    onInsert={handleInsertLink}
                />
                {!isCreateMode && (
                    <DeleteAttachmentModal
                        isOpen={deleteAttachmentModalOpen}
                        onClose={() => {
                            setDeleteAttachmentModalOpen(false);
                            setAttachmentToDelete(null);
                        }}
                        onConfirm={handleDeleteAttachment}
                        attachmentName={attachmentToDelete?.name}
                    />
                )}
            </div>
        </>,
        document.body
    );
};

export default TaskDrawer;
