import React, { useMemo } from 'react';
import FilterPopover, { type FilterState } from '../common/FilterPopover';
import type { LectureFilterState, Lecture } from './types';

interface LectureFilterProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    onApply: (filters: LectureFilterState) => void;
    onReset: () => void;
    lectures?: Lecture[];
}

const LectureFilter: React.FC<LectureFilterProps> = ({
    isOpen,
    onClose,
    triggerRef,
    onApply,
    onReset,
    lectures = [],
}) => {
    // Extract unique venues, modules, and batch codes from lectures
    const venues = useMemo(() => {
        const uniqueVenues = new Set<string>();
        lectures.forEach((lecture) => {
            if (lecture.venue) {
                uniqueVenues.add(lecture.venue);
            }
        });
        return Array.from(uniqueVenues).sort();
    }, [lectures]);

    const modules = useMemo(() => {
        const uniqueModules = new Set<string>();
        lectures.forEach((lecture) => {
            if (lecture.module) {
                uniqueModules.add(lecture.module);
            }
        });
        return Array.from(uniqueModules).sort();
    }, [lectures]);

    const batchCodes = useMemo(() => {
        const uniqueBatchCodes = new Set<string>();
        lectures.forEach((lecture) => {
            if (lecture.batchCode) {
                uniqueBatchCodes.add(lecture.batchCode);
            }
        });
        return Array.from(uniqueBatchCodes).sort();
    }, [lectures]);

    const handleApply = (filters: FilterState) => {
        const lectureFilters: LectureFilterState = {
            venue: filters.venues?.length ? filters.venues : undefined,
            module: filters.modules?.length ? filters.modules : undefined,
            batchCode: filters.batchCodes?.length ? filters.batchCodes : undefined,
            date: filters.singleDate,
        };

        onApply(lectureFilters);
    };

    const filterConfig = [
        { type: 'venueSelection' as const, title: 'Venue', id: 'venue' },
        { type: 'moduleSelection' as const, title: 'Module', id: 'module' },
        { type: 'batchCodeSelection' as const, title: 'Batch Code', id: 'batchCode' },
        { type: 'singleDate' as const, title: 'Date', id: 'date' },
    ];

    return (
        <FilterPopover
            isOpen={isOpen}
            onClose={onClose}
            triggerRef={triggerRef}
            onApply={handleApply}
            onReset={onReset}
            filterConfig={filterConfig}
            venues={venues}
            modules={modules}
            batchCodes={batchCodes}
        />
    );
};

export default LectureFilter;
