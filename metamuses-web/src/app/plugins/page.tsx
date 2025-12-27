"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstallPluginModal from "@/components/plugins/InstallPluginModal";
import {
  usePluginMarketplace,
  usePluginDetails,
  usePluginListings,
} from "@/hooks/usePluginMarketplace";
import {
  Plugin,
  PluginListing,
  Category,
  AccessType,
  formatRating as formatContractRating,
} from "@/contracts/PluginMarketplace";
import {
  getCategoryConfig,
  getCategoryIcon,
  getCategoryGradient,
  getCategoryName,
  CATEGORIES,
} from "@/utils/pluginCategories";
import {
  formatPluginPrice,
  formatInstallCount,
  getAccessTypeLabel,
  getCheapestListing,
} from "@/utils/pluginPricing";
import { fetchPluginMetadata, PluginMetadata } from "@/utils/ipfsMetadata";

// Mock plugin data type
interface MockPlugin {
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

// Mock plugin data - always displayed first
const mockPlugins: MockPlugin[] = [
  {
    id: "mock-1",
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
    id: "mock-2",
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
    id: "mock-3",
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
    id: "mock-4",
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
    id: "mock-5",
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
    id: "mock-6",
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
    id: "mock-7",
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
    id: "mock-8",
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
    id: "mock-9",
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
    id: "mock-10",
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
    id: "mock-11",
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
    id: "mock-12",
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
  {
    id: "mock-13",
    name: "Math Genius",
    description: "Advanced mathematical problem solver and tutor",
    longDescription:
      "Solve complex equations, get step-by-step explanations, and master mathematics from algebra to calculus with your AI companion.",
    author: "MathMuse",
    authorAvatar: "M",
    category: "Education",
    icon: "➗",
    gradient: "from-indigo-500 to-blue-500",
    version: "2.3.0",
    downloads: 14567,
    rating: 4.9,
    reviews: 387,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["math", "education", "solver"],
    features: [
      "Equation solver",
      "Step-by-step solutions",
      "Graphing calculator",
      "Homework help",
    ],
    lastUpdated: "2024-01-13",
  },
  {
    id: "mock-14",
    name: "Video Editor Pro",
    description: "AI-powered video editing and enhancement",
    longDescription:
      "Edit videos with AI assistance, automatic color correction, smart transitions, and professional effects powered by machine learning.",
    author: "VideoMuse",
    authorAvatar: "V",
    category: "Creativity",
    icon: "🎬",
    gradient: "from-red-500 to-pink-500",
    version: "1.7.2",
    downloads: 6842,
    rating: 4.5,
    reviews: 145,
    price: 15.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["video", "editing", "media"],
    features: [
      "Auto color correction",
      "Smart transitions",
      "Audio sync",
      "Export presets",
    ],
    lastUpdated: "2024-01-09",
  },
  {
    id: "mock-15",
    name: "Business Advisor",
    description: "Strategic business planning and market analysis",
    longDescription:
      "Get expert business advice, market analysis, competitor research, and strategic planning tools for entrepreneurs and business owners.",
    author: "BizMuse",
    authorAvatar: "B",
    category: "Professional",
    icon: "💼",
    gradient: "from-teal-500 to-green-500",
    version: "2.0.1",
    downloads: 5234,
    rating: 4.7,
    reviews: 112,
    price: 24.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["business", "strategy", "analysis"],
    features: [
      "Market analysis",
      "Business plans",
      "Financial forecasts",
      "SWOT analysis",
    ],
    lastUpdated: "2024-01-07",
  },
  {
    id: "mock-16",
    name: "Meditation Guide",
    description: "Personalized meditation and mindfulness coach",
    longDescription:
      "Improve mental health with guided meditations, breathing exercises, and mindfulness practices tailored to your needs.",
    author: "ZenMuse",
    authorAvatar: "Z",
    category: "Health",
    icon: "🧘",
    gradient: "from-purple-400 to-pink-400",
    version: "1.4.0",
    downloads: 13456,
    rating: 4.9,
    reviews: 567,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["meditation", "wellness", "mindfulness"],
    features: [
      "Guided sessions",
      "Breathing exercises",
      "Sleep stories",
      "Progress tracking",
    ],
    lastUpdated: "2024-01-17",
  },
  {
    id: "mock-17",
    name: "Recipe Generator",
    description: "AI-powered recipe creation and meal planning",
    longDescription:
      "Create delicious recipes based on ingredients you have, dietary preferences, and cooking skill level with smart meal planning.",
    author: "ChefMuse",
    authorAvatar: "C",
    category: "Health",
    icon: "👨‍🍳",
    gradient: "from-orange-400 to-red-500",
    version: "2.1.5",
    downloads: 9876,
    rating: 4.6,
    reviews: 234,
    price: 3.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["cooking", "recipes", "food"],
    features: [
      "Recipe generation",
      "Meal planning",
      "Shopping lists",
      "Nutrition info",
    ],
    lastUpdated: "2024-01-11",
  },
  {
    id: "mock-18",
    name: "Quiz Master",
    description: "Interactive quiz and trivia game creator",
    longDescription:
      "Create custom quizzes, play trivia games, and challenge your knowledge across thousands of topics with adaptive difficulty.",
    author: "QuizMuse",
    authorAvatar: "Q",
    category: "Gaming",
    icon: "❓",
    gradient: "from-yellow-400 to-orange-500",
    version: "1.8.0",
    downloads: 11234,
    rating: 4.7,
    reviews: 289,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["quiz", "trivia", "education"],
    features: [
      "Custom quizzes",
      "Multiplayer mode",
      "Leaderboards",
      "Topic variety",
    ],
    lastUpdated: "2024-01-15",
  },
  {
    id: "mock-19",
    name: "Investment Tracker",
    description: "Portfolio management and investment insights",
    longDescription:
      "Track stocks, crypto, and other investments with real-time data, performance analytics, and AI-powered recommendations.",
    author: "InvestMuse",
    authorAvatar: "I",
    category: "Finance",
    icon: "📈",
    gradient: "from-green-500 to-emerald-600",
    version: "3.2.0",
    downloads: 8765,
    rating: 4.8,
    reviews: 198,
    price: 9.99,
    isPremium: true,
    isVerified: true,
    isNew: true,
    tags: ["investing", "stocks", "portfolio"],
    features: [
      "Portfolio tracking",
      "Real-time data",
      "Performance analytics",
      "Alerts",
    ],
    lastUpdated: "2024-01-20",
  },
  {
    id: "mock-20",
    name: "Voice Coach",
    description: "Improve your voice with AI-powered coaching",
    longDescription:
      "Enhance your speaking voice, pronunciation, and vocal techniques with personalized exercises and real-time feedback.",
    author: "VocalMuse",
    authorAvatar: "V",
    category: "Education",
    icon: "🎤",
    gradient: "from-pink-500 to-purple-500",
    version: "1.5.3",
    downloads: 4567,
    rating: 4.4,
    reviews: 89,
    price: 6.99,
    isPremium: true,
    isVerified: false,
    isNew: false,
    tags: ["voice", "singing", "coaching"],
    features: [
      "Vocal exercises",
      "Pitch training",
      "Recording analysis",
      "Progress tracking",
    ],
    lastUpdated: "2024-01-06",
  },
  {
    id: "mock-21",
    name: "Travel Planner",
    description: "AI-powered travel itinerary and trip planning",
    longDescription:
      "Plan perfect trips with personalized itineraries, destination recommendations, budget tracking, and local insights.",
    author: "TravelMuse",
    authorAvatar: "T",
    category: "Professional",
    icon: "✈️",
    gradient: "from-blue-400 to-cyan-500",
    version: "2.4.0",
    downloads: 12890,
    rating: 4.8,
    reviews: 456,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["travel", "planning", "adventure"],
    features: [
      "Itinerary builder",
      "Budget tracking",
      "Local recommendations",
      "Packing lists",
    ],
    lastUpdated: "2024-01-18",
  },
  {
    id: "mock-22",
    name: "3D Model Creator",
    description: "Generate 3D models with AI assistance",
    longDescription:
      "Create 3D models from text descriptions, sketches, or images with AI-powered modeling tools and export options.",
    author: "3DMuse",
    authorAvatar: "3",
    category: "Creativity",
    icon: "🗿",
    gradient: "from-violet-500 to-purple-600",
    version: "1.2.0",
    downloads: 3456,
    rating: 4.3,
    reviews: 67,
    price: 19.99,
    isPremium: true,
    isVerified: false,
    isNew: true,
    tags: ["3d", "modeling", "design"],
    features: [
      "Text-to-3D",
      "Model editing",
      "Multiple formats",
      "Texture generation",
    ],
    lastUpdated: "2024-01-21",
  },
  {
    id: "mock-23",
    name: "Bug Finder",
    description: "Automated code debugging and error detection",
    longDescription:
      "Detect bugs, security vulnerabilities, and code smells in your projects with AI-powered static analysis and suggestions.",
    author: "DebugMuse",
    authorAvatar: "D",
    category: "Developer Tools",
    icon: "🐛",
    gradient: "from-red-500 to-orange-500",
    version: "2.6.1",
    downloads: 16789,
    rating: 4.9,
    reviews: 512,
    price: 12.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["debugging", "security", "code-quality"],
    features: [
      "Bug detection",
      "Security scan",
      "Code suggestions",
      "CI/CD integration",
    ],
    lastUpdated: "2024-01-16",
  },
  {
    id: "mock-24",
    name: "Podcast Producer",
    description: "AI-assisted podcast creation and editing",
    longDescription:
      "Create professional podcasts with AI-powered audio editing, script writing, intro/outro generation, and publishing tools.",
    author: "PodMuse",
    authorAvatar: "P",
    category: "Creativity",
    icon: "🎙️",
    gradient: "from-indigo-500 to-blue-600",
    version: "1.9.0",
    downloads: 5678,
    rating: 4.6,
    reviews: 134,
    price: 8.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["podcast", "audio", "production"],
    features: [
      "Script writing",
      "Audio editing",
      "Voice enhancement",
      "Publishing tools",
    ],
    lastUpdated: "2024-01-12",
  },
  {
    id: "mock-25",
    name: "Email Assistant",
    description: "Smart email composition and management",
    longDescription:
      "Write professional emails faster with AI suggestions, templates, tone adjustment, and automated responses.",
    author: "MailMuse",
    authorAvatar: "M",
    category: "Professional",
    icon: "📧",
    gradient: "from-blue-500 to-indigo-500",
    version: "2.8.2",
    downloads: 19876,
    rating: 4.7,
    reviews: 678,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["email", "productivity", "communication"],
    features: [
      "Email templates",
      "Tone adjustment",
      "Smart replies",
      "Schedule send",
    ],
    lastUpdated: "2024-01-14",
  },
  {
    id: "mock-26",
    name: "Stock Photo Finder",
    description: "AI-powered stock photo search and curation",
    longDescription:
      "Find perfect stock photos from multiple sources with AI-powered search, filtering, and image recommendations.",
    author: "PhotoMuse",
    authorAvatar: "P",
    category: "Marketing",
    icon: "📷",
    gradient: "from-pink-400 to-rose-500",
    version: "1.6.0",
    downloads: 7890,
    rating: 4.5,
    reviews: 167,
    price: 4.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["photos", "stock", "images"],
    features: [
      "Multi-source search",
      "AI recommendations",
      "License checking",
      "Collections",
    ],
    lastUpdated: "2024-01-10",
  },
  {
    id: "mock-27",
    name: "Habit Tracker",
    description: "Build better habits with AI coaching",
    longDescription:
      "Track habits, set goals, and receive personalized coaching to build lasting positive habits with data-driven insights.",
    author: "HabitMuse",
    authorAvatar: "H",
    category: "Health",
    icon: "✅",
    gradient: "from-green-400 to-teal-500",
    version: "2.2.0",
    downloads: 15678,
    rating: 4.8,
    reviews: 445,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["habits", "goals", "productivity"],
    features: [
      "Habit tracking",
      "Goal setting",
      "Streak counters",
      "Analytics",
    ],
    lastUpdated: "2024-01-19",
  },
  {
    id: "mock-28",
    name: "Fashion Stylist",
    description: "Personal AI fashion advisor and outfit creator",
    longDescription:
      "Get personalized fashion advice, outfit suggestions, and style recommendations based on your preferences and occasions.",
    author: "StyleMuse",
    authorAvatar: "S",
    category: "Professional",
    icon: "👗",
    gradient: "from-fuchsia-500 to-pink-600",
    version: "1.3.5",
    downloads: 9234,
    rating: 4.6,
    reviews: 234,
    price: 5.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["fashion", "style", "wardrobe"],
    features: [
      "Outfit suggestions",
      "Style analysis",
      "Virtual wardrobe",
      "Shopping links",
    ],
    lastUpdated: "2024-01-08",
  },
  {
    id: "mock-29",
    name: "Database Designer",
    description: "AI-assisted database schema design and optimization",
    longDescription:
      "Design efficient database schemas, optimize queries, and get recommendations for SQL and NoSQL databases.",
    author: "DataMuse",
    authorAvatar: "D",
    category: "Developer Tools",
    icon: "🗄️",
    gradient: "from-slate-500 to-gray-600",
    version: "2.5.0",
    downloads: 6543,
    rating: 4.7,
    reviews: 156,
    price: 14.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["database", "sql", "design"],
    features: [
      "Schema design",
      "Query optimization",
      "Migration tools",
      "Documentation",
    ],
    lastUpdated: "2024-01-13",
  },
  {
    id: "mock-30",
    name: "Presentation Builder",
    description: "Create stunning presentations with AI",
    longDescription:
      "Generate professional presentations from outlines, with smart layouts, design suggestions, and content recommendations.",
    author: "SlideMuse",
    authorAvatar: "S",
    category: "Professional",
    icon: "📊",
    gradient: "from-orange-500 to-red-500",
    version: "2.0.3",
    downloads: 11567,
    rating: 4.8,
    reviews: 389,
    price: 7.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["presentations", "slides", "business"],
    features: [
      "Auto layouts",
      "Design themes",
      "Content suggestions",
      "Export options",
    ],
    lastUpdated: "2024-01-15",
  },
  {
    id: "mock-31",
    name: "Calorie Counter",
    description: "AI-powered nutrition tracking and meal logging",
    longDescription:
      "Track calories, macros, and nutrition with AI-powered food recognition, barcode scanning, and personalized insights.",
    author: "NutriMuse",
    authorAvatar: "N",
    category: "Health",
    icon: "🍎",
    gradient: "from-lime-500 to-green-600",
    version: "3.1.2",
    downloads: 22345,
    rating: 4.9,
    reviews: 789,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["nutrition", "health", "diet"],
    features: [
      "Food recognition",
      "Barcode scanner",
      "Macro tracking",
      "Meal plans",
    ],
    lastUpdated: "2024-01-17",
  },
  {
    id: "mock-32",
    name: "API Tester",
    description: "Test and debug REST APIs with AI assistance",
    longDescription:
      "Test REST APIs, generate test cases, validate responses, and get AI-powered debugging suggestions for API development.",
    author: "APIMuse",
    authorAvatar: "A",
    category: "Developer Tools",
    icon: "🔌",
    gradient: "from-cyan-500 to-blue-600",
    version: "1.7.1",
    downloads: 8912,
    rating: 4.6,
    reviews: 201,
    price: 9.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["api", "testing", "debugging"],
    features: [
      "API testing",
      "Auto test generation",
      "Response validation",
      "Mock servers",
    ],
    lastUpdated: "2024-01-11",
  },
  {
    id: "mock-33",
    name: "Interior Designer",
    description: "AI-powered room design and decoration",
    longDescription:
      "Redesign your space with AI-generated room layouts, furniture recommendations, color schemes, and 3D visualizations.",
    author: "DesignMuse",
    authorAvatar: "D",
    category: "Creativity",
    icon: "🛋️",
    gradient: "from-amber-500 to-orange-600",
    version: "1.4.0",
    downloads: 6789,
    rating: 4.7,
    reviews: 178,
    price: 11.99,
    isPremium: true,
    isVerified: true,
    isNew: true,
    tags: ["interior", "design", "home"],
    features: [
      "Room layouts",
      "Furniture matching",
      "Color palettes",
      "3D preview",
    ],
    lastUpdated: "2024-01-20",
  },
  {
    id: "mock-34",
    name: "SEO Optimizer",
    description: "Boost your website SEO with AI insights",
    longDescription:
      "Optimize your website for search engines with keyword research, content analysis, backlink tracking, and ranking insights.",
    author: "SEOMuse",
    authorAvatar: "S",
    category: "Marketing",
    icon: "🔍",
    gradient: "from-emerald-500 to-teal-600",
    version: "2.7.0",
    downloads: 13456,
    rating: 4.8,
    reviews: 467,
    price: 16.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["seo", "marketing", "optimization"],
    features: [
      "Keyword research",
      "Content analysis",
      "Backlink tracker",
      "Rank monitoring",
    ],
    lastUpdated: "2024-01-18",
  },
  {
    id: "mock-35",
    name: "Chess Coach",
    description: "Improve your chess with AI-powered training",
    longDescription:
      "Master chess with AI analysis, opening preparation, tactical puzzles, and personalized training based on your playing style.",
    author: "ChessMuse",
    authorAvatar: "C",
    category: "Gaming",
    icon: "♟️",
    gradient: "from-slate-600 to-zinc-700",
    version: "2.9.0",
    downloads: 10234,
    rating: 4.9,
    reviews: 334,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["chess", "strategy", "training"],
    features: [
      "Position analysis",
      "Opening book",
      "Tactical puzzles",
      "Game review",
    ],
    lastUpdated: "2024-01-16",
  },
  {
    id: "mock-36",
    name: "Contract Generator",
    description: "Generate legal contracts with AI assistance",
    longDescription:
      "Create customized legal contracts, NDAs, and agreements with AI-powered templates and clause recommendations.",
    author: "ContractMuse",
    authorAvatar: "C",
    category: "Professional",
    icon: "📝",
    gradient: "from-blue-600 to-indigo-700",
    version: "1.8.5",
    downloads: 5432,
    rating: 4.5,
    reviews: 123,
    price: 29.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["legal", "contracts", "business"],
    features: [
      "Contract templates",
      "Custom clauses",
      "Legal compliance",
      "E-signature ready",
    ],
    lastUpdated: "2024-01-09",
  },
  {
    id: "mock-37",
    name: "Dream Interpreter",
    description: "Analyze and interpret your dreams with AI",
    longDescription:
      "Keep a dream journal, get AI-powered interpretations, discover patterns, and explore the meanings behind your dreams.",
    author: "DreamMuse",
    authorAvatar: "D",
    category: "Health",
    icon: "💭",
    gradient: "from-purple-500 to-indigo-600",
    version: "1.2.3",
    downloads: 7654,
    rating: 4.4,
    reviews: 189,
    price: 2.99,
    isPremium: true,
    isVerified: false,
    isNew: false,
    tags: ["dreams", "psychology", "wellness"],
    features: [
      "Dream journal",
      "AI interpretation",
      "Pattern analysis",
      "Symbol dictionary",
    ],
    lastUpdated: "2024-01-07",
  },
  {
    id: "mock-38",
    name: "Logo Designer",
    description: "Create professional logos with AI",
    longDescription:
      "Design unique logos for your brand with AI-powered generation, customization tools, and multiple format exports.",
    author: "LogoMuse",
    authorAvatar: "L",
    category: "Creativity",
    icon: "🎯",
    gradient: "from-rose-500 to-pink-600",
    version: "2.3.0",
    downloads: 14567,
    rating: 4.7,
    reviews: 456,
    price: 12.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["logo", "branding", "design"],
    features: [
      "Logo generation",
      "Brand guidelines",
      "Vector export",
      "Color variations",
    ],
    lastUpdated: "2024-01-14",
  },
  {
    id: "mock-39",
    name: "Blockchain Explorer",
    description: "Explore and analyze blockchain transactions",
    longDescription:
      "Track blockchain transactions, analyze smart contracts, monitor wallets, and get insights across multiple chains.",
    author: "ChainMuse",
    authorAvatar: "C",
    category: "Finance",
    icon: "⛓️",
    gradient: "from-violet-600 to-purple-700",
    version: "1.9.2",
    downloads: 4321,
    rating: 4.6,
    reviews: 98,
    price: 8.99,
    isPremium: true,
    isVerified: true,
    isNew: true,
    tags: ["blockchain", "crypto", "analysis"],
    features: [
      "Multi-chain support",
      "Transaction tracking",
      "Smart contracts",
      "Wallet monitoring",
    ],
    lastUpdated: "2024-01-19",
  },
  {
    id: "mock-40",
    name: "Resume Builder",
    description: "Create professional resumes with AI",
    longDescription:
      "Build impressive resumes with AI-powered content suggestions, professional templates, and ATS optimization.",
    author: "CareerMuse",
    authorAvatar: "C",
    category: "Professional",
    icon: "📄",
    gradient: "from-teal-500 to-cyan-600",
    version: "2.6.0",
    downloads: 18234,
    rating: 4.8,
    reviews: 612,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["resume", "career", "jobs"],
    features: [
      "ATS optimization",
      "Templates",
      "Content suggestions",
      "Cover letters",
    ],
    lastUpdated: "2024-01-15",
  },
  {
    id: "mock-41",
    name: "Meme Generator",
    description: "Create viral memes with AI assistance",
    longDescription:
      "Generate trending memes, add captions, use popular templates, and share your creations with AI-powered suggestions.",
    author: "MemeMuse",
    authorAvatar: "M",
    category: "Gaming",
    icon: "😂",
    gradient: "from-yellow-500 to-orange-600",
    version: "1.5.0",
    downloads: 23456,
    rating: 4.9,
    reviews: 891,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["memes", "fun", "social"],
    features: [
      "Meme templates",
      "Caption suggestions",
      "Trending topics",
      "Easy sharing",
    ],
    lastUpdated: "2024-01-21",
  },
  {
    id: "mock-42",
    name: "Budget Planner",
    description: "Smart personal finance and budget management",
    longDescription:
      "Manage your personal finances with AI-powered budgeting, expense tracking, savings goals, and financial insights.",
    author: "MoneyMuse",
    authorAvatar: "M",
    category: "Finance",
    icon: "💵",
    gradient: "from-green-600 to-emerald-700",
    version: "3.4.0",
    downloads: 16789,
    rating: 4.8,
    reviews: 523,
    price: 4.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["budget", "finance", "money"],
    features: [
      "Expense tracking",
      "Budget planning",
      "Savings goals",
      "Bill reminders",
    ],
    lastUpdated: "2024-01-18",
  },
  {
    id: "mock-43",
    name: "Regex Helper",
    description: "Build and test regular expressions with AI",
    longDescription:
      "Create, test, and debug regex patterns with AI explanations, pattern suggestions, and real-time testing.",
    author: "RegexMuse",
    authorAvatar: "R",
    category: "Developer Tools",
    icon: "🔤",
    gradient: "from-indigo-600 to-blue-700",
    version: "1.6.2",
    downloads: 7890,
    rating: 4.7,
    reviews: 167,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["regex", "development", "tools"],
    features: [
      "Pattern builder",
      "Live testing",
      "AI explanations",
      "Code snippets",
    ],
    lastUpdated: "2024-01-12",
  },
  {
    id: "mock-44",
    name: "Pet Care Guide",
    description: "AI-powered pet health and care assistant",
    longDescription:
      "Get personalized pet care advice, health tracking, feeding schedules, and training tips for your furry friends.",
    author: "PetMuse",
    authorAvatar: "P",
    category: "Health",
    icon: "🐾",
    gradient: "from-amber-500 to-yellow-600",
    version: "1.7.0",
    downloads: 9123,
    rating: 4.6,
    reviews: 234,
    price: 3.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["pets", "animals", "care"],
    features: [
      "Health tracking",
      "Feeding schedules",
      "Training tips",
      "Vet reminders",
    ],
    lastUpdated: "2024-01-10",
  },
  {
    id: "mock-45",
    name: "Color Palette Generator",
    description: "Create beautiful color schemes with AI",
    longDescription:
      "Generate harmonious color palettes for design projects with AI suggestions, accessibility checks, and export options.",
    author: "ColorMuse",
    authorAvatar: "C",
    category: "Creativity",
    icon: "🎨",
    gradient: "from-rainbow-500 to-rainbow-600",
    version: "2.1.0",
    downloads: 11234,
    rating: 4.8,
    reviews: 345,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["colors", "design", "palettes"],
    features: [
      "Palette generation",
      "Color harmony",
      "Accessibility check",
      "Export formats",
    ],
    lastUpdated: "2024-01-16",
  },
  {
    id: "mock-46",
    name: "UX/UI Reviewer",
    description: "Get AI-powered design feedback and suggestions",
    longDescription:
      "Improve your designs with AI analysis of UX/UI patterns, accessibility, user flow, and best practice recommendations.",
    author: "UXMuse",
    authorAvatar: "U",
    category: "Developer Tools",
    icon: "📱",
    gradient: "from-pink-600 to-rose-700",
    version: "1.8.0",
    downloads: 5678,
    rating: 4.5,
    reviews: 123,
    price: 13.99,
    isPremium: true,
    isVerified: true,
    isNew: true,
    tags: ["ux", "ui", "design"],
    features: [
      "Design analysis",
      "Accessibility audit",
      "User flow review",
      "Best practices",
    ],
    lastUpdated: "2024-01-20",
  },
  {
    id: "mock-47",
    name: "Song Lyrics Writer",
    description: "Write song lyrics with AI creative assistance",
    longDescription:
      "Create original song lyrics with AI suggestions, rhyme schemes, genre-specific styles, and collaborative writing tools.",
    author: "LyricMuse",
    authorAvatar: "L",
    category: "Creativity",
    icon: "🎵",
    gradient: "from-purple-600 to-fuchsia-700",
    version: "2.2.5",
    downloads: 8765,
    rating: 4.7,
    reviews: 267,
    price: 5.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["lyrics", "music", "writing"],
    features: [
      "Lyric generation",
      "Rhyme suggestions",
      "Genre styles",
      "Collaboration",
    ],
    lastUpdated: "2024-01-13",
  },
  {
    id: "mock-48",
    name: "Time Tracker",
    description: "Track time and boost productivity with AI",
    longDescription:
      "Monitor how you spend your time, get productivity insights, and optimize your schedule with AI-powered time management.",
    author: "TimeMuse",
    authorAvatar: "T",
    category: "Professional",
    icon: "⏰",
    gradient: "from-blue-500 to-cyan-600",
    version: "2.9.1",
    downloads: 13567,
    rating: 4.8,
    reviews: 478,
    price: 6.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["time", "productivity", "tracking"],
    features: [
      "Time tracking",
      "Project management",
      "Productivity insights",
      "Reports",
    ],
    lastUpdated: "2024-01-17",
  },
  {
    id: "mock-49",
    name: "Password Manager",
    description: "Secure password generation and storage",
    longDescription:
      "Generate strong passwords, store them securely, and auto-fill with AI-powered security recommendations and breach alerts.",
    author: "SecureMuse",
    authorAvatar: "S",
    category: "Professional",
    icon: "🔐",
    gradient: "from-red-600 to-pink-700",
    version: "3.5.0",
    downloads: 24567,
    rating: 4.9,
    reviews: 834,
    price: 0,
    isPremium: false,
    isVerified: true,
    isNew: false,
    tags: ["security", "passwords", "privacy"],
    features: [
      "Password generation",
      "Secure storage",
      "Auto-fill",
      "Breach alerts",
    ],
    lastUpdated: "2024-01-19",
  },
  {
    id: "mock-50",
    name: "Astrology Guide",
    description: "Personalized horoscopes and astrology insights",
    longDescription:
      "Get daily horoscopes, birth chart analysis, compatibility reports, and astrological guidance powered by AI.",
    author: "AstroMuse",
    authorAvatar: "A",
    category: "Gaming",
    icon: "🔮",
    gradient: "from-violet-500 to-purple-600",
    version: "1.4.8",
    downloads: 17890,
    rating: 4.6,
    reviews: 567,
    price: 2.99,
    isPremium: true,
    isVerified: true,
    isNew: false,
    tags: ["astrology", "horoscope", "zodiac"],
    features: [
      "Daily horoscopes",
      "Birth charts",
      "Compatibility",
      "Moon phases",
    ],
    lastUpdated: "2024-01-11",
  },
];

// Helper function to convert mock plugin to EnrichedPlugin format
const convertMockToEnriched = (mock: MockPlugin): EnrichedPlugin => {
  // Map category string to Category enum
  // Contract Categories: KNOWLEDGE, SKILLS, PERSONALITY, TOOLS, ENTERTAINMENT
  const categoryMap: Record<string, Category> = {
    "Developer Tools": Category.SKILLS,      // Code Assistant Pro
    "Creativity": Category.ENTERTAINMENT,    // Creative Writer, Art
    "Education": Category.KNOWLEDGE,         // Language Tutor, Research
    "Analytics": Category.SKILLS,            // Data Analyst
    "Finance": Category.TOOLS,               // Crypto Advisor
    "Health": Category.TOOLS,                // Health Coach
    "Gaming": Category.ENTERTAINMENT,        // Game Master
    "Professional": Category.KNOWLEDGE,      // Legal Advisor
    "Marketing": Category.TOOLS,             // Social Media Manager
  };

  const category = categoryMap[mock.category] || Category.TOOLS;

  // Create mock Plugin object
  const plugin: Plugin = {
    id: BigInt(mock.id.replace("mock-", "-")), // Negative ID to distinguish from real plugins
    name: mock.name,
    metadataURI: `mock://${mock.id}`,
    wasmHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    creator: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    category,
    currentVersion: BigInt(mock.version.split(".")[0] || 1),
    createdAt: BigInt(Math.floor(new Date(mock.lastUpdated).getTime() / 1000)),
    active: true,
    totalInstalls: BigInt(mock.downloads),
    totalRevenue: BigInt(0),
    rating: BigInt(Math.round(mock.rating * 100)), // Convert 4.9 to 490
    ratingCount: BigInt(mock.reviews),
  };

  // Create mock listings
  const listings: PluginListing[] = [{
    pluginId: plugin.id,
    accessType: mock.price > 0 ? AccessType.PERMANENT : AccessType.PERMANENT,
    price: BigInt(Math.round(mock.price * 1e18)), // Convert to wei
    usageQuota: BigInt(0),
    duration: BigInt(0),
    trialDuration: BigInt(0),
    active: true,
  }];

  // Create mock metadata
  const metadata: PluginMetadata = {
    name: mock.name,
    description: mock.description,
    longDescription: mock.longDescription,
    author: mock.author,
    icon: mock.icon,
    tags: mock.tags,
    features: mock.features,
    version: mock.version,
    homepage: "",
    repository: "",
    documentation: "",
    license: "MIT",
  };

  return {
    plugin,
    listings,
    metadata,
  };
};

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

// Extended plugin type with metadata
interface EnrichedPlugin {
  plugin: Plugin;
  listings: PluginListing[];
  metadata: PluginMetadata | null;
}

// Plugin Card Component
const PluginCard = ({
  enrichedPlugin,
  onInstall,
}: {
  enrichedPlugin: EnrichedPlugin;
  onInstall: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { plugin, listings, metadata } = enrichedPlugin;

  const cheapestListing = getCheapestListing(listings);
  const icon = metadata?.icon || getCategoryIcon(plugin.category);
  const gradient = getCategoryGradient(plugin.category);
  const rating = formatContractRating(plugin.rating);

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
        {plugin.id < BigInt(0) && (
          <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full">
            DEMO
          </span>
        )}
        {plugin.currentVersion === BigInt(1) && plugin.id >= BigInt(0) && (
          <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
            NEW
          </span>
        )}
        {cheapestListing && cheapestListing.price > BigInt(0) && (
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
            PREMIUM
          </span>
        )}
      </div>

      <div className="relative z-10">
        {/* Plugin Icon & Header */}
        <div className="flex items-start space-x-4 mb-4">
          <div
            className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/plugins/${plugin.id}`}
              className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors truncate block hover:underline"
            >
              {metadata?.name || plugin.name}
            </Link>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>by {metadata?.author || "Unknown"}</span>
              <span>•</span>
              <span>v{Number(plugin.currentVersion)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {metadata?.description || "No description available"}
        </p>

        {/* Tags */}
        {metadata?.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {metadata.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white font-semibold">
                {plugin.ratingCount > BigInt(0) ? rating.toFixed(1) : "N/A"}
              </span>
              {plugin.ratingCount > BigInt(0) && (
                <span className="text-gray-500">
                  ({Number(plugin.ratingCount)})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <span>↓</span>
              <span>{formatInstallCount(plugin.totalInstalls)}</span>
            </div>
          </div>
          <span className="text-gray-500 text-xs">
            {getCategoryName(plugin.category)}
          </span>
        </div>

        {/* Price & Install Button */}
        <div className="flex items-center justify-between">
          <div>
            {cheapestListing ? (
              cheapestListing.price === BigInt(0) ? (
                <span className="text-green-400 font-bold">Free</span>
              ) : (
                <span className="text-white font-bold">
                  {formatPluginPrice(cheapestListing.price)}
                </span>
              )
            ) : (
              <span className="text-gray-400">No pricing</span>
            )}
          </div>
          <button
            onClick={onInstall}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 neural-button text-white hover:scale-105"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

// Featured Plugin Card Component
const FeaturedPluginCard = ({
  enrichedPlugin,
  onInstall,
}: {
  enrichedPlugin: EnrichedPlugin;
  onInstall: () => void;
}) => {
  const { plugin, listings, metadata } = enrichedPlugin;
  const cheapestListing = getCheapestListing(listings);
  const icon = metadata?.icon || getCategoryIcon(plugin.category);
  const gradient = getCategoryGradient(plugin.category);
  const rating = formatContractRating(plugin.rating);

  return (
    <div className="neural-card rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
        <div
          className={`w-24 h-24 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-5xl shadow-2xl`}
        >
          {icon}
        </div>
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
              FEATURED
            </span>
          </div>
          <Link
            href={`/plugins/${plugin.id}`}
            className="text-2xl font-bold text-white mb-2 block hover:underline"
          >
            {metadata?.name || plugin.name}
          </Link>
          <p className="text-gray-300 mb-4">
            {metadata?.longDescription || metadata?.description || "No description available"}
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white font-semibold">
                {plugin.ratingCount > BigInt(0) ? rating.toFixed(1) : "N/A"}
              </span>
              {plugin.ratingCount > BigInt(0) && (
                <span className="text-gray-500">
                  ({Number(plugin.ratingCount)} reviews)
                </span>
              )}
            </div>
            <div className="text-gray-400">
              {formatInstallCount(plugin.totalInstalls)} downloads
            </div>
            <div className="text-gray-400">by {metadata?.author || "Unknown"}</div>
          </div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            {cheapestListing ? (
              cheapestListing.price === BigInt(0) ? (
                <span className="text-2xl font-bold text-green-400">Free</span>
              ) : (
                <span className="text-2xl font-bold text-white">
                  {formatPluginPrice(cheapestListing.price)}
                </span>
              )
            ) : (
              <span className="text-gray-400">No pricing</span>
            )}
          </div>
          <button
            onClick={onInstall}
            className="neural-button px-8 py-3 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Single plugin fetcher component
function PluginFetcher({
  pluginId,
  onLoaded,
}: {
  pluginId: bigint;
  onLoaded: (data: EnrichedPlugin) => void;
}) {
  const { data: plugin } = usePluginDetails(pluginId);
  const { data: listings } = usePluginListings(pluginId);
  const [metadata, setMetadata] = useState<PluginMetadata | null>(null);

  useEffect(() => {
    if (plugin) {
      fetchPluginMetadata(plugin.metadataURI).then(setMetadata);
    }
  }, [plugin]);

  useEffect(() => {
    if (plugin && listings) {
      onLoaded({
        plugin: plugin as Plugin,
        listings: listings as PluginListing[],
        metadata,
      });
    }
  }, [plugin, listings, metadata, onLoaded]);

  return null;
}

export default function PluginsPage() {
  const { isConnected } = useAccount();
  const { pluginCounter, useGetTopPlugins } = usePluginMarketplace();
  const { data: topPluginIds } = useGetTopPlugins(BigInt(20));

  const [enrichedPlugins, setEnrichedPlugins] = useState<Map<string, EnrichedPlugin>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [priceFilter, setPriceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<EnrichedPlugin | null>(null);

  // Pagination constants
  const PLUGINS_PER_PAGE = 15;

  // Initialize mock plugins on mount
  useEffect(() => {
    const mockEnriched = new Map<string, EnrichedPlugin>();
    mockPlugins.forEach((mock) => {
      const enriched = convertMockToEnriched(mock);
      mockEnriched.set(mock.id, enriched);
    });
    setEnrichedPlugins(mockEnriched);
  }, []);

  // Plugin IDs to fetch
  const pluginIds = useMemo(() => {
    if (!topPluginIds) return [];
    return (topPluginIds as bigint[]).filter((id) => id > BigInt(0));
  }, [topPluginIds]);

  // Handle plugin data loaded (from on-chain)
  const handlePluginLoaded = (data: EnrichedPlugin) => {
    setEnrichedPlugins((prev) => {
      const next = new Map(prev);
      next.set(data.plugin.id.toString(), data);
      return next;
    });
  };

  // Set loading false when we have some plugins
  useEffect(() => {
    if (enrichedPlugins.size > 0 || pluginCounter === 0) {
      setIsLoading(false);
    }
  }, [enrichedPlugins.size, pluginCounter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceFilter, sortBy]);

  // Convert map to array for filtering - Mock plugins first, then on-chain
  const pluginsArray = useMemo(() => {
    const allPlugins = Array.from(enrichedPlugins.values());

    // Separate mock and on-chain plugins
    const mocks = allPlugins.filter(ep => ep.plugin.id < BigInt(0));
    const onChain = allPlugins.filter(ep => ep.plugin.id >= BigInt(0));

    // Return mock plugins first, then on-chain
    return [...mocks, ...onChain];
  }, [enrichedPlugins]);

  // Filter and sort plugins
  const filteredPlugins = useMemo(() => {
    return pluginsArray
      .filter((ep) => {
        const { plugin, listings, metadata } = ep;

        // Skip inactive plugins
        if (!plugin.active) return false;

        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const nameMatch = (metadata?.name || plugin.name).toLowerCase().includes(term);
          const descMatch = (metadata?.description || "").toLowerCase().includes(term);
          if (!nameMatch && !descMatch) return false;
        }

        // Category filter
        if (selectedCategory !== "All" && plugin.category !== selectedCategory) {
          return false;
        }

        // Price filter
        const cheapest = getCheapestListing(listings);
        if (priceFilter === "free" && (!cheapest || cheapest.price !== BigInt(0))) {
          return false;
        }
        if (priceFilter === "premium" && cheapest && cheapest.price === BigInt(0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "popular":
            return Number(b.plugin.totalInstalls - a.plugin.totalInstalls);
          case "rating":
            return Number(b.plugin.rating - a.plugin.rating);
          case "newest":
            return Number(b.plugin.createdAt - a.plugin.createdAt);
          case "price-low": {
            const aPrice = getCheapestListing(a.listings)?.price || BigInt(0);
            const bPrice = getCheapestListing(b.listings)?.price || BigInt(0);
            return Number(aPrice - bPrice);
          }
          case "price-high": {
            const aPrice = getCheapestListing(a.listings)?.price || BigInt(0);
            const bPrice = getCheapestListing(b.listings)?.price || BigInt(0);
            return Number(bPrice - aPrice);
          }
          default:
            return 0;
        }
      });
  }, [pluginsArray, searchTerm, selectedCategory, priceFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPlugins.length / PLUGINS_PER_PAGE);
  const paginatedPlugins = useMemo(() => {
    const startIndex = (currentPage - 1) * PLUGINS_PER_PAGE;
    const endIndex = startIndex + PLUGINS_PER_PAGE;
    return filteredPlugins.slice(startIndex, endIndex);
  }, [filteredPlugins, currentPage]);

  // Featured plugin (highest rated with most installs)
  const featuredPlugin = useMemo(() => {
    const sorted = [...pluginsArray]
      .filter((ep) => ep.plugin.active && ep.plugin.ratingCount > BigInt(0))
      .sort((a, b) => {
        const aScore = Number(a.plugin.rating) * Number(a.plugin.totalInstalls);
        const bScore = Number(b.plugin.rating) * Number(b.plugin.totalInstalls);
        return bScore - aScore;
      });
    return sorted[0] || null;
  }, [pluginsArray]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: pluginsArray.filter((ep) => ep.plugin.active).length };
    CATEGORIES.forEach((cat) => {
      counts[cat.value] = pluginsArray.filter(
        (ep) => ep.plugin.active && ep.plugin.category === cat.value
      ).length;
    });
    return counts;
  }, [pluginsArray]);

  const handleInstall = (enrichedPlugin: EnrichedPlugin) => {
    setSelectedPlugin(enrichedPlugin);
    setShowInstallModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <NeuralNetwork />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
      </div>

      {/* Plugin Fetchers */}
      {pluginIds.map((id) => (
        <PluginFetcher key={id.toString()} pluginId={id} onLoaded={handlePluginLoaded} />
      ))}

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
              {mockPlugins.length + pluginCounter}
            </div>
            <div className="text-gray-400 text-sm">Total Plugins</div>
          </div>
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {pluginsArray.filter((ep) => {
                const cheapest = getCheapestListing(ep.listings);
                return !cheapest || cheapest.price === BigInt(0);
              }).length}
            </div>
            <div className="text-gray-400 text-sm">Free Plugins</div>
          </div>
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {pluginsArray.filter((ep) => ep.plugin.active).length}
            </div>
            <div className="text-gray-400 text-sm">Active</div>
          </div>
          <div className="neural-card rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {pluginsArray.length > 0
                ? (
                    pluginsArray.reduce(
                      (sum, ep) => sum + Number(ep.plugin.rating),
                      0
                    ) /
                    pluginsArray.length /
                    100
                  ).toFixed(1)
                : "N/A"}
            </div>
            <div className="text-gray-400 text-sm">Avg Rating</div>
          </div>
        </div>

        {/* Featured Plugin */}
        {featuredPlugin && !isLoading && (
          <div className="mb-12">
            <FeaturedPluginCard
              enrichedPlugin={featuredPlugin}
              onInstall={() => handleInstall(featuredPlugin)}
            />
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
                {/* All category */}
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                    selectedCategory === "All"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>🌐</span>
                    <span>All</span>
                  </div>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                    {categoryCounts["All"] || 0}
                  </span>
                </button>

                {CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                      selectedCategory === category.value
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {categoryCounts[category.value] || 0}
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
                  Try adjusting your search filters or browse different categories
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
                      {(currentPage - 1) * PLUGINS_PER_PAGE + 1}
                    </span>
                    {" - "}
                    <span className="text-white font-semibold">
                      {Math.min(currentPage * PLUGINS_PER_PAGE, filteredPlugins.length)}
                    </span>
                    {" of "}
                    <span className="text-white font-semibold">
                      {filteredPlugins.length}
                    </span>{" "}
                    plugins
                  </p>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedPlugins.map((enrichedPlugin) => (
                    <PluginCard
                      key={enrichedPlugin.plugin.id.toString()}
                      enrichedPlugin={enrichedPlugin}
                      onInstall={() => handleInstall(enrichedPlugin)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === 1
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "neural-button text-white hover:scale-105"
                      }`}
                    >
                      ← Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1;

                        // Show ellipsis
                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-3 py-2 text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              currentPage === page
                                ? "neural-button text-white"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => {
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === totalPages
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "neural-button text-white hover:scale-105"
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
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
                <Link
                  href="/plugins/submit"
                  className="neural-button px-8 py-4 text-white font-bold rounded-xl hover:scale-105 transition-transform inline-block"
                >
                  🚀 Submit a Plugin
                </Link>
                <a
                  href="http://metamuses.gitbook.io/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 border border-purple-500/30 text-purple-300 font-semibold rounded-xl hover:bg-purple-500/10 transition-all inline-block"
                >
                  📖 Read Developer Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install Modal */}
      {showInstallModal && selectedPlugin && (
        <InstallPluginModal
          plugin={selectedPlugin.plugin}
          listings={selectedPlugin.listings}
          onClose={() => {
            setShowInstallModal(false);
            setSelectedPlugin(null);
          }}
          onSuccess={() => {
            // Optionally refresh data
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
