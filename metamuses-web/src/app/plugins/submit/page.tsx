"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { parseEther } from "viem";
import { Category, AccessType } from "@/contracts/PluginMarketplace";
import { usePluginMarketplace } from "@/hooks/usePluginMarketplace";
import {
  getCategoryName,
  getCategoryIcon,
  getCategoryGradient,
  getAllCategories,
} from "@/utils/pluginCategories";
import { getAccessTypeLabel, getAccessTypeIcon, getAccessTypeDescription } from "@/utils/pluginPricing";

type Step = "connect" | "info" | "technical" | "pricing" | "review" | "deploying" | "success";

interface PluginFormData {
  name: string;
  description: string;
  category: Category;
  metadataURI: string;
  wasmHash: string;
  // Pricing
  accessType: AccessType;
  price: string;
  duration: string; // in days
  usageQuota: string;
  trialDuration: string; // in days
}

const INITIAL_FORM_DATA: PluginFormData = {
  name: "",
  description: "",
  category: Category.TOOLS,
  metadataURI: "",
  wasmHash: "",
  accessType: AccessType.PERMANENT,
  price: "0",
  duration: "30",
  usageQuota: "100",
  trialDuration: "0",
};

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: "connect", label: "Connect", number: 1 },
  { key: "info", label: "Info", number: 2 },
  { key: "technical", label: "Technical", number: 3 },
  { key: "pricing", label: "Pricing", number: 4 },
  { key: "review", label: "Review", number: 5 },
];

