"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import {
  Plugin,
  PluginListing,
  Category,
} from "@/contracts/PluginMarketplace";
import {
  usePluginDetails,
  usePluginListings,
  useTopPlugins,
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
  formatDuration,
  formatQuota,
  formatRating,
  getStarRating,
  formatInstallCount,
  hasTrialAvailable,
  getCheapestListing,
} from "@/utils/pluginPricing";
import {
  fetchPluginMetadata,
  PluginMetadata,
  getIconDisplay,
} from "@/utils/ipfsMetadata";
import InstallPluginModal from "@/components/plugins/InstallPluginModal";

type TabType = "overview" | "pricing" | "versions";

export default function PluginDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const pluginId = BigInt(params.id as string);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [metadata, setMetadata] = useState<PluginMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Fetch plugin data from contract
  const { data: plugin, isLoading: isLoadingPlugin } = usePluginDetails(pluginId);
  const { data: listings, isLoading: isLoadingListings } = usePluginListings(pluginId);
  const { data: topPlugins } = useTopPlugins(5n);

  // Fetch metadata from IPFS
  useEffect(() => {
    async function loadMetadata() {
      if (plugin?.metadataURI) {
        setIsLoadingMetadata(true);
        try {
          const data = await fetchPluginMetadata(plugin.metadataURI);
          setMetadata(data);
        } catch (error) {
          console.error("Failed to load metadata:", error);
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    }
    loadMetadata();
  }, [plugin?.metadataURI]);

  const isLoading = isLoadingPlugin || isLoadingListings || isLoadingMetadata;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-700 rounded-2xl" />
              <div className="space-y-3">
                <div className="h-8 w-64 bg-gray-700 rounded" />
                <div className="h-4 w-48 bg-gray-700 rounded" />
              </div>
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-700 rounded-xl" />
                <div className="h-32 bg-gray-700 rounded-xl" />
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-700 rounded-xl" />
                <div className="h-32 bg-gray-700 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔌</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Plugin Not Found</h1>
          <p className="text-gray-400 mb-6">
            The plugin you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/plugins"
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
          >
            Browse Plugins
          </Link>
        </div>
      </div>
    );
  }

  const activeListings = (listings as PluginListing[] | undefined)?.filter((l) => l.active) || [];
  const cheapestListing = getCheapestListing(activeListings);
  const displayName = metadata?.name || plugin.name;
  const icon = getIconDisplay(metadata?.icon || "🔌");

  // Similar plugins (same category, excluding current)
  const similarPlugins = (topPlugins as bigint[] | undefined)
    ?.filter((id) => id !== pluginId)
    .slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Back Navigation */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-sm border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Plugins</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Plugin Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex items-start space-x-6">
            {/* Plugin Icon */}
            <div
              className={`w-24 h-24 bg-gradient-to-br ${getCategoryGradient(plugin.category as Category)} rounded-2xl flex items-center justify-center text-4xl shadow-lg`}
            >
              {icon.type === "emoji" ? (
                icon.value
              ) : (
                <img src={icon.value} alt={displayName} className="w-16 h-16 rounded-xl" />
              )}
            </div>

            {/* Plugin Info */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                <span
                  className={`px-3 py-1 bg-gradient-to-r ${getCategoryGradient(plugin.category as Category)} text-white text-sm font-medium rounded-full`}
                >
                  {getCategoryIcon(plugin.category as Category)} {getCategoryName(plugin.category as Category)}
                </span>
              </div>

              <p className="text-gray-400 mb-3">
                by <span className="text-purple-400">{metadata?.author || `${plugin.creator.slice(0, 6)}...${plugin.creator.slice(-4)}`}</span>
              </p>

              {/* Rating & Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-semibold">
                    {formatRating(plugin.rating, plugin.ratingCount)}
                  </span>
                  <span className="text-gray-500">({Number(plugin.ratingCount)} reviews)</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{formatInstallCount(plugin.installCount)} installs</span>
                </div>
                {plugin.verified && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Install Button */}
          <div className="flex flex-col items-end space-y-3">
            {cheapestListing && (
              <p className="text-2xl font-bold text-white">
                {formatPluginPrice(cheapestListing.price)}
              </p>
            )}
            <button
              onClick={() => setShowInstallModal(true)}
              disabled={!isConnected || !plugin.active}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                isConnected && plugin.active
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {!isConnected
                ? "Connect Wallet"
                : !plugin.active
                  ? "Plugin Inactive"
                  : "Install Plugin"}
            </button>
            {!isConnected && (
              <p className="text-gray-500 text-sm">Connect wallet to install</p>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl">
              {(["overview", "pricing", "versions"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="neural-card rounded-2xl p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Description</h2>
                    <p className="text-gray-300 leading-relaxed">
                      {metadata?.longDescription || metadata?.description || "No description available."}
                    </p>
                  </div>

                  {metadata?.features && metadata.features.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
                      <ul className="space-y-2">
                        {metadata.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="text-purple-400 mt-1">✓</span>
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {metadata?.tags && metadata.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4">Pricing Plans</h2>

                  {activeListings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No pricing plans available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeListings.map((listing, index) => (
                        <div
                          key={index}
                          className="p-5 rounded-xl border-2 border-gray-600 hover:border-purple-500/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getAccessTypeIcon(listing.accessType)}</span>
                              <div>
                                <p className="text-white font-semibold text-lg">
                                  {getAccessTypeLabel(listing.accessType)}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {listing.accessType === 1 && `${formatDuration(listing.duration)} access`}
                                  {listing.accessType === 2 && formatQuota(listing.usageQuota)}
                                  {listing.accessType === 0 && "Lifetime access"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold text-xl">
                                {formatPluginPrice(listing.price)}
                              </p>
                              {hasTrialAvailable(listing) && (
                                <p className="text-green-400 text-sm">
                                  {formatDuration(listing.trialDuration)} free trial
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowInstallModal(true)}
                            disabled={!isConnected}
                            className={`w-full py-2 rounded-lg font-medium transition-colors ${
                              isConnected
                                ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {isConnected ? "Select this plan" : "Connect wallet"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "versions" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4">Version History</h2>

                  {/* Current Version */}
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">
                        v{metadata?.version || "1.0.0"}
                      </span>
                      <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                        Current
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {metadata?.changelog || "Initial release"}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Published: {new Date(Number(plugin.createdAt) * 1000).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Placeholder for version history */}
                  <p className="text-gray-500 text-sm text-center py-4">
                    Version history will be available when plugin versions are registered on-chain.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Creator Info Card */}
            <div className="neural-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Developer</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {(metadata?.author || plugin.creator.slice(2, 4)).toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {metadata?.author || `${plugin.creator.slice(0, 6)}...${plugin.creator.slice(-4)}`}
                  </p>
                  <p className="text-gray-400 text-sm">Plugin Developer</p>
                </div>
              </div>

              {/* Developer Links */}
              <div className="space-y-2">
                {metadata?.website && (
                  <a
                    href={metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span>Website</span>
                  </a>
                )}
                {metadata?.documentation && (
                  <a
                    href={metadata.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Documentation</span>
                  </a>
                )}
                {metadata?.repository && (
                  <a
                    href={metadata.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span>Repository</span>
                  </a>
                )}
              </div>

              {/* Contract Info */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-500 text-xs mb-1">Contract Address</p>
                <a
                  href={`https://hyperion-testnet-explorer.metisdevops.link/address/${plugin.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 text-sm font-mono hover:text-purple-300"
                >
                  {plugin.creator.slice(0, 10)}...{plugin.creator.slice(-8)}
                </a>
              </div>
            </div>

            {/* Plugin Stats Card */}
            <div className="neural-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-white">{formatInstallCount(plugin.installCount)}</p>
                  <p className="text-gray-400 text-sm">Installs</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-white">
                    {getStarRating(plugin.rating).toFixed(1)}
                  </p>
                  <p className="text-gray-400 text-sm">Rating</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-white">{Number(plugin.ratingCount)}</p>
                  <p className="text-gray-400 text-sm">Reviews</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                  <p className="text-2xl font-bold text-white">{activeListings.length}</p>
                  <p className="text-gray-400 text-sm">Plans</p>
                </div>
              </div>
            </div>

            {/* Similar Plugins */}
            {similarPlugins.length > 0 && (
              <div className="neural-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Similar Plugins</h3>
                <div className="space-y-3">
                  {similarPlugins.map((id) => (
                    <SimilarPluginCard key={id.toString()} pluginId={id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Install Modal */}
      {showInstallModal && plugin && listings && (
        <InstallPluginModal
          plugin={plugin}
          listings={listings as PluginListing[]}
          onClose={() => setShowInstallModal(false)}
          onSuccess={() => {
            setShowInstallModal(false);
          }}
        />
      )}
    </div>
  );
}

// Similar Plugin Card Component
function SimilarPluginCard({ pluginId }: { pluginId: bigint }) {
  const { data: plugin } = usePluginDetails(pluginId);
  const [metadata, setMetadata] = useState<PluginMetadata | null>(null);

  useEffect(() => {
    if (plugin?.metadataURI) {
      fetchPluginMetadata(plugin.metadataURI).then(setMetadata);
    }
  }, [plugin?.metadataURI]);

  if (!plugin) return null;

  const icon = getIconDisplay(metadata?.icon || "🔌");
  const displayName = metadata?.name || plugin.name;

  return (
    <Link
      href={`/plugins/${pluginId}`}
      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
    >
      <div
        className={`w-10 h-10 bg-gradient-to-br ${getCategoryGradient(plugin.category as Category)} rounded-lg flex items-center justify-center text-lg`}
      >
        {icon.type === "emoji" ? icon.value : "🔌"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{displayName}</p>
        <p className="text-gray-400 text-sm">
          {formatRating(plugin.rating, plugin.ratingCount)} ★
        </p>
      </div>
    </Link>
  );
}
