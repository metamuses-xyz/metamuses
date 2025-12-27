"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useMuseAIContract } from "@/hooks/useMuseAI";
import { useHasPluginAccess } from "@/hooks/usePluginMarketplace";

interface MuseSelectorProps {
  pluginId: bigint;
  onSelect: (museId: bigint) => void;
  selectedMuseId: bigint | null;
}

interface MuseCardProps {
  tokenId: bigint;
  pluginId: bigint;
  isSelected: boolean;
  onSelect: () => void;
}

function MuseCard({ tokenId, pluginId, isSelected, onSelect }: MuseCardProps) {
  const { data: hasAccess, isLoading } = useHasPluginAccess(tokenId, pluginId);

  const isInstalled = hasAccess === true;

  return (
    <button
      onClick={onSelect}
      disabled={isInstalled || isLoading}
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
        isSelected
          ? "border-purple-500 bg-purple-500/20"
          : isInstalled
            ? "border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-60"
            : "border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-gray-700/50"
      }`}
    >
      {/* Token ID Display */}
      <div className="flex items-center space-x-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
            isInstalled
              ? "bg-gray-700 text-gray-500"
              : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          }`}
        >
          #{Number(tokenId)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">Muse #{Number(tokenId)}</p>
          <p className="text-gray-400 text-sm">
            {isLoading
              ? "Checking..."
              : isInstalled
                ? "Already installed"
                : "Available"}
          </p>
        </div>
      </div>

      {/* Status indicator */}
      {isInstalled && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
            Installed
          </span>
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && !isInstalled && (
        <div className="absolute top-2 right-2">
          <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        </div>
      )}
    </button>
  );
}

export default function MuseSelector({
  pluginId,
  onSelect,
  selectedMuseId,
}: MuseSelectorProps) {
  const { address, isConnected } = useAccount();
  const { useTokensOfOwner } = useMuseAIContract();
  const { data: tokenIds, isLoading } = useTokensOfOwner(address);

  if (!isConnected) {
    return (
      <div className="neural-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔗</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-400">
          Connect your wallet to see your Muse NFTs
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="neural-card rounded-2xl p-8 text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading your Muse NFTs...</p>
      </div>
    );
  }

  const tokens = tokenIds as bigint[] | undefined;

  if (!tokens || tokens.length === 0) {
    return (
      <div className="neural-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎭</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Muse NFTs Found</h3>
        <p className="text-gray-400 mb-4">
          You need to own a Muse NFT to install plugins
        </p>
        <a
          href="/mint"
          className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
        >
          Mint Your Muse
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Select a Muse to Install Plugin
        </h3>
        <span className="text-gray-400 text-sm">
          {tokens.length} Muse{tokens.length !== 1 ? "s" : ""} found
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
        {tokens.map((tokenId) => (
          <MuseCard
            key={tokenId.toString()}
            tokenId={tokenId}
            pluginId={pluginId}
            isSelected={selectedMuseId === tokenId}
            onSelect={() => onSelect(tokenId)}
          />
        ))}
      </div>

      {selectedMuseId && (
        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-purple-300 text-sm">
            <span className="font-semibold">Selected:</span> Muse #
            {Number(selectedMuseId)}
          </p>
        </div>
      )}
    </div>
  );
}
