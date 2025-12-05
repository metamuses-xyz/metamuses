"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.4)";
        ctx.fill();

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
    />
  );
};

// Plugin type definition
interface Plugin {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  author: string;
  authorAvatar: string;
  category: string;
  icon: string;
  gradient: string;
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  price: number;
  isPremium: boolean;
  isVerified: boolean;
  isNew: boolean;
  tags: string[];
  features: string[];
  lastUpdated: string;
}

// Mock plugin data
const mockPlugins: Plugin[] = [
  {
    id: "1",
    name: "Code Assistant Pro",
    description:
      "Advanced code generation and debugging capabilities for your AI companion",
    longDescription:
      "Transform your Muse into a powerful coding partner with support for 50+ programming languages, real-time debugging, and intelligent code suggestions.",
    author: "MetaMuse Labs",
    authorAvatar: "M",
    category: "Developer Tools",
    icon: "💻",
    gradient: "from-blue-500 to-cyan-500",
    version: "2.1.0",
    downloads: 15420,
    rating: 4.9,
    reviews: 342,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["coding", "debugging", "productivity"],
    features: [
      "50+ language support",
      "Real-time debugging",
      "Code explanations",
      "Git integration",
    ],
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Creative Writer",
    description: "Enhance storytelling with advanced narrative generation",
    longDescription:
      "Unlock your Muse's creative potential with advanced story generation, character development, and world-building tools. Perfect for authors and storytellers.",
    author: "Story Forge",
    authorAvatar: "S",
    category: "Creativity",
    icon: "✍️",
    gradient: "from-purple-500 to-pink-500",
    version: "1.8.3",
    downloads: 8932,
    rating: 4.7,
    reviews: 189,
    price: 5.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["writing", "stories", "creativity"],
    features: [
      "Story generation",
      "Character profiles",
      "Plot outlines",
      "Style adaptation",
    ],
    lastUpdated: "2024-01-10",
  },
  {
    id: "3",
    name: "Data Analyst",
    description: "Advanced data analysis and visualization capabilities",
    longDescription:
      "Turn your Muse into a data science expert with powerful analysis tools, chart generation, and statistical insights powered by machine learning.",
    author: "DataMuse",
    authorAvatar: "D",
    category: "Analytics",
    icon: "📊",
    gradient: "from-green-500 to-teal-500",
    version: "3.0.1",
    downloads: 12105,
    rating: 4.8,
    reviews: 267,
    price: 9.99,
    isPremium: true,
    isVerified: true,
    isNew: true,
    tags: ["data", "analytics", "charts"],
    features: [
      "Chart generation",
      "Statistical analysis",
      "Data cleaning",
      "Report generation",
    ],
    lastUpdated: "2024-01-18",
  },
  {
    id: "4",
    name: "Language Tutor",
    description: "Learn any language with personalized AI tutoring",
    longDescription:
      "Master new languages with your AI companion as a personal tutor. Supports 30+ languages with grammar lessons, pronunciation guides, and conversational practice.",
    author: "LinguaAI",
    authorAvatar: "L",
    category: "Education",
    icon: "🌍",
    gradient: "from-orange-500 to-yellow-500",
    version: "2.5.0",
    downloads: 21543,
    rating: 4.9,
    reviews: 512,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["language", "education", "learning"],
    features: [
      "30+ languages",
      "Pronunciation guides",
      "Grammar lessons",
      "Conversation practice",
    ],
    lastUpdated: "2024-01-12",
  },
  {
    id: "5",
    name: "Crypto Advisor",
    description: "Real-time crypto analysis and portfolio management",
    longDescription:
      "Get expert cryptocurrency insights with real-time market analysis, portfolio tracking, and trading signals. Powered by advanced AI algorithms.",
    author: "CryptoMuse",
    authorAvatar: "C",
    category: "Finance",
    icon: "💰",
    gradient: "from-yellow-500 to-orange-500",
    version: "1.2.0",
    downloads: 7823,
    rating: 4.5,
    reviews: 156,
    price: 14.99,
    isPremium: true,
    isVerified: false,
    isNew: true,
    tags: ["crypto", "trading", "finance"],
    features: [
      "Market analysis",
      "Portfolio tracking",
      "Price alerts",
      "Trading signals",
    ],
    lastUpdated: "2024-01-20",
  },
  {
    id: "6",
    name: "Health Coach",
    description: "Personalized fitness and nutrition guidance",
    longDescription:
      "Transform your wellness journey with AI-powered health coaching. Get personalized workout plans, nutrition advice, and mental health support.",
    author: "WellnessAI",
    authorAvatar: "W",
    category: "Health",
    icon: "🏋️",
    gradient: "from-red-500 to-pink-500",
    version: "1.5.2",
    downloads: 9456,
    rating: 4.6,
    reviews: 203,
    price: 7.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["health", "fitness", "nutrition"],
    features: [
      "Workout plans",
      "Nutrition tracking",
      "Meal planning",
      "Progress tracking",
    ],
    lastUpdated: "2024-01-08",
  },
  {
    id: "7",
    name: "Music Composer",
    description: "AI-powered music creation and composition",
    longDescription:
      "Create beautiful music with your AI companion. Generate melodies, harmonies, and full compositions in various genres and styles.",
    author: "SonicMuse",
    authorAvatar: "S",
    category: "Creativity",
    icon: "🎵",
    gradient: "from-indigo-500 to-purple-500",
    version: "2.0.0",
    downloads: 5678,
    rating: 4.7,
    reviews: 134,
    price: 12.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["music", "composition", "audio"],
    features: [
      "Melody generation",
      "Chord progressions",
      "MIDI export",
      "Genre styles",
    ],
    lastUpdated: "2024-01-05",
  },
  {
    id: "8",
    name: "Research Assistant",
    description: "Academic research and citation management",
    longDescription:
      "Accelerate your research with AI-powered literature review, citation management, and paper summarization tools.",
    author: "AcademiaAI",
    authorAvatar: "A",
    category: "Education",
    icon: "📚",
    gradient: "from-emerald-500 to-green-600",
    version: "1.9.1",
    downloads: 11234,
    rating: 4.8,
    reviews: 289,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["research", "academic", "citations"],
    features: [
      "Paper summaries",
      "Citation management",
      "Literature search",
      "Bibliography export",
    ],
    lastUpdated: "2024-01-14",
  },
  {
    id: "9",
    name: "Game Master",
    description: "RPG campaign management and storytelling",
    longDescription:
      "The ultimate tool for tabletop RPG enthusiasts. Create campaigns, manage NPCs, generate encounters, and bring your fantasy worlds to life.",
    author: "DiceMuse",
    authorAvatar: "D",
    category: "Gaming",
    icon: "🎲",
    gradient: "from-violet-500 to-fuchsia-500",
    version: "1.3.0",
    downloads: 4521,
    rating: 4.9,
    reviews: 98,
    price: 4.99,
    isPremium: true,
    isVerified: false,
    isNew: true,
    tags: ["gaming", "rpg", "storytelling"],
    features: [
      "Campaign builder",
      "NPC generator",
      "Encounter creator",
      "Dice roller",
    ],
    lastUpdated: "2024-01-19",
  },
  {
    id: "10",
    name: "Legal Advisor",
    description: "AI-powered legal document analysis and drafting",
    longDescription:
      "Get expert legal assistance with document analysis, contract drafting, and legal research. Perfect for professionals and businesses.",
    author: "LexMuse",
    authorAvatar: "L",
    category: "Professional",
    icon: "⚖️",
    gradient: "from-slate-500 to-gray-600",
    version: "1.0.5",
    downloads: 3245,
    rating: 4.4,
    reviews: 67,
    price: 19.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["legal", "contracts", "business"],
    features: [
      "Document analysis",
      "Contract drafting",
      "Legal research",
      "Compliance checks",
    ],
    lastUpdated: "2024-01-11",
  },
  {
    id: "11",
    name: "Social Media Manager",
    description: "AI-powered content creation and scheduling",
    longDescription:
      "Supercharge your social media presence with AI-generated content, hashtag optimization, and cross-platform scheduling.",
    author: "SocialMuse",
    authorAvatar: "S",
    category: "Marketing",
    icon: "📱",
    gradient: "from-pink-500 to-rose-500",
    version: "2.2.1",
    downloads: 8901,
    rating: 4.6,
    reviews: 178,
    price: 8.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["social", "marketing", "content"],
    features: [
      "Content generation",
      "Hashtag optimization",
      "Post scheduling",
      "Analytics",
    ],
    lastUpdated: "2024-01-16",
  },
  {
    id: "12",
    name: "Art Generator",
    description: "Create stunning visual art with AI assistance",
    longDescription:
      "Turn your ideas into beautiful artwork with AI-powered image generation, style transfer, and creative tools.",
    author: "VisualMuse",
    authorAvatar: "V",
    category: "Creativity",
    icon: "🎨",
    gradient: "from-cyan-500 to-blue-500",
    version: "3.1.0",
    downloads: 18765,
    rating: 4.8,
    reviews: 423,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: true,
    tags: ["art", "images", "creative"],
    features: [
      "Image generation",
      "Style transfer",
      "Art editing",
      "High resolution",
    ],
    lastUpdated: "2024-01-21",
  },
];

