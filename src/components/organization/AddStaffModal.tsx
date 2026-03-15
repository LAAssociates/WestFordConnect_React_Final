import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import defaultAvatar from '../../assets/images/default-group-icon.png';
import type { Employee } from './types';
// TODO: Replace with actual employee search API from organizationService

interface AddStaffModalProps {
  isOpen: boolean;
  manager: Employee | null;
  onClose: () => void;
  onAdd: (selectedEmployeeIds: string[]) => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  manager,
  onClose,
  onAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const availableStaff = useMemo<Employee[]>(() => {
    return []; // No available staff for selection until API is connected
  }, [manager]);

  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return availableStaff;
    const query = searchTerm.toLowerCase();
    return availableStaff.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
    );
  }, [availableStaff, searchTerm]);

  const handleToggleSelect = (employeeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const handleAdd = () => {
    onAdd(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSearchTerm('');
  };

  if (!isOpen || !manager) return null;

  const statusIndicator = (status: Employee['status']) => {
    if (status === 'at-work') {
      return <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />;
    }
    return <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center">
      <div className="w-0 h-0 border-l-[3px] border-r-0 border-b-[3px] border-t-[3px] border-transparent border-l-orange-500 border-b-transparent border-t-transparent" />
    </div>;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[10px] shadow-xl w-full h-[670px] max-w-[485px] max-h-[80vh] flex flex-col p-[25px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-[23px] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Staff Under{' '}
            <button
              onClick={() => {
                // Could navigate to manager's profile
              }}
              className="text-[#1E88E5] cursor-pointer font-semibold"
            >
              {manager.name}
            </button>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-[5px] right-[5px] flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
              <mask id="mask0_959_17432" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
                <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
                <path d="M13.8289 8.17188L8.17188 13.8289M8.17188 8.17188L13.8289 13.8289" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </mask>
              <g mask="url(#mask0_959_17432)">
                <path d="M-1 -1H23V23H-1V-1Z" fill="#232725" />
              </g>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" />
          <input
            type="text"
            placeholder="Search people by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#E6E6E6] rounded-[25px] text-black placeholder:text-black"
          />
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto mt-[15px]">
          <div className="space-y-0">
            {filteredStaff.map((employee) => {
              const isSelected = selectedIds.has(employee.id);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleToggleSelect(employee.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-3 hover:bg-[#E1E6EE] transition cursor-pointer border-b border-[#E6E6E6]',
                    isSelected && 'bg-[#E1E6EE]'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={employee.avatar || defaultAvatar}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultAvatar;
                      }}
                    />
                    {statusIndicator(employee.status)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                  {isSelected && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#9A9A9A]">
                      <X className="h-4 w-4 text-[#9A9A9A]" strokeWidth={2.5} />
                    </span>

                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 mt-[30px]">
          <button
            type="button"
            onClick={onClose}
            className="w-[130px] py-2 border border-[#CACACA] rounded-[25px] text-sm font-medium text-black hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedIds.size === 0}
            className={cn(
              'w-[130px] py-2 rounded-[25px] text-sm font-medium text-white transition cursor-pointer bg-[#1E88E5] hover:bg-[#1E88E5]/80',
            )}
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddStaffModal;
