import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CompanionPersonality {
  name: string;
  description: string;
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
}

interface ChatRequest {
  user_address: string;
  muse_id: number;
  query: string;
  context?: ChatMessage[];
  force_tier?: "fast" | "medium" | "heavy";
  companion_personality?: CompanionPersonality;
}

interface ChatResponse {
  request_id: string;
  response: string;
  model_name: string;
  tier: string;
  latency_ms: number;
  from_cache: boolean;
  tokens_generated?: number;
  cost_tmetis?: number;
}

interface UseChatAPIReturn {
  sendMessage: (
    message: string,
    museId: number,
    userAddress: string,
    personality?: CompanionPersonality,
  ) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  lastResponse: ChatResponse | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export function useChatAPI(): UseChatAPIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);

  const sendMessage = async (
    message: string,
    museId: number,
    userAddress: string,
    personality?: CompanionPersonality,
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatRequest = {
        user_address: userAddress,
        muse_id: museId,
        query: message,
        companion_personality: personality,
      };

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data: ChatResponse = await response.json();
      setLastResponse(data);
      return data.response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
  };
}

// Health check function
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
