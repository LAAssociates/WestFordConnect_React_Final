import { apiClient } from './apiClient';
import type {
    NoteBootstrapResponse,
    GetNoteCategorySideMenuResponse,
    GetAllNotesResponse,
    NoteGetAllRequest,
    NoteSaveRequest,
    SaveNoteResponse,
    SetReminderRequest,
    SetReminderResponse,
    ToggleFavouriteRequest,
    ToggleFavouriteResponse,
    TogglePinnedRequest,
    TogglePinnedResponse
} from '../types/note';

export const noteService = {
    /**
     * Get initial data for notes (assigned to, created by, sort by options)
     */
    async getInitialLoad(): Promise<NoteBootstrapResponse> {
        return apiClient.get<NoteBootstrapResponse>('/api/Note/bootstrap/initialload');
    },

    /**
     * Get categories for the side menu
     */
    async getCategorySideMenu(): Promise<GetNoteCategorySideMenuResponse> {
        return apiClient.get<GetNoteCategorySideMenuResponse>('/api/Note/GetCategorySideMenu');
    },

    /**
     * Get all notes with filtering, searching, and pagination
     */
    async getAll(params: NoteGetAllRequest): Promise<GetAllNotesResponse> {
        return apiClient.post<GetAllNotesResponse>('/api/Note/GetAll', params);
    },

    /**
     * Save a note (create or update)
     */
    async saveNote(data: NoteSaveRequest): Promise<SaveNoteResponse> {
        return apiClient.post<SaveNoteResponse>('/api/Note/Save', data);
    },

    /**
     * Set or update a reminder for a note
     */
    async setReminder(data: SetReminderRequest): Promise<SetReminderResponse> {
        return apiClient.post<SetReminderResponse>('/api/Note/SetReminder', data);
    },

    /**
     * Toggle favourite status for a note
     */
    async toggleFavourite(data: ToggleFavouriteRequest): Promise<ToggleFavouriteResponse> {
        return apiClient.post<ToggleFavouriteResponse>('/api/Note/ToggleFavourite', data);
    },

    /**
     * Toggle pinned status for a note
     */
    async togglePinned(data: TogglePinnedRequest): Promise<TogglePinnedResponse> {
        return apiClient.post<TogglePinnedResponse>('/api/Note/TogglePinned', data);
    },

    /**
     * Delete a note
     */
    async deleteNote(noteId: string | number): Promise<any> {
        return apiClient.post<any>(`/api/Note/Delete?noteId=${noteId}`, {});
    }
};
