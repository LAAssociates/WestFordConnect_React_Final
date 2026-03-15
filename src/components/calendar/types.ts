export interface CalendarEvent {
    id: string;
    type: 'task' | 'meeting' | 'lecture' | 'holiday' | 'birthday';
    title: string;
    startTime: Date;
    endTime: Date;
    isAllDay?: boolean;
    color: string;
    sourceEntityId?: number;
    sourceEntityType?: string;
    personName?: string;
    personPosition?: string;
    profileImageUrl?: string;
    department?: string;
    personEmail?: string;
    onClick?: () => void;
    searchTerm?: string;
}


export type ViewType = 'day' | 'week' | 'month';

export interface CalendarFilterState {
    eventTypes?: ('task' | 'meeting' | 'lecture' | 'holiday' | 'birthday')[];
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    assignedTo?: string[];
    createdBy?: string[];
    department?: string[];
    priority?: ('high' | 'medium' | 'low')[];
}

export interface Holiday {
    id: string;
    title: string;
    date: Date;
    description: string;
}

export interface Birthday {
    id: string;
    title: string;
    date: Date;
    person: {
        name: string;
        position: string;
        avatar?: string;
        email?: string;
    };
}
