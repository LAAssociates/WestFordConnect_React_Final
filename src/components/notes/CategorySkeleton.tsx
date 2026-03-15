import React from 'react';
import { Skeleton } from '../common/Skeleton';

const CategorySkeleton: React.FC = () => {
    return (
        <Skeleton className="h-[32px] w-[100px] rounded-[25px]" />
    );
};

export default CategorySkeleton;
