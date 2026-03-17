import React, { useMemo, useState, useEffect } from 'react';
import type { Employee } from './types';
import { getStaffDirectory, transformApiStaff, type ApiStaffDirectoryResponse } from '../../services/organizationService';
import EmployeeCard from './EmployeeCard';
import DepartmentFilter from './DepartmentFilter';
import { Skeleton } from '../common/Skeleton';

const DirectorySkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
      <div key={i} className="bg-white rounded-lg border border-[#E6E6E6] p-[10px] flex flex-col items-center">
        <Skeleton className="w-20 h-20 rounded-full mb-[15px] bg-gray-200" />
        <Skeleton className="h-4 w-3/4 mb-2 bg-gray-200" />
        <Skeleton className="h-3 w-1/2 mb-8 bg-gray-200" />
        <Skeleton className="h-10 w-full rounded-[5px] bg-gray-100" />
      </div>
    ))}
  </div>
);

interface StaffDirectoryViewProps {
  selectedDepartment?: string;
  onSelectDepartment?: (departmentId: string) => void;
  onViewProfile?: (employee: Employee) => void;
  onSendEmail?: (employee: Employee) => void;
  onCall?: (employee: Employee) => void;
  onSendMessage?: (employee: Employee) => void;
  onViewSOP?: (employee: Employee) => void;
  departments: import('./types').DepartmentInfo[];
  resolveEmployeeStatus?: (email?: string | null) => Employee['status'];
}

const StaffDirectoryView: React.FC<StaffDirectoryViewProps> = ({
  selectedDepartment,
  onSelectDepartment,
  onViewProfile,
  onSendEmail,
  onCall,
  onSendMessage,
  onViewSOP,
  departments,
  resolveEmployeeStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [staffData, setStaffData] = useState<ApiStaffDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff directory data
  useEffect(() => {
    const fetchStaffDirectory = async () => {
      setError(null);
      setStaffData(null);
      setLoading(true);
      try {
        // Strip 'dept-' prefix for the API
        const deptId = selectedDepartment?.startsWith('dept-') ?
          (selectedDepartment === 'dept-westford' ? undefined : selectedDepartment.replace('dept-', '')) :
          selectedDepartment;

        const data = await getStaffDirectory(deptId, searchTerm || undefined);
        setStaffData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load staff directory";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDirectory();
  }, [selectedDepartment, searchTerm]);

  // Convert API staff to Employee objects
  const employees = useMemo(() => {
    if (!staffData?.staffs) return [];

    return staffData.staffs.map((staff) => {
      const transformed = transformApiStaff(staff);
      if (resolveEmployeeStatus) {
        transformed.status = resolveEmployeeStatus(staff.email);
      }
      return transformed;
    })
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }, [resolveEmployeeStatus, staffData]);

  const statusCounts = useMemo(() => ({
    atWork: employees.filter((x) => x.status === 'at-work').length,
    away: employees.filter((x) => x.status === 'away').length,
  }), [employees]);

  return (
    <div className="flex flex-col h-full rounded-[10px] bg-white">
      {/* Header Section */}
      <div className="bg-[#1C2745] rounded-t-[10px] ps-5 pr-[15px] py-[11px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Status Counts */}
          <div className="flex items-center gap-[25px]">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 16V8C3 6.67392 3.52678 5.40215 4.46447 4.46447C5.40215 3.52678 6.67392 3 8 3H16C17.3261 3 18.5979 3.52678 19.5355 4.46447C20.4732 5.40215 21 6.67392 21 8V16C21 17.3261 20.4732 18.5979 19.5355 19.5355C18.5979 20.4732 17.3261 21 16 21H8C6.67392 21 5.40215 20.4732 4.46447 19.5355C3.52678 18.5979 3 17.3261 3 16Z" stroke="white" stroke-width="1.5" />
                <path d="M16.5 14.5C16.5 14.5 15 16.5 12 16.5C9 16.5 7.5 14.5 7.5 14.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8.5 10C8.36739 10 8.24021 9.94732 8.14645 9.85355C8.05268 9.75979 8 9.63261 8 9.5C8 9.36739 8.05268 9.24021 8.14645 9.14645C8.24021 9.05268 8.36739 9 8.5 9C8.63261 9 8.75979 9.05268 8.85355 9.14645C8.94732 9.24021 9 9.36739 9 9.5C9 9.63261 8.94732 9.75979 8.85355 9.85355C8.75979 9.94732 8.63261 10 8.5 10ZM15.5 10C15.3674 10 15.2402 9.94732 15.1464 9.85355C15.0527 9.75979 15 9.63261 15 9.5C15 9.36739 15.0527 9.24021 15.1464 9.14645C15.2402 9.05268 15.3674 9 15.5 9C15.6326 9 15.7598 9.05268 15.8536 9.14645C15.9473 9.24021 16 9.36739 16 9.5C16 9.63261 15.9473 9.75979 15.8536 9.85355C15.7598 9.94732 15.6326 10 15.5 10Z" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span className="text-[18px] leading-normal text-white">People</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="2" height="40" viewBox="0 0 2 40" fill="none">
              <path d="M1 1L1 39" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
            </svg>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#16A34A]" />
              <span className="font-semibold text-sm text-white">
                At Work: {statusCounts.atWork}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FFB74D]" />
              <span className="font-semibold text-sm text-white">
                Away: {statusCounts.away}
              </span>
            </div>
          </div>

          <DepartmentFilter
            selectedDepartment={selectedDepartment}
            departments={departments}
            onSelect={onSelectDepartment || (() => { })}
            className="min-w-[200px]"
          />

          {/* Search */}
          <div className="relative min-w-[345px]">
            {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /> */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">
              <path d="M14.75 14.75L18.75 18.75M0.75 8.75C0.75 10.8717 1.59285 12.9066 3.09315 14.4069C4.59344 15.9071 6.62827 16.75 8.75 16.75C10.8717 16.75 12.9066 15.9071 14.4069 14.4069C15.9071 12.9066 16.75 10.8717 16.75 8.75C16.75 6.62827 15.9071 4.59344 14.4069 3.09315C12.9066 1.59285 10.8717 0.75 8.75 0.75C6.62827 0.75 4.59344 1.59285 3.09315 3.09315C1.59285 4.59344 0.75 6.62827 0.75 8.75Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <input
              type="text"
              placeholder="Search name, role, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[30px] pl-11 pr-4 border border-gray-300 bg-white rounded-[25px] placeholder:text-black text-[14px] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        {loading ? (
          <DirectorySkeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            Error: {error}
          </div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No employees found
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                variant="directory"
                showActions={true}
                onViewProfile={onViewProfile}
                onSendEmail={onSendEmail}
                onCall={onCall}
                onSendMessage={onSendMessage}
                onViewSOP={onViewSOP}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDirectoryView;
