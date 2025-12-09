"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLeaderboardAPI, LeaderboardEntry } from "@/hooks/useLeaderboardAPI";
import { usePointsAPI } from "@/hooks/usePointsAPI";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Medal emojis for top 3
const getMedalEmoji = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

// Format address
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount();
  const {
    getGlobalLeaderboard,
    getUserRank,
    getLeaderboardAroundUser,
    isLoading,
  } = useLeaderboardAPI();
  const { getUserPoints } = usePointsAPI();

  const [view, setView] = useState<"global" | "around">("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboard();
  }, [view, address]);

  const loadLeaderboard = async () => {
    try {
      if (view === "global") {
        const data = await getGlobalLeaderboard(100);
        setLeaderboard(data.entries);
        setTotalUsers(data.total_users);
      } else if (address) {
        const data = await getLeaderboardAroundUser(address, 20);
        setLeaderboard(data.entries);
        setTotalUsers(data.total_users);
      }

      // Load user's rank if connected
      if (address) {
        try {
          const rank = await getUserRank(address);
          setUserRank(rank);

          const points = await getUserPoints(address);
          setUserPoints(points.total_points);
        } catch (err) {
          // User might not have points yet
          console.log("User not on leaderboard yet");
        }
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">
            Compete with {totalUsers.toLocaleString()} users for the top spot
          </p>
        </div>

        {/* User Rank Card */}
        {isConnected && userRank && (
          <div className="neural-card p-6 mb-8 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-2 border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-1">Your Rank</div>
                  <div className="text-5xl font-bold text-white flex items-center">
                    {getMedalEmoji(userRank.rank) && (
                      <span className="mr-2 text-6xl">
                        {getMedalEmoji(userRank.rank)}
                      </span>
                    )}
                    #{userRank.rank.toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Top {((userRank.rank / totalUsers) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="h-16 w-px bg-gray-700" />

                <div>
                  <div className="text-gray-400 text-sm mb-1">Your Points</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {userPoints?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="h-16 w-px bg-gray-700" />

                <div>
                  <div className="text-gray-400 text-sm mb-1">Streak</div>
                  <div className="text-3xl font-bold text-orange-400 flex items-center">
                    🔥 {userRank.streak}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-gray-400 text-sm mb-2">Next Rank</div>
                {userRank.rank > 1 && leaderboard[0] && (
                  <div className="text-gray-300">
                    <span className="text-purple-400 font-semibold">
                      {(
                        leaderboard[userRank.rank - 2]?.points -
                          userRank.points || 0
                      ).toLocaleString()}
                    </span>{" "}
                    points away
                  </div>
                )}
                {userRank.rank === 1 && (
                  <div className="text-yellow-400 font-semibold">
                    👑 You're #1!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Not Connected Warning */}
        {!isConnected && (
          <div className="neural-card p-6 mb-8 bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-400 font-semibold mb-1">
                  🔒 Connect Your Wallet
                </div>
                <p className="text-gray-400 text-sm">
                  Connect your wallet to see your rank and compete on the
                  leaderboard
                </p>
              </div>
              <ConnectButton />
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView("global")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              view === "global"
                ? "neural-button text-white shadow-lg shadow-purple-500/50"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🌍 Global Top 100
          </button>
          {/*<button
            onClick={() => setView('around')}
            disabled={!isConnected}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              view === 'around' && isConnected
                ? 'neural-button text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            📍 Around You
          </button>*/}
        </div>

        {/* Leaderboard Table */}
        <div className="neural-card overflow-hidden">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-4">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No Data Yet
              </h3>
              <p className="text-gray-400">
                Be the first to earn points and appear on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700 bg-gray-800/50">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-semibold">
                      Rank
                    </th>
                    <th className="text-left p-4 text-gray-400 font-semibold">
                      User
                    </th>
                    <th className="text-right p-4 text-gray-400 font-semibold">
                      Points
                    </th>
                    <th className="text-right p-4 text-gray-400 font-semibold">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr
                      key={entry.user_address}
                      className={`border-b border-gray-800 transition-colors ${
                        entry.is_current_user
                          ? "bg-purple-900/30 hover:bg-purple-900/40"
                          : "hover:bg-gray-800/50"
                      } ${
                        idx === 0 && view === "global" ? "bg-yellow-500/10" : ""
                      } ${
                        idx === 1 && view === "global" ? "bg-gray-400/10" : ""
                      } ${
                        idx === 2 && view === "global" ? "bg-orange-700/10" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-4">
                        <div className="flex items-center">
                          {getMedalEmoji(entry.rank) && (
                            <span className="mr-2 text-2xl">
                              {getMedalEmoji(entry.rank)}
                            </span>
                          )}
                          <span
                            className={`font-bold ${
                              entry.rank <= 3 ? "text-2xl" : "text-lg"
                            } ${
                              entry.is_current_user
                                ? "text-purple-400"
                                : "text-white"
                            }`}
                          >
                            #{entry.rank}
                          </span>
                          {entry.is_current_user && (
                            <span className="ml-2 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/50">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* User Address */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              entry.rank === 1
                                ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                                : entry.rank === 2
                                  ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                  : entry.rank === 3
                                    ? "bg-gradient-to-br from-orange-600 to-orange-800"
                                    : "bg-gradient-to-br from-purple-600 to-blue-600"
                            }`}
                          >
                            {entry.user_address.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <div
                              className={`font-mono ${
                                entry.is_current_user
                                  ? "text-purple-400 font-semibold"
                                  : "text-white"
                              }`}
                            >
                              {formatAddress(entry.user_address)}
                            </div>
                            {entry.username && (
                              <div className="text-gray-400 text-sm">
                                {entry.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Points */}
                      <td className="p-4 text-right">
                        <span
                          className={`font-bold text-lg ${
                            entry.rank <= 3 ? "text-2xl" : ""
                          } ${
                            entry.rank === 1
                              ? "text-yellow-400"
                              : entry.rank === 2
                                ? "text-gray-400"
                                : entry.rank === 3
                                  ? "text-orange-400"
                                  : "text-purple-400"
                          }`}
                        >
                          {entry.points.toLocaleString()}
                        </span>
                      </td>

                      {/* Streak */}
                      <td className="p-4 text-right">
                        {entry.streak > 0 ? (
                          <span className="text-orange-400 font-semibold flex items-center justify-end">
                            🔥 {entry.streak}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {totalUsers > 0 && (
          <div className="mt-6 text-center text-gray-400 text-sm">
            Showing {leaderboard.length} of {totalUsers.toLocaleString()} active
            users
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
