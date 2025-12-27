"use client";

import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  companionName: string;
  companionAvatar: {
    gradient: string;
    emoji: string;
  };
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
}: TipModalProps) {
  const { address, isConnected } = useAccount();
  const [selectedAmount, setSelectedAmount] = useState<string>("0.01");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock transaction state (replace with actual contract call later)
  const { sendTransaction, data: hash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Handle tip submission
  const handleTip = async () => {
    if (!isConnected || !address) return;

    const amount = isCustom ? customAmount : selectedAmount;
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      // Mock: Send native token to a placeholder address
      // In production, this would send to the companion's creator address from the contract
      const mockRecipientAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;

      sendTransaction({
        to: mockRecipientAddress,
        value: parseEther(amount),
      });
    } catch (error) {
      console.error("Tip error:", error);
    }
  };

  // Show success state
  if (isSuccess && !showSuccess) {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 3000);
  }

  if (!isOpen) return null;

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
              {companionName} appreciates your support! 💖
            </p>
            <div className="mt-4 text-sm text-gray-400">
              Transaction confirmed on Metis Hyperion
            </div>
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
            </div>

            {/* Predefined Amounts */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Choose an amount:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TIP_AMOUNTS.map((tip) => (
                  <button
                    key={tip.value}
                    onClick={() => {
                      setSelectedAmount(tip.value);
                      setIsCustom(false);
                      setCustomAmount("");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      !isCustom && selectedAmount === tip.value
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-gray-700 hover:border-purple-500/50 bg-gray-800/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{tip.emoji}</div>
                    <div className="text-white font-semibold">{tip.value} tMETIS</div>
                    <div className="text-xs text-gray-400">{tip.label}</div>
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

            {/* Current Balance (Mock) */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Your balance:</span>
                <span className="text-white font-semibold">~5.0 tMETIS</span>
              </div>
            </div>

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
                  (isCustom ? !customAmount || parseFloat(customAmount) <= 0 : false)
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
                  `Send ${isCustom ? customAmount : selectedAmount} tMETIS`
                )}
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300 text-center">
                💡 Tips support your AI companion's creator and help improve the
                experience
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
