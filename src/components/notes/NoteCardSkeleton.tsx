import React from 'react';
import { Skeleton } from '../common/Skeleton';

const NoteCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white border border-[#e6e6e6] border-solid rounded-[5px] p-[10px] relative shadow-[0_2px_4px_rgba(0,0,0,0.10)] h-[180px]">
            <div className="flex flex-col gap-[10px]">
                {/* Header with Author Info */}
                <div className="flex flex-col gap-[10px]">
                    <div className="h-[48px] relative">
                        <Skeleton className="absolute left-0 top-0 size-[48px] rounded-full" />
                        <div className="absolute left-[58px] top-0">
                            <Skeleton className="h-[20px] w-[120px]" />
                        </div>
                        <div className="absolute left-[58px] top-[27px] flex items-center gap-[10px]">
                            <Skeleton className="h-[16px] w-[80px]" />
                            <div className="w-0 h-[14px] border-l-2 border-[#CACACA]"></div>
                            <Skeleton className="h-[16px] w-[60px]" />
                        </div>
                    </div>

                    {/* Title */}
                    <Skeleton className="h-[20px] w-full" />

                    {/* Content */}
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-[14px] w-full" />
                        <Skeleton className="h-[14px] w-[90%]" />
                        <Skeleton className="h-[14px] w-[80%]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteCardSkeleton;
