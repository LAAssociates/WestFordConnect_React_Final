import React, { useState, useEffect } from 'react';
import { X, Calendar, List, Loader2, Check, Paperclip } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import type { Meeting, Priority, User } from './types';
import { mockUsers } from './mockData';
import DateTimePicker from '../notes/DateTimePicker';
import avatarPlaceholder from '../../assets/images/avatar-placeholder-2.png';
import { toVenue } from '../../utils/venue';
import type { Venue } from '../../utils/venue';
import type { MeetingInitialLoadResult, AssignedToUser } from '../../types/meeting';

interface CreateMeetingDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (meeting: Omit<Meeting, 'id'>) => void;
    onUpdate?: (meeting: Meeting) => void;
    meeting?: Meeting | null;
    bootstrapData?: MeetingInitialLoadResult | null;
}

const CreateMeetingDrawer: React.FC<CreateMeetingDrawerProps> = ({ isOpen, onClose, onSubmit, onUpdate, meeting, bootstrapData }) => {
    const isEditMode = !!meeting;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [status, setStatus] = useState<'todo' | 'in-progress' | 'completed' | 'overdue'>('todo');
    const [startDate, setStartDate] = useState(new Date());
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState(new Date());
    const [endTime, setEndTime] = useState('');
    const [assignedTo, setAssignedTo] = useState<User[]>([]);
    const [venue, setVenue] = useState<Venue>('N/A');

    // Venue normalization now handled by shared toVenue helper
    const [addToCalendar, setAddToCalendar] = useState(false);
    const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
    const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setStatus('todo');
            const now = new Date();
            setStartDate(now);
            setStartTime('');
            const end = new Date(now);
            end.setHours(now.getHours() + 1);
            setEndDate(end);
            setEndTime('');
            setAssignedTo([]);
            setVenue('N/A');
            setAddToCalendar(false);
            setStartDatePickerOpen(false);
            setEndDatePickerOpen(false);
            setValidationErrors([]);
        } else if (meeting) {
            // Populate form with meeting data for editing
            setTitle(meeting.title);
            setDescription(meeting.description || '');
            setPriority(meeting.priority || 'medium');
            setStatus(meeting.status);
            setStartDate(meeting.date);
            // Parse time string if it exists
            if (meeting.time) {
                const timeMatch = meeting.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (timeMatch) {
                    // Extract just the start time if it's a range
                    const timeParts = meeting.time.split(' - ');
                    setStartTime(timeParts[0]);
                    if (timeParts.length > 1) {
                        setEndTime(timeParts[1]);
                    }
                } else {
                    // Format time from date
                    const hours = meeting.date.getHours();
                    const minutes = meeting.date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const hour12 = hours % 12 || 12;
                    const minuteStr = minutes.toString().padStart(2, '0');
                    setStartTime(`${hour12}:${minuteStr} ${ampm}`);
                }
            } else {
                // Format time from date
                const hours = meeting.date.getHours();
                const minutes = meeting.date.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const hour12 = hours % 12 || 12;
                const minuteStr = minutes.toString().padStart(2, '0');
                setStartTime(`${hour12}:${minuteStr} ${ampm}`);
            }
            setEndDate(meeting.date);
            setEndTime('');
            setAssignedTo(meeting.attendees);
            setVenue(toVenue(meeting?.venue));
            setAddToCalendar(meeting.addToCalendar || false);
        }
    }, [isOpen, meeting]);

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

    const handleSubmit = () => {
        const errors = [];
        if (!title.trim()) errors.push('title');
        if (assignedTo.length === 0) errors.push('assignedTo');
        
        setValidationErrors(errors);

        if (errors.length > 0) return;

        // Format time string for meeting
        const timeString = startTime && endTime 
            ? `${startTime} - ${endTime}`
            : startTime 
                ? `${startTime} - ${formatTime(endDate)}`
                : `${formatTime(startDate)} - ${formatTime(endDate)}`;

        if (isEditMode && meeting && onUpdate) {
            // Update existing meeting
            const updatedMeeting: Meeting = {
                ...meeting,
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                date: startDate,
                time: timeString,
                attendees: assignedTo,
                venue,
                priority,
                addToCalendar,
                onlineMeet: meeting.onlineMeet,
            };
            onUpdate(updatedMeeting);
        } else {
            // Create new meeting
            onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                date: startDate,
                time: timeString,
                attendees: assignedTo,
                createdBy: mockUsers[0], // Current user
                attachments: [],
                venue,
                priority,
                addToCalendar,
            });
        }

        onClose();
    };

    return createPortal(
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
                        <h2 className="text-lg font-semibold text-white">{isEditMode ? 'Edit Meeting' : 'New Meeting'}</h2>
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
                <div className="bg-white mx-[15px] mb-[15px] rounded-[5px] p-[38px] overflow-y-auto max-h-[calc(100dvh-(64px+80px+6px+15px))]">
                    {/* Title */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <div className="w-[399px]">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (validationErrors.includes('title')) setValidationErrors(prev => prev.filter(err => err !== 'title'));
                                }}
                                placeholder="e.g. Q2 Sales Strategy Meeting"
                                className={cn("w-full rounded-[5px] border px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2", validationErrors.includes('title') ? "border-red-500 focus:ring-red-500/40" : "border-[#E6E6E6] focus:ring-[#2563EB]/40")}
                            />
                            {validationErrors.includes('title') && (
                                <p className="text-red-500 text-xs mt-1">Title is required.</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add agenda, talking points, or key discussion items..."
                            rows={4}
                            className="w-[399px] rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-none min-h-[105px]"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">
                            Date & Time <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-[10px]">
                            <div className="relative flex-1 max-w-[207px]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStartDatePickerOpen(!startDatePickerOpen);
                                        setEndDatePickerOpen(false);
                                    }}
                                    className="w-full rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between"
                                >
                                    <span>
                                        {startTime
                                            ? `${formatDate(startDate)}, ${startTime}`
                                            : `${formatDate(startDate)}, ${formatTime(startDate)}`}
                                    </span>
                                    <Calendar className="w-[18px] h-[18px] text-[#535352]" />
                                </button>
                                {startDatePickerOpen && (
                                    <div className="absolute top-full left-0 mt-2 z-10">
                                        <DateTimePicker
                                            selectedDate={startDate}
                                            onSet={(date) => {
                                                setStartDate(date);
                                                setStartTime(formatTime(date));
                                                setStartDatePickerOpen(false);
                                            }}
                                            onCancel={() => setStartDatePickerOpen(false)}
                                        />
                                    </div>
                                )}
                            </div>
                            <span className="text-[15px] font-semibold text-[#535352]">to</span>
                            <div className="relative flex-1 max-w-[207px]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEndDatePickerOpen(!endDatePickerOpen);
                                        setStartDatePickerOpen(false);
                                    }}
                                    className="w-full rounded-[5px] border border-[#E6E6E6] px-[10px] py-[10px] text-[15px] text-[#535352] text-left flex items-center justify-between"
                                >
                                    <span>
                                        {endTime
                                            ? `${formatDate(endDate)}, ${endTime}`
                                            : `${formatDate(endDate)}, ${formatTime(endDate)}`}
                                    </span>
                                    <Calendar className="w-[18px] h-[18px] text-[#535352]" />
                                </button>
                                {endDatePickerOpen && (
                                    <div className="absolute top-full left-0 mt-2 z-10">
                                        <DateTimePicker
                                            selectedDate={endDate}
                                            onSet={(date) => {
                                                setEndDate(date);
                                                setEndTime(formatTime(date));
                                                setEndDatePickerOpen(false);
                                            }}
                                            onCancel={() => setEndDatePickerOpen(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">
                            Assigned To <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col w-[399px]">
                            <div className={cn("flex flex-wrap gap-[7px] border rounded-[5px] px-[7px] py-[4px] min-h-[38px] w-full transition-colors duration-300", validationErrors.includes('assignedTo') ? "border-red-500" : "border-[#E6E6E6]")}>
                                {assignedTo.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-[5px] bg-white border border-[#E6E6E6] rounded-[3px] px-[5px] py-[3px]"
                                    >
                                        <img
                                            src={user.avatar || avatarPlaceholder}
                                            alt={user.name}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        <span className="text-[15px] font-medium text-black">{user.name.split(' ')[0]}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAssignedTo(assignedTo.filter((u) => u.id !== user.id))}
                                            className="cursor-pointer"
                                        >
                                            <X className="w-3 h-3 text-black" />
                                        </button>
                                    </div>
                                ))}
                                <select
                                    onChange={(e) => {
                                        const user = bootstrapData?.filterAssignedTo.find((u: AssignedToUser) => u.id.toString() === e.target.value);
                                        if (user && !assignedTo.find((u) => u.id === user.id.toString())) {
                                            setAssignedTo([...assignedTo, {
                                                id: user.id.toString(),
                                                name: user.name,
                                                position: user.designation,
                                                email: user.email,
                                                avatar: user.profileImageUrl || avatarPlaceholder
                                            }]);
                                            if (validationErrors.includes('assignedTo')) setValidationErrors(prev => prev.filter(err => err !== 'assignedTo'));
                                        }
                                        e.target.value = '';
                                    }}
                                    className="border-none outline-none text-[15px] text-[#535352] bg-transparent flex-1 min-w-[150px]"
                                    defaultValue=""
                                >
                                    <option value="">Select assignee(s)</option>
                                    {bootstrapData?.filterAssignedTo
                                        .filter((u: AssignedToUser) => !assignedTo.find((a) => a.id === u.id.toString()))
                                        .map((user: AssignedToUser) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            {validationErrors.includes('assignedTo') && (
                                <p className="text-red-500 text-xs mt-1">Assignment is required.</p>
                            )}
                        </div>
                    </div>

                    {/* Venue */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">
                            Venue <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-[10px]">
                            {(['N/A', 'Online', 'On-site'] as const).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setVenue(v as 'N/A' | 'Online' | 'On-site')}
                                    className="flex items-center gap-[5px] text-[15px] font-semibold transition"
                                >
                                    <div className="w-[19px] h-[19px] flex items-center justify-center shrink-0">
                                        {venue === v ? (
                                            <div className="w-[19px] h-[19px] rounded-full border-2 border-[#535352] bg-[#535352] flex items-center justify-center">
                                                <div className="w-[7px] h-[7px] rounded-full bg-white" />
                                            </div>
                                        ) : (
                                            <div className="w-[19px] h-[19px] rounded-full border-2 border-[#535352]" />
                                        )}
                                    </div>
                                    <span className={cn(venue === v ? 'text-[#535352]' : 'text-[#535352]')}>{v}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">Attachments</label>
                        <button
                            type="button"
                            className="border border-[#E6E6E6] rounded-[5px] px-[10px] py-[10px] w-[399px] flex items-center gap-[5px] cursor-pointer hover:bg-gray-50 transition"
                        >
                            <Paperclip className="w-[18px] h-[18px] text-[#535352]" />
                            <span className="text-[15px] font-normal text-[#535352]">Add Attachment(s)</span>
                        </button>
                    </div>

                    {/* Priority */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">
                            Priority <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-[10px]">
                            {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                                const colors = {
                                    high: 'bg-[#d93025]',
                                    medium: 'bg-[#ffb74d]',
                                    low: 'bg-green-600',
                                };
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={cn(
                                            'h-[31px] rounded-[25px] px-[20px] py-[5px] text-[14px] font-semibold text-white transition-all border-2 relative',
                                            priority === p
                                                ? `${colors[p]} border-transparent`
                                                : 'border-[#cacaca] bg-transparent text-black'
                                        )}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="mb-6">
                        <label className="text-[15px] font-semibold text-black mb-2 block">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-[10px]">
                            {(['todo', 'in-progress', 'completed'] as const).map((s) => {
                                const statusConfig = {
                                    todo: { bg: 'bg-[#232725]', text: 'To do', icon: List },
                                    'in-progress': { bg: 'bg-[#1e88e5]', text: 'In Progress', icon: Loader2 },
                                    completed: { bg: 'bg-[#607d8b]', text: 'Completed', icon: Check },
                                };
                                const config = statusConfig[s];
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={cn(
                                            'h-[28px] rounded-[25px] px-[20px] py-[5px] text-[14px] font-semibold text-white transition-all border-2 flex items-center gap-[5px]',
                                            status === s
                                                ? `${config.bg} border-transparent`
                                                : 'border-[#cacaca] bg-transparent text-black'
                                        )}
                                    >
                                        <Icon className="w-[20px] h-[20px]" />
                                        {config.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add to Calendar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between w-[399px]">
                            <label className="text-[15px] font-semibold text-black">Add to Calendar</label>
                            <button
                                type="button"
                                onClick={() => setAddToCalendar(!addToCalendar)}
                                className={cn(
                                    'relative w-[35.5px] h-[17.75px] rounded-full transition-colors duration-300 cursor-pointer',
                                    addToCalendar ? 'bg-[#008080]' : 'bg-gray-300'
                                )}
                            >
                                <span
                                    className={cn(
                                        'absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-transform duration-300',
                                        addToCalendar ? 'translate-x-5 left-0' : 'translate-x-1 left-0'
                                    )}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-5 mt-8">
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
                            className="bg-[#DE4A2C] rounded-full px-[25px] py-[10px] text-[14px] font-semibold text-white hover:bg-[#C62828] cursor-pointer transition w-[130px]"
                        >
                            {isEditMode ? 'Save' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateMeetingDrawer;
