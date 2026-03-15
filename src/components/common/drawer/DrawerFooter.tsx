import React from 'react';
import { cn } from '../../../lib/utils/cn';

interface DrawerFooterProps {
    children: React.ReactNode;
    className?: string;
}

const DrawerFooter: React.FC<DrawerFooterProps> = ({
    children,
    className,
}) => {
    return (
        <div className={cn("px-6 pt-5 pb-6 flex items-center justify-end gap-3 shrink-0", className)}>
            {children}
        </div>
    );
};

export default DrawerFooter;
