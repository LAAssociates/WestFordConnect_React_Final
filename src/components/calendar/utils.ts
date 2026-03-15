/**
 * Shared utility functions for calendar components
 */

/**
 * Check if two dates are the same day
 */
export const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

/**
 * Get the week days (Sunday to Saturday) for a given date
 */
export const getWeekDays = (currentDate: Date): Date[] => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    const sunday = new Date(startOfWeek.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);
        days.push(date);
    }
    return days;
};

/**
 * Navigate to previous period based on view type
 */
export const getPreviousDate = (currentDate: Date, viewType: 'day' | 'week' | 'month'): Date => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
        newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === 'week') {
        newDate.setDate(newDate.getDate() - 7);
    } else {
        newDate.setMonth(newDate.getMonth() - 1);
    }
    return newDate;
};

/**
 * Navigate to next period based on view type
 */
export const getNextDate = (currentDate: Date, viewType: 'day' | 'week' | 'month'): Date => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
        newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === 'week') {
        newDate.setDate(newDate.getDate() + 7);
    } else {
        newDate.setMonth(newDate.getMonth() + 1);
    }
    return newDate;
};

/**
 * Format date for header display (e.g., "JAN - 2024")
 */
export const formatDateHeader = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase().replace(' ', ' - ');
};
