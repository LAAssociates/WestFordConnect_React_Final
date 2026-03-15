import { apiClient } from './apiClient';
import type {
  DashboardBootstrapResponse,
  DashboardGetAllResponse,
  DashboardMyTasksResponse,
  DashboardPeopleMomentsResponse,
  DashboardProjectGroupsResponse,
  DashboardTodayResponse,
} from '../types/dashboard';

export const dashboardService = {
  getAll: async (todayIso: string): Promise<DashboardGetAllResponse> => {
    return apiClient.post<DashboardGetAllResponse>('/api/dashboard/GetAll', null, {
      params: { today: todayIso },
    });
  },

  getMyTasks: async (todayIso: string, page: number = 1, size: number = 20): Promise<DashboardMyTasksResponse> => {
    return apiClient.get<DashboardMyTasksResponse>('/api/dashboard/my-tasks', {
      params: { today: todayIso, page, size },
    });
  },

  getMyProjectGroups: async (top: number = 20): Promise<DashboardProjectGroupsResponse> => {
    return apiClient.get<DashboardProjectGroupsResponse>('/api/dashboard/my-project-groups', {
      params: { top },
    });
  },

  getPeopleMoments: async (
    period: 'today' | 'this-week' | 'this-month',
    viewType: 'both' | 'birthdays' | 'anniversaries' = 'both'
  ): Promise<DashboardPeopleMomentsResponse> => {
    return apiClient.get<DashboardPeopleMomentsResponse>('/api/dashboard/people-moments', {
      params: { period, viewType },
    });
  },

  getToday: async (): Promise<DashboardTodayResponse> => {
    return apiClient.get<DashboardTodayResponse>('/api/dashboard/today');
  },

  getBootstrap: async (): Promise<DashboardBootstrapResponse> => {
    return apiClient.get<DashboardBootstrapResponse>('/api/dashboard/bootstrap/initialload');
  },

  checkIn: async (): Promise<DashboardTodayResponse> => {
    return apiClient.post<DashboardTodayResponse>('/api/dashboard/today/check-in', {});
  },

  checkOut: async (): Promise<DashboardTodayResponse> => {
    return apiClient.post<DashboardTodayResponse>('/api/dashboard/today/check-out', {});
  },
};
