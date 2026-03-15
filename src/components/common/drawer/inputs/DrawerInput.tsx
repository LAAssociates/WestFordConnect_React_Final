import React from 'react';
import { cn } from '../../../../lib/utils/cn';

interface DrawerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    error?: string;
    containerClassName?: string;
}

const DrawerInput: React.FC<DrawerInputProps> = ({
    label,
    required,
    error,
    className,
    containerClassName,
    ...props
}) => {
    return (
        <div className={cn("flex items-start justify-between mb-6", containerClassName)}>
            <label className="text-[15px] font-semibold text-black block mt-3">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-col">
                <input
                    className={cn(
                        "w-[419px] rounded-[5px] border border-[#E6E6E6] px-4 py-2.5 text-sm text-[#111827] placeholder:text-[#535352] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 disabled:bg-gray-100 disabled:cursor-not-allowed",
                        error && "border-red-500 focus:ring-red-500/40",
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
            </div>
        </div>
    );
};

export default DrawerInput;
