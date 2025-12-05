import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface TwitterVerification {
  id: string;
  user_address: string;
  twitter_handle: string;
  signature: string;
  message: string;
  verified_at: string;
  is_valid: boolean;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  verification: TwitterVerification | null;
}

interface TaskCompletionResponse {
  success: boolean;
  message: string;
  points_awarded: number | null;
}

interface UserCompletionsResponse {
  completed_tasks: string[];
}

export function useTwitterVerification() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verify Twitter handle ownership with wallet signature
   */
  const verifyTwitterHandle = async (twitterHandle: string): Promise<VerifyResponse | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create message to sign
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const message = `I verify that I own the Twitter handle @${twitterHandle} for MetaMuses points.\nWallet: ${address}\nTimestamp: ${today}`;

      // Sign the message
      const signature = await signMessageAsync({ message });

      // Send verification request to backend
      const response = await fetch(`${API_BASE_URL}/api/twitter/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_address: address,
          twitter_handle: twitterHandle,
          signature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Verification failed: ${errorText}`);
      }

      const data: VerifyResponse = await response.json();

      if (!data.success) {
        setError(data.message);
        return data;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user's verified Twitter handle
   */
  const getVerification = async (): Promise<TwitterVerification | null> => {
    if (!address) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/twitter/verification/${address}`);

      if (!response.ok) {
        throw new Error('Failed to get verification');
      }

      const data: TwitterVerification | null = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Complete a Twitter task (follow or retweet)
   */
  const completeTwitterTask = async (
    taskType: 'follow_twitter' | 'retweet_post',
    twitterHandle: string = 'metamuses_xyz'
  ): Promise<TaskCompletionResponse | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/twitter/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_address: address,
          task_type: taskType,
          twitter_handle: twitterHandle,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Task completion failed: ${errorText}`);
      }

      const data: TaskCompletionResponse = await response.json();

      if (!data.success) {
        setError(data.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all completed Twitter tasks for the user
   */
  const getUserCompletions = async (): Promise<string[]> => {
    if (!address) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/twitter/completions/${address}`);

      if (!response.ok) {
        return [];
      }

      const data: UserCompletionsResponse = await response.json();
      return data.completed_tasks;
    } catch (err) {
      console.error('Failed to get user completions:', err);
      return [];
    }
  };

  return {
    verifyTwitterHandle,
    getVerification,
    completeTwitterTask,
    getUserCompletions,
    isLoading,
    error,
  };
}
