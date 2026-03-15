import React from 'react';
import { Skeleton } from '../common/Skeleton';

interface PostCardSkeletonProps {
    compact?: boolean;
}

export const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({ compact = false }) => {
    if (compact) {
        return (
            <div className="relative bg-[#fbfbfb] border border-[#ebebeb] border-solid rounded-[5px] p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.10)]">
                <div className="mb-[5px]">
                    <Skeleton className="w-16 h-5 rounded-[25px]" />
                </div>
                <Skeleton className="w-3/4 h-5 mb-[5px]" />
                <div className="mb-[15px] space-y-1">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-2/3 h-3" />
                </div>
                <div className="flex items-center justify-between">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-24 h-8 rounded-[25px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fbfbfb] border border-[#ebebeb] border-solid rounded-[5px] p-5 relative overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.10)]">
            <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-5" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-24 h-4" />
                        <div className="w-3 h-0 border-t border-gray-300 rotate-90" />
                        <Skeleton className="w-20 h-4" />
                    </div>
                </div>
            </div>

            <div className="my-3">
                <Skeleton className="w-20 h-5 rounded-[25px]" />
            </div>

            <Skeleton className="w-3/4 h-6 mb-2" />
            <div className="space-y-2 mb-4">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-2/3 h-4" />
            </div>

            <div className="flex items-center justify-center gap-3 pt-6">
                <div className="flex gap-2">
                    <Skeleton className="w-12 h-8 rounded-full" />
                    <Skeleton className="w-12 h-8 rounded-full" />
                    <Skeleton className="w-12 h-8 rounded-full" />
                </div>
                <Skeleton className="flex-1 max-w-[420px] h-12 rounded-[10px]" />
            </div>
        </div>
    );
};

export default PostCardSkeleton;
