"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { formatEther } from "viem";
import {
  Plugin,
  PluginListing,
  Category,
} from "@/contracts/PluginMarketplace";
import {
  useCreatorPlugins,
  usePluginDetails,
  usePluginListings,
  usePluginMarketplace,
} from "@/hooks/usePluginMarketplace";
import {
  getCategoryName,
  getCategoryIcon,
  getCategoryGradient,
} from "@/utils/pluginCategories";
import {
  formatPluginPrice,
  getAccessTypeLabel,
  getAccessTypeIcon,
  formatRating,
  formatInstallCount,
  getListingSummary,
} from "@/utils/pluginPricing";
import {
  fetchPluginMetadata,
  PluginMetadata,
  getIconDisplay,
} from "@/utils/ipfsMetadata";

export default function MyPluginsPage() {
  const { address, isConnected } = useAccount();
  const { data: pluginIds, isLoading: isLoadingIds } = useCreatorPlugins(address);
  const {
    withdrawEarnings,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    reset,
  } = usePluginMarketplace();

  const [selectedPlugin, setSelectedPlugin] = useState<bigint | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const plugins = pluginIds as bigint[] | undefined;
  const hasPlugins = plugins && plugins.length > 0;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="neural-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔗</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your plugins
          </p>
          <w3m-button />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <div className="border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/plugins"
                className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Marketplace</span>
              </Link>
              <h1 className="text-3xl font-bold text-white">My Plugins</h1>
              <p className="text-gray-400 mt-1">
                Manage your published plugins
              </p>
            </div>
            <Link
              href="/plugins/submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all"
            >
              + Submit Plugin
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoadingIds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="neural-card rounded-2xl p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gray-700 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-700 rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-20 bg-gray-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : !hasPlugins ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🔌</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Plugins Yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You haven't published any plugins yet. Create your first plugin and share it with the MetaMuses community!
            </p>
            <Link
              href="/plugins/submit"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Submit Your First Plugin
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="neural-card rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-white">{plugins.length}</p>
                <p className="text-gray-400">Total Plugins</p>
              </div>
              <div className="neural-card rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-green-400">-</p>
                <p className="text-gray-400">Total Installs</p>
              </div>
              <div className="neural-card rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-yellow-400">-</p>
                <p className="text-gray-400">Avg Rating</p>
              </div>
              <div className="neural-card rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-purple-400">-</p>
                <p className="text-gray-400">Earnings</p>
              </div>
            </div>

            {/* Plugin List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins.map((pluginId) => (
                <PluginCard
                  key={pluginId.toString()}
                  pluginId={pluginId}
                  onSelect={() => setSelectedPlugin(pluginId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <PluginDetailModal
          pluginId={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onWithdraw={() => {
            setSelectedPlugin(null);
            setShowWithdrawModal(true);
          }}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => {
            setShowWithdrawModal(false);
            reset();
          }}
          onWithdraw={withdrawEarnings}
          isPending={isPending}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          error={error}
          hash={hash}
        />
      )}
    </div>
  );
}

// Plugin Card Component
function PluginCard({
  pluginId,
  onSelect,
}: {
  pluginId: bigint;
  onSelect: () => void;
}) {
  const { data: plugin, isLoading } = usePluginDetails(pluginId);
  const { data: listings } = usePluginListings(pluginId);
  const [metadata, setMetadata] = useState<PluginMetadata | null>(null);

  useEffect(() => {
    if (plugin?.metadataURI) {
      fetchPluginMetadata(plugin.metadataURI).then(setMetadata);
    }
  }, [plugin?.metadataURI]);

  if (isLoading || !plugin) {
    return (
      <div className="neural-card rounded-2xl p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-14 h-14 bg-gray-700 rounded-xl" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-700 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const icon = getIconDisplay(metadata?.icon || "🔌");
  const displayName = metadata?.name || plugin.name;
  const activeListings = (listings as PluginListing[] | undefined)?.filter((l) => l.active) || [];

  return (
    <div
      onClick={onSelect}
      className="neural-card rounded-2xl p-6 cursor-pointer hover:border-purple-500/50 transition-all"
    >
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div
          className={`w-14 h-14 bg-gradient-to-br ${getCategoryGradient(plugin.category as Category)} rounded-xl flex items-center justify-center text-2xl`}
        >
          {icon.type === "emoji" ? icon.value : "🔌"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{displayName}</h3>
          <p className="text-gray-400 text-sm">
            {getCategoryIcon(plugin.category as Category)} {getCategoryName(plugin.category as Category)}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            plugin.active
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {plugin.active ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <p className="text-white font-bold">{formatInstallCount(plugin.installCount)}</p>
          <p className="text-gray-500 text-xs">Installs</p>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <p className="text-white font-bold">
            {formatRating(plugin.rating, plugin.ratingCount)}
          </p>
          <p className="text-gray-500 text-xs">Rating</p>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <p className="text-white font-bold">{activeListings.length}</p>
          <p className="text-gray-500 text-xs">Plans</p>
        </div>
      </div>

      {/* Listings Preview */}
      {activeListings.length > 0 && (
        <div className="text-sm text-gray-400">
          {getListingSummary(activeListings[0])}
          {activeListings.length > 1 && ` +${activeListings.length - 1} more`}
        </div>
      )}
    </div>
  );
}

