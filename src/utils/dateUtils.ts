/**
 * Parses a UTC date string from the API.
 * The API returns dates like "2026-02-11T18:40:26.6166667" (without Z).
 * This function appends 'Z' to ensure it's treated as UTC.
 */
export const parseUTCDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    
    // If it doesn't have a timezone indicator, append Z
    if (!dateString.includes('Z') && !dateString.includes('+')) {
        return new Date(`${dateString}Z`);
    }
    
    return new Date(dateString);
};

/**
 * Formats a date to a local display string.
 * Example: "11:00 AM" or "Feb 11, 2026 06:40 PM"
 */
export const formatToLocalDisplay = (date: Date | string | null | undefined, includeDate: boolean = false): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return '';

    if (includeDate) {
        return dateObj.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Formats a date for the UI due date display.
 * Example: "12 Feb, 12:24 AM"
 */
export const formatDueDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return '';

    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const time = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return `${day} ${month}, ${time}`;
};

/**
 * Formats a date to an ISO string with timezone offset.
 * Example: "2026-02-23T11:47:40+05:30"
 */
export const formatToDateTimeOffset = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    
    // Get components as numbers
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const offsetHH = pad(Math.floor(Math.abs(tzo) / 60));
    const offsetMM = pad(Math.abs(tzo) % 60);

    return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}${dif}${offsetHH}:${offsetMM}`;
};

/**
 * Normalize a date string to ensure it can be parsed into a Date with a valid offset.
 * - If input is date-only (YYYY-MM-DD), append time 00:00:00 so it becomes a full timestamp.
 * - If input already includes time with offset or Z, return as-is.
 * - Returns null-like value if input is falsy.
 */
export const ensureDateTimeWithOffset = (value: string | null | undefined): string | null => {
  if (!value) return null;
  // If date-only, convert to full datetime at midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00`;
  }
  return value;
};
