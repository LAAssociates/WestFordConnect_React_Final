import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils/cn';
import Tooltip from '../ui/Tooltip';

interface SidebarNavItemProps {
    to: string;
    icon: string;
    targetBlank?: boolean;
    tooltip?: string;
    onNavigate?: () => void;
    badgeCount?: number;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ to, icon, targetBlank = false, tooltip, onNavigate, badgeCount }) => {
    const location = useLocation();
    const isActive = !targetBlank && location.pathname === to;

    const baseClasses = "flex items-center justify-center w-[63px] h-[63px] transition-all relative";
    const hoverClasses = "hover:bg-[#3D4A70] hover:shadow-[0px_4px_4px_0px_#00000040]";
    const activeClasses = "bg-[#3D4A70] shadow-[0px_4px_4px_0px_#00000040]";
    const iconClasses = "h-auto w-[18px] object-cover mx-auto";

    const linkProps = {
        className: cn(baseClasses, hoverClasses, isActive && activeClasses, 'cursor-pointer'),
        onClick: onNavigate,
        children: (
            <>
                <img src={icon} alt="menu" className={iconClasses} />
                {badgeCount !== undefined && badgeCount > 0 && (
                    <div className="absolute top-2 right-2 flex items-center justify-center bg-[#DE4A2C] text-white text-[13px] leading-normal font-semibold min-w-[21px] h-[21px] px-1 rounded-full">
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </div>
                )}
            </>
        )
    };

    const content = targetBlank ? (
        <a href={to} target="_blank" rel="noopener noreferrer" {...linkProps} />
    ) : (
        <Link to={to} {...linkProps} />
    );

    return tooltip ? (
        <Tooltip content={tooltip} side="right" delay={300}>
            {content}
        </Tooltip>
    ) : content;
};

export default SidebarNavItem;
