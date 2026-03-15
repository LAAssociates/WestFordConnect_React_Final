export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'overdue';

export type TaskSortOption =
    | 'due-nearest-first'
    | 'due-latest-first'
    | 'priority-high-to-low'
    | 'priority-low-to-high'
    | 'recently-updated';

export interface User {
    id: string;
    name: string;
    position: string;
    email: string;
    avatar?: string;
}

export interface Attachment {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'xlsx' | 'pptx' | 'link' | 'google-docs' | 'google-slides';
    url?: string;
    file?: File; // Actual file object for upload
}

export interface Comment {
    id: string;
    text: string;
    author: User;
    createdAt: Date;
    likes: number;
    dislikes: number;
    userLiked?: boolean;
    userDisliked?: boolean;
    replies?: Comment[];
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: Date;
    dueTime?: string; // e.g., "11:00 AM", "EOD", "April 7"
    assignedTo: User | User[]; // Can be single user or multiple users
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
    attachments?: Attachment[];
    audienceCount?: number;
    commentCount?: number;
    comments?: Comment[];
    location?: string; // e.g., "in Mr. Hanil's office"
    department?: string;
    teamsLink?: string;
    venue?: string;
    addToCalendar?: boolean;
    showComments?: boolean;
}

export type MeetingStatus = 'todo' | 'in-progress' | 'completed' | 'overdue';

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    status: MeetingStatus;
    date: Date;
    time: string;
    location?: string;
    attendees: User[];
    createdBy: User;
    department?: string;
    priority?: Priority;
    onlineMeet?: 'Teams' | 'Gmeet';
    teamsLink?: string;
    attachments?: Attachment[];
    audienceCount?: number;
    commentCount?: number;
    comments?: Comment[];
    venue?: string;
    addToCalendar?: boolean;
}

export interface Lecture {
    id: string;
    level: string; // e.g., "Masters"
    program: string; // e.g., "Canterbury Christ Church University (CCCU)"
    module: string; // e.g., "Innovation, Entrepreneurship and the International Perspective (IEIP)"
    batchCode: string; // e.g., "IEIPRGRM2504A"
    scheduleDate: Date | null;
    scheduleTime: string; // e.g., "10:00 AM - 01:30 PM"
    days: string[]; // e.g., ["Tuesday", "Thursday", "Saturday"]
    venue: string; // e.g., "Al Taawun", "DeMont", "Sahara", "Online"
    mode: 'onsite' | 'online' | '';
    noOfSessions: number | null;
    noOfStudents: number | null;
    courseAdmin: string;
}

export interface Attendance {
    id: string;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    status: 'present' | 'absent' | 'late' | 'half-day';
}

export interface Proposal {
    id: string;
    title: string;
    description?: string;
    status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected';
    submittedDate?: Date;
    department?: string;
    createdBy: User;
}

export interface MIS {
    id: string;
    title: string;
    reportType: string;
    period: string;
    status: 'pending' | 'completed';
    dueDate: Date;
    createdBy: User;
}

export interface ExtraContribution {
    id: string;
    title: string;
    description?: string;
    type: string;
    date: Date;
    hours?: number;
    createdBy: User;
}

export interface TaskFilterState {
    assignedTo?: string[];
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    createdBy?: string[];
    departments?: string[];
    priorities?: Priority[];
}

export interface MeetingFilterState {
    assignedTo?: string[];
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    createdBy?: string[];
    departments?: string[];
    priorities?: Priority[];
}

export interface LectureFilterState {
    venue?: string[];
    module?: string[];
    batchCode?: string[];
    date?: Date;
    department?: string[];
}

export type TabType = 'tasks' | 'meetings' | 'lectures' | 'attendance' | 'proposals' | 'mis' | 'extra-contributions';
