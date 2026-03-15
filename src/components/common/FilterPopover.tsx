import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Search,
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import avatarPlaceholder from '../../assets/images/default-group-icon.png';
import { MacScrollbar } from 'mac-scrollbar';
import AudienceDropdown, { type AudienceSelection, type IndividualUser, type ProjectGroup } from './AudienceDropdown';
import { getFileTypeIcon } from '../../utils/getFileTypeIcon';
export type FilterType = 'dateRange' | 'singleDate' | 'userSelection' | 'audienceSelection' | 'departmentSelection' | 'multiSelection' | 'prioritySelection' | 'venueSelection' | 'moduleSelection' | 'batchCodeSelection';

export type Priority = 'high' | 'medium' | 'low';

export interface FilterConfig {
    type: FilterType;
    title: string;
    id?: string; // Optional unique identifier for multiple instances of the same type
    showTimePicker?: boolean; // Optional flag to show/hide time picker for singleDate filters
    isSearchable?: boolean; // Optional flag to enable search functionality for multiSelection filters
    multiSelectionTitle?: string; // Optional title to display within the multiSelection filter content area
}

export interface Person {
    id: string;
    name: string;
    position: string;
    email: string;
    avatar?: string;
}

export interface Department {
    id: string;
    name: string;
    count: number;
    isSelected?: boolean;
}

interface FilterPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onApply: (filters: FilterState) => void;
    onReset: () => void;
    filterConfig?: FilterConfig[];
    labels?: {
        dateRange?: string;
        postedBy?: string;
        audience?: string;
    };
    // Custom data sources
    users?: Person[];
    departments?: Department[];
    priorities?: Priority[];
    venues?: string[];
    modules?: string[];
    batchCodes?: string[];
    fileTypes?: any[];
    projectGroups?: any[];
    initialFilters?: FilterState;
}