const categories = [
  { name: "All", icon: "🌐", count: mockPlugins.length },
  {
    name: "Developer Tools",
    icon: "💻",
    count: mockPlugins.filter((p) => p.category === "Developer Tools").length,
  },
  {
    name: "Creativity",
    icon: "🎨",
    count: mockPlugins.filter((p) => p.category === "Creativity").length,
  },
  {
    name: "Education",
    icon: "📚",
    count: mockPlugins.filter((p) => p.category === "Education").length,
  },
  {
    name: "Analytics",
    icon: "📊",
    count: mockPlugins.filter((p) => p.category === "Analytics").length,
  },
  {
    name: "Finance",
    icon: "💰",
    count: mockPlugins.filter((p) => p.category === "Finance").length,
  },
  {
    name: "Health",
    icon: "🏋️",
    count: mockPlugins.filter((p) => p.category === "Health").length,
  },
  {
    name: "Gaming",
    icon: "🎲",
    count: mockPlugins.filter((p) => p.category === "Gaming").length,
  },
  {
    name: "Professional",
    icon: "💼",
    count: mockPlugins.filter((p) => p.category === "Professional").length,
  },
  {
    name: "Marketing",
    icon: "📱",
    count: mockPlugins.filter((p) => p.category === "Marketing").length,
  },
];

