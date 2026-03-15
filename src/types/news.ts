import type { ApiResponse } from './auth';

export interface NewsCategory {
    id: number;
    name: string;
    code?: string | number;
    colourCode?: string;
}

export interface NewsGroup {
    groupId: number;
    groupName: string;
    memberCount: number;
    iconUrl?: string;
}

export interface NewsIndividualUser {
    id: string;
    name: string;
    department: string;
    departmentId: number;
    designation: string;
    designationId: number;
    profileImageUrl: string;
}

export interface NewsOption {
    code: string;
    description: string;
}

export interface NewsBootstrapResult {
    categories: NewsCategory[];
    groups: NewsGroup[];
    individualUsers: NewsIndividualUser[];
    attachment: NewsOption[];
    cta: NewsOption[];
    ctaLink: NewsOption[];
    sortBy: NewsOption[];
    audienceType: NewsOption[];
}

export type NewsBootstrapResponse = ApiResponse<NewsBootstrapResult>;

export interface CategoryMenuItem {
    categoryId: number;
    categoryName: string;
    categoryCode: string;
    colourCode: string;
    iconKey: string;
    iconUrl: string | null;
}

export type GetCategoriesSideMenuResponse = ApiResponse<CategoryMenuItem[]>;

export interface AudienceModel {
    audienceType: 'ALL' | 'USERS' | 'GROUPS' | number;
    userIds: number[];
    groupIds: number[];
}

export interface CommonAttachmentRequest {
    type: string; // 'LINK', 'FILE', etc.
    displayText: string;
    url?: string;
    fileKey?: string;
    fileName?: string;
    contentType?: string;
}

export interface NewsUploadRequest {
    newsId?: number;
    title: string;
    category: string;
    categoryId: number;
    description: string;
    audience: AudienceModel;
    publishDate: string; // ISO date string
    cta?: string;
    catLink?: string;
    status: 'D' | 'P';
    isPinned: boolean;
    allowReactions: boolean;
    sendAsEmail: boolean;
    showOnDashboard: boolean;
    createdBy?: string;
    updatedBy?: string;
    attachments?: CommonAttachmentRequest[];
}

export type SaveNewsResponse = ApiResponse<{
    items: NewsItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}>;

export interface NewsRequest {
    userId?: number;
    searchQuery?: string | null;
    categories?: string[];
    pageNumber: number;
    pageSize: number;
    sortBy?: string | null;
    fromDate?: string | null; // ISO date string
    toDate?: string | null;   // ISO date string
    postedBy?: number[];
    audience?: {
        audienceType: number;
        userIds?: number[];
        groupIds?: number[];
    };
}

export interface NewsItem {
    newsId: number;
    newsCode?: string;
    title: string;
    description: string;
    categoryId: number;
    /** Slug-style category code returned by some endpoints (e.g. "hr-update") */
    category: string | null;
    /** Human-readable category label returned by GetAll (e.g. "HR Update") */
    categoryDesc?: string | null;
    publishDate: string;
    status: string | null;
    cta: string | null;
    /** CTA link field as returned by GetAll */
    ctaLink?: string | null;
    /** CTA link field alias used by some endpoints */
    catLink?: string | null;
    attachments: any[];
    isPinned: boolean;
    allowReactions: boolean;
    sendAsEmail: boolean;
    showOnDashboard: boolean;
    createdOn: string;
    createdBy: string;
    updatedOn?: string;
    updatedBy?: string | null;
    bannerImage?: string;
    authorName?: string;
    authorImage?: string;
    loginUserProfileImageUrl?: string;
    createdByName?: string;
    createdByDesignation?: string;
    lastModified?: string;
    commentCount?: number;
    audience?: {
        audienceType: 'ALL' | 'USERS' | 'GROUPS';
        userIds: number[];
        groupIds: number[];
    } | null;
}

export type GetAllNewsResponse = ApiResponse<{
    items: NewsItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}>;

export type GetNewsFlashResponse = ApiResponse<{
    items: NewsItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}>;

export interface SetPinnedRequest {
    entityType: 'NEWS';
    entityId: number;
    isPinned: boolean;
}

export type SetPinnedResponse = ApiResponse<null>;

export interface NewsListRequest {
    status: string;
    isPinned: boolean;
}

export type GetNewsListResponse = ApiResponse<NewsItem[]>;

export interface TogglePinnedRequest {
    entityId: number;
    isPinned: boolean;
}

export type TogglePinnedResponse = ApiResponse<null>;

export type GetPinnedResponse = ApiResponse<NewsItem[]>;

export type GetDraftsResponse = ApiResponse<NewsItem[]>;

export type GetSingleNewsResponse = ApiResponse<NewsItem>;

export interface AddCategoryRequest {
    CategoryType: string;
    CategoryName: string;
    ColourCode: string;
    IconFile?: File | null;
}

export interface AddCategoryResponse extends ApiResponse<null> { }
