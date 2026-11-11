import { apiClient } from './client';
import { LeaderboardEntry } from '@/types';

export const leaderboardApi = {
  async getTop(): Promise<LeaderboardEntry[]> {
    const { data } = await apiClient.get<{
      success: boolean;
      count: number;
      leaderboard: LeaderboardEntry[];
    }>('/leaderboard');
    return data.leaderboard || [];
  },
};

