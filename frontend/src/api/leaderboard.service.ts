import { apiClient } from './client';
import { LeaderboardResponse } from '@/types/leaderboard.types';

export const leaderboardService = {
  async getLeaderboard(): Promise<LeaderboardResponse> {
    const { data } = await apiClient.get<LeaderboardResponse>('/leaderboard');
    return data;
  },
};

