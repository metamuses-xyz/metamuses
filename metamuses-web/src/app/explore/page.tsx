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
    const nodeCount = 40;

    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
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
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.4)";
        ctx.fill();

        // Draw connections
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
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
      className="absolute inset-0 pointer-events-none opacity-20"
      data-oid="n.hvxxr"
    />
  );
};

// NFT Card Component
const NFTCard = ({
  nft,
  onMint,
  isMinting,
}: {
  nft: any;
  onMint: (id: string) => void;
  isMinting: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`neural-card rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden group ${
        isHovered ? "ring-2 ring-purple-500/50" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-oid="fq57s7g"
    >
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        data-oid="l36lteu"
      />

      {/* Rarity badge */}
      <div
        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
          nft.rarity === "legendary"
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
            : nft.rarity === "epic"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : nft.rarity === "rare"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                : "bg-gray-600 text-gray-200"
        }`}
        data-oid="-pkkxhu"
      >
        {nft.rarity.toUpperCase()}
      </div>

      <div className="relative z-10" data-oid="8kljaow">
        {/* NFT Avatar */}
        <div className="text-center mb-6" data-oid="echxw_c">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br ${nft.avatar.gradient} mx-auto mb-4 flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110 relative`}
            data-oid="5ktgch-"
          >
            <span className="text-5xl font-bold text-white" data-oid="ml35cno">
              {nft.avatar.initial}
            </span>

            {/* Animated ring for legendary */}
            {nft.rarity === "legendary" && (
              <div
                className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse opacity-50"
                data-oid="ognsgbj"
              />
            )}
          </div>

          <h3
            className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors"
            data-oid="bhg3c0k"
          >
            {nft.name}
          </h3>
          <p className="text-gray-400 text-sm mb-4" data-oid="udyp-ji">
            {nft.description}
          </p>
        </div>

        {/* Personality Traits */}
        <div className="mb-6" data-oid="6og45.z">
          <h4
            className="text-sm font-semibold text-gray-300 mb-3"
            data-oid="gd96:_6"
          >
            Personality Traits
          </h4>
          <div className="grid grid-cols-2 gap-2" data-oid="wbcqprp">
            {Object.entries(nft.personality).map(([trait, value]) => (
              <div
                key={trait}
                className="flex items-center justify-between text-xs"
                data-oid="5h5_08e"
              >
                <span className="text-gray-400 capitalize" data-oid="d3-_lvb">
                  {trait}
                </span>
                <div className="flex items-center space-x-1" data-oid="j0iwu5d">
                  <div
                    className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden"
                    data-oid="nyxs4h1"
                  >
                    <div
                      className={`h-full rounded-full ${
                        trait === "creativity"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : trait === "wisdom"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                            : trait === "humor"
                              ? "bg-gradient-to-r from-orange-500 to-yellow-500"
                              : "bg-gradient-to-r from-green-500 to-teal-500"
                      }`}
                      style={{ width: `${value}%` }}
                      data-oid="72gkvud"
                    />
                  </div>
                  <span
                    className="text-purple-400 font-mono font-bold text-xs"
                    data-oid="rwc:fqx"
                  >
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NFT Details */}
        <div
          className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 mb-6"
          data-oid="5vi:f5q"
        >
          <div className="grid grid-cols-2 gap-4 text-xs" data-oid="a1qx9mj">
            <div data-oid="m-6:kgq">
              <span className="text-gray-400" data-oid="fsdbp_4">
                Token ID:
              </span>
              <div className="text-white font-mono" data-oid=".7kkl0e">
                #{nft.tokenId}
              </div>
            </div>
            <div data-oid="rqm-9.9">
              <span className="text-gray-400" data-oid="cr.03hf">
                Edition:
              </span>
              <div className="text-white font-mono" data-oid="7412wh0">
                {nft.edition}/{nft.maxSupply}
              </div>
            </div>
            <div data-oid="8-sf1cj">
              <span className="text-gray-400" data-oid="zl3erx2">
                Creator:
              </span>
              <div className="text-white font-mono" data-oid="4zfb1ln">
                {nft.creator}
              </div>
            </div>
            <div data-oid="jqb0j2k">
              <span className="text-gray-400" data-oid="g._ghtn">
                Network:
              </span>
              <div className="text-white font-mono" data-oid="bp2pxb-">
                Metis
              </div>
            </div>
          </div>
        </div>

        {/* Price and Mint Button */}
        <div
          className="flex items-center justify-between mb-4"
          data-oid="r9l07w1"
        >
          <div data-oid="p76n4j.">
            <div className="text-2xl font-bold text-white" data-oid="iczq2:w">
              {nft.price} METIS
            </div>
            <div className="text-xs text-gray-400" data-oid="yb12w58">
              ≈ ${nft.usdPrice}
            </div>
          </div>
          <div className="text-right" data-oid="92p9uou">
            <div className="text-sm text-gray-400" data-oid="bug87-p">
              Available
            </div>
            <div
              className="text-lg font-bold text-green-400"
              data-oid="l3:ukin"
            >
              {nft.available}
            </div>
          </div>
        </div>

        {/* Mint Button */}
        <button
          onClick={() => onMint(nft.id)}
          disabled={isMinting || nft.available === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
            nft.available === 0
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : isMinting
                ? "bg-purple-600/50 text-white cursor-not-allowed"
                : "neural-button text-white hover:scale-105 shadow-lg shadow-purple-500/30"
          }`}
          data-oid="mni1ldl"
        >
          {nft.available === 0 ? (
            "Sold Out"
          ) : isMinting ? (
            <div
              className="flex items-center justify-center space-x-2"
              data-oid="ts.w:6z"
            >
              <div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                data-oid="fxx2h-e"
              />

              <span data-oid="w:njtzc">Minting...</span>
            </div>
          ) : (
            "🎯 Mint NFT"
          )}
        </button>
      </div>
    </div>
  );
};

