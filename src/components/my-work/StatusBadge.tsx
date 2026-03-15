import React from 'react';
import { cn } from '../../lib/utils/cn';
import type { TaskStatus } from './types';

interface StatusBadgeProps {
    status: TaskStatus;
    className?: string;
    isSelected?: boolean;
    onClick?: () => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, isSelected = false, onClick }) => {
    switch (status) {
        case 'todo':
            return (
                <div className={cn('relative', className)}>
                    <div
                        onClick={onClick}
                        className={cn(
                            "ps-1 h-[28px] w-[83px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#232725]",
                            onClick ? "cursor-pointer" : "cursor-default"
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.16667 4.16602H3.83333C3.3731 4.16602 3 4.53911 3 4.99935V8.33268C3 8.79292 3.3731 9.16602 3.83333 9.16602H7.16667C7.6269 9.16602 8 8.79292 8 8.33268V4.99935C8 4.53911 7.6269 4.16602 7.16667 4.16602Z" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 14.1667L4.66667 15.8333L8 12.5M11.3333 5H18M11.3333 10H18M11.3333 15H18" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        To do
                        {isSelected && <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]" />}
                    </div>
                </div>
            );

        case 'in-progress':
            return (
                <div className={cn('relative', className)}>
                    <div
                        onClick={onClick}
                        className={cn(
                            "ps-1 h-[28px] w-[119px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#1e88e5]",
                            onClick ? "cursor-pointer" : "cursor-default"
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M9.99999 19C8.76999 19 7.6075 18.7636 6.5125 18.2908C5.4175 17.818 4.4614 17.173 3.6442 16.3558C2.827 15.5386 2.182 14.5825 1.7092 13.4875C1.2364 12.3925 1 11.23 1 10C1 8.755 1.2364 7.5889 1.7092 6.5017C2.182 5.4145 2.827 4.462 3.6442 3.6442C4.4614 2.8264 5.4175 2.1814 6.5125 1.7092C7.6075 1.237 8.76999 1.0006 9.99999 1C10.255 1 10.4689 1.0864 10.6417 1.2592C10.8145 1.432 10.9006 1.6456 10.9 1.9C10.8994 2.1544 10.813 2.3683 10.6408 2.5417C10.4686 2.7151 10.255 2.8012 9.99999 2.8C8.005 2.8 6.3061 3.5014 4.9033 4.9042C3.5005 6.307 2.7994 8.0056 2.8 10C2.8006 11.9944 3.502 13.6933 4.9042 15.0967C6.3064 16.5001 8.005 17.2012 9.99999 17.2C11.995 17.1988 13.6939 16.4977 15.0967 15.0967C16.4995 13.6957 17.2006 11.9968 17.2 10C17.2 9.745 17.2864 9.5314 17.4592 9.3592C17.632 9.187 17.8456 9.1006 18.1 9.1C18.3544 9.0994 18.5683 9.1858 18.7417 9.3592C18.9151 9.5326 19.0012 9.7462 19 10C19 11.23 18.7636 12.3925 18.2908 13.4875C17.818 14.5825 17.173 15.5389 16.3558 16.3567C15.5386 17.1745 14.5861 17.8195 13.4983 18.2917C12.4105 18.7639 11.2444 19 9.99999 19Z" fill="white" />
                        </svg>
                        In Progress
                        {isSelected && <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]" />}
                    </div>
                </div>
            );

        case 'completed':
            return (
                <div className={cn('relative', className)}>
                    <div
                        onClick={onClick}
                        className={cn(
                            "ps-1 h-[28px] w-[118px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#607d8b]",
                            onClick ? "cursor-pointer" : "cursor-default"
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M9.99961 2.63629C9.03264 2.63629 8.07515 2.82675 7.18179 3.19679C6.28843 3.56683 5.47671 4.10921 4.79296 4.79296C4.10921 5.47671 3.56683 6.28843 3.19679 7.18179C2.82675 8.07515 2.63629 9.03264 2.63629 9.99961C2.63629 10.9666 2.82675 11.9241 3.19679 12.8174C3.56683 13.7108 4.10921 14.5225 4.79296 15.2063C5.47671 15.89 6.28843 16.4324 7.18179 16.8024C8.07515 17.1725 9.03264 17.3629 9.99961 17.3629C11.9525 17.3629 13.8254 16.5871 15.2063 15.2063C16.5871 13.8254 17.3629 11.9525 17.3629 9.99961C17.3629 8.04674 16.5871 6.17385 15.2063 4.79296C13.8254 3.41207 11.9525 2.63629 9.99961 2.63629ZM1 9.99961C1 5.02937 5.02937 1 9.99961 1C14.9698 1 18.9992 5.02937 18.9992 9.99961C18.9992 14.9698 14.9698 18.9992 9.99961 18.9992C5.02937 18.9992 1 14.9698 1 9.99961Z" fill="white" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M14.5888 7.54358L8.26784 13.8646L5.0918 10.0741L6.32802 9.00233L8.35375 11.465L13.432 6.38672L14.5888 7.54358Z" fill="white" />
                        </svg>
                        Completed
                        {isSelected && <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]" />}
                    </div>
                </div>
            );

        case 'overdue':
            return (
                <div className={cn('relative', className)}>
                    <div
                        onClick={onClick}
                        className={cn(
                            "ps-1 h-[28px] w-[100px] rounded-[25px] text-[14px] font-semibold text-white transition-all border-2 flex justify-start items-center gap-[5px] bg-[#d93025]",
                            onClick ? "cursor-pointer" : "cursor-default"
                        )}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.16667 4.16602H3.83333C3.3731 4.16602 3 4.53911 3 4.99935V8.33268C3 8.79292 3.3731 9.16602 3.83333 9.16602H7.16667C7.6269 9.16602 8 8.79292 8 8.33268V4.99935C8 4.53911 7.6269 4.16602 7.16667 4.16602Z" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 14.1667L4.66667 15.8333L8 12.5M11.3333 5H18M11.3333 10H18M11.3333 15H18" stroke="#FFB74D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Overdue
                        {isSelected && <div className="absolute -top-[2px] -left-[2px] border-2 border-[#CACACA] rounded-[25px] w-[calc(100%+4px)] h-[calc(100%+4px)]" />}
                    </div>
                </div>
            );

        default:
            return null;
    }
};

export default StatusBadge;
