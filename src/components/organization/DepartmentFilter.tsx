import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils/cn';
import { type DepartmentInfo } from './types';

interface DepartmentFilterProps {
  selectedDepartment?: string;
  departments: DepartmentInfo[];
  onSelect: (departmentId: string) => void;
  className?: string;
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  selectedDepartment,
  departments,
  onSelect,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find selected department or default to WESTFORD
  const selectedDept = departments.find((d) => d.id === selectedDepartment) || departments.find(d => d.id === 'dept-westford') || departments[0];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 15,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('department-filter-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (departmentId: string) => {
    onSelect(departmentId);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between bg-white border border-gray-300 rounded-[25px] px-[14.5px] text-sm font-semibold text-gray-900 hover:bg-gray-50 transition cursor-pointer h-[30px] w-[213px]',
          className
        )}
      >
        <span className="leading-normal">
          {selectedDept ? `${selectedDept.name} (${selectedDept.count})` : 'Select Department'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none" className={cn("shrink-0 transition-transform duration-200", isOpen ? "rotate-180" : "")}>
          <path d="M0.264138 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899076 11.1057 0.0110741C11.3422 0.0131569 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.67763 12 0.917343C12.002 1.15705 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264138 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671627 0.0950107 0.439126 0.264138 0.267679Z" fill="black" />
        </svg>
      </button>

      {isOpen && position && typeof document !== 'undefined' && createPortal(
        <div
          id="department-filter-dropdown"
          className="fixed z-50 bg-[#232725] rounded-lg shadow-xl overflow-hidden"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {departments.map((dept) => {
            const isSelected = selectedDepartment === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => handleSelect(dept.id)}
                className={cn(
                  'w-full flex items-center gap-1.5 px-4 py-3 hover:bg-[#42484B] transition text-white text-left cursor-pointer',
                  isSelected && 'bg-[#42484B]'
                )}
              >
                {isSelected ? (
                  <div className="w-[17px] h-[17px] rounded-full border border-white bg-[#0198F1] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M9.39512 0L4.35488 6.21362L1.375 3.42924L0 4.71496L4.58262 9L11 1.28571L9.39512 0Z" fill="white" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-[17px] h-[17px] rounded-full border border-white bg-[#D9D9D9] flex-shrink-0" />
                )}
                <span className={cn('text-sm', isSelected && 'font-medium')}>
                  {dept.name} ({dept.count})
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default DepartmentFilter;
