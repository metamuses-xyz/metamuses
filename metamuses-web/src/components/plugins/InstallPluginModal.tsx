"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Plugin,
  PluginListing,
  AccessType,
} from "@/contracts/PluginMarketplace";
import { usePluginMarketplace } from "@/hooks/usePluginMarketplace";
import MuseSelector from "./MuseSelector";
import {
  formatPluginPrice,
  getAccessTypeLabel,
  getAccessTypeIcon,
  formatDuration,
  formatQuota,
  hasTrialAvailable,
} from "@/utils/pluginPricing";
import { getCategoryIcon, getCategoryGradient } from "@/utils/pluginCategories";

interface InstallPluginModalProps {
  plugin: Plugin;
  listings: PluginListing[];
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "select-muse" | "select-listing" | "confirm" | "processing" | "success" | "error";

export default function InstallPluginModal({
  plugin,
  listings,
  onClose,
  onSuccess,
}: InstallPluginModalProps) {
  const { isConnected } = useAccount();
  const {
    installPlugin,
    startTrial,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    reset,
  } = usePluginMarketplace();

  const [step, setStep] = useState<Step>("select-muse");
  const [selectedMuseId, setSelectedMuseId] = useState<bigint | null>(null);
  const [selectedListing, setSelectedListing] = useState<PluginListing | null>(null);
  const [useTrial, setUseTrial] = useState(false);

  // Filter active listings
  const activeListings = listings.filter((l) => l.active);

  // Handle transaction state changes
  useEffect(() => {
    if (isPending) {
      setStep("processing");
    } else if (isConfirming) {
      setStep("processing");
    } else if (isConfirmed) {
      setStep("success");
      onSuccess?.();
    } else if (error) {
      setStep("error");
    }
  }, [isPending, isConfirming, isConfirmed, error, onSuccess]);

  const handleMuseSelect = (museId: bigint) => {
    setSelectedMuseId(museId);
  };

  const handleListingSelect = (listing: PluginListing) => {
    setSelectedListing(listing);
    setUseTrial(false);
  };

  const handleTrialSelect = (listing: PluginListing) => {
    setSelectedListing(listing);
    setUseTrial(true);
  };

  const handleInstall = () => {
    if (!selectedMuseId || !selectedListing) return;

    if (useTrial) {
      startTrial(
        selectedMuseId,
        plugin.id,
        BigInt(listings.indexOf(selectedListing))
      );
    } else {
      installPlugin(
        selectedMuseId,
        plugin.id,
        BigInt(listings.indexOf(selectedListing)),
        selectedListing.price
      );
    }
  };

  const handleReset = () => {
    reset();
    setStep("select-muse");
    setSelectedMuseId(null);
    setSelectedListing(null);
    setUseTrial(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canProceedToListing = selectedMuseId !== null;
  const canProceedToConfirm = selectedListing !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${getCategoryGradient(plugin.category)} rounded-xl flex items-center justify-center text-2xl`}
              >
                {getCategoryIcon(plugin.category)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{plugin.name}</h2>
                <p className="text-gray-400 text-sm">Install Plugin</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          {step !== "processing" && step !== "success" && step !== "error" && (
            <div className="flex items-center justify-center mt-4 space-x-2">
              {["select-muse", "select-listing", "confirm"].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === s
                        ? "bg-purple-500 text-white"
                        : i < ["select-muse", "select-listing", "confirm"].indexOf(step)
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {i < ["select-muse", "select-listing", "confirm"].indexOf(step) ? "✓" : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-8 h-0.5 ${
                        i < ["select-muse", "select-listing", "confirm"].indexOf(step)
                          ? "bg-green-500"
                          : "bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Select Muse */}
          {step === "select-muse" && (
            <div>
              <MuseSelector
                pluginId={plugin.id}
                onSelect={handleMuseSelect}
                selectedMuseId={selectedMuseId}
              />
            </div>
          )}

          {/* Step 2: Select Listing */}
          {step === "select-listing" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Choose a Pricing Plan
              </h3>

              {activeListings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No pricing options available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeListings.map((listing, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedListing === listing && !useTrial
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-600 hover:border-purple-400"
                      }`}
                      onClick={() => handleListingSelect(listing)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {getAccessTypeIcon(listing.accessType)}
                          </span>
                          <div>
                            <p className="text-white font-semibold">
                              {getAccessTypeLabel(listing.accessType)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {listing.accessType === AccessType.SUBSCRIPTION &&
                                `${formatDuration(listing.duration)} access`}
                              {listing.accessType === AccessType.USAGE_BASED &&
                                `${formatQuota(listing.usageQuota)}`}
                              {listing.accessType === AccessType.PERMANENT &&
                                "Lifetime access"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">
                            {formatPluginPrice(listing.price)}
                          </p>
                          {hasTrialAvailable(listing) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrialSelect(listing);
                              }}
                              className={`text-xs mt-1 px-2 py-1 rounded-full ${
                                selectedListing === listing && useTrial
                                  ? "bg-green-500 text-white"
                                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              }`}
                            >
                              {formatDuration(listing.trialDuration)} Free Trial
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedMuseId && selectedListing && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Confirm Installation
              </h3>

              <div className="neural-card rounded-xl p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plugin</span>
                  <span className="text-white font-semibold">{plugin.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Install on</span>
                  <span className="text-white">
                    Muse #{Number(selectedMuseId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white">
                    {getAccessTypeLabel(selectedListing.accessType)}
                    {useTrial && " (Trial)"}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-4 flex justify-between">
                  <span className="text-gray-400 font-semibold">Total</span>
                  <span className="text-white font-bold text-xl">
                    {useTrial ? "Free" : formatPluginPrice(selectedListing.price)}
                  </span>
                </div>
              </div>

              {!useTrial && selectedListing.price > BigInt(0) && (
                <p className="text-gray-400 text-sm text-center">
                  This will require a blockchain transaction
                </p>
              )}
            </div>
          )}

          {/* Processing */}
          {step === "processing" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {isPending ? "Confirm in Wallet" : "Processing..."}
              </h3>
              <p className="text-gray-400">
                {isPending
                  ? "Please confirm the transaction in your wallet"
                  : "Waiting for transaction confirmation..."}
              </p>
              {hash && (
                <a
                  href={`https://explorer.hyperion-testnet.metis.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm mt-4 inline-block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Plugin Installed!
              </h3>
              <p className="text-gray-400 mb-4">
                {plugin.name} has been installed on Muse #
                {selectedMuseId ? Number(selectedMuseId) : ""}
              </p>
              {hash && (
                <a
                  href={`https://explorer.hyperion-testnet.metis.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View Transaction →
                </a>
              )}
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Installation Failed
              </h3>
              <p className="text-gray-400 mb-4">
                {error?.message || "Something went wrong. Please try again."}
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "processing" && step !== "success" && step !== "error" && (
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/20 p-6">
            <div className="flex justify-between">
              {step !== "select-muse" ? (
                <button
                  onClick={() => {
                    if (step === "select-listing") setStep("select-muse");
                    if (step === "confirm") setStep("select-listing");
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step === "select-muse" && (
                <button
                  onClick={() => setStep("select-listing")}
                  disabled={!canProceedToListing}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    canProceedToListing
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continue
                </button>
              )}

              {step === "select-listing" && (
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!canProceedToConfirm}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    canProceedToConfirm
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continue
                </button>
              )}

              {step === "confirm" && (
                <button
                  onClick={handleInstall}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all"
                >
                  {useTrial
                    ? "Start Free Trial"
                    : selectedListing && selectedListing.price === BigInt(0)
                      ? "Install Free"
                      : "Install & Pay"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success/Error close button */}
        {(step === "success" || step === "error") && (
          <div className="p-6 border-t border-purple-500/20">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
