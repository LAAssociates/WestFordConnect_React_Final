import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/auth';
import type { NoteGetAllRequest, GetAllNotesResponse } from '../types/note';

export interface ReminderNoteListDto {
    noteId: number;
    title: string;
}

export interface ReminderBootstrapResult {
    assignedToType: any[];
    individualUsers: any[];
    noteList: ReminderNoteListDto[];
}

export type ReminderBootstrapResponse = ApiResponse<ReminderBootstrapResult>;

export const reminderService = {
    async getInitialLoad(): Promise<ReminderBootstrapResponse> {
        return apiClient.get<ReminderBootstrapResponse>('/api/Reminder/bootstrap/initialload');
    },

    async getAll(params: NoteGetAllRequest): Promise<GetAllNotesResponse> {
        return apiClient.post<GetAllNotesResponse>('/api/Reminder/Get', params);
    },

    async toggleFavourite(data: { entityId: number; isFavourite: boolean }): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>('/api/Reminder/ToggleFavourite', data);
    }
};
