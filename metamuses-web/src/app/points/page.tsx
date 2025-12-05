"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePointsAPI, UserPoints } from "@/hooks/usePointsAPI";
import { useLeaderboardAPI } from "@/hooks/useLeaderboardAPI";
import { useTwitterVerification } from "@/hooks/useTwitterVerification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PointsPage() {
  const { address, isConnected } = useAccount();
  const { checkIn, getUserPoints, canCheckInToday, isLoading, error } =
    usePointsAPI();
  const { getUserRank } = useLeaderboardAPI();
  const {
    verifyTwitterHandle,
    getVerification,
    completeTwitterTask,
    getUserCompletions,
    isLoading: twitterLoading,
    error: twitterError,
  } = useTwitterVerification();

  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Twitter verification state
  const [twitterHandle, setTwitterHandle] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedHandle, setVerifiedHandle] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null);

  // Load user points on mount and when address changes
  useEffect(() => {
    if (address) {
      loadUserPoints();
      loadTwitterStatus();
    }
  }, [address]);

  const loadUserPoints = async () => {
    if (!address) return;

    try {
      const points = await getUserPoints(address);
      setUserPoints(points);
      setCanCheckIn(canCheckInToday(points.last_checkin_date));
    } catch (err) {
      // User might not have points yet - that's okay
      console.log("User has no points yet");
      setCanCheckIn(true);
    }
  };

  const loadTwitterStatus = async () => {
    try {
      const verification = await getVerification();
      if (verification) {
        setIsVerified(true);
        setVerifiedHandle(verification.twitter_handle);
      }

      const completions = await getUserCompletions();
      setCompletedTasks(completions);
    } catch (err) {
      console.log("No Twitter verification yet");
    }
  };

  const handleVerifyTwitter = async () => {
    if (!twitterHandle.trim()) return;

    try {
      const result = await verifyTwitterHandle(twitterHandle.trim());
      if (result && result.success) {
        setIsVerified(true);
        setVerifiedHandle(twitterHandle.trim());
        setShowVerifyModal(false);
        setTaskSuccess("Twitter handle verified successfully!");
        setTimeout(() => setTaskSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Verification failed:", err);
    }
  };

  const handleCompleteTask = async (
    taskType: "follow_twitter" | "retweet_post",
  ) => {
    if (!isVerified) {
      setShowVerifyModal(true);
      return;
    }

    try {
      const result = await completeTwitterTask(taskType);
      if (result && result.success && result.points_awarded) {
        setCompletedTasks([...completedTasks, taskType]);
        setTaskSuccess(`✓ Earned ${result.points_awarded} points!`);
        setTimeout(() => setTaskSuccess(null), 3000);
        // Reload points
        await loadUserPoints();
      }
    } catch (err) {
      console.error("Task completion failed:", err);
    }
  };

  const handleCheckIn = async () => {
    if (!address || !canCheckIn) return;

    setCheckInError(null);
    setCheckInSuccess(false);

    try {
      const result = await checkIn(address);
      setCheckInSuccess(true);

      // Reload points after check-in
      await loadUserPoints();

      // Clear success message after 3 seconds
      setTimeout(() => setCheckInSuccess(false), 3000);
    } catch (err) {
      setCheckInError(err instanceof Error ? err.message : "Check-in failed");
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥💎";
    if (streak >= 14) return "🔥✨";
    if (streak >= 7) return "🔥⚡";
    if (streak >= 3) return "🔥";
    return "🌟";
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Diamond Streak! You're unstoppable!";
    if (streak >= 14) return "Two weeks strong! Keep it up!";
    if (streak >= 7) return "One week streak! You're on fire!";
    if (streak >= 3) return "Building momentum!";
    if (streak === 0) return "Start your streak today!";
    return "Keep going!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎯 Points & Rewards
          </h1>
          <p className="text-gray-400 text-lg">
            Earn points, build streaks, and climb the leaderboard
          </p>
        </div>

        {!isConnected ? (
          <div className="neural-card p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet to start earning points and building your
              streak
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success/Error Messages */}
            {taskSuccess && (
              <div className="neural-card p-4 bg-green-500/10 border-2 border-green-500/50">
                <div className="flex items-center space-x-2 text-green-400">
                  <span className="text-xl">✓</span>
                  <span className="font-semibold">{taskSuccess}</span>
                </div>
              </div>
            )}

            {twitterError && (
              <div className="neural-card p-4 bg-red-500/10 border-2 border-red-500/50">
                <div className="flex items-center space-x-2 text-red-400">
                  <span className="text-xl">⚠</span>
                  <span className="font-semibold">{twitterError}</span>
                </div>
              </div>
            )}

            {/* Twitter Verification Modal */}
            {showVerifyModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="neural-card p-8 max-w-md w-full">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    🔐 Verify Twitter Handle
                  </h2>
                  <p className="text-gray-400 mb-6">
                    To claim Twitter task rewards, please verify your Twitter
                    handle by signing a message with your wallet.
                  </p>

                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2">
                      Twitter Handle
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">@</span>
                      <input
                        type="text"
                        value={twitterHandle}
                        onChange={(e) => setTwitterHandle(e.target.value)}
                        placeholder="metamuses_xyz"
                        className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleVerifyTwitter}
                      disabled={twitterLoading || !twitterHandle.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {twitterLoading ? "Verifying..." : "Sign & Verify"}
                    </button>
                    <button
                      onClick={() => setShowVerifyModal(false)}
                      disabled={twitterLoading}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>

                  {twitterError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {twitterError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Points Overview Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {/* Total Points */}
              <div className="neural-card p-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                <div className="text-gray-400 text-sm mb-2">Total Points</div>
                <div className="text-4xl font-bold text-white mb-2">
                  {userPoints?.total_points.toLocaleString() || 0}
                </div>
                <div className="text-purple-400 text-sm">
                  Lifetime: {userPoints?.lifetime_points.toLocaleString() || 0}
                </div>
              </div>

              {/* Current Streak */}
              <div className="neural-card p-6 bg-gradient-to-br from-orange-900/50 to-red-900/50">
                <div className="text-gray-400 text-sm mb-2">Current Streak</div>
                <div className="text-4xl font-bold text-orange-400 mb-2 flex items-center">
                  {getStreakEmoji(userPoints?.current_streak || 0)}{" "}
                  {userPoints?.current_streak || 0}
                </div>
                <div className="text-orange-300 text-xs">
                  {getStreakMessage(userPoints?.current_streak || 0)}
                </div>
              </div>

              {/* Rank */}
              <div className="neural-card p-6 bg-gradient-to-br from-yellow-900/50 to-amber-900/50">
                <div className="text-gray-400 text-sm mb-2">Your Rank</div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  #{userPoints?.rank?.toLocaleString() || "-"}
                </div>
                <Link
                  href="/leaderboard"
                  className="text-yellow-300 text-sm hover:underline"
                >
                  View Leaderboard →
                </Link>
              </div>

              {/* Longest Streak */}
              <div className="neural-card p-6 bg-gradient-to-br from-green-900/50 to-emerald-900/50">
                <div className="text-gray-400 text-sm mb-2">Best Streak</div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  🏆 {userPoints?.longest_streak || 0}
                </div>
                <div className="text-green-300 text-sm">Personal Record</div>
              </div>
            </div>

            {/* Daily Check-In Card */}
            <div className="neural-card p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Daily Check-In
                  </h2>
                  <p className="text-gray-400 mb-4">
                    Check in every day to earn points and build your streak
                  </p>

                  {/* Streak Bonus Info */}
                  {userPoints && userPoints.current_streak > 0 && (
                    <div className="inline-block bg-purple-500/20 border border-purple-500/50 rounded-lg px-4 py-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-400 font-semibold">
                          Streak Bonus:
                        </span>
                        <span className="text-white font-bold">
                          +{Math.min(userPoints.current_streak * 10, 100)} pts
                        </span>
                        <span className="text-gray-400 text-sm">
                          (
                          {(
                            1 + Math.min(userPoints.current_streak * 0.1, 1)
                          ).toFixed(1)}
                          x multiplier)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Last Check-in Info */}
                  {userPoints?.last_checkin_date && (
                    <div className="text-gray-400 text-sm mb-4">
                      Last check-in:{" "}
                      {new Date(
                        userPoints.last_checkin_date,
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Check-In Button */}
                <div className="ml-8">
                  {canCheckIn ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={isLoading}
                      className="neural-button px-12 py-6 text-white font-bold text-2xl rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
                    >
                      {isLoading ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                          Checking in...
                        </>
                      ) : (
                        <>🎁 Check In Now!</>
                      )}
                    </button>
                  ) : (
                    <div className="text-center px-12 py-6 bg-green-500/20 border-2 border-green-500/50 rounded-xl">
                      <div className="text-4xl mb-2">✅</div>
                      <div className="text-green-400 font-bold text-xl mb-1">
                        Checked In!
                      </div>
                      <div className="text-gray-400 text-sm">
                        Come back tomorrow
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {checkInSuccess && (
                <div className="mt-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 animate-scale-in">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">🎉</div>
                    <div>
                      <div className="text-green-400 font-bold">
                        Check-in successful!
                      </div>
                      <div className="text-gray-300 text-sm">
                        You earned points and extended your streak!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {checkInError && (
                <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">❌</div>
                    <div>
                      <div className="text-red-400 font-bold">
                        Check-in failed
                      </div>
                      <div className="text-gray-300 text-sm">
                        {checkInError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Available Tasks */}
            <div className="neural-card p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                🎯 Available Tasks
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Daily Check-In */}
                <div
                  className={`p-4 rounded-lg border-2 ${
                    canCheckIn
                      ? "bg-purple-500/10 border-purple-500/50"
                      : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">📅</span>
                      <span className="font-semibold text-white">
                        Daily Check-In
                      </span>
                    </div>
                    <span className="text-purple-400 font-bold">+50 pts</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Check in once per day • Build your streak for bonus points
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Once per day</span>
                    {!canCheckIn && (
                      <span className="text-green-400">✓ Completed today</span>
                    )}
                  </div>
                </div>

                {/* Follow Twitter */}
                <div
                  className={`p-4 rounded-lg border-2 ${
                    completedTasks.includes("follow_twitter")
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">𝕏</span>
                      <span className="font-semibold text-white">
                        Follow on Twitter
                      </span>
                    </div>
                    <span className="text-blue-400 font-bold">+150 pts</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Follow @metamuses_xyz on Twitter/X
                    {isVerified && ` (${verifiedHandle})`}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">One-time</span>
                      {completedTasks.includes("follow_twitter") ? (
                        <span className="text-green-400">✓ Completed</span>
                      ) : null}
                    </div>
                    {!completedTasks.includes("follow_twitter") && (
                      <div className="flex gap-2">
                        <a
                          href="https://x.com/metamuses_xyz"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded text-xs font-semibold transition-colors"
                        >
                          1. Follow on 𝕏
                        </a>
                        <button
                          onClick={() => handleCompleteTask("follow_twitter")}
                          disabled={twitterLoading || !isVerified}
                          className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={!isVerified ? "Please verify your Twitter handle first" : "Claim your points"}
                        >
                          {twitterLoading ? "Claiming..." : "2. Claim Points"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat 15 Minutes */}
                <div className="p-4 rounded-lg border-2 bg-gray-800/50 border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">💬</span>
                      <span className="font-semibold text-white">
                        Chat 15 Minutes
                      </span>
                    </div>
                    <span className="text-purple-400 font-bold">+100 pts</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Chat with your AI companion for 15+ minutes
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Repeatable</span>
                    <span className="text-yellow-400">Coming soon</span>
                  </div>
                </div>

                {/* Send Messages */}
                <div className="p-4 rounded-lg border-2 bg-gray-800/50 border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✉️</span>
                      <span className="font-semibold text-white">
                        Send 10 Messages
                      </span>
                    </div>
                    <span className="text-purple-400 font-bold">+75 pts</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Send 10 messages to your AI companion
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Repeatable</span>
                    <span className="text-yellow-400">Coming soon</span>
                  </div>
                </div>

                {/* Mint NFT */}
                {/*<div className="p-4 rounded-lg border-2 bg-gray-800/50 border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🎨</span>
                      <span className="font-semibold text-white">Mint NFT</span>
                    </div>
                    <span className="text-yellow-400 font-bold">+500 pts</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Mint your first MuseAI companion NFT
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">One-time</span>
                    <Link
                      href="/mint"
                      className="text-purple-400 hover:underline"
                    >
                      Mint now →
                    </Link>
                  </div>
                </div>*/}

                {/* Retweet Post */}
                {/*<div className={`p-4 rounded-lg border-2 ${
                  completedTasks.includes('retweet_post')
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🔄</span>
                      <span className="font-semibold text-white">Retweet Post</span>
                    </div>
                    <span className="text-green-400 font-bold">+100 pts</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Retweet our latest post on Twitter/X
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">One-time</span>
                    {completedTasks.includes('retweet_post') ? (
                      <span className="text-green-400">✓ Completed</span>
                    ) : (
                      <button
                        onClick={() => {
                          window.open('https://x.com/metamuses_xyz', '_blank');
                          setTimeout(() => handleCompleteTask('retweet_post'), 1000);
                        }}
                        disabled={twitterLoading}
                        className="text-green-400 hover:underline disabled:opacity-50"
                      >
                        {twitterLoading ? 'Processing...' : 'Retweet & Claim →'}
                      </button>
                    )}
                  </div>
                </div>*/}
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/leaderboard"
                className="neural-card p-6 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      🏆 View Leaderboard
                    </h3>
                    <p className="text-gray-400 text-sm">
                      See how you rank against other users
                    </p>
                  </div>
                  <div className="text-4xl">→</div>
                </div>
              </Link>

              <Link
                href="/chat"
                className="neural-card p-6 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      💬 Start Chatting
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Chat with your AI companion to earn more points
                    </p>
                  </div>
                  <div className="text-4xl">→</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
