import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { TIP_JAR_ADDRESS, TIP_JAR_ABI } from "@/contracts/TipJar";

/**
 * Hook for interacting with the TipJar contract
 *
 * Revenue Split:
 * - 90% to NFT owner (creator)
 * - 10% to platform
 */
export function useTipJar() {
  // Write contract for tipping
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  /**
   * Send a tip to a MuseAI NFT owner
   * @param tokenId - The NFT token ID to tip
   * @param amount - Amount in tMETIS (e.g., "0.1")
   * @param message - Optional message to include with the tip
   */
  const tip = (tokenId: bigint, amount: string, message?: string) => {
    const value = parseEther(amount);

    if (message) {
      writeContract({
        address: TIP_JAR_ADDRESS,
        abi: TIP_JAR_ABI,
        functionName: "tip",
        args: [tokenId, message],
        value,
      });
    } else {
      writeContract({
        address: TIP_JAR_ADDRESS,
        abi: TIP_JAR_ABI,
        functionName: "tip",
        args: [tokenId],
        value,
      });
    }
  };

  /**
   * Withdraw accumulated creator earnings
   */
  const withdrawCreatorEarnings = () => {
    writeContract({
      address: TIP_JAR_ADDRESS,
      abi: TIP_JAR_ABI,
      functionName: "withdrawCreatorEarnings",
    });
  };

  return {
    // Actions
    tip,
    withdrawCreatorEarnings,
    reset,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

/**
 * Hook to get total tips received for a specific token
 */
export function useTipsForToken(tokenId?: bigint) {
  const { data, isLoading, refetch } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: "getTipsForToken",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    totalTips: data ? formatEther(data) : "0",
    totalTipsRaw: data,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get creator statistics (pending earnings, withdrawn, total)
 */
export function useCreatorStats(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: "getCreatorStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    pending: data ? formatEther(data[0]) : "0",
    withdrawn: data ? formatEther(data[1]) : "0",
    total: data ? formatEther(data[2]) : "0",
    pendingRaw: data?.[0],
    withdrawnRaw: data?.[1],
    totalRaw: data?.[2],
    isLoading,
    refetch,
  };
}

/**
 * Hook to get pending earnings for a creator
 */
export function usePendingEarnings(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: "getPendingEarnings",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    pendingEarnings: data ? formatEther(data) : "0",
    pendingEarningsRaw: data,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get overall TipJar statistics
 */
export function useTipJarStats() {
  const { data, isLoading, refetch } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: "getStats",
  });

  return {
    totalTips: data ? formatEther(data[0]) : "0",
    platformFeesPending: data ? formatEther(data[1]) : "0",
    platformFeesWithdrawn: data ? formatEther(data[2]) : "0",
    totalTipsRaw: data?.[0],
    platformFeesPendingRaw: data?.[1],
    platformFeesWithdrawnRaw: data?.[2],
    isLoading,
    refetch,
  };
}

/**
 * Hook to get the revenue share percentages
 */
export function useRevenueShare() {
  const { data: creatorShare } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: "CREATOR_SHARE_BPS",
  });

  const { data: platformShare } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: "PLATFORM_SHARE_BPS",
  });

  return {
    creatorShareBps: creatorShare ? Number(creatorShare) : 9000,
    platformShareBps: platformShare ? Number(platformShare) : 1000,
    creatorSharePercent: creatorShare ? Number(creatorShare) / 100 : 90,
    platformSharePercent: platformShare ? Number(platformShare) / 100 : 10,
  };
}
