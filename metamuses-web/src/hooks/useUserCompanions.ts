// useUserCompanions Hook
// Fetch user's minted MuseAI NFT companions

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMuseAIContract } from "./useMuseAI";

export interface AICompanion {
  id: number;
  tokenId: number;
  name: string;
  avatar: {
    gradient: string;
    initial: string;
    emoji: string;
  };
  personality: {
    creativity: number;
    wisdom: number;
    humor: number;
    empathy: number;
  };
  status: "online" | "thinking" | "offline";
  description: string;
  owner: string;
}

export interface UseUserCompanionsReturn {
  companions: AICompanion[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Predefined companion templates (for demo purposes)
const COMPANION_TEMPLATES = [
  {
    name: "Luna the Mystic",
    gradient: "from-purple-500 to-pink-500",
    emoji: "🌙",
    description: "Creative soul with mystical wisdom",
    personality: { creativity: 95, wisdom: 80, humor: 60, empathy: 90 },
  },
  {
    name: "Sage the Wise",
    gradient: "from-blue-500 to-cyan-500",
    emoji: "🧙‍♂️",
    description: "Ancient wisdom meets modern understanding",
    personality: { creativity: 45, wisdom: 98, humor: 30, empathy: 85 },
  },
  {
    name: "Spark the Jester",
    gradient: "from-orange-500 to-yellow-500",
    emoji: "🎭",
    description: "Bringing joy and laughter to conversations",
    personality: { creativity: 85, wisdom: 40, humor: 98, empathy: 70 },
  },
  {
    name: "Nova the Explorer",
    gradient: "from-green-500 to-teal-500",
    emoji: "🚀",
    description: "Curious mind seeking new frontiers",
    personality: { creativity: 90, wisdom: 70, humor: 75, empathy: 65 },
  },
  {
    name: "Echo the Empath",
    gradient: "from-pink-500 to-rose-500",
    emoji: "💖",
    description: "Deep emotional intelligence and understanding",
    personality: { creativity: 70, wisdom: 75, humor: 55, empathy: 98 },
  },
];

export function useUserCompanions(): UseUserCompanionsReturn {
  const { address, isConnected } = useAccount();
  const { currentTokenId } = useMuseAIContract();

  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompanions = async () => {
    if (!isConnected || !address) {
      setCompanions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, we would:
      // 1. Query the MuseAI contract for tokenIds owned by address
      // 2. Fetch metadata from IPFS for each tokenId
      // 3. Parse personality traits and companion details

      // For now, we'll simulate with mock data based on currentTokenId
      // Assume user owns tokens 0 to min(currentTokenId-1, 2)
      const tokenCount = Math.min(Number(currentTokenId || 0), 3);

      if (tokenCount === 0) {
        setCompanions([]);
        setIsLoading(false);
        return;
      }

      const userCompanions: AICompanion[] = [];

      for (let i = 0; i < tokenCount; i++) {
        const template = COMPANION_TEMPLATES[i % COMPANION_TEMPLATES.length];

        userCompanions.push({
          id: i + 1,
          tokenId: i,
          name: template.name,
          avatar: {
            gradient: template.gradient,
            initial: template.name[0],
            emoji: template.emoji,
          },
          personality: template.personality,
          status: "online",
          description: template.description,
          owner: address,
        });
      }

      setCompanions(userCompanions);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch companions");
      setError(error);
      console.error("Error fetching companions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanions();
  }, [address, isConnected, currentTokenId]);

  return {
    companions,
    isLoading,
    error,
    refetch: fetchCompanions,
  };
}

// Hook to generate a default companion for users without NFTs
export function useDefaultCompanion(): AICompanion | null {
  const { address, isConnected } = useAccount();
  const { companions } = useUserCompanions();

  if (!isConnected || companions.length > 0) {
    return null;
  }

  // Return a default companion for users who haven't minted
  return {
    id: 0,
    tokenId: -1,
    name: "Demo Companion",
    avatar: {
      gradient: "from-gray-500 to-slate-500",
      initial: "D",
      emoji: "🤖",
    },
    personality: {
      creativity: 70,
      wisdom: 70,
      humor: 70,
      empathy: 70,
    },
    status: "online",
    description: "Try me out! Mint your own companion for a personalized experience",
    owner: address || "",
  };
}
