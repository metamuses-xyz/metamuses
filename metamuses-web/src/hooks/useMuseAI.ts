import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MUSE_AI_ADDRESS, MUSE_AI_ABI } from "@/contracts/MuseAI";

export function useMuseAIContract() {
  // Read functions
  const { data: maxSupply } = useReadContract({
    address: MUSE_AI_ADDRESS,
    abi: MUSE_AI_ABI,
    functionName: "MAX_SUPPLY",
  });

  const { data: currentTokenId, refetch: refetchCurrentTokenId } =
    useReadContract({
      address: MUSE_AI_ADDRESS,
      abi: MUSE_AI_ABI,
      functionName: "getCurrentTokenId",
    });

  const { data: isMintingActive } = useReadContract({
    address: MUSE_AI_ADDRESS,
    abi: MUSE_AI_ABI,
    functionName: "isMintingActive",
  });

  // Write functions
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mint = (address: `0x${string}`) => {
    writeContract({
      address: MUSE_AI_ADDRESS,
      abi: MUSE_AI_ABI,
      functionName: "mint",
      args: [address],
    });
  };

  // Check if user has minted
  const useHasMinted = (address?: `0x${string}`) => {
    return useReadContract({
      address: MUSE_AI_ADDRESS,
      abi: MUSE_AI_ABI,
      functionName: "hasMinted",
      args: address ? [address] : undefined,
    });
  };

  return {
    // Contract data
    maxSupply: maxSupply ? Number(maxSupply) : 5000,
    currentTokenId: currentTokenId ? Number(currentTokenId) : 0,
    remaining: maxSupply && currentTokenId
      ? Number(maxSupply) - Number(currentTokenId)
      : 5000,
    isMintingActive: Boolean(isMintingActive),

    // Mint function
    mint,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    refetchCurrentTokenId,

    // Hooks
    useHasMinted,
  };
}
