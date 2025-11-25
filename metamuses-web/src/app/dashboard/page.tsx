"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import TraitRadarChart from "@/components/dashboard/TraitRadarChart";
import XPProgressBar from "@/components/dashboard/XPProgressBar";
import MemoryViewer from "@/components/dashboard/MemoryViewer";

// Types matching backend analytics responses
interface CompanionAnalytics {
  total_conversations: number;
  total_messages: number;
  avg_messages_per_conversation: number;
  facts_extracted: number;
  top_categories: Array<{ category: string; count: number }>;
  recent_activity: Array<{ date: string; messages: number }>;
  interaction_breakdown: {
    creative: number;
    wisdom: number;
    humor: number;
    empathy: number;
    logic: number;
  };
}

interface TraitValues {
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
  logic: number;
}

interface LevelEvolution {
  level: number;
  traits: TraitValues;
  timestamp: string;
}

interface LevelStats {
  level_range: string;
  total_messages: number;
  percentages: {
    creative: number;
    wisdom: number;
    humor: number;
    empathy: number;
    logic: number;
  };
}

interface EvolutionHistory {
  current_level: number;
  current_traits: TraitValues;
  evolution_history: LevelEvolution[];
  interaction_stats: LevelStats[];
}

interface Fact {
  id: string;
  category: string | null;
  content: string;
  confidence: number;
  created_at: string;
}

interface FactsList {
  facts: Fact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  categories: {
    preference: number;
    personal: number;
    history: number;
    goal: number;
    knowledge: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [companionId, setCompanionId] = useState<string>("");
  const [analytics, setAnalytics] = useState<CompanionAnalytics | null>(null);
  const [evolution, setEvolution] = useState<EvolutionHistory | null>(null);
  const [facts, setFacts] = useState<FactsList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "evolution" | "memories"
  >("overview");

  const fetchAnalytics = async () => {
    if (!companionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/companions/${companionId}/analytics`,
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvolution = async () => {
    if (!companionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/companions/${companionId}/evolution`,
      );
      if (!response.ok) throw new Error("Failed to fetch evolution");
      const data = await response.json();
      setEvolution(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacts = async (page = 1, category?: string) => {
    if (!companionId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (category) params.append("category", category);

      const response = await fetch(
        `${API_BASE_URL}/api/companions/${companionId}/facts?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch facts");
      const data = await response.json();
      setFacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDashboard = () => {
    fetchAnalytics();
    fetchEvolution();
    fetchFacts();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
            >
              MetaMuses
            </Link>
            <ConnectButton />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Companion Dashboard</h1>
            <p className="text-gray-400 mb-8">
              Connect your wallet to view your AI companion's dashboard
            </p>
            <ConnectButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
          >
            MetaMuses
          </Link>
          <nav className="flex gap-6 items-center">
            <Link href="/chat" className="hover:text-purple-400 transition">
              Chat
            </Link>
            <Link href="/dashboard" className="text-purple-400">
              Dashboard
            </Link>
            <ConnectButton />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Companion Dashboard
        </h1>

        {/* Companion ID Input */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <label className="block text-sm font-medium mb-2">
            Companion ID (UUID)
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={companionId}
              onChange={(e) => setCompanionId(e.target.value)}
              placeholder="Enter companion UUID..."
              className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={handleLoadDashboard}
              disabled={!companionId || loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load Dashboard"}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>

        {/* Tabs */}
        {(analytics || evolution || facts) && (
          <div className="mb-6">
            <div className="flex gap-4 border-b border-gray-800">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === "overview"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("evolution")}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === "evolution"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Evolution
              </button>
              <button
                onClick={() => setActiveTab("memories")}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === "memories"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Memories
              </button>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && analytics && evolution && (
          <div className="space-y-6">
            {/* XP Progress Bar */}
            {evolution && (
              <XPProgressBar
                currentXP={evolution.current_level * 100}
                requiredXP={(evolution.current_level + 1) * 150}
                level={evolution.current_level}
                className="bg-gray-900 rounded-lg p-6"
              />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-sm text-gray-400 mb-2">Total Messages</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {analytics.total_messages}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-sm text-gray-400 mb-2">Conversations</h3>
                <p className="text-3xl font-bold text-pink-400">
                  {analytics.total_conversations}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-sm text-gray-400 mb-2">Avg. Messages</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {analytics.avg_messages_per_conversation.toFixed(1)}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-sm text-gray-400 mb-2">Facts Learned</h3>
                <p className="text-3xl font-bold text-green-400">
                  {analytics.facts_extracted}
                </p>
              </div>
            </div>

            {/* Personality Traits Radar Chart */}
            {evolution && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Personality Traits</h2>
                <TraitRadarChart
                  traits={evolution.current_traits}
                  width={500}
                  height={500}
                />
              </div>
            )}

            {/* Interaction Breakdown */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Interaction Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(analytics.interaction_breakdown).map(
                  ([trait, value]) => (
                    <div key={trait}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize">{trait}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Top Fact Categories</h2>
              <div className="space-y-2">
                {analytics.top_categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex justify-between items-center"
                  >
                    <span className="capitalize">{cat.category}</span>
                    <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Evolution Tab */}
        {activeTab === "evolution" && evolution && (
          <div className="space-y-6">
            {/* Current Level */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Current Status</h2>
              <p className="text-3xl font-bold text-purple-400 mb-4">
                Level {evolution.current_level}
              </p>

              <h3 className="text-lg font-semibold mb-3">Current Traits</h3>
              <div className="space-y-3">
                {Object.entries(evolution.current_traits).map(
                  ([trait, value]) => (
                    <div key={trait}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize">{trait}</span>
                        <span>{value.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                          style={{ width: `${(value / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Evolution History */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Evolution History</h2>
              <div className="space-y-4">
                {evolution.evolution_history.map((entry) => (
                  <div
                    key={entry.level}
                    className="border-l-2 border-purple-500 pl-4"
                  >
                    <h3 className="font-semibold">Level {entry.level}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                    <div className="mt-2 text-sm">
                      {Object.entries(entry.traits).map(([trait, value]) => (
                        <span key={trait} className="mr-4">
                          <span className="capitalize text-gray-400">
                            {trait}:
                          </span>{" "}
                          {value.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Stats */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                Interaction Stats by Level
              </h2>
              <div className="space-y-4">
                {evolution.interaction_stats.map((stat) => (
                  <div
                    key={stat.level_range}
                    className="border-b border-gray-800 pb-4 last:border-0"
                  >
                    <h3 className="font-semibold mb-2">
                      Level {stat.level_range}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {stat.total_messages} messages
                    </p>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {Object.entries(stat.percentages).map(([trait, pct]) => (
                        <div key={trait} className="text-center">
                          <div className="capitalize text-gray-400">
                            {trait}
                          </div>
                          <div className="font-semibold">{pct.toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Memories Tab */}
        {activeTab === "memories" && facts && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Companion Memories</h2>
            <MemoryViewer
              memories={facts.facts}
              onCategoryFilter={(category) =>
                fetchFacts(1, category || undefined)
              }
            />

            {/* Pagination */}
            {facts.pagination.total_pages > 1 && (
              <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-gray-800">
                {Array.from(
                  { length: facts.pagination.total_pages },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchFacts(page)}
                    className={`px-4 py-2 rounded-lg transition ${
                      page === facts.pagination.page
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
