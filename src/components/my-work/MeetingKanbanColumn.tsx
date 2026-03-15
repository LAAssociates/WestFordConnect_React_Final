import React, { useRef, useState } from 'react';
import type { Meeting, TaskSortOption } from './types';
import MeetingCard from './MeetingCard';
import TaskSort from './TaskSort';

interface MeetingKanbanColumnProps {
    title: string;
    meetings: Meeting[];
    icon?: React.ReactNode;
    accentColor?: string;
    onMeetingClick?: (meeting: Meeting) => void;
    onSortChange?: (sort: TaskSortOption) => void;
    selectedSort?: TaskSortOption;
    searchTerm?: string;
}

const MeetingKanbanColumn: React.FC<MeetingKanbanColumnProps> = ({
    title,
    meetings,
    icon,
    accentColor = '#E6E6E6',
    onMeetingClick,
    onSortChange,
    selectedSort = 'due-nearest-first',
    searchTerm,
}) => {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="border-2 border-[#E6E6E6] rounded-[10px] flex flex-col overflow-auto">
            {/* Column Header */}
            <div className="mb-[16px] relative">
                <div className="flex items-center justify-between px-5 py-[15px]">
                    <div className="flex items-center gap-[10px]">
                        {icon && <div className="w-5 h-5">{icon}</div>}
                        <h2 className="text-[18px] font-semibold text-black">{title}</h2>
                    </div>
                    <button
                        ref={sortButtonRef}
                        type="button"
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer rounded-full bg-[#CACACA] hover:bg-[#BDBDBD] transition-colors"
                        aria-label="Sort"
                    >
                        <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.24063 8.42789C0.394703 8.58196 0.603671 8.66852 0.821563 8.66852H6.84636C7.06425 8.66852 7.27322 8.58196 7.42729 8.42789C7.58136 8.27381 7.66792 8.06485 7.66792 7.84695C7.66792 7.62906 7.58136 7.42009 7.42729 7.26602C7.27322 7.11195 7.06425 7.02539 6.84636 7.02539H0.821563C0.603671 7.02539 0.394703 7.11195 0.24063 7.26602C0.0865571 7.42009 0 7.62906 0 7.84695C0 8.06485 0.0865571 8.27381 0.24063 8.42789Z" fill="black" />
                            <path d="M0.821563 12.8111C0.603671 12.8111 0.394703 12.7245 0.24063 12.5705C0.0865571 12.4164 0 12.2074 0 11.9895C0 11.7716 0.0865571 11.5627 0.24063 11.4086C0.394703 11.2545 0.603671 11.168 0.821563 11.168H9.91907C10.137 11.168 10.3459 11.2545 10.5 11.4086C10.6541 11.5627 10.7406 11.7716 10.7406 11.9895C10.7406 12.2074 10.6541 12.4164 10.5 12.5705C10.3459 12.7245 10.137 12.8111 9.91907 12.8111H0.821563Z" fill="black" />
                            <path d="M0.24063 4.28335C0.394703 4.43743 0.603671 4.52398 0.821563 4.52398H4.65552C4.87341 4.52398 5.08238 4.43743 5.23645 4.28335C5.39053 4.12928 5.47708 3.92031 5.47708 3.70242C5.47708 3.48453 5.39053 3.27556 5.23645 3.12149C5.08238 2.96742 4.87341 2.88086 4.65552 2.88086H0.821563C0.603671 2.88086 0.394703 2.96742 0.24063 3.12149C0.0865571 3.27556 0 3.48453 0 3.70242C0 3.92031 0.0865571 4.12928 0.24063 4.28335Z" fill="black" />
                            <path d="M13.9991 13.9991C14.1532 13.845 14.2398 13.636 14.2398 13.4181V2.80354L16.6716 5.23537C16.8273 5.38049 17.0333 5.4595 17.2462 5.45574C17.459 5.45199 17.6621 5.36576 17.8126 5.21524C17.9631 5.06471 18.0493 4.86164 18.0531 4.6488C18.0569 4.43596 17.9779 4.22997 17.8327 4.07423L13.9988 0.240269C13.8447 0.0864168 13.6359 0 13.4182 0C13.2005 0 12.9917 0.0864168 12.8376 0.240269L9.00367 4.07423C8.92296 4.14944 8.85821 4.24014 8.81331 4.34092C8.76841 4.4417 8.74426 4.55049 8.74232 4.6608C8.74037 4.77111 8.76066 4.88068 8.80198 4.98298C8.8433 5.08528 8.9048 5.17821 8.98282 5.25622C9.06083 5.33424 9.15376 5.39574 9.25606 5.43706C9.35836 5.47838 9.46793 5.49867 9.57824 5.49673C9.68855 5.49478 9.79735 5.47064 9.89812 5.42573C9.9989 5.38083 10.0896 5.31609 10.1648 5.23537L12.5966 2.80354V13.4181C12.5966 13.636 12.6832 13.845 12.8373 13.9991C12.9913 14.1531 13.2003 14.2397 13.4182 14.2397C13.6361 14.2397 13.8451 14.1531 13.9991 13.9991Z" fill="black" />
                        </svg>
                    </button>
                </div>

                <div className="h-2.5 mx-5 rounded-full" style={{ backgroundColor: accentColor }} />

                {/* Sort Dropdown */}
                <TaskSort
                    isOpen={isSortOpen}
                    onClose={() => setIsSortOpen(false)}
                    triggerRef={sortButtonRef}
                    selectedSort={selectedSort}
                    onSortChange={(sort) => {
                        onSortChange?.(sort);
                        setIsSortOpen(false);
                    }}
                />
            </div>

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto px-[15px]">
                {meetings.length === 0 ? (
                    <div className="text-center py-8 text-[#535352] text-sm">No meetings</div>
                ) : (
                    meetings.map((meeting) => (
                        <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            onClick={onMeetingClick}
                            searchTerm={searchTerm}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default MeetingKanbanColumn;