export interface FilterState {
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    singleDate?: Date;
    postedBy?: string[];
    assignedTo?: string[];
    createdBy?: string[];
    audience?: string[];
    departments?: string[];
    priorities?: Priority[];
    venues?: string[];
    modules?: string[];
    batchCodes?: string[];
    fileTypes?: string[];
    category?: string[];
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onApply,
    onReset,
    filterConfig,
    labels,
    users,
    departments,
    priorities = ['high', 'medium', 'low'],
    venues = [],
    modules = [],
    batchCodes = [],
    fileTypes = [],
    projectGroups: dynamicProjectGroups = [],
    initialFilters,
}) => {
    // Use provided users or fall back to empty array
    const peopleList = users || [];

    // Get filter configuration - use filterConfig if provided, otherwise derive from labels or use defaults
    const activeFilters = useMemo(() => {
        if (filterConfig && filterConfig.length > 0) {
            return filterConfig;
        }
        // Backward compatibility: derive from labels or use defaults
        const defaultConfig: FilterConfig[] = [];
        if (labels?.dateRange || !labels) {
            defaultConfig.push({ type: 'dateRange', title: labels?.dateRange ?? 'Date Range' });
        }
        if (labels?.postedBy || !labels) {
            defaultConfig.push({ type: 'userSelection', title: labels?.postedBy ?? 'Posted By' });
        }
        if (labels?.audience || !labels) {
            defaultConfig.push({ type: 'audienceSelection', title: labels?.audience ?? 'Audience' });
        }
        return defaultConfig;
    }, [filterConfig, labels]);

    // Helper to get unique key for each filter instance
    const getFilterKey = (filter: FilterConfig, index: number): string => {
        return filter.id || `${filter.type}-${index}`;
    };

    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Dynamic expand state for filters - keyed by filter instance
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        if (activeFilters.length > 0) {
            initial[getFilterKey(activeFilters[0], 0)] = true;
        }
        return initial;
    });

    const toggleFilter = (filterKey: string) => {
        setExpandedFilters((prev) => {
            const newState = { ...prev };
            if (prev[filterKey]) {
                newState[filterKey] = false;
            } else {
                // Close all others and open this one
                Object.keys(newState).forEach((key) => {
                    newState[key] = false;
                });
                newState[filterKey] = true;
            }
            return newState;
        });
    };

    // Date picker state
    const [dateRangeMode, setDateRangeMode] = useState<'from' | 'to'>('from');
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedHour, setSelectedHour] = useState(11);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [isAM, setIsAM] = useState(true);
    const [hourInput, setHourInput] = useState('11');
    const [minuteInput, setMinuteInput] = useState('00');
    const [hourFocused, setHourFocused] = useState(false);
    const [minuteFocused, setMinuteFocused] = useState(false);

    // Single date state
    const [singleDate, setSingleDate] = useState<Date | null>(null);
    const [singleDateCurrentMonth, setSingleDateCurrentMonth] = useState(new Date().getMonth());
    const [singleDateCurrentYear, setSingleDateCurrentYear] = useState(new Date().getFullYear());
    const [singleDateHour, setSingleDateHour] = useState(11);
    const [singleDateMinute, setSingleDateMinute] = useState(0);
    const [singleDateIsAM, setSingleDateIsAM] = useState(true);
    const [singleDateHourInput, setSingleDateHourInput] = useState('11');
    const [singleDateMinuteInput, setSingleDateMinuteInput] = useState('00');

    const [singleDateHourFocused, setSingleDateHourFocused] = useState(false);
    const [singleDateMinuteFocused, setSingleDateMinuteFocused] = useState(false);

    // People search state - per filter instance
    const [userSelectionState, setUserSelectionState] = useState<Record<string, { search: string; selected: string[] }>>({});

    // Audience state - per filter instance
    const [audienceSelectionState, setAudienceSelectionState] = useState<Record<string, {
        selectedAllStaff: boolean;
        selectedIndividuals: string[];
        selectedGroups: string[];
    }>>({});

    // Department state - per filter instance (for backward compatibility with TaskFilter)
    const [departmentSelectionState, setDepartmentSelectionState] = useState<Record<string, { selected: string[] }>>({});

    // MultiSelection state - per filter instance (unified for categories and file types)
    const [multiSelectionState, setMultiSelectionState] = useState<Record<string, { search?: string; selected: string[] }>>({});

    // Priority state - per filter instance
    const [prioritySelectionState, setPrioritySelectionState] = useState<Record<string, { selected: Priority[] }>>({});

    // Venue, Module, BatchCode state - per filter instance
    const [venueSelectionState, setVenueSelectionState] = useState<Record<string, { selected: string[] }>>({});
    const [moduleSelectionState, setModuleSelectionState] = useState<Record<string, { search: string; selected: string[] }>>({});
    const [batchCodeSelectionState, setBatchCodeSelectionState] = useState<Record<string, { search: string; selected: string[] }>>({});

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.currentTarget as HTMLImageElement;
        if (target.src !== avatarPlaceholder) {
            target.src = avatarPlaceholder;
        }
    };

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 419; // Width of the menu
        const triggerCenter = rect.left + rect.width / 2;
        let menuLeft = triggerCenter - menuWidth / 2;

        // Ensure menu stays within viewport bounds
        const padding = 10; // Padding from viewport edges
        const maxLeft = window.innerWidth - menuWidth - padding;
        const minLeft = padding;

        if (menuLeft < minLeft) {
            menuLeft = minLeft;
        } else if (menuLeft > maxLeft) {
            menuLeft = maxLeft;
        }

        setMenuPosition({
            top: rect.bottom + 10,
            left: menuLeft, // Center the menu relative to the trigger
        });
    }, [triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();

        const handleWindowChange = () => {
            updateMenuPosition();
        };

        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);

        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [isOpen, updateMenuPosition]);

    // Reset expanded state when filters change
    useEffect(() => {
        if (activeFilters.length > 0) {
            setExpandedFilters(() => {
                const newState: Record<string, boolean> = {};
                // Expand first filter by default
                newState[getFilterKey(activeFilters[0], 0)] = true;
                return newState;
            });
        }
    }, [activeFilters]);

    // Initialize departmentSelection from departments prop
    useEffect(() => {
        if (!departments || departments.length === 0) return;
        if (!isOpen) return;

        // Find all departmentSelection filters and initialize their state
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'departmentSelection') {
                const filterKey = getFilterKey(filter, index);

                // Only initialize if state is empty (not already set)
                setDepartmentSelectionState((prev) => {
                    const currentlySelected = prev[filterKey]?.selected || [];

                    // If already initialized, don't override
                    if (currentlySelected.length > 0) {
                        return prev;
                    }

                    // Initialize with pre-selected departments
                    const preSelected = departments
                        .filter((dept) => dept.isSelected === true)
                        .map((dept) => dept.id);

                    if (preSelected.length > 0) {
                        return {
                            ...prev,
                            [filterKey]: { selected: preSelected },
                        };
                    }

                    return prev;
                });
            }
        });
    }, [departments, activeFilters, isOpen]);

    // Initialize multiSelection from departments prop
    useEffect(() => {
        if (!departments || departments.length === 0) return;
        if (!isOpen) return;

        // Find all multiSelection filters with category id and initialize their state
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'multiSelection' && (filter.id === 'category' || !filter.id)) {
                const filterKey = getFilterKey(filter, index);

                // Only initialize if state is empty (not already set)
                setMultiSelectionState((prev) => {
                    const currentlySelected = prev[filterKey]?.selected || [];

                    // If already initialized, don't override
                    if (currentlySelected.length > 0) {
                        return prev;
                    }

                    // Initialize with pre-selected departments
                    const preSelected = departments
                        .filter((dept) => dept.isSelected === true)
                        .map((dept) => dept.id);

                    if (preSelected.length > 0) {
                        return {
                            ...prev,
                            [filterKey]: { selected: preSelected },
                        };
                    }

                    return prev;
                });
            }
        });
    }, [departments, activeFilters, isOpen]);

    // Rehydrate state from initialFilters when popover opens
    useEffect(() => {
        if (!isOpen) return;

        if (!initialFilters) {
            // Reset all internal states if initialFilters is null/cleared externally
            setFromDate(null);
            setToDate(null);
            setDateRangeMode('from');
            setSelectedDate(new Date());
            setSingleDate(null);
            setUserSelectionState({});
            setAudienceSelectionState({});
            setDepartmentSelectionState({});
            setMultiSelectionState({});
            setPrioritySelectionState({});
            setVenueSelectionState({});
            setModuleSelectionState({});
            setBatchCodeSelectionState({});
            setExpandedFilters(activeFilters.length > 0 ? { [getFilterKey(activeFilters[0], 0)]: true } : {});
            return;
        }

        // Rehydrate dateRange
        if (initialFilters.dateRange) {
            setFromDate(initialFilters.dateRange.from || null);
            setToDate(initialFilters.dateRange.to || null);
        }

        // Rehydrate singleDate
        if (initialFilters.singleDate) {
            setSingleDate(initialFilters.singleDate);
        }

        // Rehydrate various filter states based on activeFilters configuration
        activeFilters.forEach((filter, index) => {
            const filterKey = getFilterKey(filter, index);

            if (filter.type === 'audienceSelection') {
                if (initialFilters.audience && initialFilters.audience.length > 0) {
                    const selectedIndividuals: string[] = [];
                    const selectedGroups: string[] = [];
                    let selectedAllStaff = false;

                    initialFilters.audience.forEach(id => {
                        if (id === 'all-staff') {
                            selectedAllStaff = true;
                        } else if (id.startsWith('u-')) {
                            selectedIndividuals.push(id.substring(2));
                        } else if (id.startsWith('g-')) {
                            selectedGroups.push(id.substring(2));
                        }
                    });

                    setAudienceSelectionState(prev => ({
                        ...prev,
                        [filterKey]: {
                            selectedAllStaff,
                            selectedIndividuals,
                            selectedGroups
                        }
                    }));
                }
            } else if (filter.type === 'multiSelection') {
                const filterId = filter.id;
                let initialValues: string[] | undefined;

                if (filterId === 'category') initialValues = (initialFilters as any).category;
                else if (filterId === 'fileType') initialValues = (initialFilters as any).fileTypes;
                else if (filterId) initialValues = (initialFilters as any)[filterId];

                if (initialValues && Array.isArray(initialValues)) {
                    setMultiSelectionState(prev => ({
                        ...prev,
                        [filterKey]: { ...prev[filterKey], selected: initialValues!.map(String) }
                    }));
                }
            } else if (filter.type === 'userSelection') {
                const filterId = filter.id;
                let selected: string[] = [];
                if (filterId === 'createdBy' || filterId === 'created-by') selected = initialFilters.createdBy || [];
                else if (filterId === 'assignedTo' || filterId === 'assigned-to') selected = initialFilters.assignedTo || [];
                else if (filterId === 'postedBy') selected = initialFilters.postedBy || [];

                if (selected.length > 0) {
                    setUserSelectionState(prev => ({
                        ...prev,
                        [filterKey]: { ...prev[filterKey], selected: selected.map(String) }
                    }));
                }
            } else if (filter.type === 'prioritySelection') {
                if (initialFilters.priorities && initialFilters.priorities.length > 0) {
                    setPrioritySelectionState(prev => ({
                        ...prev,
                        [filterKey]: { selected: initialFilters.priorities || [] }
                    }));
                }
            } else if (filter.type === 'departmentSelection') {
                if (initialFilters.departments && initialFilters.departments.length > 0) {
                    setDepartmentSelectionState(prev => ({
                        ...prev,
                        [filterKey]: { selected: initialFilters.departments || [] }
                    }));
                }
            } else if (filter.type === 'venueSelection') {
                if (initialFilters.venues && initialFilters.venues.length > 0) {
                    setVenueSelectionState(prev => ({
                        ...prev,
                        [filterKey]: { selected: initialFilters.venues || [] }
                    }));
                }
            } else if (filter.type === 'moduleSelection') {
                if (initialFilters.modules && initialFilters.modules.length > 0) {
                    setModuleSelectionState(prev => ({
                        ...prev,
                        [filterKey]: { ...prev[filterKey], selected: initialFilters.modules || [] }
                    }));
                }
            } else if (filter.type === 'batchCodeSelection') {
                if (initialFilters.batchCodes && initialFilters.batchCodes.length > 0) {
                    setBatchCodeSelectionState(prev => ({
                        ...prev,
                        [filterKey]: { ...prev[filterKey], selected: initialFilters.batchCodes || [] }
                    }));
                }
            }
        });
    }, [isOpen, initialFilters, activeFilters]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, triggerRef]);

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        // Set the time from the current time picker values
        const hours24 = isAM ? (selectedHour === 12 ? 0 : selectedHour) : (selectedHour === 12 ? 12 : selectedHour + 12);
        newDate.setHours(hours24, selectedMinute, 0, 0);
        setSelectedDate(newDate);

        if (dateRangeMode === 'from') {
            setFromDate(newDate);
            // Automatically switch to 'to' mode after selecting 'from'
            setDateRangeMode('to');
            // Update calendar to show the selected date
            setCurrentMonth(newDate.getMonth());
            setCurrentYear(newDate.getFullYear());
        } else {
            // In 'to' mode, ensure the selected date is not before 'from' date
            if (fromDate && newDate < fromDate) {
                // If selected date is before from date, set it to the same as from date
                setToDate(new Date(fromDate));
            } else {
                setToDate(newDate);
            }
        }
    };

    // Sync calendar view and time picker with the active date selection
    useEffect(() => {
        const activeDate = dateRangeMode === 'from' ? fromDate : toDate;
        if (activeDate) {
            setCurrentMonth(activeDate.getMonth());
            setCurrentYear(activeDate.getFullYear());
            setSelectedDate(activeDate);
            // Sync time picker with the active date
            const hours = activeDate.getHours();
            const minutes = activeDate.getMinutes();
            setSelectedMinute(minutes);
            let hour12: number;
            if (hours === 0) {
                hour12 = 12;
                setIsAM(true);
            } else if (hours === 12) {
                hour12 = 12;
                setIsAM(false);
            } else if (hours < 12) {
                hour12 = hours;
                setIsAM(true);
            } else {
                hour12 = hours - 12;
                setIsAM(false);
            }
            setSelectedHour(hour12);
            setHourInput(String(hour12).padStart(2, '0'));
            setMinuteInput(String(minutes).padStart(2, '0'));
        } else {
            // If in 'to' mode and no toDate, show fromDate's month/year if fromDate exists
            if (dateRangeMode === 'to' && fromDate) {
                setCurrentMonth(fromDate.getMonth());
                setCurrentYear(fromDate.getFullYear());
                setSelectedDate(new Date(fromDate));
            } else {
                // Reset to default if no date is selected
                const now = new Date();
                setCurrentMonth(now.getMonth());
                setCurrentYear(now.getFullYear());
                setSelectedDate(now);
            }
        }
    }, [dateRangeMode, fromDate, toDate]);

    const handlePreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Single date handlers
    const handleSingleDateSelect = (day: number, useTimePicker: boolean = false) => {
        const newDate = new Date(singleDateCurrentYear, singleDateCurrentMonth, day);
        if (useTimePicker) {
            // Set the time from the current time picker values
            const hours24 = singleDateIsAM ? (singleDateHour === 12 ? 0 : singleDateHour) : (singleDateHour === 12 ? 12 : singleDateHour + 12);
            newDate.setHours(hours24, singleDateMinute, 0, 0);
        } else {
            // Set to start of day when time picker is not enabled
            newDate.setHours(0, 0, 0, 0);
        }
        setSingleDate(newDate);
    };

    const handleSingleDatePreviousMonth = () => {
        if (singleDateCurrentMonth === 0) {
            setSingleDateCurrentMonth(11);
            setSingleDateCurrentYear(singleDateCurrentYear - 1);
        } else {
            setSingleDateCurrentMonth(singleDateCurrentMonth - 1);
        }
    };

    const handleSingleDateNextMonth = () => {
        if (singleDateCurrentMonth === 11) {
            setSingleDateCurrentMonth(0);
            setSingleDateCurrentYear(singleDateCurrentYear + 1);
        } else {
            setSingleDateCurrentMonth(singleDateCurrentMonth + 1);
        }
    };

    // Sync single date calendar view and time picker with selected date
    useEffect(() => {
        if (singleDate) {
            setSingleDateCurrentMonth(singleDate.getMonth());
            setSingleDateCurrentYear(singleDate.getFullYear());
            // Sync time picker with the selected date
            const hours = singleDate.getHours();
            const minutes = singleDate.getMinutes();
            setSingleDateMinute(minutes);
            let hour12: number;
            if (hours === 0) {
                hour12 = 12;
                setSingleDateIsAM(true);
            } else if (hours === 12) {
                hour12 = 12;
                setSingleDateIsAM(false);
            } else if (hours < 12) {
                hour12 = hours;
                setSingleDateIsAM(true);
            } else {
                hour12 = hours - 12;
                setSingleDateIsAM(false);
            }
            setSingleDateHour(hour12);
            setSingleDateHourInput(String(hour12).padStart(2, '0'));
            setSingleDateMinuteInput(String(minutes).padStart(2, '0'));
        }
    }, [singleDate]);

    const handleSingleDateTimeChange = (type: 'hour' | 'minute', delta: number) => {
        if (type === 'hour') {
            setSingleDateHour((prev) => {
                const newHour = prev + delta;
                const clampedHour = Math.max(1, Math.min(12, newHour));
                setSingleDateHourInput(String(clampedHour).padStart(2, '0'));
                updateSingleDateWithTime(clampedHour, singleDateMinute, singleDateIsAM);
                return clampedHour;
            });
        } else {
            setSingleDateMinute((prev) => {
                const newMinute = prev + delta;
                const clampedMinute = Math.max(0, Math.min(59, newMinute));
                setSingleDateMinuteInput(String(clampedMinute).padStart(2, '0'));
                updateSingleDateWithTime(singleDateHour, clampedMinute, singleDateIsAM);
                return clampedMinute;
            });
        }
    };

    const updateSingleDateWithTime = (hour: number, minute: number, am: boolean) => {
        if (singleDate) {
            const hours24 = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
            const updatedDate = new Date(singleDate);
            updatedDate.setHours(hours24, minute, 0, 0);
            setSingleDate(updatedDate);
        } else {
            // If no date is selected, create a new date with the time
            const now = new Date();
            const hours24 = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
            const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            newDate.setHours(hours24, minute, 0, 0);
            setSingleDate(newDate);
            setSingleDateCurrentMonth(now.getMonth());
            setSingleDateCurrentYear(now.getFullYear());
        }
    };

    const handleSingleDateAMPMToggle = (am: boolean) => {
        setSingleDateIsAM(am);
        updateSingleDateWithTime(singleDateHour, singleDateMinute, am);
    };

    const handleSingleDateHourInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setSingleDateHourInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 1 && num <= 12) {
                setSingleDateHour(num);
                updateSingleDateWithTime(num, singleDateMinute, singleDateIsAM);
            }
        }
    };

    const handleSingleDateHourInputBlur = () => {
        setSingleDateHourFocused(false);
        const num = parseInt(singleDateHourInput, 10);
        if (isNaN(num) || num < 1 || num > 12) {
            setSingleDateHourInput(String(singleDateHour).padStart(2, '0'));
        } else {
            setSingleDateHourInput(String(num).padStart(2, '0'));
            setSingleDateHour(num);
            updateSingleDateWithTime(num, singleDateMinute, singleDateIsAM);
        }
    };

    const handleSingleDateMinuteInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setSingleDateMinuteInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 0 && num <= 59) {
                setSingleDateMinute(num);
                updateSingleDateWithTime(singleDateHour, num, singleDateIsAM);
            }
        }
    };

    const handleSingleDateMinuteInputBlur = () => {
        setSingleDateMinuteFocused(false);
        const num = parseInt(singleDateMinuteInput, 10);
        if (isNaN(num) || num < 0 || num > 59) {
            setSingleDateMinuteInput(String(singleDateMinute).padStart(2, '0'));
        } else {
            setSingleDateMinuteInput(String(num).padStart(2, '0'));
            setSingleDateMinute(num);
            updateSingleDateWithTime(singleDateHour, num, singleDateIsAM);
        }
    };

    useEffect(() => {
        if (!singleDateHourFocused) {
            setSingleDateHourInput(String(singleDateHour).padStart(2, '0'));
        }
    }, [singleDateHour, singleDateHourFocused]);

    useEffect(() => {
        if (!singleDateMinuteFocused) {
            setSingleDateMinuteInput(String(singleDateMinute).padStart(2, '0'));
        }
    }, [singleDateMinute, singleDateMinuteFocused]);

    const handleTimeChange = (type: 'hour' | 'minute', delta: number) => {
        if (type === 'hour') {
            setSelectedHour((prev) => {
                const newHour = prev + delta;
                const clampedHour = Math.max(1, Math.min(12, newHour));
                setHourInput(String(clampedHour).padStart(2, '0'));
                // Update the active date with new time
                updateActiveDateWithTime(clampedHour, selectedMinute, isAM);
                return clampedHour;
            });
        } else {
            setSelectedMinute((prev) => {
                const newMinute = prev + delta;
                const clampedMinute = Math.max(0, Math.min(59, newMinute));
                setMinuteInput(String(clampedMinute).padStart(2, '0'));
                // Update the active date with new time
                updateActiveDateWithTime(selectedHour, clampedMinute, isAM);
                return clampedMinute;
            });
        }
    };

    const updateActiveDateWithTime = (hour: number, minute: number, am: boolean) => {
        const activeDate = dateRangeMode === 'from' ? fromDate : toDate;
        if (activeDate) {
            const hours24 = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
            const updatedDate = new Date(activeDate);
            updatedDate.setHours(hours24, minute, 0, 0);

            if (dateRangeMode === 'from') {
                setFromDate(updatedDate);
            } else {
                setToDate(updatedDate);
            }
            setSelectedDate(updatedDate);
        }
    };

    const handleAMPMToggle = (am: boolean) => {
        setIsAM(am);
        updateActiveDateWithTime(selectedHour, selectedMinute, am);
    };

    const handleHourInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setHourInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 1 && num <= 12) {
                setSelectedHour(num);
                updateActiveDateWithTime(num, selectedMinute, isAM);
            }
        }
    };

    const handleHourInputBlur = () => {
        setHourFocused(false);
        const num = parseInt(hourInput, 10);
        if (isNaN(num) || num < 1 || num > 12) {
            setHourInput(String(selectedHour).padStart(2, '0'));
        } else {
            setHourInput(String(num).padStart(2, '0'));
            setSelectedHour(num);
            updateActiveDateWithTime(num, selectedMinute, isAM);
        }
    };

    const handleMinuteInputChange = (value: string) => {
        if (value === '' || /^\d{1,2}$/.test(value)) {
            setMinuteInput(value);
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 0 && num <= 59) {
                setSelectedMinute(num);
                updateActiveDateWithTime(selectedHour, num, isAM);
            }
        }
    };

    const handleMinuteInputBlur = () => {
        setMinuteFocused(false);
        const num = parseInt(minuteInput, 10);
        if (isNaN(num) || num < 0 || num > 59) {
            setMinuteInput(String(selectedMinute).padStart(2, '0'));
        } else {
            setMinuteInput(String(num).padStart(2, '0'));
            setSelectedMinute(num);
            updateActiveDateWithTime(selectedHour, num, isAM);
        }
    };

    useEffect(() => {
        if (!hourFocused) {
            setHourInput(String(selectedHour).padStart(2, '0'));
        }
    }, [selectedHour, hourFocused]);

    useEffect(() => {
        if (!minuteFocused) {
            setMinuteInput(String(selectedMinute).padStart(2, '0'));
        }
    }, [selectedMinute, minuteFocused]);

    // Filter people based on search - per filter instance
    const getFilteredCreatedBy = (filterKey: string) => {
        const state = userSelectionState[filterKey] || { search: '', selected: [] };
        if (!state.search.trim()) {
            return peopleList;
        }
        const query = state.search.trim().toLowerCase();
        return peopleList.filter((person) => {
            return (
                person.name.toLowerCase().includes(query) ||
                person.email.toLowerCase().includes(query) ||
                person.position.toLowerCase().includes(query)
            );
        });
    };

    const toggleCreatedBySelection = (filterKey: string, personId: string) => {
        setUserSelectionState((prev) => {
            const current = prev[filterKey] || { search: '', selected: [] };
            const newSelected = current.selected.includes(personId)
                ? current.selected.filter((id) => id !== personId)
                : [...current.selected, personId];
            return {
                ...prev,
                [filterKey]: { ...current, selected: newSelected },
            };
        });
    };

    const toggleDepartmentSelection = (filterKey: string, departmentId: string) => {
        setDepartmentSelectionState((prev) => {
            const current = prev[filterKey] || { selected: [] };
            const newSelected = current.selected.includes(departmentId)
                ? current.selected.filter((id) => id !== departmentId)
                : [...current.selected, departmentId];
            return {
                ...prev,
                [filterKey]: { selected: newSelected },
            };
        });
    };

    const toggleMultiSelection = (filterKey: string, itemId: string) => {
        setMultiSelectionState((prev) => {
            const current = prev[filterKey] || { selected: [] };
            const newSelected = current.selected.includes(itemId)
                ? current.selected.filter((id) => id !== itemId)
                : [...current.selected, itemId];
            return {
                ...prev,
                [filterKey]: { ...current, selected: newSelected },
            };
        });
    };

    const togglePrioritySelection = (filterKey: string, priority: Priority) => {
        setPrioritySelectionState((prev) => {
            const current = prev[filterKey] || { selected: [] };
            const newSelected = current.selected.includes(priority)
                ? current.selected.filter((p) => p !== priority)
                : [...current.selected, priority];
            return {
                ...prev,
                [filterKey]: { selected: newSelected },
            };
        });
    };

    const toggleVenueSelection = (filterKey: string, venue: string) => {
        setVenueSelectionState((prev) => {
            const current = prev[filterKey] || { selected: [] };
            const newSelected = current.selected.includes(venue)
                ? current.selected.filter((v) => v !== venue)
                : [...current.selected, venue];
            return {
                ...prev,
                [filterKey]: { selected: newSelected },
            };
        });
    };

    const toggleModuleSelection = (filterKey: string, module: string) => {
        setModuleSelectionState((prev) => {
            const current = prev[filterKey] || { search: '', selected: [] };
            const newSelected = current.selected.includes(module)
                ? current.selected.filter((m) => m !== module)
                : [...current.selected, module];
            return {
                ...prev,
                [filterKey]: { ...current, selected: newSelected },
            };
        });
    };

    const toggleBatchCodeSelection = (filterKey: string, batchCode: string) => {
        setBatchCodeSelectionState((prev) => {
            const current = prev[filterKey] || { search: '', selected: [] };
            const newSelected = current.selected.includes(batchCode)
                ? current.selected.filter((b) => b !== batchCode)
                : [...current.selected, batchCode];
            return {
                ...prev,
                [filterKey]: { ...current, selected: newSelected },
            };
        });
    };


    const handleFilterReset = () => {
        // Reset Date Range
        setFromDate(null);
        setToDate(null);
        setDateRangeMode('from');
        setSelectedDate(new Date());
        setCurrentMonth(new Date().getMonth());
        setCurrentYear(new Date().getFullYear());
        setSelectedHour(11);
        setSelectedMinute(0);
        setIsAM(true);
        setHourInput('11');
        setMinuteInput('00');
        
        // Reset Single Date
        setSingleDate(null);
        const now = new Date();
        setSingleDateCurrentMonth(now.getMonth());
        setSingleDateCurrentYear(now.getFullYear());
        setSingleDateHour(11);
        setSingleDateMinute(0);
        setSingleDateIsAM(true);
        setSingleDateHourInput('11');
        setSingleDateMinuteInput('00');

        // Reset Selections
        setUserSelectionState({});
        setAudienceSelectionState({});
        setDepartmentSelectionState({});
        setMultiSelectionState({});
        setPrioritySelectionState({});
        setVenueSelectionState({});
        setModuleSelectionState({});
        setBatchCodeSelectionState({});

        // Clear all expanded filters except first
        if (activeFilters.length > 0) {
            setExpandedFilters({ [getFilterKey(activeFilters[0], 0)]: true });
        } else {
            setExpandedFilters({});
        }

        onReset();
    };

    // Unified handleFilterApply
    const handleFilterApply = () => {
        const filters: FilterState = {
            dateRange: {},
        };

        // Update the active date with current time picker values before applying
        updateActiveDateWithTime(selectedHour, selectedMinute, isAM);

        // Add from date if available (already includes time)
        if (fromDate) {
            filters.dateRange!.from = new Date(fromDate);
        }

        // Add to date if available (already includes time)
        if (toDate) {
            filters.dateRange!.to = new Date(toDate);
        }

        // Add single date if available
        // Check if time picker is enabled for single date filter
        const singleDateFilter = activeFilters.find(f => f.type === 'singleDate');
        const useTimePicker = singleDateFilter?.showTimePicker ?? false;

        if (singleDate) {
            if (useTimePicker) {
                // Update with current time picker values
                updateSingleDateWithTime(singleDateHour, singleDateMinute, singleDateIsAM);
            }
            filters.singleDate = new Date(singleDate);
        }

        // Collect all userSelection filter selections
        // Use filter ID to determine which field to populate
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'userSelection') {
                const filterKey = getFilterKey(filter, index);
                const state = userSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    const filterId = filter.id || filterKey;
                    if (filterId === 'assignedTo' || filterId === 'assigned-to' || filterId.includes('assignedTo')) {
                        filters.assignedTo = state.selected;
                    } else if (filterId === 'createdBy' || filterId === 'created-by' || filterId.includes('createdBy')) {
                        filters.createdBy = state.selected;
                    } else {
                        // Default to postedBy for backward compatibility
                        filters.postedBy = state.selected;
                    }
                }
            }
        });

        // Collect all audienceSelection filter selections
        const allAudienceIds: string[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'audienceSelection') {
                const filterKey = getFilterKey(filter, index);
                const state = audienceSelectionState[filterKey];
                if (state) {
                    if (state.selectedAllStaff) {
                        allAudienceIds.push('all-staff');
                    }
                    if (state.selectedIndividuals.length > 0) {
                        allAudienceIds.push(...state.selectedIndividuals.map(id => `u-${id}`));
                    }
                    if (state.selectedGroups.length > 0) {
                        allAudienceIds.push(...state.selectedGroups.map(id => `g-${id}`));
                    }
                }
            }
        });
        if (allAudienceIds.length > 0) {
            filters.audience = allAudienceIds;
        }

        // Collect all departmentSelection filter selections
        const allDepartmentIds: string[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'departmentSelection') {
                const filterKey = getFilterKey(filter, index);
                const state = departmentSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allDepartmentIds.push(...state.selected);
                }
            }
            // Also collect from multiSelection filters with category id
            if (filter.type === 'multiSelection' && (filter.id === 'category' || !filter.id)) {
                const filterKey = getFilterKey(filter, index);
                const state = multiSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allDepartmentIds.push(...state.selected);
                    filters.category = state.selected;
                }
            }
        });
        if (allDepartmentIds.length > 0) {
            filters.departments = allDepartmentIds;
        }

        // Collect all prioritySelection filter selections
        const allPrioritySelections: Priority[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'prioritySelection') {
                const filterKey = getFilterKey(filter, index);
                const state = prioritySelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allPrioritySelections.push(...state.selected);
                }
            }
        });
        if (allPrioritySelections.length > 0) {
            filters.priorities = allPrioritySelections;
        }

        // Collect all venueSelection filter selections
        const allVenueSelections: string[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'venueSelection') {
                const filterKey = getFilterKey(filter, index);
                const state = venueSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allVenueSelections.push(...state.selected);
                }
            }
        });
        if (allVenueSelections.length > 0) {
            filters.venues = allVenueSelections;
        }

        // Collect all moduleSelection filter selections
        const allModuleSelections: string[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'moduleSelection') {
                const filterKey = getFilterKey(filter, index);
                const state = moduleSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allModuleSelections.push(...state.selected);
                }
            }
        });
        if (allModuleSelections.length > 0) {
            filters.modules = allModuleSelections;
        }

        // Collect all batchCodeSelection filter selections
        const allBatchCodeSelections: string[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'batchCodeSelection') {
                const filterKey = getFilterKey(filter, index);
                const state = batchCodeSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allBatchCodeSelections.push(...state.selected);
                }
            }
        });
        if (allBatchCodeSelections.length > 0) {
            filters.batchCodes = allBatchCodeSelections;
        }

        // Collect all multiSelection filter selections for file types
        const allFileTypeSelections: string[] = [];
        activeFilters.forEach((filter, index) => {
            if (filter.type === 'multiSelection' && filter.id === 'fileType') {
                const filterKey = getFilterKey(filter, index);
                const state = multiSelectionState[filterKey];
                if (state && state.selected.length > 0) {
                    allFileTypeSelections.push(...state.selected);
                }
            }
        });
        if (allFileTypeSelections.length > 0) {
            filters.fileTypes = allFileTypeSelections;
        }

        onApply(filters);
        onClose();
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    // Render functions for each filter type
    const renderDateRangeFilter = () => {
        return (
            <div className="bg-[#232725] rounded-[10px]">
                {/* From and To Labels */}
                <div className="px-4 mb-[15px]">
                    {dateRangeMode === 'from' && (
                        <p className="text-[14px] font-semibold text-white">From:</p>
                    )}
                    {dateRangeMode === 'to' && (
                        <p className="text-[14px] font-semibold text-white">To:</p>
                    )}
                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-[20px] px-[65px]">
                    <button
                        type="button"
                        onClick={handlePreviousMonth}
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5 text-[#9A9A9A]" />
                    </button>
                    <p className="text-[14px] font-semibold text-white">
                        {monthNames[currentMonth]}, {currentYear}
                    </p>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer"
                    >
                        <ChevronRight className="w-5 h-5 text-[#9A9A9A]" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0 mb-[10px] px-[47px]">
                    {dayNames.map((day) => (
                        <div key={day} className="text-[12px] font-semibold text-white text-center py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-2.5 gap-x-6 px-[47px]">
                    {days.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="h-[30px]" />;
                        }

                        const isSelected =
                            day === selectedDate.getDate() &&
                            currentMonth === selectedDate.getMonth() &&
                            currentYear === selectedDate.getFullYear();

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDateSelect(day)}
                                className={cn(
                                    'cursor-pointer h-6 w-6 rounded-full text-[12px] font-medium text-white hover:bg-[#2F3432] transition-colors',
                                    isSelected && '!bg-[#008080]'
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="h-px bg-[#535352] w-full my-[20px]" />

                {/* Time Picker */}
                <div className="flex items-center gap-[5px] ps-[47px]">
                    {/* Clock Icon */}
                    <div className="w-[20px] h-[20px] me-[5px]">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM9.5 5H10.5V10.25L14.5 12.33L13.83 13.25L9.5 10.75V5Z"
                                fill="white"
                            />
                        </svg>
                    </div>

                    {/* Time Input */}
                    <div className="flex items-center gap-[5px] border border-[#535352] rounded-[5px] px-[10px] py-[5px]">
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
                        <div className="flex flex-col h-[24px]">
                            <button
                                type="button"
                                onClick={() => {
                                    if (minuteFocused) {
                                        handleTimeChange('minute', 1);
                                    } else {
                                        handleTimeChange('hour', 1);
                                    }
                                }}
                                className="w-[12px] h-[12px] flex items-center justify-center cursor-pointer shrink-0"
                                aria-label="Increase"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                                    <path d="M0.264138 6.73232C0.433317 6.90372 0.662742 7 0.901961 7C1.14118 7 1.37061 6.90372 1.53978 6.73232L6.00545 2.2068L10.4711 6.73232C10.6413 6.89886 10.8691 6.99101 11.1057 6.98893C11.3422 6.98684 11.5685 6.89069 11.7358 6.72118C11.903 6.55167 11.9979 6.32237 12 6.08266C12.002 5.84295 11.9111 5.612 11.7468 5.43958L6.64327 0.267679C6.47409 0.0962842 6.24467 0 6.00545 0C5.76623 0 5.5368 0.0962842 5.36762 0.267679L0.264138 5.43958C0.0950107 5.61102 0 5.84352 0 6.08595C0 6.32837 0.0950107 6.56087 0.264138 6.73232Z" fill="#9A9A9A" />
                                </svg>
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
                                className="w-[12px] h-[12px] flex items-center justify-center cursor-pointer shrink-0"
                                aria-label="Decrease"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                                    <path d="M0.264138 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899076 11.1057 0.0110741C11.3422 0.0131569 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.67763 12 0.917343C12.002 1.15705 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264138 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671627 0.0950107 0.439126 0.264138 0.267679Z" fill="#9A9A9A" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* AM/PM Toggle Switch */}
                    <div className="relative flex gap-[5px] border border-[#535352] rounded-[5px] p-[5px] bg-[#232725]">
                        {/* Sliding indicator */}
                        <div
                            className={cn(
                                'absolute top-[5px] bottom-[5px] w-[28px] bg-teal rounded-[2px] transition-all duration-300 ease-in-out',
                                isAM ? 'left-[5px]' : 'left-[33px]'
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => handleAMPMToggle(true)}
                            className={cn(
                                'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                                isAM && 'bg-[#008080]'
                            )}
                        >
                            AM
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAMPMToggle(false)}
                            className={cn(
                                'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                                !isAM && 'bg-[#008080]'
                            )}
                        >
                            PM
                        </button>
                    </div>
                </div>

            </div >
        );
    };

    const renderSingleDateFilter = (showTimePicker: boolean = false) => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        const daysInMonth = getDaysInMonth(singleDateCurrentMonth, singleDateCurrentYear);
        const firstDay = getFirstDayOfMonth(singleDateCurrentMonth, singleDateCurrentYear);
        const days: (number | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return (
            <div className="bg-[#232725] rounded-[10px]">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-[20px] px-[65px]">
                    <button
                        type="button"
                        onClick={handleSingleDatePreviousMonth}
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5 text-[#9A9A9A]" />
                    </button>
                    <p className="text-[14px] font-semibold text-white">
                        {monthNames[singleDateCurrentMonth]}, {singleDateCurrentYear}
                    </p>
                    <button
                        type="button"
                        onClick={handleSingleDateNextMonth}
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer"
                    >
                        <ChevronRight className="w-5 h-5 text-[#9A9A9A]" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0 mb-[10px] px-[47px]">
                    {dayNames.map((day) => (
                        <div key={day} className="text-[12px] font-semibold text-white text-center py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-2.5 gap-x-6 px-[47px]">
                    {days.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="h-[30px]" />;
                        }

                        const isSelected =
                            singleDate !== null &&
                            day === singleDate.getDate() &&
                            singleDateCurrentMonth === singleDate.getMonth() &&
                            singleDateCurrentYear === singleDate.getFullYear();

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleSingleDateSelect(day, showTimePicker)}
                                className={cn(
                                    'cursor-pointer h-6 w-6 rounded-full text-[12px] font-medium text-white hover:bg-[#2F3432] transition-colors',
                                    isSelected && '!bg-[#008080]'
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                {/* Time Picker - Only show if enabled */}
                {showTimePicker && (
                    <>
                        {/* Divider */}
                        <div className="h-px bg-[#535352] w-full my-[20px]" />

                        {/* Time Picker */}
                        <div className="flex items-center gap-[5px] ps-[47px]">
                            {/* Clock Icon */}
                            <div className="w-[20px] h-[20px] me-[5px]">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM9.5 5H10.5V10.25L14.5 12.33L13.83 13.25L9.5 10.75V5Z"
                                        fill="white"
                                    />
                                </svg>
                            </div>

                            {/* Time Input */}
                            <div className="flex items-center gap-[5px] border border-[#535352] rounded-[5px] px-[10px] py-[5px]">
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        data-single-date-hour-input
                                        value={singleDateHourInput}
                                        onChange={(e) => handleSingleDateHourInputChange(e.target.value)}
                                        onFocus={() => setSingleDateHourFocused(true)}
                                        onBlur={handleSingleDateHourInputBlur}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                handleSingleDateTimeChange('hour', 1);
                                            } else if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                handleSingleDateTimeChange('hour', -1);
                                            } else if (e.key === 'Tab' && !e.shiftKey) {
                                                e.preventDefault();
                                                const minuteInputEl = document.querySelector('[data-single-date-minute-input]') as HTMLInputElement;
                                                minuteInputEl?.focus();
                                            }
                                        }}
                                        className="bg-transparent text-[14px] font-medium text-white w-[20px] outline-none text-center border-none p-0 cursor-text"
                                        maxLength={2}
                                    />
                                    <span className="text-[14px] font-medium text-white">:</span>
                                    <input
                                        type="text"
                                        data-single-date-minute-input
                                        value={singleDateMinuteInput}
                                        onChange={(e) => handleSingleDateMinuteInputChange(e.target.value)}
                                        onFocus={() => setSingleDateMinuteFocused(true)}
                                        onBlur={handleSingleDateMinuteInputBlur}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                handleSingleDateTimeChange('minute', 1);
                                            } else if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                handleSingleDateTimeChange('minute', -1);
                                            } else if (e.key === 'Tab' && e.shiftKey) {
                                                e.preventDefault();
                                                const hourInputEl = document.querySelector('[data-single-date-hour-input]') as HTMLInputElement;
                                                hourInputEl?.focus();
                                            }
                                        }}
                                        className="bg-transparent text-[14px] font-medium text-white w-[20px] outline-none text-center border-none p-0 cursor-text"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="flex flex-col h-[24px]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (singleDateMinuteFocused) {
                                                handleSingleDateTimeChange('minute', 1);
                                            } else {
                                                handleSingleDateTimeChange('hour', 1);
                                            }
                                        }}
                                        className="w-[12px] h-[12px] flex items-center justify-center cursor-pointer shrink-0"
                                        aria-label="Increase"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                                            <path d="M0.264138 6.73232C0.433317 6.90372 0.662742 7 0.901961 7C1.14118 7 1.37061 6.90372 1.53978 6.73232L6.00545 2.2068L10.4711 6.73232C10.6413 6.89886 10.8691 6.99101 11.1057 6.98893C11.3422 6.98684 11.5685 6.89069 11.7358 6.72118C11.903 6.55167 11.9979 6.32237 12 6.08266C12.002 5.84295 11.9111 5.612 11.7468 5.43958L6.64327 0.267679C6.47409 0.0962842 6.24467 0 6.00545 0C5.76623 0 5.5368 0.0962842 5.36762 0.267679L0.264138 5.43958C0.0950107 5.61102 0 5.84352 0 6.08595C0 6.32837 0.0950107 6.56087 0.264138 6.73232Z" fill="#9A9A9A" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (singleDateMinuteFocused) {
                                                handleSingleDateTimeChange('minute', -1);
                                            } else {
                                                handleSingleDateTimeChange('hour', -1);
                                            }
                                        }}
                                        className="w-[12px] h-[12px] flex items-center justify-center cursor-pointer shrink-0"
                                        aria-label="Decrease"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                                            <path d="M0.264138 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899076 11.1057 0.0110741C11.3422 0.0131569 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.67763 12 0.917343C12.002 1.15705 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264138 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671627 0.0950107 0.439126 0.264138 0.267679Z" fill="#9A9A9A" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* AM/PM Toggle Switch */}
                            <div className="relative flex gap-[5px] border border-[#535352] rounded-[5px] p-[5px] bg-[#232725]">
                                {/* Sliding indicator */}
                                <div
                                    className={cn(
                                        'absolute top-[5px] bottom-[5px] w-[28px] bg-teal rounded-[2px] transition-all duration-300 ease-in-out',
                                        singleDateIsAM ? 'left-[5px]' : 'left-[33px]'
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSingleDateAMPMToggle(true)}
                                    className={cn(
                                        'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                                        singleDateIsAM && 'bg-[#008080]'
                                    )}
                                >
                                    AM
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSingleDateAMPMToggle(false)}
                                    className={cn(
                                        'cursor-pointer relative z-10 w-[28px] h-[24px] rounded-[2px] text-[14px] font-medium text-white transition-all duration-300',
                                        !singleDateIsAM && 'bg-[#008080]'
                                    )}
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                    </>
                )}

            </div>
        );
    };

    const renderUserSelectionFilter = (filterKey: string) => {
        const state = userSelectionState[filterKey] || { search: '', selected: [] };
        const filteredPeople = getFilteredCreatedBy(filterKey);

        return (
            <div className="bg-white rounded-[10px] h-[350px] flex flex-col overflow-hidden">
                {/* Search Input */}
                <div className="px-[10px] pt-[13px] pb-[12px]">
                    <div className="relative">
                        <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white pointer-events-none" />
                        <input
                            type="text"
                            value={state.search}
                            onChange={(e) => {
                                setUserSelectionState((prev) => ({
                                    ...prev,
                                    [filterKey]: { ...(prev[filterKey] || { search: '', selected: [] }), search: e.target.value },
                                }));
                            }}
                            placeholder="Search people by name or email"
                            className="w-full h-[40px] bg-[#232725] border border-[#cacaca] rounded-[5px] px-[15px] pl-[43px] py-[10px] text-[14px] font-medium text-white placeholder:text-white outline-none"
                        />
                    </div>
                </div>

                {/* People List */}
                <div className="flex-1 overflow-y-auto px-[10px] pt-0 pb-0 mt-0">
                    {filteredPeople.length === 0 ? (
                        <div className="px-3 py-10 text-center text-sm text-[#64748B]">
                            No matches found. Try a different search term.
                        </div>
                    ) : (
                        <div>
                            {filteredPeople.map((person, index) => {
                                const isSelected = state.selected.includes(person.id);
                                return (
                                    <div key={person.id}>
                                        {index > 0 && (
                                            <div className="h-px bg-[#E6E6E6] w-full" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleCreatedBySelection(filterKey, person.id)}
                                            className={cn(
                                                'w-full flex items-center justify-between p-[10px] text-left transition cursor-pointer',
                                                isSelected ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                                            )}
                                        >
                                            <div className="flex items-center gap-[10px] flex-1 min-w-0">
                                                <img
                                                    src={person.avatar || avatarPlaceholder}
                                                    alt={`${person.name} avatar`}
                                                    className="h-12 w-12 rounded-full object-cover shrink-0"
                                                    onError={handleImageError}
                                                />
                                                <div className="flex flex-1 flex-col min-w-0">
                                                    <span className="text-[16px] font-semibold text-black truncate">
                                                        {person.name}
                                                    </span>
                                                    <span className="text-[14px] font-normal text-[#535352] truncate">
                                                        {person.position}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 0C5.31429 0 0 5.31429 0 12C0 18.6857 5.31429 24 12 24C18.6857 24 24 18.6857 24 12C24 5.31429 18.6857 0 12 0ZM12 22.2857C6.34286 22.2857 1.71429 17.6571 1.71429 12C1.71429 6.34286 6.34286 1.71429 12 1.71429C17.6571 1.71429 22.2857 6.34286 22.2857 12C22.2857 17.6571 17.6571 22.2857 12 22.2857Z" fill="#9A9A9A" />
                                                    <path d="M16.6286 18L12 13.3714L7.37143 18L6 16.6286L10.6286 12L6 7.37143L7.37143 6L12 10.6286L16.6286 6L18 7.37143L13.3714 12L18 16.6286L16.6286 18Z" fill="#9A9A9A" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMultiSelectionFilter = (filterKey: string, filterConfig: FilterConfig) => {
        const state = multiSelectionState[filterKey] || { selected: [], search: '' };
        const isSearchable = filterConfig.isSearchable ?? false;
        const isCategoryFilter = filterConfig.id === 'category' || !filterConfig.id;
        const isFileTypeFilter = filterConfig.id === 'fileType';

        // Determine data source
        let items: Array<{ id: string; name: string; count?: number; iconUrl?: string }> = [];
        if (isCategoryFilter && departments) {
            items = departments.map(dept => ({ id: dept.id, name: dept.name, count: dept.count }));
        } else if (isFileTypeFilter && fileTypes) {
            items = fileTypes.map((type: any) => ({
                id: type.code ? type.code.toString() : (type.description || type),
                name: type.description || type,
                iconUrl: type.iconUrl
            }));
        }

        // Filter items based on search
        const filteredItems = isSearchable && state.search
            ? items.filter((item) => {
                const query = state.search!.trim().toLowerCase();
                return item.name.toLowerCase().includes(query);
            })
            : items;

        // Update search state handler
        const handleSearchChange = (value: string) => {
            setMultiSelectionState((prev) => ({
                ...prev,
                [filterKey]: { ...(prev[filterKey] || { selected: [] }), search: value },
            }));
        };

        return (
            <div className="flex flex-col px-[10px] pt-[10px] bg-white rounded-[10px]">
                {filterConfig.multiSelectionTitle && (
                    <div className="mb-[15px]">
                        <h3 className="text-[14px] text-white px-[15px] py-[11.5px] bg-[#232725] rounded-[5px] font-medium">{filterConfig.multiSelectionTitle}</h3>
                    </div>
                )}
                {isSearchable && (
                    <div className="mb-[15px]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9A9A]" />
                            <input
                                type="search"
                                value={state.search || ''}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search..."
                                className="w-full h-[38px] pl-9 pr-3 bg-[#2A2D29] border border-[#535352] rounded-[5px] text-white text-sm placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#0198F1]"
                            />
                        </div>
                    </div>
                )}

                <MacScrollbar className="h-[calc(300px-66px)]">
                    <div className="flex flex-col">
                        {filteredItems.length === 0 ? (
                            <div className="px-3 py-10 text-center text-sm text-[#9A9A9A]">
                                No matches found. Try a different search term.
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = state.selected.includes(item.id);

                                // Get icon for file types
                                let iconElement: React.ReactNode = null;
                                if (isFileTypeFilter) {
                                    if (item.iconUrl) {
                                        iconElement = (
                                            <span className="flex items-center justify-center w-[17px] h-[17px] shrink-0">
                                                <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain" />
                                            </span>
                                        );
                                    } else {
                                        const icon = getFileTypeIcon(item.name, true);
                                        if (icon) {
                                            iconElement = (
                                                <span className="flex items-center justify-center w-[17px] h-[17px] shrink-0">
                                                    {icon}
                                                </span>
                                            );
                                        }
                                    }
                                }

                                return (
                                    <div key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggleMultiSelection(filterKey, item.id)}
                                            className={cn(
                                                'w-full flex justify-between items-center gap-[7px] ps-[20px] pe-[10px] text-left transition cursor-pointer min-h-[40px] border-b border-[#CACACA]',
                                                isSelected ? 'bg-[#E1E6EE]' : 'bg-white hover:bg-[#E1E6EE]'
                                            )}
                                        >
                                            <div className="flex items-center gap-[7px] flex-1 min-w-0">
                                                {iconElement}
                                                <span className="text-[14px] font-semibold truncate">
                                                    {item.name}{item.count !== undefined ? ` (${item.count})` : ''}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 0C5.31429 0 0 5.31429 0 12C0 18.6857 5.31429 24 12 24C18.6857 24 24 18.6857 24 12C24 5.31429 18.6857 0 12 0ZM12 22.2857C6.34286 22.2857 1.71429 17.6571 1.71429 12C1.71429 6.34286 6.34286 1.71429 12 1.71429C17.6571 1.71429 22.2857 6.34286 22.2857 12C22.2857 17.6571 17.6571 22.2857 12 22.2857Z" fill="#9A9A9A" />
                                                    <path d="M16.6286 18L12 13.3714L7.37143 18L6 16.6286L10.6286 12L6 7.37143L7.37143 6L12 10.6286L16.6286 6L18 7.37143L13.3714 12L18 16.6286L16.6286 18Z" fill="#9A9A9A" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </MacScrollbar>
            </div >
        );
    };

    const renderDepartmentSelectionFilter = (filterKey: string) => {
        const state = departmentSelectionState[filterKey] || { selected: [] };
        const departmentsList = departments || [];

        return (
            <div className="flex flex-col px-[10px] py-[15px]">
                <div className="flex flex-col gap-[15px]">
                    {departmentsList.map((dept) => {
                        const isSelected = state.selected.includes(dept.id);
                        return (
                            <div key={dept.id}>
                                <button
                                    type="button"
                                    onClick={() => toggleDepartmentSelection(filterKey, dept.id)}
                                    className={cn(
                                        'w-full flex items-center gap-[7px] px-[10px] text-left transition cursor-pointer',
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-[17px] h-[17px] border border-[#FFFFFF] rounded-[3px] shrink-0",
                                        isSelected ? 'bg-[#0198F1]' : 'bg-[#D9D9D9]'
                                    )}>
                                        {isSelected && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
                                                <path d="M9.39512 0L4.35488 6.21362L1.375 3.42924L0 4.71496L4.58262 9L11 1.28571L9.39512 0Z" fill="white" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-[14px] font-semibold text-white">
                                        {dept.name}{dept.count !== undefined ? ` (${dept.count})` : ''}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderPrioritySelectionFilter = (filterKey: string) => {
        const state = prioritySelectionState[filterKey] || { selected: [] };

        return (
            <div className="px-[11px]">
                <div className="flex gap-[40px] py-[5px]">
                    {priorities.map((priority) => {
                        const isSelected = state.selected.includes(priority);
                        const colors = {
                            high: 'bg-[#d93025]',
                            medium: 'bg-[#ffb74d]',
                            low: 'bg-green-600',
                        };
                        return (
                            <div key={priority} className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => togglePrioritySelection(filterKey, priority)}
                                    className={cn(
                                        'h-[27px] w-full rounded-[25px] px-[20px] py-[5px] text-[14px] font-semibold text-white transition-all cursor-pointer',
                                        colors[priority]
                                    )}
                                >
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </button>
                                {isSelected && (
                                    <div className="absolute -top-[4px] -left-[4px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+8px)] h-[calc(100%+8px)]"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Generic render function for string list selections (like department style)
    const renderStringListSelection = (
        filterKey: string,
        items: string[],
        selectedItems: string[],
        onToggle: (filterKey: string, item: string) => void,
        options?: {
            enableSearch?: boolean;
            searchPlaceholder?: string;
            searchState?: { search: string };
            onSearchChange?: (filterKey: string, value: string) => void;
            selectedBgColor?: string;
            unselectedBgColor?: string;
            textColor?: string;
        }
    ) => {
        const {
            enableSearch = false,
            searchPlaceholder = 'Search...',
            searchState,
            onSearchChange,
            selectedBgColor = '#0198F1',
            unselectedBgColor = '#D9D9D9',
            textColor = 'white',
        } = options || {};

        const filteredItems = enableSearch && searchState
            ? items.filter((item) => {
                if (!searchState.search.trim()) return true;
                const query = searchState.search.trim().toLowerCase();
                return item.toLowerCase().includes(query);
            })
            : items;

        // Determine text color based on whether search is enabled (white bg = black text, dark bg = white text)
        const finalTextColor = enableSearch ? (textColor || 'black') : (textColor || 'white');
        const finalSelectedBg = selectedBgColor || '#0198F1';
        const finalUnselectedBg = unselectedBgColor || '#D9D9D9';

        const content = (
            <div className="flex flex-col">
                <div className="flex flex-col gap-[15px]">
                    {filteredItems.length === 0 ? (
                        <div className="px-3 py-10 text-center text-sm text-[#64748B]">
                            No matches found. Try a different search term.
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const isSelected = selectedItems.includes(item);
                            return (
                                <div key={item}>
                                    <button
                                        type="button"
                                        onClick={() => onToggle(filterKey, item)}
                                        className={cn(
                                            'w-full flex items-center gap-[7px] px-[10px] text-left transition cursor-pointer',
                                        )}
                                    >
                                        <div
                                            className="flex items-center justify-center w-[17px] h-[17px] border border-[#FFFFFF] rounded-[3px] shrink-0"
                                            style={{
                                                backgroundColor: isSelected ? finalSelectedBg : finalUnselectedBg,
                                            }}
                                        >
                                            {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
                                                    <path d="M9.39512 0L4.35488 6.21362L1.375 3.42924L0 4.71496L4.58262 9L11 1.28571L9.39512 0Z" fill="white" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-[14px] font-semibold" style={{ color: finalTextColor }}>
                                            {item}
                                        </span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );

        if (enableSearch && searchState && onSearchChange) {
            return (
                <div className="bg-white rounded-[10px] h-[350px] flex flex-col overflow-hidden">
                    {/* Search Input */}
                    <div className="px-[10px] pt-[13px] pb-[12px]">
                        <div className="relative">
                            <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white pointer-events-none" />
                            <input
                                type="text"
                                value={searchState.search}
                                onChange={(e) => onSearchChange(filterKey, e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full h-[40px] bg-[#232725] border border-[#cacaca] rounded-[5px] px-[15px] pl-[43px] py-[10px] text-[14px] font-medium text-white placeholder:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto px-[10px] pt-0 pb-0 mt-0">
                        {content}
                    </div>
                </div>
            );
        }

        return <div className="px-[10px] py-[15px]">{content}</div>;
    };

    const renderVenueSelectionFilter = (filterKey: string) => {
        const state = venueSelectionState[filterKey] || { selected: [] };

        return (
            <div className="flex flex-col">
                <div className="flex flex-col gap-[15px]">
                    {venues.map((venue) => {
                        const isSelected = state.selected.includes(venue);
                        return (
                            <div key={venue}>
                                <button
                                    type="button"
                                    onClick={() => toggleVenueSelection(filterKey, venue)}
                                    className={cn(
                                        'w-full flex items-center gap-[7px] px-[10px] text-left transition cursor-pointer',
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-[17px] h-[17px] border border-[#FFFFFF] rounded-[3px] shrink-0",
                                        isSelected ? 'bg-[#0198F1]' : 'bg-[#D9D9D9]'
                                    )}>
                                        {isSelected && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
                                                <path d="M9.39512 0L4.35488 6.21362L1.375 3.42924L0 4.71496L4.58262 9L11 1.28571L9.39512 0Z" fill="white" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-[14px] font-semibold text-white">
                                        {venue}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderModuleSelectionFilter = (filterKey: string) => {
        const state = moduleSelectionState[filterKey] || { search: '', selected: [] };

        return renderStringListSelection(
            filterKey,
            modules,
            state.selected,
            toggleModuleSelection,
            {
                enableSearch: true,
                searchPlaceholder: 'Search for Modules',
                searchState: state,
                onSearchChange: (key, value) => {
                    setModuleSelectionState((prev) => ({
                        ...prev,
                        [key]: { ...(prev[key] || { search: '', selected: [] }), search: value },
                    }));
                },
                textColor: 'black',
            }
        );
    };

    const renderBatchCodeSelectionFilter = (filterKey: string) => {
        const state = batchCodeSelectionState[filterKey] || { search: '', selected: [] };

        return renderStringListSelection(
            filterKey,
            batchCodes,
            state.selected,
            toggleBatchCodeSelection,
            {
                enableSearch: true,
                searchPlaceholder: 'Search for Batches',
                searchState: state,
                onSearchChange: (key, value) => {
                    setBatchCodeSelectionState((prev) => ({
                        ...prev,
                        [key]: { ...(prev[key] || { search: '', selected: [] }), search: value },
                    }));
                },
                textColor: 'black',
            }
        );
    };


    const renderAudienceSelectionFilter = (filterKey: string) => {
        const state = audienceSelectionState[filterKey] || {
            selectedAllStaff: false,
            selectedIndividuals: [],
            selectedGroups: [],
        };

        const selection: AudienceSelection = {
            allStaff: state.selectedAllStaff,
            individualIds: state.selectedIndividuals,
            groupIds: state.selectedGroups,
        };

        // Convert Person[] to IndividualUser[]
        const audienceIndividualUsers: IndividualUser[] = peopleList.map(p => ({
            id: p.id,
            name: p.name,
            position: p.position,
            email: p.email,
            avatar: p.avatar,
        }));

        const handleAudienceChange = (newSelection: AudienceSelection) => {
            setAudienceSelectionState((prev) => ({
                ...prev,
                [filterKey]: {
                    ...prev[filterKey],
                    selectedAllStaff: newSelection.allStaff,
                    selectedIndividuals: newSelection.individualIds,
                    selectedGroups: newSelection.groupIds,
                },
            }));
        };

        return (
            <div className="bg-white rounded-[10px] flex flex-col">
                <AudienceDropdown
                    inline
                    individualUsers={audienceIndividualUsers}
                    projectGroups={dynamicProjectGroups as ProjectGroup[]}
                    selectedAudience={selection}
                    onAudienceChange={handleAudienceChange}
                />
            </div>
        );
    };

    if (!isOpen || !menuPosition) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Popover */}
            <div
                ref={menuRef}
                className="bg-[#232725] rounded-[10px] shadow-lg z-50 w-[419px]"
                style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    left: menuPosition.left,
                }}
            >
                {/* Header */}
                <div className="px-[20px] py-[15px]">
                    <h3 className="text-[16px] font-semibold text-white">Filter By</h3>
                </div>

                {/* Divider */}
                <div className="h-px bg-white w-full" />

                {/* Content */}
                <div className="px-[10px] py-[15px] flex flex-col">
                    {/* Dynamically render filters based on activeFilters */}
                    {activeFilters.map((filter, index) => {
                        const filterKey = getFilterKey(filter, index);
                        const isExpanded = expandedFilters[filterKey];
                        const isLast = index === activeFilters.length - 1;
                        const maxHeight =
                            filter.type === 'dateRange' ? 'max-h-[1000px]'
                                : filter.type === 'singleDate' ? 'max-h-[500px]'
                                    : filter.type === 'prioritySelection' ? 'max-h-[200px]'
                                        : filter.type === 'venueSelection' ? 'max-h-[300px]'
                                            : filter.type === 'departmentSelection' ? 'max-h-[300px]'
                                                : filter.type === 'multiSelection' ? 'max-h-[300px]'
                                                    : 'max-h-[500px]';

                        return (
                            <React.Fragment key={filterKey}>
                                <button
                                    type="button"
                                    onClick={() => toggleFilter(filterKey)}
                                    className={cn(
                                        'w-full flex items-center justify-between px-[10px] py-0 cursor-pointer transition-colors',
                                        isExpanded ? 'bg-[#1e88e5]' : 'bg-transparent hover:bg-[#2F3432]',
                                        !isLast && 'mb-[15px]'
                                    )}
                                >
                                    <span className="text-[16px] font-semibold text-white">{filter.title}</span>
                                    <ChevronUp
                                        className={cn(
                                            'w-6 h-6 text-white transition-transform duration-300',
                                            isExpanded ? 'rotate-0' : 'rotate-180'
                                        )}
                                    />
                                </button>

                                <div
                                    className={cn(
                                        'overflow-hidden transition-all duration-300 ease-in-out',
                                        isExpanded ? `${maxHeight} opacity-100` : 'max-h-0 opacity-0',
                                        !isLast && isExpanded && 'mb-[15px]',
                                        isLast && isExpanded && 'mt-[15px]'
                                    )}
                                >
                                    {filter.type === 'dateRange' && renderDateRangeFilter()}
                                    {filter.type === 'singleDate' && renderSingleDateFilter(filter.showTimePicker ?? false)}
                                    {filter.type === 'userSelection' && renderUserSelectionFilter(filterKey)}
                                    {filter.type === 'audienceSelection' && renderAudienceSelectionFilter(filterKey)}
                                    {filter.type === 'departmentSelection' && renderDepartmentSelectionFilter(filterKey)}
                                    {filter.type === 'multiSelection' && renderMultiSelectionFilter(filterKey, filter)}
                                    {filter.type === 'prioritySelection' && renderPrioritySelectionFilter(filterKey)}
                                    {filter.type === 'venueSelection' && renderVenueSelectionFilter(filterKey)}
                                    {filter.type === 'moduleSelection' && renderModuleSelectionFilter(filterKey)}
                                    {filter.type === 'batchCodeSelection' && renderBatchCodeSelectionFilter(filterKey)}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Global Footer Buttons */}
                {(() => {
                    const hasActiveFilters = 
                        fromDate !== null || 
                        singleDate !== null ||
                        Object.values(userSelectionState).some(state => state && state.selected && state.selected.length > 0) ||
                        Object.values(audienceSelectionState).some(state => state && (state.selectedAllStaff || (state.selectedIndividuals && state.selectedIndividuals.length > 0) || (state.selectedGroups && state.selectedGroups.length > 0))) ||
                        Object.values(departmentSelectionState).some(state => state && state.selected && state.selected.length > 0) ||
                        Object.values(multiSelectionState).some(state => state && state.selected && state.selected.length > 0) ||
                        Object.values(prioritySelectionState).some(state => state && state.selected && state.selected.length > 0) ||
                        Object.values(venueSelectionState).some(state => state && state.selected && state.selected.length > 0) ||
                        Object.values(moduleSelectionState).some(state => state && state.selected && state.selected.length > 0) ||
                        Object.values(batchCodeSelectionState).some(state => state && state.selected && state.selected.length > 0);

                    return (
                        <>
                            <div className="h-px bg-[#535352] w-full mt-2" />
                            <div className="flex items-center justify-between gap-[10px] px-[20px] py-[15px]">
                                <button
                                    type="button"
                                    onClick={handleFilterReset}
                                    className={cn(
                                        "cursor-pointer border border-[#535352] rounded-[25px] px-[15px] py-[5px] text-[14px] font-medium hover:bg-[#2F3432] transition-colors",
                                        hasActiveFilters ? 'text-red-500' : 'text-[#9a9a9a]'
                                    )}
                                >
                                    Reset
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFilterApply}
                                    className={cn(
                                        "cursor-pointer rounded-[25px] px-[25px] py-[5px] text-[14px] font-medium text-white transition-colors",
                                        hasActiveFilters ? 'bg-[#1677BC] hover:bg-[#1266a0]' : 'bg-[#535352] hover:bg-[#42484B]'
                                    )}
                                >
                                    Apply
                                </button>
                            </div>
                        </>
                    );
                })()}
            </div>
        </>,
        document.body
    );
};

export default FilterPopover;

