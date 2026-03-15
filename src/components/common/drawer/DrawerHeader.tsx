import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

interface DrawerHeaderProps {
    title: string;
    onClose: () => void;
    actions?: React.ReactNode;
    className?: string;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
    title,
    onClose,
    actions,
    className,
}) => {
    return (
        <div className={cn("px-8 pt-[15px] pb-[21px] flex items-center justify-between shrink-0", className)}>
            <div className="flex items-center gap-2.5">
                <div className="w-px h-5 border-2 border-[#DE4A2C] rounded-full" />
                <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <div className="flex items-center gap-2.5">
                {actions}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-[#F3F4F6] cursor-pointer transition"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default DrawerHeader;
