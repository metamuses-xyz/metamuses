"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { useTipJar, useTipsForToken, useRevenueShare } from "@/hooks/useTipJar";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  companionName: string;
  companionAvatar: {
    gradient: string;
    emoji: string;
  };
  tokenId: bigint; // The NFT token ID to tip
  onTipSuccess?: (amount: string) => void;
}

// Predefined tip amounts in tMETIS
const TIP_AMOUNTS = [
  { label: "Coffee", value: "0.01", emoji: "☕" },
  { label: "Pizza", value: "0.05", emoji: "🍕" },
  { label: "Dinner", value: "0.1", emoji: "🍽️" },
  { label: "Generous", value: "0.5", emoji: "💎" },
];

export default function TipModal({
  isOpen,
  onClose,
  companionName,
  companionAvatar,
  tokenId,
  onTipSuccess,
}: TipModalProps) {
  const { address, isConnected } = useAccount();
  const [selectedAmount, setSelectedAmount] = useState<string>("0.01");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>("");

  // Get user's balance
  const { data: balanceData } = useBalance({
    address: address,
  });

  // TipJar contract hooks
  const { tip, isPending, isConfirming, isConfirmed, error, hash, reset } =
    useTipJar();

  // Get total tips for this token
  const { totalTips, refetch: refetchTips } = useTipsForToken(tokenId);

  // Get revenue share percentages
  const { creatorSharePercent, platformSharePercent } = useRevenueShare();

  // Handle tip submission
  const handleTip = async () => {
    if (!isConnected || !address) return;

    const amount = isCustom ? customAmount : selectedAmount;
    if (!amount || parseFloat(amount) <= 0) return;

    // Store the amount for success callback
    setTipAmount(amount);

    try {
      // Send tip through TipJar contract with revenue sharing
      tip(tokenId, amount);
    } catch (err) {
      console.error("Tip error:", err);
    }
  };

  // Handle success state
  useEffect(() => {
    if (isConfirmed && !showSuccess) {
      setShowSuccess(true);
      refetchTips();

      // Trigger happy response from AI
      if (onTipSuccess && tipAmount) {
        onTipSuccess(tipAmount);
      }

      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
        // Reset states
        setSelectedAmount("0.01");
        setCustomAmount("");
        setIsCustom(false);
        setTipAmount("");
        reset();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    isConfirmed,
    showSuccess,
    tipAmount,
    onTipSuccess,
    onClose,
    refetchTips,
    reset,
  ]);

  // Reset on modal open
  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setSelectedAmount("0.01");
      setCustomAmount("");
      setIsCustom(false);
      setTipAmount("");
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const currentAmount = isCustom ? customAmount : selectedAmount;
  const creatorAmount = currentAmount
    ? ((parseFloat(currentAmount) * creatorSharePercent) / 100).toFixed(4)
    : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="neural-card rounded-2xl p-8 max-w-md w-full relative animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Success State */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Tip Sent!</h3>
            <p className="text-gray-300">
              {companionName} appreciates your support!
            </p>
            <div className="mt-4 space-y-1 text-sm text-gray-400">
              <p>
                Creator received: {creatorAmount} tMETIS ({creatorSharePercent}
                %)
              </p>
              <p>Transaction confirmed on Metis Hyperion</p>
            </div>
            {hash && (
              <a
                href={`https://explorer.hyperion-testnet.metis.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-purple-400 hover:text-purple-300 text-sm underline"
              >
                View on Explorer
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 bg-gradient-to-br ${companionAvatar.gradient} rounded-full flex items-center justify-center text-3xl mx-auto mb-3`}
              >
                {companionAvatar.emoji}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Tip {companionName}
              </h2>
              <p className="text-gray-400 text-sm">
                Show your appreciation with tMETIS tokens
              </p>
              {parseFloat(totalTips) > 0 && (
                <p className="text-purple-400 text-xs mt-1">
                  Total tips received: {parseFloat(totalTips).toFixed(4)} tMETIS
                </p>
              )}
            </div>

            {/* Predefined Amounts */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Choose an amount:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TIP_AMOUNTS.map((tipOption) => (
                  <button
                    key={tipOption.value}
                    onClick={() => {
                      setSelectedAmount(tipOption.value);
                      setIsCustom(false);
                      setCustomAmount("");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      !isCustom && selectedAmount === tipOption.value
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-gray-700 hover:border-purple-500/50 bg-gray-800/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{tipOption.emoji}</div>
                    <div className="text-white font-semibold">
                      {tipOption.value} tMETIS
                    </div>
                    <div className="text-xs text-gray-400">
                      {tipOption.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Or enter custom amount:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.0"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setIsCustom(true);
                  }}
                  onFocus={() => setIsCustom(true)}
                  className={`w-full bg-gray-800/50 border-2 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all ${
                    isCustom
                      ? "border-purple-500 ring-2 ring-purple-500/20"
                      : "border-gray-700 focus:border-purple-500"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  tMETIS
                </span>
              </div>
            </div>

            {/* Revenue Split Info */}
            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Creator receives:</span>
                <span className="text-purple-300 font-semibold">
                  {creatorAmount} tMETIS ({creatorSharePercent}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-gray-400">Platform fee:</span>
                <span className="text-gray-400">{platformSharePercent}%</span>
              </div>
            </div>

            {/* Current Balance */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Your balance:</span>
                <span className="text-white font-semibold">
                  {balanceData
                    ? `${parseFloat(formatEther(balanceData.value)).toFixed(4)} tMETIS`
                    : "Loading..."}
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-300 text-center">
                  {error.message || "Transaction failed. Please try again."}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={
                  !isConnected ||
                  isPending ||
                  isConfirming ||
                  (isCustom
                    ? !customAmount || parseFloat(customAmount) <= 0
                    : false)
                }
                className="flex-1 neural-button px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending || isConfirming ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {isConfirming ? "Confirming..." : "Sending..."}
                  </span>
                ) : (
                  `Send ${currentAmount} tMETIS`
                )}
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300 text-center">
                Tips support your AI companion's creator with{" "}
                {creatorSharePercent}% going directly to them
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
