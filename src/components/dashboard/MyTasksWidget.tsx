import React, { useState, useMemo, useRef, useEffect } from 'react';
import DashboardWidget from './DashboardWidget';
import TaskCard from '../my-work/TaskCard';
import TaskDrawer from '../my-work/TaskDrawer';
import type { Task, TaskStatus } from '../my-work/types';
import type { DashboardTaskCounts } from '../../types/dashboard';
import Tooltip from '../ui/Tooltip';

interface MyTasksWidgetProps {
  tasks?: Task[];
  taskCounts?: DashboardTaskCounts;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onTaskClick?: (task: Task) => void;
  onSubmit?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({
  tasks = [],
  taskCounts,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onTaskClick,
  onSubmit,
  selectedDate: controlledSelectedDate,
  onDateChange,
}) => {
  const [selectedDate, setSelectedDate] = useState(controlledSelectedDate ?? new Date());
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('todo');
  const [currentMonth, setCurrentMonth] = useState(
    new Date(
      (controlledSelectedDate ?? new Date()).getFullYear(),
      (controlledSelectedDate ?? new Date()).getMonth(),
      1
    )
  );
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!controlledSelectedDate) return;
    setSelectedDate(controlledSelectedDate);
    setCurrentMonth(new Date(
      controlledSelectedDate.getFullYear(),
      controlledSelectedDate.getMonth(),
      1
    ));
  }, [controlledSelectedDate]);

  // Calculate current week dates (Sunday to Saturday)
  const getWeekDates = (date: Date): Date[] => {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day; // Get Sunday of the week
    const sunday = new Date(dateCopy.getFullYear(), dateCopy.getMonth(), diff);
    const weekDates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(sunday);
      weekDate.setDate(sunday.getDate() + i);
      weekDates.push(weekDate);
    }

    return weekDates;
  };

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const updateSelectedDate = (date: Date) => {
    setSelectedDate(date);
    onDateChange?.(date);
  };

  // Format month/year display
  const monthYearLabel = useMemo(() => {
    const month = currentMonth.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const year = currentMonth.getFullYear();
    return `${month} - ${year}`;
  }, [currentMonth]);

  // Count tasks by status (or use server-provided counts for dashboard mode)
  const computedTaskCounts = useMemo(() => {
    if (taskCounts) {
      return taskCounts;
    }

    const counts: DashboardTaskCounts = {
      todo: 0,
      'in-progress': 0,
      completed: 0,
      overdue: 0,
    };

    tasks.forEach((task) => {
      if (task.status in counts) {
        counts[task.status as keyof DashboardTaskCounts]++;
      }
    });

    return counts;
  }, [tasks, taskCounts]);

  // Filter tasks by selected status
  const filteredTasks = useMemo(() => {
    if (selectedStatus === 'all') return tasks;
    return tasks.filter((task) => task.status === selectedStatus);
  }, [tasks, selectedStatus]);

  // Handle week navigation
  const handlePrevWeek = () => {
    const newSelectedDate = new Date(selectedDate);
    newSelectedDate.setDate(newSelectedDate.getDate() - 7);
    setCurrentMonth(new Date(newSelectedDate.getFullYear(), newSelectedDate.getMonth(), 1));
    updateSelectedDate(newSelectedDate);
  };

  const handleNextWeek = () => {
    const newSelectedDate = new Date(selectedDate);
    newSelectedDate.setDate(newSelectedDate.getDate() + 7);
    setCurrentMonth(new Date(newSelectedDate.getFullYear(), newSelectedDate.getMonth(), 1));
    updateSelectedDate(newSelectedDate);
  };

  // Custom scrollbar implementation
  useEffect(() => {
    const container = scrollContainerRef.current;
    const thumb = scrollbarThumbRef.current;

    if (!container || !thumb) return;

    const updateScrollbar = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollableHeight = scrollHeight - clientHeight;

      if (onLoadMore && hasMore && !isLoadingMore) {
        const nearBottom = scrollTop + clientHeight >= scrollHeight - 120;
        if (nearBottom) {
          onLoadMore();
        }
      }

      if (scrollableHeight <= 0) {
        thumb.style.display = 'none';
        return;
      }

      thumb.style.display = 'block';
      const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * clientHeight);
      const maxThumbTop = clientHeight - thumbHeight;
      const thumbTop = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * maxThumbTop : 0;

      thumb.style.height = `${thumbHeight}px`;
      thumb.style.top = `${thumbTop}px`;
    };

    // Use ResizeObserver to handle content changes
    const resizeObserver = new ResizeObserver(updateScrollbar);
    resizeObserver.observe(container);

    container.addEventListener('scroll', updateScrollbar);
    updateScrollbar();

    return () => {
      container.removeEventListener('scroll', updateScrollbar);
      resizeObserver.disconnect();
    };
  }, [filteredTasks, onLoadMore, hasMore, isLoadingMore]);

  // Split tasks into two columns
  const leftColumnTasks = useMemo(() => {
    return filteredTasks.filter((_, index) => index % 2 === 0);
  }, [filteredTasks]);

  const rightColumnTasks = useMemo(() => {
    return filteredTasks.filter((_, index) => index % 2 === 1);
  }, [filteredTasks]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <DashboardWidget title="My Tasks" className="h-[430px] flex flex-col lg:col-span-2">
      <div className="flex-1 border-3 border-[#9A9A9A] rounded-[10px] px-[17px] py-[8px] shadow-[0_2px_4px_0_rgba(0,0,0,0.10)] bg-white flex flex-col">
        {/* Status Filter Buttons */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setSelectedStatus('todo')}
            className={`relative px-[2px] py-[2px] rounded-[25px] ${selectedStatus === 'todo' ? 'border-2 border-[#cacaca]' : ''}`}
          >
            <div className="bg-[#232725] h-[24px] px-[5px] pe-2.5 rounded-[25px] flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.16667 4.16602H3.83333C3.3731 4.16602 3 4.53911 3 4.99935V8.33268C3 8.79292 3.3731 9.16602 3.83333 9.16602H7.16667C7.6269 9.16602 8 8.79292 8 8.33268V4.99935C8 4.53911 7.6269 4.16602 7.16667 4.16602Z" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 14.1667L4.66667 15.8333L8 12.5M11.3333 5H18M11.3333 10H18M11.3333 15H18" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[14px] font-semibold text-white">To do:</span>
              <span className="text-[14px] font-semibold text-white">{String(computedTaskCounts.todo).padStart(2, '0')}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('in-progress')}
            className={`relative px-[2px] py-[2px] rounded-[25px] ${selectedStatus === 'in-progress' ? 'border-2 border-[#cacaca]' : ''}`}
          >
            <div className="bg-[#1e88e5] h-[24px] px-[2px] pe-1.5 rounded-[25px] flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9.99999 19C8.76999 19 7.6075 18.7636 6.5125 18.2908C5.4175 17.818 4.4614 17.173 3.6442 16.3558C2.827 15.5386 2.182 14.5825 1.7092 13.4875C1.2364 12.3925 1 11.23 1 10C1 8.755 1.2364 7.5889 1.7092 6.5017C2.182 5.4145 2.827 4.462 3.6442 3.6442C4.4614 2.8264 5.4175 2.1814 6.5125 1.7092C7.6075 1.237 8.76999 1.0006 9.99999 1C10.255 1 10.4689 1.0864 10.6417 1.2592C10.8145 1.432 10.9006 1.6456 10.9 1.9C10.8994 2.1544 10.813 2.3683 10.6408 2.5417C10.4686 2.7151 10.255 2.8012 9.99999 2.8C8.005 2.8 6.3061 3.5014 4.9033 4.9042C3.5005 6.307 2.7994 8.0056 2.8 10C2.8006 11.9944 3.502 13.6933 4.9042 15.0967C6.3064 16.5001 8.005 17.2012 9.99999 17.2C11.995 17.1988 13.6939 16.4977 15.0967 15.0967C16.4995 13.6957 17.2006 11.9968 17.2 10C17.2 9.745 17.2864 9.5314 17.4592 9.3592C17.632 9.187 17.8456 9.1006 18.1 9.1C18.3544 9.0994 18.5683 9.1858 18.7417 9.3592C18.9151 9.5326 19.0012 9.7462 19 10C19 11.23 18.7636 12.3925 18.2908 13.4875C17.818 14.5825 17.173 15.5389 16.3558 16.3567C15.5386 17.1745 14.5861 17.8195 13.4983 18.2917C12.4105 18.7639 11.2444 19 9.99999 19Z" fill="white" />
              </svg>
              <span className="text-[14px] font-semibold text-white">In Progress:</span>
              <span className="text-[14px] font-semibold text-white">{String(computedTaskCounts['in-progress']).padStart(2, '0')}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('completed')}
            className={`relative px-[2px] py-[2px] rounded-[25px] ${selectedStatus === 'completed' ? 'border-2 border-[#cacaca]' : ''}`}
          >
            <div className="bg-[#607d8b] h-[24px] px-[3px] pe-1.5 rounded-[25px] flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9.99961 2.63629C9.03264 2.63629 8.07515 2.82675 7.18179 3.19679C6.28843 3.56683 5.47671 4.10921 4.79296 4.79296C4.10921 5.47671 3.56683 6.28843 3.19679 7.18179C2.82675 8.07515 2.63629 9.03264 2.63629 9.99961C2.63629 10.9666 2.82675 11.9241 3.19679 12.8174C3.56683 13.7108 4.10921 14.5225 4.79296 15.2063C5.47671 15.89 6.28843 16.4324 7.18179 16.8024C8.07515 17.1725 9.03264 17.3629 9.99961 17.3629C11.9525 17.3629 13.8254 16.5871 15.2063 15.2063C16.5871 13.8254 17.3629 11.9525 17.3629 9.99961C17.3629 8.04674 16.5871 6.17385 15.2063 4.79296C13.8254 3.41207 11.9525 2.63629 9.99961 2.63629ZM1 9.99961C1 5.02937 5.02937 1 9.99961 1C14.9698 1 18.9992 5.02937 18.9992 9.99961C18.9992 14.9698 14.9698 18.9992 9.99961 18.9992C5.02937 18.9992 1 14.9698 1 9.99961Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M14.5888 7.54358L8.26784 13.8646L5.0918 10.0741L6.32802 9.00233L8.35375 11.465L13.432 6.38672L14.5888 7.54358Z" fill="white" />
              </svg>
              <span className="text-[14px] font-semibold text-white">Completed:</span>
              <span className="text-[14px] font-semibold text-white">{String(computedTaskCounts.completed).padStart(2, '0')}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('overdue')}
            className={`relative px-[2px] py-[2px] rounded-[25px] ${selectedStatus === 'overdue' ? 'border-2 border-[#cacaca]' : ''}`}
          >
            <div className="bg-[#8c2036] h-[24px] px-1.5 rounded-[25px] flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.72868 0C3.9141 0 4.09193 0.0736579 4.22304 0.20477C4.35415 0.335882 4.42781 0.513708 4.42781 0.699128V1.86434H9.08867V0.699128C9.08867 0.513708 9.16232 0.335882 9.29344 0.20477C9.42455 0.0736579 9.60237 0 9.78779 0C9.97321 0 10.151 0.0736579 10.2822 0.20477C10.4133 0.335882 10.4869 0.513708 10.4869 0.699128V1.86434H12.1182C12.3654 1.86434 12.6025 1.96255 12.7774 2.13737C12.9522 2.31218 13.0504 2.54929 13.0504 2.79651V6.75824C13.0504 6.94366 12.9767 7.12148 12.8456 7.2526C12.7145 7.38371 12.5367 7.45737 12.3513 7.45737C12.1658 7.45737 11.988 7.38371 11.8569 7.2526C11.7258 7.12148 11.6521 6.94366 11.6521 6.75824V6.05911H1.39826V11.6521H6.75824C6.94366 11.6521 7.12148 11.7258 7.2526 11.8569C7.38371 11.988 7.45737 12.1658 7.45737 12.3513C7.45737 12.5367 7.38371 12.7145 7.2526 12.8456C7.12148 12.9767 6.94366 13.0504 6.75824 13.0504H0.932171C0.684944 13.0504 0.447842 12.9522 0.273026 12.7774C0.0982105 12.6025 0 12.3654 0 12.1182V2.79651C0 2.54929 0.0982105 2.31218 0.273026 2.13737C0.447842 1.96255 0.684944 1.86434 0.932171 1.86434H3.02955V0.699128C3.02955 0.513708 3.10321 0.335882 3.23432 0.20477C3.36544 0.0736579 3.54326 0 3.72868 0ZM1.39826 4.66085H11.6521V3.2626H1.39826V4.66085ZM9.58272 8.59461C9.51871 8.52593 9.44153 8.47083 9.35577 8.43262C9.27001 8.39441 9.17743 8.37386 9.08356 8.37221C8.98969 8.37055 8.89644 8.38782 8.80939 8.42298C8.72233 8.45814 8.64326 8.51048 8.57687 8.57687C8.51048 8.64326 8.45814 8.72233 8.42298 8.80939C8.38782 8.89644 8.37055 8.98969 8.37221 9.08356C8.37386 9.17743 8.39441 9.27001 8.43262 9.35577C8.47083 9.44153 8.52593 9.51871 8.59461 9.58272L10.1979 11.186L8.59461 12.7894C8.52593 12.8534 8.47083 12.9306 8.43262 13.0163C8.39441 13.1021 8.37386 13.1947 8.37221 13.2885C8.37055 13.3824 8.38782 13.4757 8.42298 13.5627C8.45814 13.6498 8.51048 13.7288 8.57687 13.7952C8.64326 13.8616 8.72233 13.914 8.80939 13.9491C8.89644 13.9843 8.98969 14.0015 9.08356 13.9999C9.17743 13.9982 9.27001 13.9777 9.35577 13.9395C9.44153 13.9013 9.51871 13.8462 9.58272 13.7775L11.186 12.1742L12.7894 13.7775C12.8534 13.8462 12.9306 13.9013 13.0163 13.9395C13.1021 13.9777 13.1947 13.9982 13.2885 13.9999C13.3824 14.0015 13.4757 13.9843 13.5627 13.9491C13.6498 13.914 13.7288 13.8616 13.7952 13.7952C13.8616 13.7288 13.914 13.6498 13.9491 13.5627C13.9843 13.4757 14.0015 13.3824 13.9999 13.2885C13.9982 13.1947 13.9777 13.1021 13.9395 13.0163C13.9013 12.9306 13.8462 12.8534 13.7775 12.7894L12.1742 11.186L13.7775 9.58272C13.8462 9.51871 13.9013 9.44153 13.9395 9.35577C13.9777 9.27001 13.9982 9.17743 13.9999 9.08356C14.0015 8.98969 13.9843 8.89644 13.9491 8.80939C13.914 8.72233 13.8616 8.64326 13.7952 8.57687C13.7288 8.51048 13.6498 8.45814 13.5627 8.42298C13.4757 8.38782 13.3824 8.37055 13.2885 8.37221C13.1947 8.37386 13.1021 8.39441 13.0163 8.43262C12.9306 8.47083 12.8534 8.52593 12.7894 8.59461L11.186 10.1979L9.58272 8.59461Z" fill="white" />
              </svg>
              <span className="text-[14px] font-semibold text-white">Overdue:</span>
              <span className="text-[14px] font-semibold text-white">{String(computedTaskCounts.overdue).padStart(2, '0')}</span>
            </div>
          </button>
        </div>

        {/* Divider Line */}
        <div className="h-0 border-t border-[#E6E6E6] mb-2"></div>

        {/* Calendar Header */}
        <div className="relative mb-3">
          {/* Month/Year Display */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="cursor-pointer group"
                aria-label="Previous week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                  <circle cx="12.5" cy="12.5" r="11.5" stroke="#CACACA" strokeWidth="2" className="group-hover:stroke-[#9A9A9A] transition duration-100" />
                  <path d="M14.7323 18.7359C14.9037 18.5667 15 18.3373 15 18.098C15 17.8588 14.9037 17.6294 14.7323 17.4602L10.2068 12.9946L14.7323 8.52889C14.8989 8.35874 14.991 8.13086 14.9889 7.89431C14.9868 7.65777 14.8907 7.4315 14.7212 7.26423C14.5517 7.09697 14.3224 7.00209 14.0827 7.00003C13.8429 6.99798 13.612 7.08891 13.4396 7.25325L8.26768 12.3567C8.09628 12.5259 8 12.7553 8 12.9946C8 13.2338 8.09628 13.4632 8.26768 13.6324L13.4396 18.7359C13.611 18.905 13.8435 19 14.0859 19C14.3284 19 14.5609 18.905 14.7323 18.7359Z" fill="#9A9A9A" className="group-hover:fill-[#232725] transition duration-100" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="cursor-pointer group"
                aria-label="Next week"
              >
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12.5" cy="12.5" r="11.5" transform="matrix(-1 0 0 1 25 0)" stroke="#CACACA" strokeWidth="2" className="group-hover:stroke-[#9A9A9A] transition duration-100" />
                  <path d="M10.2677 18.7359C10.0963 18.5667 10 18.3373 10 18.098C10 17.8588 10.0963 17.6294 10.2677 17.4602L14.7932 12.9946L10.2677 8.52889C10.1011 8.35874 10.009 8.13086 10.0111 7.89431C10.0132 7.65777 10.1093 7.4315 10.2788 7.26423C10.4483 7.09697 10.6776 7.00209 10.9173 7.00003C11.1571 6.99798 11.388 7.08891 11.5604 7.25325L16.7323 12.3567C16.9037 12.5259 17 12.7553 17 12.9946C17 13.2338 16.9037 13.4632 16.7323 13.6324L11.5604 18.7359C11.389 18.905 11.1565 19 10.9141 19C10.6716 19 10.4391 18.905 10.2677 18.7359Z" fill="#9A9A9A" className="group-hover:fill-[#232725] transition duration-100" />
                </svg>
              </button>
            </div>
            <span className="text-[18px] font-semibold text-black">{monthYearLabel}</span>
            <Tooltip content="Add new task" side="left">
              <button
                onClick={() => setIsTaskDrawerOpen(true)}
                className="flex items-center justify-center bg-[#1C2745] rounded-full size-[29px] hover:opacity-80 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M11 6.28571H6.28571V11H4.71429V6.28571H0V4.71429H4.71429V0H6.28571V4.71429H11V6.28571Z" fill="white" />
                </svg>
              </button>
            </Tooltip>
          </div>

          <div className="px-10">
            {/* Day Labels */}
            <div className="flex justify-between mb-1">
              {dayLabels.map((day) => (
                <div key={day} className="flex-1 text-center">
                  <span className="text-[14px] font-semibold text-[#535352]">{day}</span>
                </div>
              ))}
            </div>

            {/* Date Numbers */}
            <div className="flex justify-between">
              {weekDates.map((date, index) => {
                const isDateSelected = selectedDate.getDate() === date.getDate() &&
                  selectedDate.getMonth() === date.getMonth() &&
                  selectedDate.getFullYear() === date.getFullYear();
                return (
                  <div key={index} className="flex-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => updateSelectedDate(date)}
                      className={`w-[25px] h-[25px] rounded-full flex items-center justify-center transition-opacity ${isDateSelected
                        ? 'bg-[#008080] hover:opacity-80'
                        : 'hover:opacity-70'
                        }`}
                    >
                      <span className={`text-[16px] font-semibold ${isDateSelected ? 'text-white' : 'text-black'
                        }`}>{date.getDate()}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="h-0 border-t border-[#E6E6E6] mb-3"></div>

        {/* Task Grid with Custom Scrollbar */}
        <div className="relative max-h-[calc(200px)] overflow-hidden rounded-[5px] flex-1">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto pr-[30px] scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-[#535352]">No tasks available</div>
            ) : (
              <div className="flex gap-3 w-full">
                {/* Left Column */}
                <div className="w-1/2 flex-shrink-0 min-w-0">
                  <div className="flex flex-col gap-3.5">
                    {leftColumnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="w-1/2 flex-shrink-0 min-w-0">
                  <div className="flex flex-col gap-3.5">
                    {rightColumnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLoadingMore && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center text-[12px] text-[#535352]">
              Loading more...
            </div>
          )}

          {!hasMore && filteredTasks.length > 0 && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center text-[11px] text-[#9A9A9A]">
              End of tasks
            </div>
          )}

          {/* Custom Scrollbar */}
          <div className="absolute right-0 top-0 w-[7px] h-full pointer-events-none">
            <div className="relative w-full h-full">
              {/* Track */}
              <div className="absolute inset-0 bg-[#dddddc] rounded-[10px]"></div>
              {/* Thumb */}
              <div
                ref={scrollbarThumbRef}
                className="absolute left-0 right-0 bg-[#8a8a89] rounded-[10px] transition-top duration-100"
                style={{ minHeight: '20px', top: '0px' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <TaskDrawer
        isOpen={isTaskDrawerOpen}
        task={null}
        onClose={() => setIsTaskDrawerOpen(false)}
        onSubmit={onSubmit}
      />
    </DashboardWidget>
  );
};

export default MyTasksWidget;

