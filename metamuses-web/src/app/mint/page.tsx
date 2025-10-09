"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
      data-oid="v1gu2km"
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
    <div className="flex justify-center space-x-4 mb-8" data-oid="1vczt5a">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center" data-oid="spa9m-p">
          <div
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 min-w-[80px] border border-purple-500/30"
            data-oid="u9od81y"
          >
            <div
              className="text-3xl font-bold text-white font-mono"
              data-oid="6ij6t48"
            >
              {value.toString().padStart(2, "0")}
            </div>
            <div
              className="text-xs text-purple-200 uppercase tracking-wider"
              data-oid=":2q:k9i"
            >
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
    <div className="max-w-2xl mx-auto" data-oid=".unbeps">
      <div
        className={`neural-card rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden group ${
          isHovered ? "ring-2 ring-purple-500/50" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-oid="l:e1o2l"
      >
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          data-oid="_j-z24k"
        />

        {/* Free Mint Badge */}
        <div
          className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse"
          data-oid="wf8fm8."
        >
          FREE MINT
        </div>

        <div className="relative z-10" data-oid="en8-r1h">
          {/* NFT Avatar */}
          <div className="text-center mb-8" data-oid="5r4fhff">
            <div
              className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110 relative"
              data-oid="2:j.5tn"
            >
              <span
                className="text-8xl font-bold text-white"
                data-oid="uvod9a."
              >
                🤖
              </span>

              {/* Animated rings */}
              <div
                className="absolute inset-0 rounded-full border-4 border-purple-400 animate-pulse opacity-50"
                data-oid="qj7hq_l"
              />

              <div
                className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"
                style={{ animationDelay: "1s" }}
                data-oid="cuk6d:a"
              />
            </div>

            <h2
              className="text-4xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors"
              data-oid="8okcn-t"
            >
              Muse AI Genesis
            </h2>
            <p
              className="text-gray-300 text-lg mb-6 leading-relaxed"
              data-oid="zms5mcu"
            >
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
          <div
            className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 mb-8"
            data-oid="k0m5gxq"
          >
            <div className="grid grid-cols-2 gap-6" data-oid=".2vbl-9">
              <div data-oid="6v-7lw7">
                <span className="text-gray-400 text-sm" data-oid="eql84.l">
                  Collection
                </span>
                <div className="text-white font-semibold" data-oid="qohli:3">
                  Muse AI Genesis
                </div>
              </div>
              <div data-oid="cpjn4l_">
                <span className="text-gray-400 text-sm" data-oid="6t2d-ri">
                  Network
                </span>
                <div className="text-white font-semibold" data-oid="fxs1txl">
                  Hyperion Testnet
                </div>
              </div>
              <div data-oid="xy.rtv5">
                <span className="text-gray-400 text-sm" data-oid="x7tv:76">
                  Total Supply
                </span>
                <div className="text-white font-semibold" data-oid="92y_whe">
                  {maxSupply.toLocaleString()}
                </div>
              </div>
              <div data-oid="yeqalm.">
                <span className="text-gray-400 text-sm" data-oid="zeexrj8">
                  Remaining
                </span>
                <div
                  className="text-green-400 font-semibold"
                  data-oid="xzdb0ry"
                >
                  {remaining.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8" data-oid="ab9w:xr">
            <div
              className="flex justify-between items-center mb-2"
              data-oid="dur7tdq"
            >
              <span className="text-gray-400 text-sm" data-oid="e16jjjh">
                Minting Progress
              </span>
              <span
                className="text-purple-400 font-mono text-sm"
                data-oid="q7fo842"
              >
                {mintCount}/{maxSupply}
              </span>
            </div>
            <div
              className="w-full h-3 bg-gray-700 rounded-full overflow-hidden"
              data-oid="g0ac-xx"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(mintCount / maxSupply) * 100}%` }}
                data-oid="dm9nt6e"
              />
            </div>
          </div>

          {/* Price Display */}
          {/* <div className="text-center mb-8" data-oid="dksbqcz">
                             <div
                               className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2"
                               data-oid="jk_izz3"
                             >
                               FREE
                             </div>
                             <div className="text-gray-400 text-lg" data-oid="8r5ph67">
                               No gas fees • No hidden costs • Limited time only
                             </div>
                            </div> */}

          {/* Mint Button */}
          <button
            onClick={onMint}
            disabled={isMinting || remaining === 0}
            className={`w-full py-6 rounded-xl font-bold text-xl transition-all duration-300 ${
              remaining === 0
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : isMinting
                  ? "bg-purple-600/50 text-white cursor-not-allowed"
                  : "neural-button text-white hover:scale-105 shadow-lg shadow-purple-500/30"
            }`}
            data-oid="19y:bzf"
          >
            {remaining === 0 ? (
              "🔥 SOLD OUT"
            ) : isMinting ? (
              <div
                className="flex items-center justify-center space-x-3"
                data-oid="uxqjjyr"
              >
                <div
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
                  data-oid="3yt0znb"
                />

                <span data-oid="7jvgfa8">Minting Your Muse AI...</span>
              </div>
            ) : (
              "🚀 MINT YOUR MUSE AI - FREE"
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [mintCount, setMintCount] = useState(247); // Simulated current mint count
  const [userHasMinted, setUserHasMinted] = useState(false);

  // Campaign end date (7 days from now)
  const campaignEndDate = new Date();
  campaignEndDate.setDate(campaignEndDate.getDate() + 90);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleMint = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (userHasMinted) {
      alert("You have already minted your free Muse AI NFT!");
      return;
    }

    setIsMinting(true);

    // Simulate minting process
    setTimeout(() => {
      setMintCount((prev) => prev + 1);
      setUserHasMinted(true);
      setIsMinting(false);
      alert(
        "🎉 Congratulations! Your Muse AI NFT has been minted successfully!",
      );
    }, 4000);
  };

  const connectWallet = () => {
    // Simulate wallet connection
    setWalletConnected(true);
    alert("Wallet connected successfully! 🔗");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      data-oid="j_vh3:j"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="t5kb5wo" />

      <div className="absolute inset-0 overflow-hidden" data-oid="lrz1o:c">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          data-oid="ojazeny"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          data-oid="7_s9f37"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="oyso8x2"
        />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid="sbyl-vu"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid=":kjj9w9"
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="rfhxvoe"
          >
            M
          </div>
          <div data-oid="nadleyc">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="a91z50i"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="9fbcgx4">
              Free Mint Campaign
            </div>
          </div>
        </Link>

        <div className="flex items-center space-x-4" data-oid="bzkr.rn">
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="neural-button px-6 py-3 text-white font-semibold rounded-xl hover:scale-105 transition-all"
              data-oid="nfe88ob"
            >
              🔗 Connect Wallet
            </button>
          ) : (
            <div
              className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-xl"
              data-oid="o.rmw:0"
            >
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                data-oid="1ld3p4m"
              />

              <span
                className="text-green-300 text-sm font-mono"
                data-oid="ds:qs1e"
              >
                0x3BD9...7881
              </span>
            </div>
          )}

          {/* <Link
             href="/"
             className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
             data-oid="-ouz60l"
            >
             ← Back to Home
            </Link> */}
        </div>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 py-12"
        data-oid="f9xg4qf"
      >
        {/* Header */}
        <div className="text-center mb-16" data-oid="rwofkxu">
          <div
            className="inline-block px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-mono mb-8 animate-pulse"
            data-oid="14zpij-"
          >
            🎁 FREE MINT CAMPAIGN - LIMITED TIME
          </div>

          <h1
            className="text-6xl lg:text-8xl font-black mb-8 leading-tight"
            data-oid="0f21aol"
          >
            <div className="hero-gradient-text mb-2" data-oid="bp6z6ay">
              Muse AI
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12"
            data-oid="d8htj1_"
          >
            Be among the first to own a revolutionary AI companion NFT. Each
            Muse AI features unique personality traits, persistent memory, and
            verified blockchain interactions.
            <br data-oid="13mnxr4" />
            <span className="text-green-400 font-semibold" data-oid="3kj1jwm">
              {" "}
              Completely free to mint!
            </span>
          </p>

          {/* Countdown Timer */}
          <div className="mb-12" data-oid="szoy0ez">
            <h3
              className="text-2xl font-bold text-white mb-6"
              data-oid="0xe0ax0"
            >
              ⏰ Campaign Ends In:
            </h3>
            <CountdownTimer targetDate={campaignEndDate} data-oid="w0-7z8l" />
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16"
            data-oid="6q1ytgc"
          >
            <div className="text-center" data-oid="zbalwd3">
              <div
                className="text-4xl font-bold stat-number"
                data-oid="_j4fgpn"
              >
                {mintCount.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm" data-oid="yhn6u-3">
                Minted
              </div>
            </div>
            <div className="text-center" data-oid="43hnw9f">
              <div
                className="text-4xl font-bold stat-number"
                data-oid="9tz5s2a"
              >
                5,000
              </div>
              <div className="text-gray-400 text-sm" data-oid="ex2gwuz">
                Total Supply
              </div>
            </div>
            <div className="text-center" data-oid="5bs32q0">
              <div
                className="text-4xl font-bold text-green-400"
                data-oid="zwsee.m"
              >
                FREE
              </div>
              <div className="text-gray-400 text-sm" data-oid="p.tw.t4">
                Mint Price
              </div>
            </div>
            <div className="text-center" data-oid="6ghy1rc">
              <div
                className="text-4xl font-bold stat-number"
                data-oid="3sy-ov."
              >
                1
              </div>
              <div className="text-gray-400 text-sm" data-oid="-6skb41">
                Per Wallet
              </div>
            </div>
          </div>
        </div>

        {/* Main NFT Display */}
        {isLoading ? (
          <div className="text-center py-20" data-oid="xak-21y">
            <div
              className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              data-oid="0a9:6w_"
            />

            <p className="text-gray-400 text-lg" data-oid="f2-s4px">
              Loading your Muse AI...
            </p>
          </div>
        ) : (
          <MuseAINFT
            onMint={handleMint}
            isMinting={isMinting}
            mintCount={mintCount}
            data-oid="7hmsrp1"
          />
        )}

        {/* Features Section */}
        <div className="mt-20" data-oid="ftk:2u8">
          <h2
            className="text-4xl font-bold text-center text-white mb-12"
            data-oid="61bm-6y"
          >
            Why Muse AI Genesis?
          </h2>
          <div className="grid md:grid-cols-3 gap-8" data-oid="r_o3k_1">
            <div
              className="neural-card rounded-2xl p-8 text-center"
              data-oid="vi-ddd8"
            >
              <div className="text-5xl mb-4" data-oid="72eaff.">
                🧠
              </div>
              <h3
                className="text-xl font-bold text-white mb-4"
                data-oid="qj:h617"
              >
                Advanced AI
              </h3>
              <p className="text-gray-300" data-oid="c:svz0c">
                Powered by cutting-edge AI technology with persistent memory and
                evolving personality traits.
              </p>
            </div>
            <div
              className="neural-card rounded-2xl p-8 text-center"
              data-oid="v1lw.dc"
            >
              <div className="text-5xl mb-4" data-oid="gmg1l_9">
                🔗
              </div>
              <h3
                className="text-xl font-bold text-white mb-4"
                data-oid="8_-cofq"
              >
                Blockchain Verified
              </h3>
              <p className="text-gray-300" data-oid="r9jnce9">
                Every interaction is recorded on the Metis blockchain, ensuring
                authenticity and ownership.
              </p>
            </div>
            <div
              className="neural-card rounded-2xl p-8 text-center"
              data-oid="28uv2up"
            >
              <div className="text-5xl mb-4" data-oid="p9swnzk">
                🌟
              </div>
              <h3
                className="text-xl font-bold text-white mb-4"
                data-oid="6p-q0tn"
              >
                Ecosystem Access
              </h3>
              <p className="text-gray-300" data-oid="99ikqpa">
                Your gateway to the entire MetaMuses ecosystem with exclusive
                features and future utilities.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20" data-oid="lr:wfam">
          <h2
            className="text-4xl font-bold text-center text-white mb-12"
            data-oid="qqge9dv"
          >
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto space-y-6" data-oid="ovoy971">
            {[
              {
                q: "Is this really free?",
                a: "Yes! This is a completely free mint campaign. You only pay network gas fees.",
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
              <div
                key={index}
                className="neural-card rounded-xl p-6"
                data-oid="rrlsu9-"
              >
                <h3
                  className="text-lg font-bold text-white mb-3"
                  data-oid="wv4cju0"
                >
                  {faq.q}
                </h3>
                <p className="text-gray-300" data-oid="kkvpc26">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
