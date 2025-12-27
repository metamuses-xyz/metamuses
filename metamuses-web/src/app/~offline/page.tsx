'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="neural-card rounded-2xl p-8 max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">
          You are offline
        </h1>
        <p className="text-gray-400 mb-6">
          MetaMuses requires an internet connection to chat with your AI companion and interact with the blockchain.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="neural-button px-6 py-3 rounded-xl text-white font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
