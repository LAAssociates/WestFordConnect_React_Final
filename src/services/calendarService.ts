import { apiClient } from './apiClient';
import type {
  CalendarResponse,
  CalendarEventsRequest,
  CalendarBootstrapResponse,
  CalendarStatusResponse,
  CalendarTogglePinnedRequest,
  CalendarTogglePinnedResponse
} from '../types/calendar';

export const calendarService = {
  getEvents: async (params: CalendarEventsRequest): Promise<CalendarResponse> => {
    return await apiClient.get<CalendarResponse>('/api/Calendar/GetEvents', {
      params,
    });
  },

  getBootstrap: async (): Promise<CalendarBootstrapResponse> => {
    return await apiClient.get<CalendarBootstrapResponse>('/api/Calendar/bootstrap/initialload');
  },

  getStatus: async (): Promise<CalendarStatusResponse> => {
    return await apiClient.get<CalendarStatusResponse>('/api/Calendar/Status');
  },

  togglePinned: async (payload: CalendarTogglePinnedRequest): Promise<CalendarTogglePinnedResponse> => {
    return await apiClient.post<CalendarTogglePinnedResponse>('/api/Calendar/pin/toggle', payload);
  },
};
