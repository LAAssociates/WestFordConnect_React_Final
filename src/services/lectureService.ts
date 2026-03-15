import { apiClient } from './apiClient';
import type { LectureRequest, LectureResponse, LectureScheduleResponse } from '../types/lecture';

export const lectureService = {
  getLectureCalendarInfo: async (payload: LectureRequest): Promise<LectureResponse> => {
    return await apiClient.post<LectureResponse>('/api/Lecture/GetAll', payload);
  },

  getScheduleInfo: async (scheduleId: number): Promise<LectureScheduleResponse> => {
    return await apiClient.get<LectureScheduleResponse>('/api/Lecture/GetScheduleInfo', {
      params: { scheduleId },
    });
  },
};