// Filter Component
const FilterBar = ({
  selectedRarity,
  setSelectedRarity,
  selectedPriceRange,
  setSelectedPriceRange,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
}: {
  selectedRarity: string;
  setSelectedRarity: (rarity: string) => void;
  selectedPriceRange: string;
  setSelectedPriceRange: (range: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}) => {
  return (
    <div className="neural-card rounded-2xl p-6 mb-8" data-oid="a-j9ha1">
      <div
        className="flex flex-col lg:flex-row gap-4 items-center"
        data-oid="9ccizt8"
      >
        {/* Search */}
        <div className="flex-1 relative" data-oid="v9_q6_6">
          <input
            type="text"
            placeholder="Search AI companions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
            data-oid="n1h3ix6"
          />

          <span
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            data-oid="88tmoix"
          >
            🔍
          </span>
        </div>

        {/* Rarity Filter */}
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
          data-oid="7kqs2_w"
        >
          <option value="all" data-oid="2-f_:71">
            All Rarities
          </option>
          <option value="common" data-oid="h8scj0-">
            Common
          </option>
          <option value="rare" data-oid="o9or.jw">
            Rare
          </option>
          <option value="epic" data-oid="-3eq7pt">
            Epic
          </option>
          <option value="legendary" data-oid="xbsg6gw">
            Legendary
          </option>
        </select>

        {/* Price Range */}
        <select
          value={selectedPriceRange}
          onChange={(e) => setSelectedPriceRange(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
          data-oid="hxfv2_n"
        >
          <option value="all" data-oid="o:wrjn5">
            All Prices
          </option>
          <option value="0-1" data-oid="hsngnpx">
            0-1 METIS
          </option>
          <option value="1-5" data-oid=".aq0b:r">
            1-5 METIS
          </option>
          <option value="5-10" data-oid=":osm8v4">
            5-10 METIS
          </option>
          <option value="10+" data-oid="--61ifx">
            10+ METIS
          </option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
          data-oid="u7k3rpn"
        >
          <option value="newest" data-oid="wh6oo.x">
            Newest First
          </option>
          <option value="price-low" data-oid="jhfmhf7">
            Price: Low to High
          </option>
          <option value="price-high" data-oid="-dj2i.-">
            Price: High to Low
          </option>
          <option value="rarity" data-oid="jc738:t">
            Rarity
          </option>
          <option value="popular" data-oid="_t2k8dx">
            Most Popular
          </option>
        </select>
      </div>
    </div>
  );
};

export default function MintPage() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [mintingId, setMintingId] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  // Mock NFT data
  useEffect(() => {
    const mockNFTs = [
      {
        id: "1",
        name: "Luna the Mystic",
        description: "A creative soul with deep empathy and mystical wisdom",
        avatar: {
          gradient: "from-purple-500 to-pink-500",
          initial: "L",
        },
        personality: {
          creativity: 95,
          wisdom: 80,
          humor: 60,
          empathy: 90,
        },
        rarity: "legendary",
        price: 15.5,
        usdPrice: "1,240",
        tokenId: "0001",
        edition: 1,
        maxSupply: 10,
        available: 3,
        creator: "MetaMuse",
      },
      {
        id: "2",
        name: "Sage the Wise",
        description: "Ancient wisdom meets modern understanding",
        avatar: {
          gradient: "from-blue-500 to-cyan-500",
          initial: "S",
        },
        personality: {
          creativity: 45,
          wisdom: 98,
          humor: 30,
          empathy: 85,
        },
        rarity: "epic",
        price: 8.2,
        usdPrice: "656",
        tokenId: "0002",
        edition: 5,
        maxSupply: 50,
        available: 12,
        creator: "MetaMuse",
      },
      {
        id: "3",
        name: "Spark the Jester",
        description: "Bringing joy and laughter to every conversation",
        avatar: {
          gradient: "from-orange-500 to-yellow-500",
          initial: "S",
        },
        personality: {
          creativity: 85,
          wisdom: 40,
          humor: 98,
          empathy: 70,
        },
        rarity: "rare",
        price: 3.8,
        usdPrice: "304",
        tokenId: "0003",
        edition: 15,
        maxSupply: 100,
        available: 25,
        creator: "MetaMuse",
      },
      {
        id: "4",
        name: "Echo the Balanced",
        description: "Perfect harmony in all aspects of being",
        avatar: {
          gradient: "from-green-500 to-teal-500",
          initial: "E",
        },
        personality: {
          creativity: 65,
          wisdom: 65,
          humor: 60,
          empathy: 70,
        },
        rarity: "common",
        price: 1.2,
        usdPrice: "96",
        tokenId: "0004",
        edition: 50,
        maxSupply: 500,
        available: 150,
        creator: "MetaMuse",
      },
      {
        id: "5",
        name: "Nova the Innovator",
        description: "Cutting-edge creativity with boundless imagination",
        avatar: {
          gradient: "from-indigo-500 to-purple-600",
          initial: "N",
        },
        personality: {
          creativity: 100,
          wisdom: 75,
          humor: 80,
          empathy: 60,
        },
        rarity: "legendary",
        price: 22.0,
        usdPrice: "1,760",
        tokenId: "0005",
        edition: 1,
        maxSupply: 5,
        available: 0,
        creator: "MetaMuse",
      },
      {
        id: "6",
        name: "Zen the Peaceful",
        description: "Tranquil wisdom and serene understanding",
        avatar: {
          gradient: "from-emerald-500 to-green-600",
          initial: "Z",
        },
        personality: {
          creativity: 50,
          wisdom: 90,
          humor: 40,
          empathy: 95,
        },
        rarity: "epic",
        price: 6.5,
        usdPrice: "520",
        tokenId: "0006",
        edition: 8,
        maxSupply: 30,
        available: 7,
        creator: "MetaMuse",
      },
    ];

    setTimeout(() => {
      setNfts(mockNFTs);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleMint = async (nftId: string) => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setMintingId(nftId);

    // Simulate minting process
    setTimeout(() => {
      setNfts((prev) =>
        prev.map((nft) =>
          nft.id === nftId
            ? { ...nft, available: Math.max(0, nft.available - 1) }
            : nft,
        ),
      );
      setMintingId(null);
      alert("NFT minted successfully! 🎉");
    }, 3000);
  };

  const connectWallet = () => {
    // Simulate wallet connection
    setWalletConnected(true);
    alert("Wallet connected! 🔗");
  };

  // Filter and sort NFTs
  const filteredAndSortedNFTs = nfts
    .filter((nft) => {
      if (
        searchTerm &&
        !nft.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (selectedRarity !== "all" && nft.rarity !== selectedRarity) {
        return false;
      }
      if (selectedPriceRange !== "all") {
        const [min, max] = selectedPriceRange
          .split("-")
          .map((p) => p.replace("+", ""));
        const price = nft.price;
        if (selectedPriceRange === "10+") {
          if (price < 10) return false;
        } else {
          if (price < parseFloat(min) || price > parseFloat(max)) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rarity":
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
          return (
            rarityOrder[b.rarity as keyof typeof rarityOrder] -
            rarityOrder[a.rarity as keyof typeof rarityOrder]
          );

        default:
          return 0;
      }
    });

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      data-oid="fj-fx3w"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="su9z5k0" />

      <div className="absolute inset-0 overflow-hidden" data-oid="2nj1p-z">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="m44o1fs"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="2i108qm"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
          data-oid="g4actla"
        />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid="xb4f6hv"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid="tzi4ojm"
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="u06nag1"
          >
            M
          </div>
          <div data-oid="xke_mfq">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="ackv8-1"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="3urfjb-">
              NFT Mint
            </div>
          </div>
        </Link>

        <div className="flex items-center space-x-4" data-oid="1a4nbn:">
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="neural-button px-6 py-3 text-white font-semibold rounded-xl hover:scale-105 transition-all"
              data-oid="c:hotc9"
            >
              🔗 Connect Wallet
            </button>
          ) : (
            <div
              className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-xl"
              data-oid="zfb9h55"
            >
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                data-oid="fdzsroo"
              />

              <span
                className="text-green-300 text-sm font-mono"
                data-oid="u0f:rux"
              >
                0x3BD9...7881
              </span>
            </div>
          )}

          <Link
            href="/create"
            className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
            data-oid="p.m6mi9"
          >
            ✨ Create Muse
          </Link>

          <Link
            href="/"
            className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
            data-oid="ocw2866"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-12"
        data-oid="ixfdmx1"
      >
        {/* Header */}
        <div className="text-center mb-16" data-oid="s0hd4lx">
          <div
            className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
            data-oid="l:284u-"
          >
            🎯 NFT Marketplace
          </div>

          <h1
            className="text-6xl lg:text-7xl font-black mb-8 leading-tight"
            data-oid="-rp_jou"
          >
            <div className="hero-gradient-text mb-2" data-oid="m6vibfz">
              Mint AI Companions
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
            data-oid="7cm6oht"
          >
            Own unique AI companions as NFTs on the Metis blockchain. Each
            companion has distinct personality traits and can be used across the
            MetaMuse ecosystem.
          </p>

          {/* Stats */}
          <div
            className="grid grid-cols-4 gap-8 max-w-3xl mx-auto"
            data-oid="nfobyyg"
          >
            <div className="text-center" data-oid="9.e08h:">
              <div
                className="text-3xl font-bold stat-number"
                data-oid="o79ku4f"
              >
                {nfts.length}
              </div>
              <div className="text-gray-400 text-sm" data-oid="85.iu45">
                Collections
              </div>
            </div>
            <div className="text-center" data-oid="_o4_bui">
              <div
                className="text-3xl font-bold stat-number"
                data-oid="v8u09.6"
              >
                {nfts.reduce((sum, nft) => sum + nft.available, 0)}
              </div>
              <div className="text-gray-400 text-sm" data-oid="ffd4c3l">
                Available
              </div>
            </div>
            <div className="text-center" data-oid="w7g1tad">
              <div
                className="text-3xl font-bold stat-number"
                data-oid="b1xrozi"
              >
                {Math.min(...nfts.map((nft) => nft.price)).toFixed(1)}
              </div>
              <div className="text-gray-400 text-sm" data-oid="290_sb:">
                Min Price (METIS)
              </div>
            </div>
            <div className="text-center" data-oid="ewx1ntf">
              <div
                className="text-3xl font-bold stat-number"
                data-oid="-gc3ofc"
              >
                {nfts.filter((nft) => nft.rarity === "legendary").length}
              </div>
              <div className="text-gray-400 text-sm" data-oid=".lsuat8">
                Legendary
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          selectedRarity={selectedRarity}
          setSelectedRarity={setSelectedRarity}
          selectedPriceRange={selectedPriceRange}
          setSelectedPriceRange={setSelectedPriceRange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          data-oid="gtvmc4m"
        />

        {/* NFT Grid */}
        {isLoading ? (
          <div className="text-center py-20" data-oid="kpdu7xb">
            <div
              className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              data-oid="54txc6k"
            />

            <p className="text-gray-400" data-oid="m1yp.pl">
              Loading NFT collections...
            </p>
          </div>
        ) : filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-20" data-oid="cfwfd5-">
            <div
              className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
              data-oid="mr3waej"
            >
              😔
            </div>
            <h3
              className="text-2xl font-bold text-white mb-4"
              data-oid="4lxx-7e"
            >
              No NFTs Found
            </h3>
            <p className="text-gray-400 mb-8" data-oid="qx-.kp.">
              Try adjusting your search filters or check back later for new
              collections
            </p>
          </div>
        ) : (
          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            data-oid="1t-7z.e"
          >
            {filteredAndSortedNFTs.map((nft, index) => (
              <div
                key={nft.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in"
                data-oid="k.3:7y:"
              >
                <NFTCard
                  nft={nft}
                  onMint={handleMint}
                  isMinting={mintingId === nft.id}
                  data-oid="65cyz6t"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
