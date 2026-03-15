import React from 'react';
import { cn } from '../../../lib/utils/cn';
import MacScrollbar from '../MacScrollbar';

interface DrawerContentProps {
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

const DrawerContent: React.FC<DrawerContentProps> = ({
    children,
    footer,
    className,
}) => {
    return (
        <div className="flex flex-col bg-white rounded-[5px] m-[15px] mt-0 flex-1 overflow-hidden min-h-0">
            <MacScrollbar className="flex-1 overflow-y-auto">
                <div className={cn("p-[23px] pb-[15px] min-h-full", className)}>
                    {children}
                </div>
            </MacScrollbar>
            {footer}
        </div>
    );
};

export default DrawerContent;
