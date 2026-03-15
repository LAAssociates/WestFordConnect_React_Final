import type { ApiResponse } from './auth';

export interface DropdownItem {
    lookupType: string;
    code: number;
    description: string;
    iconUrl: string;
    sortOrder: number;
}

export interface UserItem {
    id: number;
    name: string;
    email: string;
    department: string;
    departmentId: number;
    designation: string;
    designationId: number;
    profileImageUrl: string;
}

export interface CategoryItem {
    id: number;
    code: number;
    name: string;
    colourCode: string;
    tranxCount?: number;
}

export interface ResourceGroup {
    groupId: number;
    groupName: string;
    memberCount: number;
    iconUrl?: string;
}

export interface InitialLoadResult {
    audienceType: DropdownItem[];
    attachmentType: DropdownItem[];
    groups: ResourceGroup[];
    individualUsers: UserItem[];
    uploadedBy: UserItem[];
    categories: CategoryItem[];
    sortBy: DropdownItem[];
    fileType: DropdownItem[];
}

export interface SideMenuCategory {
    categoryId: number;
    categoryCode: number;
    categoryName: string;
    iconUrl: string;
    colourCode: string;
    tranxCount?: number;
}

export type InitialLoadResponse = ApiResponse<InitialLoadResult>;
export type GetCategorySideMenuResponse = ApiResponse<SideMenuCategory[]>;

export interface AddCategoryResult {
    categoryId: number;
    categoryType: string;
    categoryName: string;
    colourCode: string | null;
}

export type AddCategoryResponse = ApiResponse<AddCategoryResult>;

export interface GetAllResourceParams {
    searchQuery?: string;
    fromDate?: string;
    toDate?: string;
    category?: number[];
    fileType?: number[];
    uploadedBy?: number[];
    audience?: {
        audienceType?: number;
        userIds?: number[];
        groupIds?: number[];
    };
    sortBy?: number;
    pageNumber?: number;
    pageSize?: number;
    parentId?: number;
}

export interface AudienceParams {
    audienceType: number;
    userIds?: number[];
    groupIds?: number[];
}

export interface SaveResourceParams {
    resourceId?: number | string;
    title: string;
    categoryId: number | string;
    parentId?: number | string;
    description?: string;
    attachments?: string; // JSON string
    audience?: string; // JSON string
    fileType?: number | string;
    fileKey?: string;
    fileSize?: number | string;
    contentType?: string;
    ResourceFile?: File;
}

export interface CreateFolderParams {
    resourceId?: number;
    folderName: string;
    categoryId: number;
    parentId?: number;
    description?: string;
    audience?: AudienceParams;
}

export interface ResourceItem {
    resourceId: number;
    title: string;
    categoryId: number;
    categoryDesc: string;
    description: string;
    parentId: number;
    audience: any | null;
    fileType: number;
    fileTypeName: string;
    fileKey: string;
    fileSize: number;
    contentType: string;
    createdOn: string;
    updatedOn: string;
    createdByName: string;
    userProfileImageUrl: string;
    thumbnailUrl: string;
    attachments: any[];
    isActive: boolean;
}

export interface ResourceGetAllResult {
    items: ResourceItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

export type GetAllResourceResponse = ApiResponse<ResourceGetAllResult>;
export type GetSingleResourceResponse = ApiResponse<ResourceItem>;
