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
      data-oid="q1lr81t"
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
    <div className="flex justify-center space-x-4 mb-8" data-oid="wqeur-g">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center" data-oid="06wg4g1">
          <div
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 min-w-[80px] border border-purple-500/30"
            data-oid="2ue8vqw"
          >
            <div
              className="text-3xl font-bold text-white font-mono"
              data-oid="eisq5-z"
            >
              {value.toString().padStart(2, "0")}
            </div>
            <div
              className="text-xs text-purple-200 uppercase tracking-wider"
              data-oid="k0s:sxm"
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
    <div className="max-w-2xl mx-auto" data-oid="5v7d2bv">
      <div
        className={`neural-card rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden group ${
          isHovered ? "ring-2 ring-purple-500/50" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-oid="q.:eyg5"
      >
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          data-oid="lh.46ih"
        />

        {/* Free Mint Badge */}
        <div
          className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse"
          data-oid="gi:ehjx"
        >
          FREE MINT
        </div>

        <div className="relative z-10" data-oid="1m-18ci">
          {/* NFT Avatar */}
          <div className="text-center mb-8" data-oid="d3w.qan">
            <div
              className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110 relative"
              data-oid="94-z_ge"
            >
              <span
                className="text-8xl font-bold text-white"
                data-oid="mkhi577"
              >
                🤖
              </span>

              {/* Animated rings */}
              <div
                className="absolute inset-0 rounded-full border-4 border-purple-400 animate-pulse opacity-50"
                data-oid="hcr5_:_"
              />

              <div
                className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"
                style={{ animationDelay: "1s" }}
                data-oid="w:73-u6"
              />
            </div>

            <h2
              className="text-4xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors"
              data-oid="2vncb4."
            >
              Muse AI Genesis
            </h2>
            <p
              className="text-gray-300 text-lg mb-6 leading-relaxed"
              data-oid="r3qjinj"
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
            data-oid="nk6itfs"
          >
            <div className="grid grid-cols-2 gap-6" data-oid="3urt.w1">
              <div data-oid="2qsr9pz">
                <span className="text-gray-400 text-sm" data-oid="p_n2c_c">
                  Collection
                </span>
                <div className="text-white font-semibold" data-oid="3n47llt">
                  Muse AI Genesis
                </div>
              </div>
              <div data-oid="krzb:1x">
                <span className="text-gray-400 text-sm" data-oid="snjj_lu">
                  Network
                </span>
                <div className="text-white font-semibold" data-oid="s29mz:t">
                  Hyperion Testnet
                </div>
              </div>
              <div data-oid="qnfooqr">
                <span className="text-gray-400 text-sm" data-oid=":y7-:ew">
                  Total Supply
                </span>
                <div className="text-white font-semibold" data-oid="i-a-kyp">
                  {maxSupply.toLocaleString()}
                </div>
              </div>
              <div data-oid="sup4u.5">
                <span className="text-gray-400 text-sm" data-oid="2kjnlld">
                  Remaining
                </span>
                <div
                  className="text-green-400 font-semibold"
                  data-oid="67wopaa"
                >
                  {remaining.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8" data-oid="hg9fstc">
            <div
              className="flex justify-between items-center mb-2"
              data-oid="s7m-0ah"
            >
              <span className="text-gray-400 text-sm" data-oid="chj5f9d">
                Minting Progress
              </span>
              <span
                className="text-purple-400 font-mono text-sm"
                data-oid="j5q34p1"
              >
                {mintCount}/{maxSupply}
              </span>
            </div>
            <div
              className="w-full h-3 bg-gray-700 rounded-full overflow-hidden"
              data-oid="bvgezup"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(mintCount / maxSupply) * 100}%` }}
                data-oid="9d8ax48"
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
            data-oid="t:66ntq"
          >
            {remaining === 0 ? (
              "🔥 SOLD OUT"
            ) : isMinting ? (
              <div
                className="flex items-center justify-center space-x-3"
                data-oid="pqjeemy"
              >
                <div
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
                  data-oid="64e1ixt"
                />

                <span data-oid="lvsai:s">Minting Your Muse AI...</span>
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
      data-oid="gcp9v1e"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="sgh1q_b" />

      <div className="absolute inset-0 overflow-hidden" data-oid="g6yxo33">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          data-oid="zm3z.9_"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          data-oid="is0um_w"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="654fxz8"
        />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid="citiv90"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid="7vom8ba"
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="g-nkavw"
          >
            M
          </div>
          <div data-oid="vmihdhw">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="f2wx:.q"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="y3kyixe">
              Free Mint Campaign
            </div>
          </div>
        </Link>

        <div className="flex items-center space-x-4" data-oid="8g:805x">
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="neural-button px-6 py-3 text-white font-semibold rounded-xl hover:scale-105 transition-all"
              data-oid="c0a7k:u"
            >
              🔗 Connect Wallet
            </button>
          ) : (
            <div
              className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-xl"
              data-oid="3q0hroy"
            >
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                data-oid="c8yi396"
              />

              <span
                className="text-green-300 text-sm font-mono"
                data-oid="-kwfcb."
              >
                0x3BD9...7881
              </span>
            </div>
          )}

          <Link
            href="/"
            className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
            data-oid="il4gmvv"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 py-12"
        data-oid="150xr5o"
      >
        {/* Header */}
        <div className="text-center mb-16" data-oid="495jagk">
          <div
            className="inline-block px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-mono mb-8 animate-pulse"
            data-oid="q8assx9"
          >
            🎁 FREE MINT CAMPAIGN - LIMITED TIME
          </div>

          <h1
            className="text-6xl lg:text-8xl font-black mb-8 leading-tight"
            data-oid="tpn7ai2"
          >
            <div className="hero-gradient-text mb-2" data-oid="xsx_so7">
              Muse AI
            </div>
            <div className="text-white" data-oid="vsgoles">
              Genesis Collection
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12"
            data-oid="l0sq424"
          >
            Be among the first to own a revolutionary AI companion NFT. Each
            Muse AI features unique personality traits, persistent memory, and
            verified blockchain interactions.
            <br data-oid="uqy_-83" />
            <span className="text-green-400 font-semibold" data-oid="t.1fr0t">
              {" "}
              Completely free to mint!
            </span>
          </p>

          {/* Countdown Timer */}
          <div className="mb-12" data-oid="9um71d1">
            <h3
              className="text-2xl font-bold text-white mb-6"
              data-oid="xhwsv2w"
            >
              ⏰ Campaign Ends In:
            </h3>
            <CountdownTimer targetDate={campaignEndDate} data-oid="96s44t4" />
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16"
            data-oid="uhx6526"
          >
            <div className="text-center" data-oid="8gglp0q">
              <div
                className="text-4xl font-bold stat-number"
                data-oid="auiz2vn"
              >
                {mintCount.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm" data-oid="qbl8g92">
                Minted
              </div>
            </div>
            <div className="text-center" data-oid="6r::u_p">
              <div
                className="text-4xl font-bold stat-number"
                data-oid="8pma5no"
              >
                5,000
              </div>
              <div className="text-gray-400 text-sm" data-oid="h3_l6b4">
                Total Supply
              </div>
            </div>
            <div className="text-center" data-oid="ikogfgn">
              <div
                className="text-4xl font-bold text-green-400"
                data-oid="rc0g7oa"
              >
                FREE
              </div>
              <div className="text-gray-400 text-sm" data-oid="t91b9cm">
                Mint Price
              </div>
            </div>
            <div className="text-center" data-oid=":bpz_sw">
              <div
                className="text-4xl font-bold stat-number"
                data-oid="0uvada_"
              >
                1
              </div>
              <div className="text-gray-400 text-sm" data-oid="mfj.ckl">
                Per Wallet
              </div>
            </div>
          </div>
        </div>

        {/* Main NFT Display */}
        {isLoading ? (
          <div className="text-center py-20" data-oid="_0srxhp">
            <div
              className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              data-oid="9a:ib0n"
            />

            <p className="text-gray-400 text-lg" data-oid="9y_w9k_">
              Loading your Muse AI...
            </p>
          </div>
        ) : (
          <MuseAINFT
            onMint={handleMint}
            isMinting={isMinting}
            mintCount={mintCount}
            data-oid="lwhurv6"
          />
        )}

        {/* Features Section */}
        <div className="mt-20" data-oid="uoyd486">
          <h2
            className="text-4xl font-bold text-center text-white mb-12"
            data-oid="tojtw:o"
          >
            Why Muse AI Genesis?
          </h2>
          <div className="grid md:grid-cols-3 gap-8" data-oid="7bzcj4y">
            <div
              className="neural-card rounded-2xl p-8 text-center"
              data-oid="nx8nklv"
            >
              <div className="text-5xl mb-4" data-oid=".6y0trq">
                🧠
              </div>
              <h3
                className="text-xl font-bold text-white mb-4"
                data-oid="iz9n3fp"
              >
                Advanced AI
              </h3>
              <p className="text-gray-300" data-oid=".:jgjyg">
                Powered by cutting-edge AI technology with persistent memory and
                evolving personality traits.
              </p>
            </div>
            <div
              className="neural-card rounded-2xl p-8 text-center"
              data-oid="2owor0a"
            >
              <div className="text-5xl mb-4" data-oid="v28mm0e">
                🔗
              </div>
              <h3
                className="text-xl font-bold text-white mb-4"
                data-oid=".p.mi9q"
              >
                Blockchain Verified
              </h3>
              <p className="text-gray-300" data-oid="rhf4hxn">
                Every interaction is recorded on the Metis blockchain, ensuring
                authenticity and ownership.
              </p>
            </div>
            <div
              className="neural-card rounded-2xl p-8 text-center"
              data-oid="zq3ueq5"
            >
              <div className="text-5xl mb-4" data-oid="oey4hsu">
                🌟
              </div>
              <h3
                className="text-xl font-bold text-white mb-4"
                data-oid="1mczt99"
              >
                Ecosystem Access
              </h3>
              <p className="text-gray-300" data-oid="_2qlymt">
                Your gateway to the entire MetaMuses ecosystem with exclusive
                features and future utilities.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20" data-oid="swl54cm">
          <h2
            className="text-4xl font-bold text-center text-white mb-12"
            data-oid="27kg5_e"
          >
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto space-y-6" data-oid="u3soqpq">
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
                data-oid="8ur7b5l"
              >
                <h3
                  className="text-lg font-bold text-white mb-3"
                  data-oid="2ho5_nj"
                >
                  {faq.q}
                </h3>
                <p className="text-gray-300" data-oid="_v7hs-2">
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
