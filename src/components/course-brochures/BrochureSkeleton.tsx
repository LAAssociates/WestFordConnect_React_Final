import React from 'react';
import { Skeleton } from '../common/Skeleton';

const BrochureSkeleton: React.FC = () => {
  return (
    <article className="flex flex-col gap-4 p-[20px] border-b border-[#E6E6E6] lg:flex-row lg:items-stretch">
      {/* Image Skeleton */}
      <div className="flex w-full justify-center sm:w-[122.875px] sm:justify-start">
        <Skeleton className="h-[200px] w-[140px] sm:h-[175px] sm:w-[122.875px]" />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-[10px] sm:flex-row sm:items-start sm:justify-between flex-1">
          <div className="flex flex-col gap-[10px] w-full">
            {/* Title */}
            <Skeleton className="h-6 w-3/4 sm:w-1/2" />
            
            {/* Badge */}
            <Skeleton className="h-5 w-24 rounded-full" />
            
            {/* Description lines */}
            <div className="space-y-2 mt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-auto">
          <Skeleton className="h-9 w-full sm:w-28 rounded-full" />
          <Skeleton className="h-9 w-full sm:w-24 rounded-full" />
        </div>
      </div>
    </article>
  );
};

export default BrochureSkeleton;
