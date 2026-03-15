import { apiClient } from './apiClient';

export interface PresenceStatusResponse {
  success: boolean;
  message: string;
  result: {
    userId: number;
    availabilityStatus: number;
    isOnline: boolean;
    lastSeen: string | null;
  } | null;
  errors: any | null;
  requestId: string;
  timestamp: string;
}

export const presenceService = {
  setStatus: async (status: 1 | 2 | 3): Promise<PresenceStatusResponse> => {
    return apiClient.post<PresenceStatusResponse>('/api/presence/status', { status });
  }
};
