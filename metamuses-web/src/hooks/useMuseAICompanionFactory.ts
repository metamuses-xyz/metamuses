import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  COMPANION_FACTORY_ADDRESS,
  COMPANION_FACTORY_ABI,
  PersonalityTraits,
} from "@/contracts/MuseAICompanionFactory";

export function useCompanionFactory() {
  // Read functions
  const { data: totalCompanions, refetch: refetchTotalCompanions } =
    useReadContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "totalCompanions",
    });

  // Write functions
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Deploy companion with name
  const deployCompanion = (
    tokenId: bigint,
    traits: PersonalityTraits,
    name: string
  ) => {
    writeContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "deployCompanionWithName",
      args: [
        tokenId,
        {
          creativity: traits.creativity,
          wisdom: traits.wisdom,
          humor: traits.humor,
          empathy: traits.empathy,
          logic: traits.logic,
        },
        name,
      ],
    });
  };

  // Check if a token has a companion
  const useHasCompanion = (tokenId?: bigint) => {
    return useReadContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "hasCompanion",
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  // Get companion address for a token
  const useGetCompanion = (tokenId?: bigint) => {
    return useReadContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "getCompanion",
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  // Get companion info for a token
  const useGetCompanionInfo = (tokenId?: bigint) => {
    return useReadContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "getCompanionInfo",
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  // Get all companions owned by an address
  const useGetCompanionsByOwner = (address?: `0x${string}`) => {
    return useReadContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "getCompanionsByOwner",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Get tokens with companions for an owner
  const useGetOwnedTokensWithCompanions = (address?: `0x${string}`) => {
    return useReadContract({
      address: COMPANION_FACTORY_ADDRESS,
      abi: COMPANION_FACTORY_ABI,
      functionName: "getOwnedTokensWithCompanions",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  return {
    // Contract data
    totalCompanions: totalCompanions ? Number(totalCompanions) : 0,

    // Deploy function
    deployCompanion,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    receipt,
    reset,
    refetchTotalCompanions,

    // Hooks
    useHasCompanion,
    useGetCompanion,
    useGetCompanionInfo,
    useGetCompanionsByOwner,
    useGetOwnedTokensWithCompanions,
  };
}

// Standalone hook for checking if a specific token has a companion
export function useHasCompanion(tokenId?: bigint) {
  return useReadContract({
    address: COMPANION_FACTORY_ADDRESS,
    abi: COMPANION_FACTORY_ABI,
    functionName: "hasCompanion",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

// Standalone hook for getting companion info
export function useGetCompanionInfo(tokenId?: bigint) {
  return useReadContract({
    address: COMPANION_FACTORY_ADDRESS,
    abi: COMPANION_FACTORY_ABI,
    functionName: "getCompanionInfo",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}