// Plugin Detail Modal
function PluginDetailModal({
  pluginId,
  onClose,
  onWithdraw,
}: {
  pluginId: bigint;
  onClose: () => void;
  onWithdraw: () => void;
}) {
  const { data: plugin } = usePluginDetails(pluginId);
  const { data: listings } = usePluginListings(pluginId);
  const [metadata, setMetadata] = useState<PluginMetadata | null>(null);

  useEffect(() => {
    if (plugin?.metadataURI) {
      fetchPluginMetadata(plugin.metadataURI).then(setMetadata);
    }
  }, [plugin?.metadataURI]);

  if (!plugin) return null;

  const icon = getIconDisplay(metadata?.icon || "🔌");
  const displayName = metadata?.name || plugin.name;
  const activeListings = (listings as PluginListing[] | undefined)?.filter((l) => l.active) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 bg-gradient-to-br ${getCategoryGradient(plugin.category as Category)} rounded-xl flex items-center justify-center text-3xl`}
              >
                {icon.type === "emoji" ? icon.value : "🔌"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                <p className="text-gray-400">
                  {getCategoryIcon(plugin.category as Category)} {getCategoryName(plugin.category as Category)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-white">{formatInstallCount(plugin.installCount)}</p>
              <p className="text-gray-400 text-sm">Installs</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-white">
                {formatRating(plugin.rating, plugin.ratingCount)}
              </p>
              <p className="text-gray-400 text-sm">Rating</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-white">{Number(plugin.ratingCount)}</p>
              <p className="text-gray-400 text-sm">Reviews</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-xl">
              <p className="text-2xl font-bold text-purple-400">
                {formatEther(plugin.totalEarnings || BigInt(0))}
              </p>
              <p className="text-gray-400 text-sm">Earnings</p>
            </div>
          </div>

          {/* Listings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Pricing Plans</h3>
            {activeListings.length === 0 ? (
              <p className="text-gray-400">No active pricing plans</p>
            ) : (
              <div className="space-y-3">
                {activeListings.map((listing, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getAccessTypeIcon(listing.accessType)}</span>
                      <div>
                        <p className="text-white font-medium">
                          {getAccessTypeLabel(listing.accessType)}
                        </p>
                        <p className="text-gray-400 text-sm">{getListingSummary(listing)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatPluginPrice(listing.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Link
              href={`/plugins/${pluginId}`}
              className="flex-1 py-3 text-center border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
            >
              View Public Page
            </Link>
            <button
              onClick={onWithdraw}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Withdraw Earnings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Withdraw Modal
function WithdrawModal({
  onClose,
  onWithdraw,
  isPending,
  isConfirming,
  isConfirmed,
  error,
  hash,
}: {
  onClose: () => void;
  onWithdraw: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-8">
        {isPending || isConfirming ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {isPending ? "Confirm in Wallet" : "Processing..."}
            </h3>
            <p className="text-gray-400">
              {isPending
                ? "Please confirm the transaction in your wallet"
                : "Waiting for transaction confirmation..."}
            </p>
          </div>
        ) : isConfirmed ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Successful!</h3>
            <p className="text-gray-400 mb-4">Your earnings have been withdrawn to your wallet.</p>
            {hash && (
              <a
                href={`https://explorer.hyperion-testnet.metis.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                View Transaction →
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Failed</h3>
            <p className="text-gray-400 mb-4">{error.message || "Something went wrong"}</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Withdraw Earnings</h3>
              <p className="text-gray-400">
                Withdraw all your plugin earnings to your connected wallet.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onWithdraw}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all"
              >
                Withdraw
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
