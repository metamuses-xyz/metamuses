"use client";

import { useState, useCallback } from "react";
import { useSignTypedData, useAccount, useChainId } from "wagmi";

// ============================================================================
// Types
// ============================================================================

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
  signature: string;
  timestamp: number;
  nonce: string;
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

interface UseAuthenticatedChatReturn {
  sendMessage: (
    message: string,
    museId: number,
    personality?: CompanionPersonality
  ) => Promise<string>;
  isLoading: boolean;
  isSigning: boolean;
  error: string | null;
  lastResponse: ChatResponse | null;
}

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

// EIP-712 Domain for MetaMuses Chat Auth
const CHAT_AUTH_DOMAIN = {
  name: "MetaMuses",
  version: "1",
  chainId: 133717, // Metis Hyperion Testnet
} as const;

// EIP-712 Types for ChatAuth
const CHAT_AUTH_TYPES = {
  ChatAuth: [
    { name: "userAddress", type: "address" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "string" },
  ],
} as const;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a random nonce for replay protection
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get current Unix timestamp in seconds
 */
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAuthenticatedChat(): UseAuthenticatedChatReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);

  const sendMessage = useCallback(
    async (
      message: string,
      museId: number,
      personality?: CompanionPersonality
    ): Promise<string> => {
      // Validate wallet connection
      if (!isConnected || !address) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }

      setIsLoading(true);
      setIsSigning(true);
      setError(null);

      try {
        // Step 1: Generate auth data
        const timestamp = getCurrentTimestamp();
        const nonce = generateNonce();

        // Step 2: Sign the EIP-712 typed data
        const signature = await signTypedDataAsync({
          domain: {
            ...CHAT_AUTH_DOMAIN,
            chainId: chainId || CHAT_AUTH_DOMAIN.chainId,
          },
          types: CHAT_AUTH_TYPES,
          primaryType: "ChatAuth",
          message: {
            userAddress: address,
            timestamp: BigInt(timestamp),
            nonce: nonce,
          },
        });

        setIsSigning(false);

        // Step 3: Build authenticated request
        const request: ChatRequest = {
          user_address: address,
          muse_id: museId,
          query: message,
          signature: signature,
          timestamp: timestamp,
          nonce: nonce,
          companion_personality: personality,
        };

        // Step 4: Send authenticated request
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle specific error codes
          if (response.status === 401) {
            throw new Error(errorData.message || "Authentication failed. Please try again.");
          }
          if (response.status === 429) {
            throw new Error(errorData.message || "Rate limit exceeded. Please wait before sending another message.");
          }

          throw new Error(
            errorData.message || `Request failed with status ${response.status}`
          );
        }

        const data: ChatResponse = await response.json();
        setLastResponse(data);
        return data.response;
      } catch (err) {
        // Handle user rejection of signature
        if (err instanceof Error) {
          if (err.message.includes("User rejected") || err.message.includes("rejected")) {
            const errorMessage = "Message signing cancelled. Please sign the message to chat.";
            setError(errorMessage);
            throw new Error(errorMessage);
          }
          setError(err.message);
          throw err;
        }

        const errorMessage = "An unexpected error occurred";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
        setIsSigning(false);
      }
    },
    [address, isConnected, chainId, signTypedDataAsync]
  );

  return {
    sendMessage,
    isLoading,
    isSigning,
    error,
    lastResponse,
  };
}

// ============================================================================
// Health Check (unchanged from original)
// ============================================================================

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
