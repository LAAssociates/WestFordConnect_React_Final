export type ResourceType = 'PDF' | 'PPTX' | 'ZIP' | 'Word' | 'PNG' | 'PPT' | 'Excel' | 'Slides' | 'Fldr' | 'URL';

export interface Resource {
    id: string;
    title: string;
    category: string;
    type: ResourceType;
    size: string; // e.g., "26.1 MB"
    uploadedOn: Date;
    uploadedBy: {
        id: string;
        name: string;
        avatar?: string;
    };
    lastModifiedOn: Date;
    previewImage?: string;
    audience?: Array<{ id: string; name: string; avatar?: string }>;
    description?: string;
}

export interface ResourceCategory {
    id: string;
    name: string;
    icon: string;
    code?: string;
    count?: number;
}

export type ResourceSortOption = 'title-az' | 'title-za' | 'date-newest' | 'date-oldest' | 'size-largest' | 'size-smallest';

export type ViewMode = 'list' | 'grid';



