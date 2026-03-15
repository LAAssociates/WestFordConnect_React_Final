import type { ApiResponse } from './auth';


import type { BrochureDto } from '../components/course-brochures/types';
export type { BrochureDto };

export interface GetBrochureInfoRequest {
    userId?: number;
    searchQuery?: string | null;
    categories?: string[];
    pageNumber: number;
    pageSize: number;
    sortBy?: string | null;
}

export interface BrochureListResult {
    items: BrochureDto[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

export type GetBrochureInfoResponse = ApiResponse<BrochureListResult>;

export interface BrochureCategory {
    id: number;
    code: number;
    name: string;
    colourCode: string;
    tranxCount: number;
}

export interface BrochureUser {
    userId: number;
    name: string;
    email: string;
    designation: string;
    profileImageUrl: string;
}

export interface IndividualUser {
    id: number;
    name: string;
    department: string;
    departmentId: number;
    designation: string;
    designationId: number;
    profileImageUrl: string;
}

export interface BrochureGroup {
    groupId: number;
    groupName: string;
    memberCount: number;
    iconUrl?: string;
}

export interface MetricLookupItem {
    lookupType: string;
    code: number;
    description: string;
    iconUrl: string;
    sortOrder: number;
}

export interface BrochureBootstrapResult {
    categories: BrochureCategory[];
    users: BrochureUser[]; // Keeping for backward compatibility if needed, but JSON shows separate lists
    groups: BrochureGroup[];
    attachment: MetricLookupItem[];
    individualUsers: IndividualUser[];
    sortBy: MetricLookupItem[];
    audienceType: MetricLookupItem[];
}

export type BrochureBootstrapResponse = ApiResponse<BrochureBootstrapResult>;

export interface CategoryMenuItem {
    categoryId: number;
    categoryCode: number;
    categoryName: string;
    iconUrl: string;
    colourCode: string;
    tranxCount?: number;
}

export type GetCategoriesSideMenuResponse = ApiResponse<CategoryMenuItem[]>;

export interface LookupItem {
    code: string;
    description: string;
}

export interface LookupResult {
    items: LookupItem[];
}

export type GetLookupResponse = ApiResponse<LookupResult>;

export interface BrochureFile {
    fileName: string;
    fileKey: string;
}

export interface BrochureAttachment {
    attachmentId: number;
    attachmentType: string;
    displayText: string;
    fileKey: string;
    fileName: string;
    contentType: string;
    url: string;
}

export interface SingleBrochureInfo {
    brochureId: number;
    brochureCode: string;
    title: string;
    categoryId: number;
    category: string;
    description: string;
    audience: BrochureAudience;
    file: BrochureFile;
    attachments: BrochureAttachment[];
    isActive: boolean;
    fileName?: string; // Root level fileName from API
    fileKey?: string; // Root level fileKey from API
}

export interface CreateFileShareRequest {
    ModuleCode: string;
    EntityId: number;
    ExpiresAt: string | null;
    MaxDownloads: number | null;
}

export interface CreateFileShareResponse {
    shareLink: string;
}

export type CreateFileShareApiResponse = ApiResponse<CreateFileShareResponse>;

export interface BrochureAudience {
    audienceType: 'ALL' | 'USERS' | 'GROUPS';
    userIds: number[];
    groupIds: number[];
}



export type GetSingleBrochureInfoResponse = ApiResponse<SingleBrochureInfo>;

// Group Members API types
export interface GroupMemberDetail {
    userId: number;
    fullName: string;
    profileUrl: string;
    departmentName: string;
    designationName: string;
}


export type GetProjectGroupMembersResponse = ApiResponse<GroupMemberDetail[]>;

export interface ShareBrochureRequest {
    entityId: number;
}

export interface ShareBrochureResult {
    shareToken: string;
    shareLink: string;
    expiresAt: string;
    maxDownloads: number;
}

export type ShareBrochureResponse = ApiResponse<ShareBrochureResult>;

