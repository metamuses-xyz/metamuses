"use client";

interface XPProgressBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  className?: string;
}

export default function XPProgressBar({
  currentXP,
  requiredXP,
  level,
  className = "",
}: XPProgressBarProps) {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Level {level}</h3>
          <p className="text-sm text-gray-400">
            {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-400">{progress.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">
            {(requiredXP - currentXP).toLocaleString()} XP to next level
          </p>
        </div>
      </div>

      <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-white drop-shadow-lg">
            {currentXP.toLocaleString()} XP
          </span>
        </div>
      </div>

      {progress >= 100 && (
        <div className="flex items-center justify-center gap-2 text-yellow-400 animate-bounce">
          <span className="text-2xl">🎉</span>
          <span className="font-semibold">Ready to level up!</span>
          <span className="text-2xl">🎉</span>
        </div>
      )}
    </div>
  );
}
