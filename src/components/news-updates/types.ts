export type PostCategory = string;

export type PostAuthor = {
    id: string;
    name: string;
    role: string;
    avatar: string;
    availability: 'online' | 'away' | 'busy' | 'offline';
};

export type PostImage = {
    type: 'avatar' | 'banner' | 'document';
    url: string;
    alt?: string;
    width?: number;
    height?: number;
};

export type PostAttachment = {
    id: string;
    type: 'pdf' | 'link';
    title: string;
    url: string;
};

export type PostReaction = {
    type: 'celebrate' | 'applaud' | 'support';
    count: number;
    userReacted: boolean;
};

export type Post = {
    id: string;
    author: PostAuthor;
    category: PostCategory;
    title: string;
    content: string;
    timestamp: string;
    formattedDate: string;
    formattedDateLong?: string;
    pinned: boolean;
    images?: PostImage[];
    attachments?: PostAttachment[];
    reactions: PostReaction[];
    commentCount: number;
    allowReactions?: boolean;
    cta?: string;
    ctaLink?: string;
};

export type SortOption = {
    value: string;
    label: string;
};

export type UpdatesVariant = 'Default' | 'Variant2' | 'Variant3';

export interface UpdatesContent {
    title: string;
    content: string;
    userName: string;
    userRole: string;
    avatar?: string;
}