export default function SubmitPluginPage() {
  const { address, isConnected } = useAccount();
  const {
    registerPlugin,
    createListing,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    reset,
  } = usePluginMarketplace();

  const [step, setStep] = useState<Step>("connect");
  const [formData, setFormData] = useState<PluginFormData>(INITIAL_FORM_DATA);
  const [registeredPluginId, setRegisteredPluginId] = useState<bigint | null>(null);

  // Auto-advance from connect step when wallet connects
  useEffect(() => {
    if (isConnected && step === "connect") {
      setStep("info");
    }
  }, [isConnected, step]);

  // Handle transaction states
  useEffect(() => {
    if (isPending || isConfirming) {
      setStep("deploying");
    } else if (isConfirmed && !registeredPluginId) {
      // For demo, we'll show success after registration
      // In real implementation, you'd get the plugin ID from the event
      setRegisteredPluginId(BigInt(1));
      setStep("success");
    }
  }, [isPending, isConfirming, isConfirmed, registeredPluginId]);

  const updateFormData = (field: keyof PluginFormData, value: string | number | Category | AccessType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Convert days to seconds for duration/trial
    const durationSeconds = BigInt(parseInt(formData.duration) * 86400);
    const trialSeconds = BigInt(parseInt(formData.trialDuration) * 86400);
    const quota = BigInt(parseInt(formData.usageQuota) || 0);
    const priceWei = parseEther(formData.price);

    // Register plugin (this will also create the listing in real implementation)
    registerPlugin(
      formData.name,
      formData.metadataURI,
      formData.wasmHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
      formData.category
    );
  };

  const handleReset = () => {
    reset();
    setFormData(INITIAL_FORM_DATA);
    setStep("info");
    setRegisteredPluginId(null);
  };

  const canProceed = (currentStep: Step): boolean => {
    switch (currentStep) {
      case "connect":
        return isConnected;
      case "info":
        return formData.name.length >= 3 && formData.description.length >= 10;
      case "technical":
        return formData.metadataURI.length > 0;
      case "pricing":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const getStepIndex = (s: Step): number => {
    const idx = STEPS.findIndex((step) => step.key === s);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIndex = getStepIndex(step);

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
              <h1 className="text-3xl font-bold text-white">Submit a Plugin</h1>
              <p className="text-gray-400 mt-1">
                Share your creation with the MetaMuses community
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      {step !== "deploying" && step !== "success" && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    i < currentStepIndex
                      ? "bg-green-500 text-white"
                      : i === currentStepIndex
                        ? "bg-purple-500 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {i < currentStepIndex ? "✓" : s.number}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded ${
                      i < currentStepIndex ? "bg-green-500" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <p className="text-gray-400 text-sm">
              Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.label}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Connect Wallet */}
          {step === "connect" && (
            <div className="neural-card rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔗</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Connect your wallet to submit plugins to the marketplace
              </p>
              <w3m-button />
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === "info" && (
            <div className="neural-card rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Plugin Information</h2>
                <p className="text-gray-400">Tell us about your plugin</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-white font-medium mb-2">Plugin Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="My Awesome Plugin"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-gray-500 text-sm mt-1">Minimum 3 characters</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getAllCategories().map((cat) => (
                    <button
                      key={cat}
                      onClick={() => updateFormData("category", cat)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        formData.category === cat
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-700 hover:border-purple-400"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{getCategoryIcon(cat)}</span>
                      <span className="text-white text-sm">{getCategoryName(cat)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Describe what your plugin does..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                />
                <p className="text-gray-500 text-sm mt-1">Minimum 10 characters</p>
              </div>
            </div>
          )}

          {/* Step 3: Technical Details */}
          {step === "technical" && (
            <div className="neural-card rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Technical Details</h2>
                <p className="text-gray-400">Provide technical information about your plugin</p>
              </div>

              {/* Metadata URI */}
              <div>
                <label className="block text-white font-medium mb-2">Metadata URI (IPFS)</label>
                <input
                  type="text"
                  value={formData.metadataURI}
                  onChange={(e) => updateFormData("metadataURI", e.target.value)}
                  placeholder="ipfs://Qm... or https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none font-mono text-sm"
                />
                <p className="text-gray-500 text-sm mt-1">
                  JSON file containing name, description, icon, features, etc.
                </p>
              </div>

              {/* WASM Hash */}
              <div>
                <label className="block text-white font-medium mb-2">
                  WASM Hash <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.wasmHash}
                  onChange={(e) => updateFormData("wasmHash", e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none font-mono text-sm"
                />
                <p className="text-gray-500 text-sm mt-1">
                  Hash of your compiled WASM plugin binary
                </p>
              </div>

              {/* Metadata Schema Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <h4 className="text-blue-400 font-medium mb-2">Metadata JSON Schema</h4>
                <pre className="text-gray-400 text-xs overflow-x-auto">
{`{
  "name": "Plugin Name",
  "description": "Short description",
  "longDescription": "Detailed description",
  "icon": "emoji or URL",
  "features": ["Feature 1", "Feature 2"],
  "author": "Your Name",
  "website": "https://...",
  "tags": ["tag1", "tag2"]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === "pricing" && (
            <div className="neural-card rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Pricing Setup</h2>
                <p className="text-gray-400">Configure how users will pay for your plugin</p>
              </div>

              {/* Access Type */}
              <div>
                <label className="block text-white font-medium mb-3">Access Type</label>
                <div className="space-y-3">
                  {[AccessType.PERMANENT, AccessType.SUBSCRIPTION, AccessType.USAGE_BASED].map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFormData("accessType", type)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        formData.accessType === type
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-700 hover:border-purple-400"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getAccessTypeIcon(type)}</span>
                        <div>
                          <p className="text-white font-semibold">{getAccessTypeLabel(type)}</p>
                          <p className="text-gray-400 text-sm">{getAccessTypeDescription(type)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-white font-medium mb-2">Price (tMETIS)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateFormData("price", e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.001"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-gray-500 text-sm mt-1">Set to 0 for free plugins</p>
              </div>

              {/* Duration (for subscription) */}
              {formData.accessType === AccessType.SUBSCRIPTION && (
                <div>
                  <label className="block text-white font-medium mb-2">Duration (days)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => updateFormData("duration", e.target.value)}
                    placeholder="30"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Usage Quota (for usage-based) */}
              {formData.accessType === AccessType.USAGE_BASED && (
                <div>
                  <label className="block text-white font-medium mb-2">Usage Quota</label>
                  <input
                    type="number"
                    value={formData.usageQuota}
                    onChange={(e) => updateFormData("usageQuota", e.target.value)}
                    placeholder="100"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-gray-500 text-sm mt-1">Number of uses included</p>
                </div>
              )}

              {/* Trial Duration */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Free Trial (days) <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={formData.trialDuration}
                  onChange={(e) => updateFormData("trialDuration", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-gray-500 text-sm mt-1">Set to 0 for no trial</p>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === "review" && (
            <div className="neural-card rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Review & Deploy</h2>
                <p className="text-gray-400">Confirm your plugin details before deploying</p>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${getCategoryGradient(formData.category)} rounded-xl flex items-center justify-center text-3xl`}
                  >
                    {getCategoryIcon(formData.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{formData.name}</h3>
                    <p className="text-gray-400">{getCategoryName(formData.category)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-gray-400 text-sm">Access Type</p>
                    <p className="text-white font-semibold">
                      {getAccessTypeIcon(formData.accessType)} {getAccessTypeLabel(formData.accessType)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-white font-semibold">
                      {parseFloat(formData.price) === 0 ? "Free" : `${formData.price} tMETIS`}
                    </p>
                  </div>
                </div>

                {formData.accessType === AccessType.SUBSCRIPTION && (
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-gray-400 text-sm">Subscription Duration</p>
                    <p className="text-white font-semibold">{formData.duration} days</p>
                  </div>
                )}

                {formData.accessType === AccessType.USAGE_BASED && (
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-gray-400 text-sm">Usage Quota</p>
                    <p className="text-white font-semibold">{formData.usageQuota} uses</p>
                  </div>
                )}

                {parseInt(formData.trialDuration) > 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <p className="text-green-400 text-sm">Free Trial</p>
                    <p className="text-white font-semibold">{formData.trialDuration} days</p>
                  </div>
                )}

                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white">{formData.description}</p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-gray-400 text-sm">Metadata URI</p>
                  <p className="text-white font-mono text-sm break-all">{formData.metadataURI}</p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  <strong>Note:</strong> Deploying a plugin requires a blockchain transaction.
                  Make sure you have enough tMETIS for gas fees.
                </p>
              </div>
            </div>
          )}

          {/* Deploying */}
          {step === "deploying" && (
            <div className="neural-card rounded-2xl p-8 text-center">
              <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-3">
                {isPending ? "Confirm in Wallet" : "Deploying Plugin..."}
              </h2>
              <p className="text-gray-400 mb-6">
                {isPending
                  ? "Please confirm the transaction in your wallet"
                  : "Waiting for transaction confirmation..."}
              </p>
              {hash && (
                <a
                  href={`https://explorer.hyperion-testnet.metis.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="neural-card rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Plugin Registered!</h2>
              <p className="text-gray-400 mb-6">
                Your plugin has been successfully registered on the marketplace.
              </p>
              {hash && (
                <a
                  href={`https://explorer.hyperion-testnet.metis.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 block mb-6"
                >
                  View Transaction →
                </a>
              )}
              <div className="flex justify-center space-x-4">
                <Link
                  href="/plugins"
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                >
                  View Marketplace
                </Link>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
                >
                  Submit Another
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && step !== "success" && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400">
                <strong>Error:</strong> {error.message || "Something went wrong"}
              </p>
              <button
                onClick={handleReset}
                className="mt-2 text-red-400 underline hover:text-red-300"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {step !== "connect" && step !== "deploying" && step !== "success" && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  const steps: Step[] = ["info", "technical", "pricing", "review"];
                  const currentIdx = steps.indexOf(step);
                  if (currentIdx > 0) {
                    setStep(steps[currentIdx - 1]);
                  }
                }}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Back
              </button>

              {step !== "review" ? (
                <button
                  onClick={() => {
                    const steps: Step[] = ["info", "technical", "pricing", "review"];
                    const currentIdx = steps.indexOf(step);
                    if (currentIdx < steps.length - 1 && canProceed(step)) {
                      setStep(steps[currentIdx + 1]);
                    }
                  }}
                  disabled={!canProceed(step)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    canProceed(step)
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all"
                >
                  Deploy Plugin
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
