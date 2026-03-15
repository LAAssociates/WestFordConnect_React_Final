import React from 'react';
import { cn } from '../../lib/utils/cn';
import { Skeleton } from '../common/Skeleton';
import type { FilterCategory } from './types';

export type FilterSection = {
  id: string;
  title: string;
  categories: FilterCategory[];
};

type FilterSidebarProps = {
  sections: FilterSection[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
  loading?: boolean;
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({ sections, activeCategory, onSelect, loading = false }) => {
  if (loading) {
    return (
      <aside className="flex w-full flex-col gap-4 px-4 py-4 sm:px-5 lg:h-[calc(100dvh-264px)] lg:overflow-y-auto lg:px-5 lg:py-6">
        <div className="flex gap-2.5 overflow-x-auto pb-2 lg:flex-col lg:items-center lg:gap-2.5 lg:overflow-visible lg:pb-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="inline-flex w-full items-center gap-[8px] p-[10px]">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-5 w-4/5 rounded" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-full flex-col gap-4 px-4 py-4 sm:px-5 lg:h-[calc(100dvh-264px)] lg:overflow-y-auto lg:px-5 lg:py-6">
      {sections.map((section) => (
        <div
          key={section.id}
          className="flex gap-2.5 overflow-x-auto pb-2 lg:flex-col lg:items-center lg:gap-2.5 lg:overflow-visible lg:pb-0"
        >
          {section.categories.map((category) => {
            const isActive = activeCategory === category.id;

            return (
              <button
                type="button"
                key={category.id}
                onClick={() => onSelect(category.id)}
                className={cn(
                  'group inline-flex shrink-0 cursor-pointer items-center gap-[8px] rounded-[5px] border border-transparent p-[10px] text-[14px] font-semibold transition lg:w-full lg:shrink',
                  isActive
                    ? 'bg-[#42484B] text-white'
                    : 'bg-white text-black hover:bg-[#42484B] hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-[20px] items-center justify-center text-black transition',
                    category.id !== 'favorites' && isActive && 'filter-white',
                    category.id !== 'favorites' && 'group-hover:filter-white'
                  )}
                >
                  {category.icon}
                </span>
                <span className="whitespace-nowrap">{category.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

export default FilterSidebar;
