import React, { useState, useRef, useEffect } from 'react';
import DateTimePicker from '../../DateTimePicker';
import { cn } from '../../../../lib/utils/cn';
import { formatToDateTimeOffset } from '../../../../utils/dateUtils';

interface DrawerDateTimePickerProps {
    label: string;
    required?: boolean;
    value: string;
    onChange: (isoString: string) => void;
    error?: string;
    containerClassName?: string;
    placeholder?: string;
}

const formatDateTimeForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${day} ${month}, ${displayHours}:${displayMinutes} ${ampm}`;
};

const DrawerDateTimePicker: React.FC<DrawerDateTimePickerProps> = ({
    label,
    required,
    value,
    onChange,
    error,
    containerClassName,
    placeholder = 'Select Date & Time',
}) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleSave = (date: Date) => {
        onChange(formatToDateTimeOffset(date));
        setOpen(false);
    };

    return (
        <div className={cn("flex items-start justify-between mb-6", containerClassName)}>
            <label className="text-[15px] font-semibold text-black mt-3">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div ref={dropdownRef} className="relative w-[419px]">
                <button
                    type="button"
                    className={cn(
                        "w-fit relative rounded-[5px] border border-[#E6E6E6] px-4 py-3 pr-10 text-sm focus:outline-none text-left flex items-center justify-between !cursor-default",
                        value ? 'text-[#111827]' : 'text-[#535352]',
                        error && "border-red-500"
                    )}
                >
                    <span>
                        {value ? formatDateTimeForDisplay(value) : placeholder}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        <path d="M4.10156 8.09961H5.90156V9.89961H4.10156V8.09961ZM4.10156 11.6996H5.90156V13.4996H4.10156V11.6996ZM7.70156 8.09961H9.50156V9.89961H7.70156V8.09961ZM7.70156 11.6996H9.50156V13.4996H7.70156V11.6996ZM11.3016 8.09961H13.1016V9.89961H11.3016V8.09961ZM11.3016 11.6996H13.1016V13.4996H11.3016V11.6996Z" fill="#008080" />
                        <path d="M2.3 18H14.9C15.8927 18 16.7 17.1927 16.7 16.2V3.6C16.7 2.6073 15.8927 1.8 14.9 1.8H13.1V0H11.3V1.8H5.9V0H4.1V1.8H2.3C1.3073 1.8 0.5 2.6073 0.5 3.6V16.2C0.5 17.1927 1.3073 18 2.3 18ZM14.9 5.4L14.9009 16.2H2.3V5.4H14.9Z" fill="#008080" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute right-0 mt-2 z-50">
                        <DateTimePicker
                            selectedDate={value ? new Date(value) : new Date()}
                            onSave={handleSave}
                            onCancel={() => setOpen(false)}
                        />
                    </div>
                )}
                {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
            </div>
        </div>
    );
};

export default DrawerDateTimePicker;
