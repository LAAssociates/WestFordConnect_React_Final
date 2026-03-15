import React, { useState, useEffect } from 'react';
import DashboardWidget from './DashboardWidget';

export interface TodayData {
    userName: string;
    currentDate: Date;
    checkInTime: string | null;
    checkOutTime: string | null;
    daysAtWestford: number;
    currentTime: Date;
}

interface TodayWidgetProps {
    data?: TodayData;
}

const TodayWidget: React.FC<TodayWidgetProps> = ({ data }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const defaultData: TodayData = {
        userName: '',
        currentDate: new Date(),
        checkInTime: null,
        checkOutTime: null,
        daysAtWestford: 0,
        currentTime: currentTime,
    };

    const todayData = data || defaultData;

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date: Date): string => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    return (
        <DashboardWidget title="Today">
            <div className="bg-white border-[3px] border-[#BEC9E3] rounded-[10px] px-[10px] py-[21px]">
                <div className="space-y-[6px]">
                    {/* Greeting and Date */}
                    <div className="px-[10px]">
                        <h3 className="text-[18px] font-semibold text-black leading-normal mb-2.5">
                            {getGreeting()}, {todayData.userName}
                        </h3>
                        <p className="text-[14px] font-normal text-[#535352] leading-normal">
                            {formatDate(todayData.currentDate)}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#E6E6E6]"></div>

                    {/* Current Time */}
                    <div className="flex items-center gap-2.5 px-[10px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84286 5.84344 2 7.87827 2 10C2 12.1217 2.84286 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1572 14.1566 18 12.1217 18 10C18 7.87827 17.1572 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2ZM10 4C10.2449 4.00003 10.4813 4.08996 10.6644 4.25272C10.8474 4.41547 10.9643 4.63975 10.993 4.883L11 5V9.586L13.707 12.293C13.8864 12.473 13.9905 12.7144 13.9982 12.9684C14.006 13.2223 13.9168 13.4697 13.7488 13.6603C13.5807 13.8508 13.3465 13.9703 13.0935 13.9944C12.8406 14.0185 12.588 13.9454 12.387 13.79L12.293 13.707L9.293 10.707C9.13758 10.5514 9.03776 10.349 9.009 10.131L9 10V5C9 4.73478 9.10536 4.48043 9.2929 4.29289C9.48043 4.10536 9.73479 4 10 4Z" fill="black" />
                        </svg>
                        <span className="text-[14px] font-normal text-[#535352] leading-normal">
                            {formatTime(currentTime)}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#E6E6E6]"></div>

                    {/* Days at Westford */}
                    <div className="flex items-center gap-2.5 px-[10px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M6.99967 19V15C6.14967 14.9333 5.31634 14.8417 4.49968 14.725C3.68301 14.6083 2.86634 14.4583 2.04967 14.275C1.76634 14.2083 1.54134 14.05 1.37467 13.8C1.20801 13.55 1.16634 13.2833 1.24967 13C1.33301 12.7167 1.50401 12.5083 1.76267 12.375C2.02134 12.2417 2.29201 12.2083 2.57467 12.275C3.79134 12.5583 5.02067 12.75 6.26267 12.85C7.50467 12.95 8.75034 13 9.99968 13C11.249 13 12.495 12.95 13.7377 12.85C14.9803 12.75 16.2093 12.5583 17.4247 12.275C17.7247 12.2083 17.9997 12.2417 18.2497 12.375C18.4997 12.5083 18.6663 12.7167 18.7497 13C18.833 13.2833 18.7873 13.55 18.6127 13.8C18.438 14.05 18.2087 14.2083 17.9247 14.275C17.108 14.4583 16.2913 14.6083 15.4747 14.725C14.658 14.8417 13.833 14.9333 12.9997 15V19C12.9997 19.2833 12.904 19.521 12.7127 19.713C12.5213 19.905 12.2837 20.0007 11.9997 20H7.99968C7.71634 20 7.47901 19.904 7.28768 19.712C7.09634 19.52 7.00034 19.2827 6.99967 19ZM9.99968 12C9.43301 12 8.95801 11.8083 8.57468 11.425C8.19134 11.0417 7.99968 10.5667 7.99968 10C7.99968 9.45 8.19134 8.97933 8.57468 8.588C8.95801 8.19667 9.43301 8.00067 9.99968 8C10.5497 8 11.0207 8.196 11.4127 8.588C11.8047 8.98 12.0003 9.45067 11.9997 10C11.9997 10.5667 11.804 11.0417 11.4127 11.425C11.0213 11.8083 10.5503 12 9.99968 12Z" fill="black" />
                            <path d="M15.7083 9.29167C16.1806 9.76389 16.7778 10 17.5 10C18.1956 10 18.7861 9.76389 19.2717 9.29167C19.7572 8.81944 20 8.22222 20 7.5C20.0011 6.80667 19.7583 6.21667 19.2717 5.73C18.785 5.24333 18.1944 5 17.5 5C16.7778 5.00111 16.1806 5.24444 15.7083 5.73C15.2361 6.21556 15 6.80556 15 7.5C15 8.22222 15.2361 8.81944 15.7083 9.29167Z" fill="#1C2745" />
                            <path d="M11.7083 4.29167C12.1806 4.76389 12.7778 5 13.5 5C14.1956 5 14.7861 4.76389 15.2717 4.29167C15.7572 3.81944 16 3.22222 16 2.5C16.0011 1.80667 15.7583 1.21667 15.2717 0.73C14.785 0.243333 14.1944 0 13.5 0C12.7778 0.00111111 12.1806 0.244444 11.7083 0.73C11.2361 1.21556 11 1.80556 11 2.5C11 3.22222 11.2361 3.81944 11.7083 4.29167Z" fill="#8C2036" />
                            <path d="M4.70833 4.29167C5.18056 4.76389 5.77778 5 6.5 5C7.19555 5 7.78611 4.76389 8.27166 4.29167C8.75722 3.81944 9 3.22222 9 2.5C9.00111 1.80667 8.75833 1.21667 8.27166 0.73C7.785 0.243333 7.19444 0 6.5 0C5.77778 0.00111111 5.18056 0.244444 4.70833 0.73C4.23611 1.21556 4 1.80556 4 2.5C4 3.22222 4.23611 3.81944 4.70833 4.29167Z" fill="#DE4A2C" />
                            <path d="M0.708333 9.29167C1.18055 9.76389 1.77778 10 2.5 10C3.19555 10 3.78611 9.76389 4.27166 9.29167C4.75722 8.81944 5 8.22222 5 7.5C5.00111 6.80667 4.75833 6.21667 4.27166 5.73C3.785 5.24333 3.19444 5 2.5 5C1.77778 5.00111 1.18055 5.24444 0.708333 5.73C0.236111 6.21556 0 6.80556 0 7.5C0 8.22222 0.236111 8.81944 0.708333 9.29167Z" fill="#535352" />
                        </svg>
                        <span className="text-[14px] font-normal text-[#535352] leading-normal">
                            {todayData.daysAtWestford.toLocaleString()} days at Westford
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#E6E6E6]"></div>

                    {/* Check-in/Check-out */}
                    <div className="flex items-center gap-[5px] h-[23px] mt-2.5">
                        <div className="flex items-center h-full flex-1">
                            <div className="flex items-center justify-center w-[38%] rounded-l-[25px] bg-[#008080] h-full">
                                <span className="text-[14px] font-semibold text-white leading-none">IN</span>
                            </div>
                            <div className="flex-1 border border-[#E6E6E6] rounded-r-[25px] ps-2.5 pr-[15px] h-full flex items-center justify-center">
                                <span className="text-[14px] font-medium text-black leading-none">
                                    {todayData.checkInTime || '--:--'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center h-full flex-1">
                            <div className="flex items-center justify-center w-[38%] rounded-l-[25px] bg-[#FFB74D] h-full">
                                <span className="text-[14px] font-semibold text-white leading-none">OUT</span>
                            </div>
                            <div className="flex-1 border border-[#E6E6E6] rounded-r-[25px] ps-2.5 pr-[15px] h-full flex items-center justify-center">
                                <span className="text-[14px] font-medium text-black leading-none">
                                    {todayData.checkOutTime || '--:--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardWidget>
    );
};

export default TodayWidget;

