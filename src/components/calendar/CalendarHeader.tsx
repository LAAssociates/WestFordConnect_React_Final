import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { ViewType } from './types';
import { formatDateHeader } from './utils';

interface CalendarHeaderProps {
    viewType: ViewType;
    currentDate: Date;
    onViewChange: (view: ViewType) => void;
    onToday: () => void;
    onPrevious: () => void;
    onNext: () => void;
    // Optional search functionality (for LecturesCalendarWeek)
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    searchPlaceholder?: string;
    // Optional filter functionality (for LecturesCalendarWeek)
    onFilterClick?: () => void;
    filterButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    viewType,
    currentDate,
    onViewChange,
    onToday,
    onPrevious,
    onNext,
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Start typing to look up events',
    onFilterClick,
    filterButtonRef,
}) => {
    const internalFilterRef = useRef<HTMLButtonElement | null>(null);
    const filterRef = filterButtonRef || internalFilterRef;

    return (
        <div className="border-b-2 border-[#e6e6e6] px-[20px] py-[15px] flex items-center justify-between">
            {/* View Toggles */}
            <div className="flex items-center gap-[5px]">
                <button
                    type="button"
                    onClick={() => onViewChange('day')}
                    className={cn(
                        'px-[15px] py-[5px] rounded-[25px] text-[14px] font-semibold transition cursor-pointer',
                        viewType === 'day'
                            ? 'bg-[#1e88e5] text-white'
                            : 'bg-[#232725] text-white hover:opacity-90'
                    )}
                >
                    Day
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('week')}
                    className={cn(
                        'px-[15px] py-[5px] rounded-[25px] text-[14px] font-semibold transition cursor-pointer',
                        viewType === 'week'
                            ? 'bg-[#1e88e5] text-white'
                            : 'bg-[#232725] text-white hover:opacity-90'
                    )}
                >
                    Week
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('month')}
                    className={cn(
                        'px-[15px] py-[5px] rounded-[25px] text-[14px] font-semibold transition cursor-pointer',
                        viewType === 'month'
                            ? 'bg-[#1e88e5] text-white'
                            : 'bg-[#232725] text-white hover:opacity-90'
                    )}
                >
                    Month
                </button>
            </div>

            {/* Search and Filter (optional) */}
            {(searchTerm !== undefined || onFilterClick) && (
                <div className="flex items-center gap-[15px]">
                    {searchTerm !== undefined && onSearchChange && (
                        <div className="relative w-[399px]">
                            <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-black pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="bg-[#e6e6e6] border border-[#cacaca] h-[40px] w-full pl-[43px] pr-4 rounded-[25px] text-[14px] font-medium text-black placeholder:text-black focus:outline-none"
                            />
                        </div>
                    )}
                    {onFilterClick && (
                        <button
                            ref={filterRef}
                            type="button"
                            onClick={onFilterClick}
                            className="shrink-0 rounded-full flex h-[32px] w-[32px] items-center justify-center cursor-pointer transition-colors bg-[#DE4A2C]"
                            aria-label="Filter"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M1.61274 1.6L6.84029 8.0808C7.06912 8.36466 7.1937 8.71734 7.19353 9.0808V14.4L8.80647 13.2V9.08C8.80648 8.71682 8.93105 8.36445 9.15971 8.0808L14.3873 1.6H1.61274ZM1.61274 0H14.3873C14.6911 3.76005e-05 14.9888 0.0852189 15.246 0.245733C15.5032 0.406246 15.7094 0.635563 15.841 0.90727C15.9725 1.17898 16.0241 1.48202 15.9896 1.7815C15.9551 2.08097 15.8361 2.3647 15.6462 2.6L10.4194 9.08V13.2C10.4194 13.4484 10.3611 13.6934 10.2491 13.9155C10.1371 14.1377 9.97456 14.331 9.77424 14.48L8.16129 15.68C7.92166 15.8583 7.63671 15.9669 7.33838 15.9935C7.04005 16.0202 6.74012 15.964 6.4722 15.8311C6.20428 15.6982 5.97896 15.4939 5.82148 15.2412C5.664 14.9884 5.58058 14.6971 5.58058 14.4V9.08L0.353841 2.6C0.163928 2.3647 0.0448808 2.08097 0.010412 1.7815C-0.0240568 1.48202 0.0274547 1.17898 0.159013 0.90727C0.290572 0.635563 0.496826 0.406246 0.754019 0.245733C1.01121 0.0852189 1.30888 3.76005e-05 1.61274 0Z"
                                    fill="white"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-5">
                <span className="text-[18px] font-semibold text-black leading-normal">
                    {formatDateHeader(currentDate)}
                </span>
                <button
                    type="button"
                    onClick={onToday}
                    className="px-[15px] border-2 border-[#CACACA] rounded-[25px] text-[14px] font-semibold text-black hover:bg-[#1E88E5] hover:border-[#1E88E5] hover:text-white transition duration-300 h-[30px] cursor-pointer"
                >
                    Today
                </button>
                <div className="flex items-center gap-3 border-l-2 border-[#E6E6E6] pl-5">
                    <button
                        type="button"
                        onClick={onPrevious}
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                        aria-label="Previous"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="7"
                            height="12"
                            viewBox="0 0 7 12"
                            className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100"
                        >
                            <path d="M6.73232 11.7359C6.90372 11.5667 7 11.3373 7 11.098C7 10.8588 6.90372 10.6294 6.73232 10.4602L2.2068 5.99455L6.73232 1.52889C6.89886 1.35874 6.99101 1.13086 6.98893 0.894314C6.98684 0.657772 6.89069 0.4315 6.72118 0.264234C6.55167 0.0969667 6.32237 0.0020895 6.08266 3.43323e-05C5.84295 -0.00202179 5.612 0.0889101 5.43958 0.253245L0.267679 5.35673C0.0962842 5.52591 0 5.75533 0 5.99455C0 6.23377 0.0962842 6.4632 0.267679 6.63238L5.43958 11.7359C5.61102 11.905 5.84352 12 6.08595 12C6.32837 12 6.56087 11.905 6.73232 11.7359Z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                        aria-label="Next"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="7"
                            height="12"
                            viewBox="0 0 7 12"
                            className="fill-[#9A9A9A] group-hover:fill-[#232725] transition duration-100"
                        >
                            <path d="M0.267679 11.7359C0.0962844 11.5667 0 11.3373 0 11.098C0 10.8588 0.0962844 10.6294 0.267679 10.4602L4.7932 5.99455L0.267679 1.52889C0.101142 1.35874 0.00899076 1.13086 0.0110741 0.894314C0.0131569 0.657772 0.109307 0.4315 0.278816 0.264234C0.448325 0.0969667 0.67763 0.0020895 0.917343 3.43323e-05C1.15705 -0.00202179 1.388 0.0889101 1.56042 0.253245L6.73232 5.35673C6.90372 5.52591 7 5.75533 7 5.99455C7 6.23377 6.90372 6.4632 6.73232 6.63238L1.56042 11.7359C1.38898 11.905 1.15648 12 0.914052 12C0.671627 12 0.439126 11.905 0.267679 11.7359Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
