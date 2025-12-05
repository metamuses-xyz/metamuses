import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Address } from "viem";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

interface MintResponse {
  success: boolean;
  tx_hash: string;
  token_id?: number;
  explorer_url: string;
}

interface NonceResponse {
  nonce: number;
  address: string;
}

export function useGaslessMint() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MUSEAI_CONTRACT_ADDRESS as Address;
  const CHAIN_ID = 133717; // Metis Hyperion Testnet

  const getNonce = async (userAddress: string): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/api/mint/nonce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: userAddress,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get nonce");
    }

    const data: NonceResponse = await response.json();
    return data.nonce;
  };

  const mint = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setExplorerUrl(null);
    setTokenId(null);

    try {
      // Step 1: Get nonce from backend
      console.log("Getting nonce for", address);
      const nonce = await getNonce(address);
      console.log("Nonce:", nonce);

      // Step 2: Create EIP-712 typed data
      const domain = {
        name: "MetaMuses AI",
        version: "1",
        chainId: CHAIN_ID,
        verifyingContract: CONTRACT_ADDRESS,
      } as const;

      const types = {
        MintRequest: [
          { name: "to", type: "address" },
          { name: "nonce", type: "uint256" },
        ],
      } as const;

      const message = {
        to: address as Address,
        nonce: BigInt(nonce),
      } as const;

      // Step 3: Sign the typed data (no gas!)
      console.log("Requesting signature...");
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "MintRequest",
        message,
      });
      console.log("Signature obtained:", signature);

      // Step 4: Send to backend for gasless minting
      console.log("Sending mint request to backend...");
      const response = await fetch(`${API_BASE_URL}/api/mint/gasless`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: address,
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mint NFT");
      }

      const data: MintResponse = await response.json();
      console.log("Mint response:", data);

      setTxHash(data.tx_hash);
      setExplorerUrl(data.explorer_url);
      setTokenId(data.token_id || null);

      return data;
    } catch (err) {
      console.error("Mint error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to mint NFT";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mint,
    isLoading,
    error,
    txHash,
    explorerUrl,
    tokenId,
  };
}
