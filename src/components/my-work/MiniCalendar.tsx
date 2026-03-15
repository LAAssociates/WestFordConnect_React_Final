import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils/cn';

interface MiniCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onSelectDate }) => {
    const [visibleMonth, setVisibleMonth] = useState(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );

    useEffect(() => {
        setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }, [selectedDate]);

    const days = useMemo(() => {
        const startOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
        const endOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
        const startDay = startOfMonth.getDay();
        const totalDays = endOfMonth.getDate();
        const cells: Date[] = [];

        const totalCells = Math.ceil((startDay + totalDays) / 7) * 7;
        for (let i = 0; i < totalCells; i++) {
            const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), i - startDay + 1);
            cells.push(date);
        }

        return cells;
    }, [visibleMonth]);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const isCurrentMonth = (date: Date) =>
        date.getMonth() === visibleMonth.getMonth() && date.getFullYear() === visibleMonth.getFullYear();

    const monthLabel = `${visibleMonth.toLocaleDateString('en-US', {
        month: 'short',
    }).toUpperCase()} - ${visibleMonth.getFullYear()}`;

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-[16px]">
                <p className="text-[18px] font-semibold text-black">{monthLabel}</p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))
                        }
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                        aria-label="Previous week"
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
                        onClick={() =>
                            setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))
                        }
                        className="w-[25px] h-[25px] flex items-center justify-center cursor-pointer hover:border-[#9A9A9A] border-2 border-[#CACACA] rounded-full transition duration-300 group"
                        aria-label="Next week"
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
            <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-[#535352] mb-3">
                {dayLabels.map((label) => (
                    <span key={label}>{label}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-x-1 gap-y-3 text-center text-[12px]">
                {days.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                        <button
                            key={date.toISOString()}
                            type="button"
                            onClick={() => onSelectDate(date)}
                            className={cn(
                                'h-5 w-5 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-colors font-semibold',
                                isSelected ? 'bg-[#008080] text-white' : 'text-black hover:bg-[#E6E6E6]',
                                !isCurrentMonth(date) && 'text-[#9a9a9a]'
                            )}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MiniCalendar;




