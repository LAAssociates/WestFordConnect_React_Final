import React from 'react';
import FilterPopover, { type FilterState, type Person, type Department as PopoverDepartment, type Priority as PopoverPriority } from '../common/FilterPopover';
import type { TaskFilterState } from './types';
import type { MeetingInitialLoadResult } from '../../types/meeting';

interface TaskFilterProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onApply: (filters: TaskFilterState) => void;
    onReset: () => void;
    bootstrapData?: MeetingInitialLoadResult | null;
    initialFilters?: FilterState | null;
}

const TaskFilter: React.FC<TaskFilterProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onApply,
    onReset,
    bootstrapData,
    initialFilters,
}) => {
    const handleApply = (filters: FilterState) => {
        const taskFilters: TaskFilterState = {
            assignedTo: filters.assignedTo?.length ? filters.assignedTo : undefined,
            dateRange: filters.dateRange,
            createdBy: filters.createdBy?.length ? filters.createdBy : undefined,
            departments: filters.departments?.length ? filters.departments : undefined,
            priorities: filters.priorities?.length ? filters.priorities : undefined,
        };

        onApply(taskFilters);
    };

    const filterConfig = [
        { type: 'userSelection' as const, title: 'Assigned To', id: 'assignedTo' },
        { type: 'dateRange' as const, title: 'Due Date Range', id: 'dueDateRange' },
        { type: 'userSelection' as const, title: 'Created By', id: 'createdBy' },
        { type: 'departmentSelection' as const, title: 'Department', id: 'department' },
        { type: 'prioritySelection' as const, title: 'Priority', id: 'priority' },
    ];

    const mappedUsers = React.useMemo<Person[]>(() => {
        if (!bootstrapData?.filterAssignedTo) return [];
        return bootstrapData.filterAssignedTo.map(u => ({
            id: u.id.toString(),
            name: u.name,
            position: u.designation || 'User',
            email: u.email,
            avatar: u.profileImageUrl,
        }));
    }, [bootstrapData]);

    const mappedDepartments = React.useMemo<PopoverDepartment[]>(() => {
        if (!bootstrapData?.filterDepartments) return [];
        return bootstrapData.filterDepartments.map(d => ({
            id: d.id.toString(),
            name: d.name,
            count: d.staffCount,
        }));
    }, [bootstrapData]);

    const mappedPriorities = React.useMemo<PopoverPriority[]>(() => {
        if (!bootstrapData?.filterPriorities) return ['low', 'medium', 'high'];
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

export default TaskFilter;
