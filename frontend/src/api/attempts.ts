import { apiClient } from './client';
import {
  AnswerChoice,
  AttemptHistoryItem,
  AttemptSubmissionResult,
} from '@/types';

export interface SubmitAttemptPayload {
  scenarioId: string;
  answers: AnswerChoice[];
  timeSpent?: number;
}

export const attemptApi = {
  async submit(payload: SubmitAttemptPayload): Promise<AttemptSubmissionResult> {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      attempt: AttemptSubmissionResult;
    }>('/attempts', payload);
    return data.attempt;
  },

  async getHistory(): Promise<AttemptHistoryItem[]> {
    const { data } = await apiClient.get<{
      success: boolean;
      count: number;
      attempts: AttemptHistoryItem[];
    }>('/attempts');
    return data.attempts || [];
  },
};
