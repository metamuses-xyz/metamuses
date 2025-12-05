import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Types
export interface LeaderboardEntry {
  rank: number;
  user_address: string;
  username: string | null;
  points: number;
  streak: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  leaderboard_type: string;
  entries: LeaderboardEntry[];
  total_users: number;
}

export function useLeaderboardAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get global leaderboard (top N users)
   */
  const getGlobalLeaderboard = async (limit: number = 100): Promise<LeaderboardResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard/global?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user's rank
   */
  const getUserRank = async (address: string): Promise<LeaderboardEntry> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard/user/${address}`);

      if (!response.ok) {
        throw new Error('User not found on leaderboard');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rank';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get leaderboard around user (users above and below)
   */
  const getLeaderboardAroundUser = async (address: string, range: number = 20): Promise<LeaderboardResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard/around/${address}?limit=${range}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getGlobalLeaderboard,
    getUserRank,
    getLeaderboardAroundUser,
    isLoading,
    error,
  };
}
