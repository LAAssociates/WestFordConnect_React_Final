export type AudienceSegmentId = 'all' | 'individual-users' | 'project-groups';

export interface AudienceSegment {
    id: AudienceSegmentId;
    label: string;
}

export const audienceSegments: AudienceSegment[] = [
    { id: 'all', label: 'All Staff' },
    { id: 'individual-users', label: 'Individual Users' },
    { id: 'project-groups', label: 'Project Groups' },
];

// Search placeholders for each segment type
export const AUDIENCE_SEARCH_PLACEHOLDERS: Record<AudienceSegmentId, string> = {
    'all': '',
    'individual-users': 'Search people by name or email',
    'project-groups': 'Search groups by name',
};

// Empty state message when no search results found
export const AUDIENCE_EMPTY_STATE_MESSAGE = 'No matches found. Try a different search term.';

// Default message shown when "All Staff" is selected
export const AUDIENCE_ALL_STAFF_MESSAGE = 'This resource will be shared with all Westford staff.';

// Helper function to get search placeholder for a segment
export const getAudienceSearchPlaceholder = (segmentId: AudienceSegmentId): string => {
    return AUDIENCE_SEARCH_PLACEHOLDERS[segmentId] || '';
};

// Helper function to get audience segment by ID
export const getAudienceSegmentById = (id: AudienceSegmentId | undefined): AudienceSegment | undefined =>
    audienceSegments.find((segment) => segment.id === id);

