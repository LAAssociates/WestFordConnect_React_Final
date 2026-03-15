import React, { useMemo } from 'react';
import FilterPopover, { type FilterState, type Person, type Department as PopoverDepartment, type Priority as PopoverPriority } from '../common/FilterPopover';
import type { MeetingFilterState } from './types';
import type { MeetingInitialLoadResult } from '../../types/meeting';

interface MeetingFilterProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onApply: (filters: MeetingFilterState) => void;
    onReset: () => void;
    bootstrapData?: MeetingInitialLoadResult | null;
    initialFilters?: FilterState | null;
}

const MeetingFilter: React.FC<MeetingFilterProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onApply,
    onReset,
    bootstrapData,
    initialFilters,
}) => {
    const handleApply = (filters: FilterState) => {
        const meetingFilters: MeetingFilterState = {
            assignedTo: filters.assignedTo?.length ? filters.assignedTo : undefined,
            dateRange: filters.dateRange,
            createdBy: filters.createdBy?.length ? filters.createdBy : undefined,
            departments: filters.departments?.length ? filters.departments : undefined,
            priorities: filters.priorities?.length ? filters.priorities : undefined,
        };

        onApply(meetingFilters);
    };

    const filterConfig = [
        { type: 'userSelection' as const, title: 'Assigned To', id: 'assignedTo' },
        { type: 'dateRange' as const, title: 'Date & Time', id: 'dateTime' },
        { type: 'userSelection' as const, title: 'Created By', id: 'createdBy' },
        { type: 'departmentSelection' as const, title: 'Department', id: 'department' },
        { type: 'prioritySelection' as const, title: 'Priority', id: 'priority' },
    ];

    const mappedUsers = useMemo<Person[]>(() => {
        if (!bootstrapData?.filterAssignedTo) return [];
        return bootstrapData.filterAssignedTo.map(u => ({
            id: u.id.toString(),
            name: u.name,
            position: u.designation || 'User',
            email: u.email,
            avatar: u.profileImageUrl,
        }));
    }, [bootstrapData]);

    const mappedDepartments = useMemo<PopoverDepartment[]>(() => {
        if (!bootstrapData?.filterDepartments) return [];
        return bootstrapData.filterDepartments.map(d => ({
            id: d.id.toString(),
            name: d.name,
            count: d.staffCount,
        }));
    }, [bootstrapData]);

    const mappedPriorities = useMemo<PopoverPriority[]>(() => {
        if (!bootstrapData?.filterPriorities) return ['low', 'medium', 'high'];
        // Map API priorities to popover priority strings if possible, 
        // or just pass the descriptions if the popover supports them.
        // FilterPopover expects 'high' | 'medium' | 'low'.
        const priorityMap: Record<string, PopoverPriority> = {
            'High': 'high',
            'Medium': 'medium',
            'Low': 'low'
        };
        return bootstrapData.filterPriorities.map(p => priorityMap[p.description] || 'medium');
    }, [bootstrapData]);

    return (
        <FilterPopover
            isOpen={isOpen}
            onClose={onClose}
            triggerRef={triggerRef}
            onApply={handleApply}
            onReset={onReset}
            filterConfig={filterConfig}
            users={mappedUsers}
            departments={mappedDepartments}
            priorities={mappedPriorities}
            initialFilters={initialFilters || undefined}
        />
    );
};

export default MeetingFilter;
