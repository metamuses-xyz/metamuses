"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useMuseAIContract } from "@/hooks/useMuseAI";
import { useGaslessMint } from "@/hooks/useGaslessMint";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

// Neural Network Background
const NeuralNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const nodeCount = 50;

    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
        ctx.fill();

        // Draw connections
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-30"
    />
  );
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex justify-center space-x-4 mb-8">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 min-w-[80px] border border-purple-500/30">
            <div className="text-3xl font-bold text-white font-mono">
              {value.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-purple-200 uppercase tracking-wider">
              {unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Muse AI NFT Component
const MuseAINFT = ({
  onMint,
  isMinting,
  mintCount,
}: {
  onMint: () => void;
  isMinting: boolean;
  mintCount: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const maxSupply = 5000;
  const remaining = maxSupply - mintCount;

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`neural-card rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden group ${
          isHovered ? "ring-2 ring-purple-500/50" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Free Mint Badge */}
        <div className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
          FREE MINT
        </div>

        <div className="relative z-10">
          {/* NFT Avatar */}
          <div className="text-center mb-8">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110 relative p-4">
              <Image
                src="/metamuses_logo_2.png"
                alt="MetaMuses Logo"
                width={160}
                height={160}
                className="object-contain"
                priority
              />

              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-pulse opacity-50" />

              <div
                className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"
                style={{ animationDelay: "1s" }}
              />
            </div>

            <h2 className="text-4xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors">
              Muse AI Genesis
            </h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              The first-ever AI companion NFT with advanced personality traits,
              persistent memory, and blockchain-verified interactions. Your
              gateway to the MetaMuse ecosystem.
            </p>
          </div>

          {/* Personality Traits */}
          {/* <div className="mb-8" data-oid="450uq6u">
                                          <h3
                                            className="text-xl font-semibold text-gray-200 mb-4 text-center"
                                            data-oid="e4:m0aq"
                                          >
                                            🧠 AI Capabilities
                                          </h3>
                                          <div className="grid grid-cols-2 gap-4" data-oid="y:5b.70">
                                            {[
                                              {
                                                trait: "Intelligence",
                                                value: 95,
                                                color: "from-blue-500 to-cyan-500",
                                              },
                                              {
                                                trait: "Creativity",
                                                value: 88,
                                                color: "from-purple-500 to-pink-500",
                                              },
                                              {
                                                trait: "Empathy",
                                                value: 92,
                                                color: "from-green-500 to-teal-500",
                                              },
                                              {
                                                trait: "Adaptability",
                                                value: 90,
                                                color: "from-orange-500 to-yellow-500",
                                              },
                                            ].map(({ trait, value, color }) => (
                                              <div
                                                key={trait}
                                                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
                                                data-oid="pz9rsvd"
                                              >
                                                <div
                                                  className="flex items-center justify-between mb-2"
                                                  data-oid="229h4.."
                                                >
                                                  <span
                                                    className="text-gray-300 font-medium"
                                                    data-oid="a9ds6xz"
                                                  >
                                                    {trait}
                                                  </span>
                                                  <span
                                                    className="text-purple-400 font-mono font-bold"
                                                    data-oid="6sqo5dp"
                                                  >
                                                    {value}%
                                                  </span>
                                                </div>
                                                <div
                                                  className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                                                  data-oid="nlnc81h"
                                                >
                                                  <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
                                                    style={{ width: `${value}%` }}
                                                    data-oid="_mka8dg"
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                         </div> */}

          {/* NFT Details */}
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-gray-400 text-sm">Collection</span>
                <div className="text-white font-semibold">Muse AI Genesis</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Network</span>
                <div className="text-white font-semibold">Hyperion Testnet</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Total Supply</span>
                <div className="text-white font-semibold">
                  {maxSupply.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Remaining</span>
                <div className="text-green-400 font-semibold">
                  {remaining.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Minting Progress</span>
              <span className="text-purple-400 font-mono text-sm">
                {mintCount}/{maxSupply}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(mintCount / maxSupply) * 100}%` }}
              />
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
              FREE
            </div>
            <div className="text-gray-400 text-lg">
              No gas fees • No hidden costs • Just sign & mint!
            </div>
          </div>

          {/* Minting Status */}
          {isMinting && (
            <div className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />

                  <span className="text-purple-300 font-medium">
                    Transaction in progress...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mint Button */}
          <button
            onClick={onMint}
            disabled={isMinting || remaining === 0}
            className={`w-full py-6 rounded-xl font-bold text-xl transition-all duration-300 relative overflow-hidden ${
              remaining === 0
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : isMinting
                  ? "bg-purple-600/50 text-white cursor-not-allowed"
                  : "neural-button text-white hover:scale-105 shadow-lg shadow-purple-500/30"
            }`}
          >
            {remaining === 0 ? (
              "🔥 SOLD OUT"
            ) : isMinting ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />

                <span>Minting Your Muse AI...</span>
              </div>
            ) : (
              <>
                <span className="relative z-10">
                  🚀 MINT YOUR MUSE AI - FREE
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </>
            )}
          </button>

          {/* Benefits */}
          {/* <div
                                        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center"
                                        data-oid="rd-zhmj"
                                       >
                                        <div
                                          className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
                                          data-oid="r7vcyq_"
                                        >
                                          <div className="text-2xl mb-2" data-oid="3:--cpq">
                                            💬
                                          </div>
                                          <div className="text-sm text-gray-300" data-oid="p.g8ge3">
                                            Persistent Memory
                                          </div>
                                        </div>
                                        <div
                                          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                                          data-oid="fj2kmvs"
                                        >
                                          <div className="text-2xl mb-2" data-oid="nl8k.8j">
                                            🔗
                                          </div>
                                          <div className="text-sm text-gray-300" data-oid="4po3ugp">
                                            Blockchain Verified
                                          </div>
                                        </div>
                                        <div
                                          className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                                          data-oid="7uwtx-q"
                                        >
                                          <div className="text-2xl mb-2" data-oid="foo8y_6">
                                            🎯
                                          </div>
                                          <div className="text-sm text-gray-300" data-oid="xi0r2qj">
                                            Ecosystem Access
                                          </div>
                                        </div>
                                       </div> */}
        </div>
      </div>
    </div>
  );
};

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get contract data
  const {
    maxSupply,
    currentTokenId,
    remaining,
    isMintingActive,
    refetchCurrentTokenId,
    useHasMinted,
  } = useMuseAIContract();

  // Check if user has minted
  const { data: userHasMinted } = useHasMinted(address);

  // Gasless minting hook
  const {
    mint: gaslessMint,
    isLoading: isMinting,
    error: mintError,
    txHash: mintTxHash,
    explorerUrl: mintExplorerUrl,
    tokenId: mintTokenId,
  } = useGaslessMint();

  // Campaign end date - 90 days from December 5, 2025
  const campaignEndDate = new Date('2025-12-05');
  campaignEndDate.setDate(campaignEndDate.getDate() + 90); // March 5, 2026

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Handle mint success
  useEffect(() => {
    if (mintTxHash) {
      setShowSuccessModal(true);
      refetchCurrentTokenId();
    }
  }, [mintTxHash, refetchCurrentTokenId]);

  // Handle mint error
  useEffect(() => {
    if (mintError) {
      setErrorMessage(mintError);
      setShowErrorModal(true);
    }
  }, [mintError]);

  const handleMint = async () => {
    if (!isConnected) {
      setErrorMessage("Please connect your wallet first!");
      setShowErrorModal(true);
      return;
    }

    if (!address) {
      setErrorMessage("Wallet address not found!");
      setShowErrorModal(true);
      return;
    }

    if (userHasMinted) {
      setErrorMessage("You have already minted your free Muse AI NFT!");
      setShowErrorModal(true);
      return;
    }

    if (!isMintingActive) {
      setErrorMessage("Minting is not active right now!");
      setShowErrorModal(true);
      return;
    }

    if (remaining <= 0) {
      setErrorMessage("All NFTs have been minted!");
      setShowErrorModal(true);
      return;
    }

    // Call gasless mint (no gas fees!)
    try {
      await gaslessMint();
    } catch (err) {
      // Error is already set in the hook
      console.error("Mint failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <NeuralNetwork />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />

        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      {/* Navigation */}
      <Header />

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-mono mb-8 animate-pulse">
            🎁 FREE MINT CAMPAIGN - LIMITED TIME
          </div>

          <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
            <div className="hero-gradient-text mb-2">Muse AI</div>
          </h1>

          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            Be among the first to own a revolutionary AI companion NFT. Each
            Muse AI features unique personality traits, persistent memory, and
            verified blockchain interactions.
            <br />
            <span className="text-green-400 font-semibold">
              {" "}
              Completely free to mint!
            </span>
          </p>

          {/* Countdown Timer */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">
              ⏰ Campaign Ends In:
            </h3>
            <CountdownTimer targetDate={campaignEndDate} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold stat-number">
                {currentTokenId.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Minted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold stat-number">
                {maxSupply.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Supply</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">FREE</div>
              <div className="text-gray-400 text-sm">Mint Price</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold stat-number">1</div>
              <div className="text-gray-400 text-sm">Per Wallet</div>
            </div>
          </div>
        </div>

        {/* Main NFT Display */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />

            <p className="text-gray-400 text-lg">Loading your Muse AI...</p>
          </div>
        ) : (
          <MuseAINFT
            onMint={handleMint}
            isMinting={isMinting}
            mintCount={currentTokenId}
          />
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="neural-card rounded-3xl p-8 max-w-md w-full animate-scale-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <span className="text-4xl">🎉</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  Congratulations!
                </h3>
                <p className="text-gray-300 mb-6">
                  Your Muse AI NFT has been successfully minted! No gas fees
                  paid!
                </p>
                {mintTokenId && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 mb-4 border border-purple-500/30">
                    <p className="text-sm text-gray-400 mb-1">Token ID:</p>
                    <p className="text-2xl font-bold text-purple-300">
                      #{mintTokenId}
                    </p>
                  </div>
                )}
                {mintTxHash && (
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-400 mb-2">
                      Transaction Hash:
                    </p>
                    <a
                      href={
                        mintExplorerUrl ||
                        `https://hyperion-testnet-explorer.metisdevops.link/tx/${mintTxHash}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 font-mono break-all underline hover:underline-offset-4 transition-all"
                    >
                      {mintTxHash}
                    </a>
                  </div>
                )}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 transition-transform"
                >
                  Awesome!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="neural-card rounded-3xl p-8 max-w-md w-full animate-scale-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Oops!</h3>
                <p className="text-gray-300 mb-6">{errorMessage}</p>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:scale-105 transition-transform"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            Why Muse AI Genesis?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="neural-card rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-4">Advanced AI</h3>
              <p className="text-gray-300">
                Powered by cutting-edge AI technology with persistent memory and
                evolving personality traits.
              </p>
            </div>
            <div className="neural-card rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Blockchain Verified
              </h3>
              <p className="text-gray-300">
                Every interaction is recorded on the Metis blockchain, ensuring
                authenticity and ownership.
              </p>
            </div>
            <div className="neural-card rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Ecosystem Access
              </h3>
              <p className="text-gray-300">
                Your gateway to the entire MetaMuses ecosystem with exclusive
                features and future utilities.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: "Is this really free?",
                a: "Yes! This is a completely FREE mint with ZERO gas fees. Just sign the message with your wallet!",
              },
              {
                q: "How many can I mint?",
                a: "Each wallet can mint exactly 1 Muse AI NFT during this campaign.",
              },
              {
                q: "What blockchain is this on?",
                a: "Muse AI NFTs are minted on the Metis blockchain for fast and affordable transactions.",
              },
              {
                q: "What can I do with my Muse AI?",
                a: "Your Muse AI serves as your companion in the MetaMuse ecosystem with chat, memory, and future utility features.",
              },
            ].map((faq, index) => (
              <div key={index} className="neural-card rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
