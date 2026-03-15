import React from 'react';
import MiniCalendar from '../my-work/MiniCalendar';
import PinnedStaff from './PinnedStaff';
import type { User } from '../my-work/types';

interface CalendarSidebarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    actionButtons?: React.ReactNode;
    actionButtonsPosition?: 'top' | 'bottom';
    pinnedStaff?: User[];
    onAddStaff?: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
    selectedDate,
    onSelectDate,
    actionButtons,
    actionButtonsPosition = 'top',
    pinnedStaff,
    onAddStaff,
}) => {
    return (
        <div className="border-r-2 border-[#e6e6e6] w-[18%] flex flex-col">
            {/* Action Buttons - Top Position (Calendar page) */}
            {actionButtons && actionButtonsPosition === 'top' && (
                <div className="p-[20px] py-[25px] flex flex-col gap-[25px] border-b border-[#E6E6E6]">
                    {actionButtons}
                </div>
            )}

            {/* Mini Calendar */}
            <div className="py-[25px] px-5 border-b border-[#E6E6E6]">
                <MiniCalendar selectedDate={selectedDate} onSelectDate={onSelectDate} />
            </div>

            {/* Action Buttons - Bottom Position (LecturesCalendarWeek) */}
            {actionButtons && actionButtonsPosition === 'bottom' && (
                <div className="p-[20px] pt-[25px] flex flex-col gap-[25px]">
                    {actionButtons}
                </div>
            )}

            {/* Pinned Staff (Calendar page only) */}
            {pinnedStaff !== undefined && (
                <div className="flex-1 overflow-hidden">
                    <PinnedStaff pinnedStaff={pinnedStaff} onAddStaff={onAddStaff} />
                </div>
            )}
        </div>
    );
};

export default CalendarSidebar;
