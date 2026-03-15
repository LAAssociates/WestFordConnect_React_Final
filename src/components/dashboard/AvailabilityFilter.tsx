import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { AvailabilityItem } from './AvailabilityWidget';
import { getDepartmentFromPosition } from './AvailabilityWidget';
import type { DashboardDepartmentItem } from '../../types/dashboard';

export interface Department {
  id: string;
  name: string;
  count: number;
}

interface AvailabilityFilterProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onApply: (selectedDepartments: string[]) => void;
  items?: AvailabilityItem[];
  selectedDepartments?: string[];
  departmentOptions?: DashboardDepartmentItem[];
}

const departmentDefinitions: Omit<Department, 'count'>[] = [
  { id: 'westford', name: 'WESTFORD' },
  { id: 'operations', name: 'Operations' },
  { id: 'student-services', name: 'Student Services' },
  { id: 'faculty', name: 'Faculty' },
  { id: 'admissions-bd', name: 'Admissions / BD' },
  { id: 'marcom', name: 'Marcom' },
  { id: 'accounts', name: 'Accounts' },
  { id: 'student-experience', name: 'Student Experience' },
];

const toDeptId = (name: string): string => {
  const normalized = name.trim().toLowerCase().replace(/\s*\/\s*/g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!normalized || normalized === 'all' || normalized === 'all-departments') return 'westford';
  if (normalized === 'admissions-bd') return 'admissions-bd';
  return normalized;
};

// Checkbox Icon Component
const CheckboxIcon: React.FC<{ checked: boolean }> = ({ checked }) => {
  if (checked) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="8.5" cy="8.5" r="8" fill="#D9D9D9" stroke="white" />
        <circle cx="8.5" cy="8.5" r="8" fill="#0198F1" stroke="white" />
        <path d="M12.3951 4L7.35488 10.2136L4.375 7.42924L3 8.71496L7.58262 13L14 5.28571L12.3951 4Z" fill="white" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="8.5" cy="8.5" r="8" fill="#D9D9D9" stroke="white" />
    </svg>
  );
};

// Search Icon Component
const SearchIcon: React.FC = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14.75 14.75L18.75 18.75M0.75 8.75C0.75 10.8717 1.59285 12.9066 3.09315 14.4069C4.59344 15.9071 6.62827 16.75 8.75 16.75C10.8717 16.75 12.9066 15.9071 14.4069 14.4069C15.9071 12.9066 16.75 10.8717 16.75 8.75C16.75 6.62827 15.9071 4.59344 14.4069 3.09315C12.9066 1.59285 10.8717 0.75 8.75 0.75C6.62827 0.75 4.59344 1.59285 3.09315 3.09315C1.59285 4.59344 0.75 6.62827 0.75 8.75Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

const AvailabilityFilter: React.FC<AvailabilityFilterProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onApply,
  items = [],
  selectedDepartments = ['westford'],
  departmentOptions = [],
}) => {
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width?: number } | null>(null);
  const [localSelectedDepartments, setLocalSelectedDepartments] = useState<string[]>(selectedDepartments);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate department counts from items
  const departments = useMemo(() => {
    if (departmentOptions.length > 0) {
      const hasWestford = departmentOptions.some((d) => toDeptId(d.name) === 'westford');
      const mapped = departmentOptions.map((d) => ({
        id: toDeptId(d.name),
        name: d.name,
        count: Number(d.staffCount ?? 0),
      }));

      return hasWestford
        ? mapped
        : [{ id: 'westford', name: 'WESTFORD', count: items.length }, ...mapped];
    }

    // Count items per department
    const departmentCounts = new Map<string, number>();
    items.forEach((item) => {
      const deptId = getDepartmentFromPosition(item.position);
      const count = departmentCounts.get(deptId) || 0;
      departmentCounts.set(deptId, count + 1);
    });

    // Build departments array with calculated counts
    return departmentDefinitions.map((dept) => {
      if (dept.id === 'westford') {
        // WESTFORD shows total count of all items
        return { ...dept, count: items.length };
      }
      return { ...dept, count: departmentCounts.get(dept.id) || 0 };
    });
  }, [items, departmentOptions]);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    // Get the widget container width (parent of the button)
    const widgetContainer = triggerRef.current.closest('.relative') as HTMLElement;
    const menuWidth = widgetContainer ? widgetContainer.offsetWidth : 335; // Fallback to approximate width

    // Position dropdown bottom right - align right edge of dropdown with right edge of button
    let menuLeft = rect.right - menuWidth;

    // Ensure menu stays within viewport bounds
    const padding = 10;
    const minLeft = padding;

    if (menuLeft < minLeft) {
      menuLeft = minLeft;
    }

    setMenuPosition({
      top: rect.bottom + 10,
      left: menuLeft,
      width: menuWidth,
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

  useEffect(() => {
    setLocalSelectedDepartments(selectedDepartments);
  }, [selectedDepartments, isOpen]);

  // Click outside handler - apply current selection and close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target)) {
        return;
      }

      const filterPanel = document.querySelector('[data-filter-panel="availability"]');
      if (filterPanel?.contains(target)) {
        return;
      }

      // Apply current selection when clicking outside
      onApply(localSelectedDepartments);
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef, localSelectedDepartments, onApply]);

  const toggleDepartment = (departmentId: string) => {
    const newSelection = localSelectedDepartments.includes(departmentId)
      ? localSelectedDepartments.filter((id) => id !== departmentId)
      : [...localSelectedDepartments, departmentId];
    setLocalSelectedDepartments(newSelection);
    // Apply immediately on selection
    onApply(newSelection);
  };

  // Filter departments based on search query
  const filteredDepartments = departments.filter((dept) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return dept.name.toLowerCase().includes(query);
  });

  if (!isOpen || !menuPosition) return null;

  return createPortal(
    <>
      {/* Filter Panel */}
      <div
        data-filter-panel="availability"
        className="fixed bg-[#232725] rounded-[10px] z-[9999]"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: menuPosition.width ? `${menuPosition.width}px` : '335px',
        }}
      >
        {/* Search Bar */}
        <div className="relative m-[10px]">
          <button
            type="button"
            className="relative w-full h-[34px] bg-[#e6e6e6] rounded-[20px] px-[15px] pl-[45px] flex items-center"
          >
            <input
              type="text"
              placeholder="Search by name or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[14px] text-black placeholder:text-black font-normal"
            />
            <div className="absolute left-[18px] top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white mb-[15px]" />

        {/* Departments List */}
        <div className="pb-[20px] max-h-[400px] overflow-y-auto space-y-[15px]">
          {filteredDepartments.map((department) => {
            const isSelected = localSelectedDepartments.includes(department.id);
            return (
              <button
                key={department.id}
                type="button"
                onClick={() => toggleDepartment(department.id)}
                className="w-full flex items-center gap-[7px] px-[15px] transition-colors"
              >
                <CheckboxIcon checked={isSelected} />
                <span className="text-[14px] font-semibold text-white leading-normal text-left">
                  {department.name}
                </span>
                <span className="text-[14px] font-semibold text-white leading-normal">
                  ({department.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
};

export default AvailabilityFilter;
