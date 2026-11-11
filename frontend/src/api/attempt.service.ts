import { apiClient } from './client';
import {
  AttemptHistoryResponse,
  SubmitAttemptPayload,
  SubmitAttemptResponse,
} from '@/types/attempt.types';

export const attemptService = {
  async submitAttempt(payload: SubmitAttemptPayload): Promise<SubmitAttemptResponse> {
    const { data } = await apiClient.post<SubmitAttemptResponse>('/attempts', payload);
    return data;
  },

  async getAttemptHistory(): Promise<AttemptHistoryResponse> {
    const { data } = await apiClient.get<AttemptHistoryResponse>('/attempts');
    return data;
  },
};
