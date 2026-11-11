export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  fullName?: string | null;
  totalPoints: number;
  level: number;
  badges: string[];
}

export interface LeaderboardResponse {
  success: boolean;
  count: number;
  leaderboard: LeaderboardUser[];
}
