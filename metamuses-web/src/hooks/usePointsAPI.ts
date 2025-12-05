import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Types
export interface UserPoints {
  user_address: string;
  total_points: number;
  lifetime_points: number;
  season_points: number;
  current_streak: number;
  longest_streak: number;
  rank: number | null;
  last_checkin_date: string | null;
}

export interface CheckInResponse {
  success: boolean;
  completion: {
    task_type: string;
    points_awarded: number;
    multiplier: number;
    metadata: any;
  };
  user_points: {
    total_points: number;
    current_streak: number;
    rank: number | null;
  };
}

export interface TaskHistoryItem {
  id: string;
  task_type: string;
  points_awarded: number;
  multiplier: number;
  completed_at: string;
  metadata: any;
}

export interface TaskHistoryResponse {
  completions: TaskHistoryItem[];
  total: number;
}

export function usePointsAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Daily check-in
   */
  const checkIn = async (address: string): Promise<CheckInResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/points/checkin/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Check-in failed');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user's points and stats
   */
  const getUserPoints = async (address: string): Promise<UserPoints> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/points/user/${address}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user points');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch points';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user's task completion history
   */
  const getTaskHistory = async (address: string, limit: number = 20): Promise<TaskHistoryResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/points/user/${address}/history?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch task history');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user can check in today
   */
  const canCheckInToday = (lastCheckinDate: string | null): boolean => {
    if (!lastCheckinDate) return true;

    const today = new Date().toISOString().split('T')[0];
    return lastCheckinDate !== today;
  };

  return {
    checkIn,
    getUserPoints,
    getTaskHistory,
    canCheckInToday,
    isLoading,
    error,
  };
}