// Plugin Card Component
const PluginCard = ({
  plugin,
  onInstall,
  isInstalling,
}: {
  plugin: Plugin;
  onInstall: (id: string) => void;
  isInstalling: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDownloads = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div
      className={`neural-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden group ${
        isHovered ? "ring-2 ring-purple-500/50" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Badges */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {plugin.isNew && (
          <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
            NEW
          </span>
        )}
        {plugin.isPremium && (
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
            PREMIUM
          </span>
        )}
        {plugin.isVerified && (
          <span className="text-blue-400" title="Verified">
            ✓
          </span>
        )}
      </div>

      <div className="relative z-10">
        {/* Plugin Icon & Header */}
        <div className="flex items-start space-x-4 mb-4">
          <div
            className={`w-14 h-14 bg-gradient-to-br ${plugin.gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            {plugin.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors truncate">
              {plugin.name}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>by {plugin.author}</span>
              <span>•</span>
              <span>v{plugin.version}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {plugin.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {plugin.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white font-semibold">{plugin.rating}</span>
              <span className="text-gray-500">({plugin.reviews})</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <span>↓</span>
              <span>{formatDownloads(plugin.downloads)}</span>
            </div>
          </div>
          <span className="text-gray-500 text-xs">{plugin.category}</span>
        </div>

        {/* Price & Install Button */}
        <div className="flex items-center justify-between">
          <div>
            {plugin.price === 0 ? (
              <span className="text-green-400 font-bold">Free</span>
            ) : (
              <span className="text-white font-bold">
                ${plugin.price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => onInstall(plugin.id)}
            disabled={isInstalling}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
              isInstalling
                ? "bg-purple-600/50 text-white cursor-not-allowed"
                : "neural-button text-white hover:scale-105"
            }`}
          >
            {isInstalling ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Installing...</span>
              </div>
            ) : (
              "Install"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Featured Plugin Card Component
const FeaturedPluginCard = ({ plugin }: { plugin: Plugin }) => {
  return (
    <div className="neural-card rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
        <div
          className={`w-24 h-24 bg-gradient-to-br ${plugin.gradient} rounded-2xl flex items-center justify-center text-5xl shadow-2xl`}
        >
          {plugin.icon}
        </div>
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
              FEATURED
            </span>
            {plugin.isVerified && (
              <span className="text-blue-400">✓ Verified</span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{plugin.name}</h3>
          <p className="text-gray-300 mb-4">{plugin.longDescription}</p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white font-semibold">{plugin.rating}</span>
              <span className="text-gray-500">({plugin.reviews} reviews)</span>
            </div>
            <div className="text-gray-400">
              {plugin.downloads.toLocaleString()} downloads
            </div>
            <div className="text-gray-400">by {plugin.author}</div>
          </div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            {plugin.price === 0 ? (
              <span className="text-2xl font-bold text-green-400">Free</span>
            ) : (
              <span className="text-2xl font-bold text-white">
                ${plugin.price.toFixed(2)}
              </span>
            )}
          </div>
          <button className="neural-button px-8 py-3 text-white font-bold rounded-xl hover:scale-105 transition-transform">
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [priceFilter, setPriceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPlugins(mockPlugins);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleInstall = async (pluginId: string) => {
    setInstallingId(pluginId);
    // Simulate installation
    setTimeout(() => {
      setInstallingId(null);
      alert("Plugin installed successfully! 🎉");
    }, 2000);
  };

  // Filter and sort plugins
  const filteredPlugins = plugins
    .filter((plugin) => {
      if (
        searchTerm &&
        !plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (selectedCategory !== "All" && plugin.category !== selectedCategory) {
        return false;
      }
      if (priceFilter === "free" && plugin.price !== 0) {
        return false;
      }
      if (priceFilter === "premium" && plugin.price === 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const featuredPlugin = plugins.find((p) => p.id === "4"); // Language Tutor as featured

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <NeuralNetwork />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
      </div>

      {/* Navigation */}
      <Header />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8">
            🔌 Plugin Marketplace
          </div>

          <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
            <span className="hero-gradient-text">Enhance Your Muse</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover powerful plugins to extend your AI companion's
            capabilities. From coding assistance to creative tools, find the
            perfect plugins for your needs.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">
              {plugins.length}
            </div>
            <div className="text-gray-400 text-sm">Total Plugins</div>
          </div>
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {plugins.filter((p) => p.price === 0).length}
            </div>
            <div className="text-gray-400 text-sm">Free Plugins</div>
          </div>
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {plugins.filter((p) => p.isVerified).length}
            </div>
            <div className="text-gray-400 text-sm">Verified</div>
          </div>
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {(
                plugins.reduce((sum, p) => sum + p.rating, 0) / plugins.length
              ).toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">Avg Rating</div>
          </div>
        </div>

        {/* Featured Plugin */}
        {featuredPlugin && !isLoading && (
          <div className="mb-12">
            <FeaturedPluginCard plugin={featuredPlugin} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="neural-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value="all">All Prices</option>
              <option value="free">Free Only</option>
              <option value="premium">Premium Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Sidebar + Plugin Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="neural-card rounded-2xl p-4 sticky top-4">
              <h3 className="text-lg font-bold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                      selectedCategory === category.name
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Plugin Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading plugins...</p>
              </div>
            ) : filteredPlugins.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🔌
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No Plugins Found
                </h3>
                <p className="text-gray-400 mb-8">
                  Try adjusting your search filters or browse different
                  categories
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setPriceFilter("all");
                  }}
                  className="px-6 py-3 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/10 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-400">
                    Showing{" "}
                    <span className="text-white font-semibold">
                      {filteredPlugins.length}
                    </span>{" "}
                    plugins
                  </p>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPlugins.map((plugin) => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      onInstall={handleInstall}
                      isInstalling={installingId === plugin.id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20">
          <div className="neural-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
            <div className="relative z-10">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-6">
                🛠️ Build Your Own Plugin
              </div>

              <h2 className="text-4xl font-black mb-4 hero-gradient-text">
                Want to Create a Plugin?
              </h2>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join our developer community and build plugins that enhance the
                MetaMuse ecosystem. Earn rewards and help shape the future of AI
                companions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="http://metamuses.gitbook.io/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neural-button px-8 py-4 text-white font-bold rounded-xl hover:scale-105 transition-transform inline-block"
                >
                  📖 Read Developer Docs
                </a>
                <a
                  href="https://discord.gg/eBrDRvPet2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 border border-purple-500/30 text-purple-300 font-semibold rounded-xl hover:bg-purple-500/10 transition-all inline-block"
                >
                  💬 Join Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
