import { apiClient } from './apiClient';

export interface SendGreetingRequest {
  eventType: 'birthday' | 'work-anniversary';
  targetEmail: string;
  targetName?: string;
  message: string;
  source?: string;
}

export interface SendGreetingResponse {
  success: boolean;
  message: string;
  result: any | null;
  errors: any;
  requestId: string;
  timestamp: string;
}

export const greetingService = {
  send: async (payload: SendGreetingRequest): Promise<SendGreetingResponse> => {
    return apiClient.post<SendGreetingResponse>('/api/Greeting/send', payload);
  },
};
