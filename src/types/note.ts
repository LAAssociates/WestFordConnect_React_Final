import type { ApiResponse } from './auth';

export interface NoteUser {
    id: number;
    name: string;
    department: string;
    departmentId: number;
    designation: string;
    designationId: number;
    profileImageUrl: string;
}

export interface NoteSortOption {
    lookupType: string;
    code: number;
    description: string;
    iconUrl: string;
    sortOrder: number;
}

export interface NoteBootstrapResult {
    assignedTo: NoteUser[];
    createdBy: NoteUser[];
    sortBy: NoteSortOption[];
}

export type NoteBootstrapResponse = ApiResponse<NoteBootstrapResult>;

export interface NoteCategoryMenuItem {
    categoryId: number;
    categoryCode: number;
    categoryName: string;
    iconUrl: string;
    colourCode: string;
}

export type GetNoteCategorySideMenuResponse = ApiResponse<NoteCategoryMenuItem[]>;

export interface NoteItem {
    noteId: number;
    title: string;
    notes: string;
    hasReminder: boolean;
    reminderDateTime: string | null;
    isPinned: boolean;
    isFavourite: boolean;
    isSharedNote: boolean;
    isSharedReminder: boolean;
    canEditByAudience: boolean;
    createdOn: string;
    createdBy: number;
    createdByName: string;
    loginUserProfileImageUrl: string;
}

export type GetAllNotesResponse = ApiResponse<{
    items: NoteItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}>;

export interface NoteGetAllRequest {
    userId?: number;
    searchQuery?: string;
    onlyReminders?: boolean;
    fromDate?: string;
    toDate?: string;
    pageNumber: number;
    pageSize: number;
    category?: number;
    createdBy?: number[];
    assignedTo?: number[];
    sortBy?: number;
}

export interface NoteAudience {
    audienceType: number;
    userIds: number[];
    groupIds: number[];
}

export interface NoteSaveRequest {
    noteId?: number;
    title: string;
    notes: string;
    canEditByAudience: boolean;
    reminderDateTime?: string;
    audience: NoteAudience;
    isFavourite: boolean;
    isPinned: boolean;
    updatedBy?: string;
}

export type SaveNoteResponse = ApiResponse<NoteItem>;

export interface SetReminderRequest {
    noteId: number;
    reminderDateTime: string;
}

export type SetReminderResponse = ApiResponse<NoteItem>;

export interface ToggleFavouriteRequest {
    entityId: number;
    isFavourite: boolean;
}

export type ToggleFavouriteResponse = ApiResponse<null>;

export interface TogglePinnedRequest {
    entityId: number;
    isPinned: boolean;
}

export type TogglePinnedResponse = ApiResponse<null>;
