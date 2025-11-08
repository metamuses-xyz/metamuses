"use client";

import { useState } from "react";

interface Memory {
  id: string;
  category: string | null;
  content: string;
  confidence: number;
  created_at: string;
}

interface MemoryViewerProps {
  memories: Memory[];
  onCategoryFilter?: (category: string | null) => void;
  className?: string;
}

const categoryColors: Record<string, string> = {
  preference: "bg-purple-600",
  personal: "bg-pink-600",
  history: "bg-blue-600",
  goal: "bg-green-600",
  knowledge: "bg-yellow-600",
  uncategorized: "bg-gray-600",
};

const categoryIcons: Record<string, string> = {
  preference: "⭐",
  personal: "👤",
  history: "📜",
  goal: "🎯",
  knowledge: "💡",
  uncategorized: "📝",
};

export default function MemoryViewer({
  memories,
  onCategoryFilter,
  className = "",
}: MemoryViewerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date");

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    if (onCategoryFilter) {
      onCategoryFilter(category === selectedCategory ? null : category);
    }
  };

  // Filter and sort memories
  const filteredMemories = memories
    .filter((memory) => {
      const matchesCategory = !selectedCategory || memory.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        memory.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.confidence - a.confidence;
      }
    });

  // Count memories by category
  const categoryCounts = memories.reduce((acc, memory) => {
    const cat = memory.category || "uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "confidence")}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white"
        >
          <option value="date">Sort by Date</option>
          <option value="confidence">Sort by Confidence</option>
        </select>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryCounts).map(([category, count]) => {
          const isSelected = selectedCategory === category;
          const colorClass = categoryColors[category] || categoryColors.uncategorized;
          const icon = categoryIcons[category] || categoryIcons.uncategorized;

          return (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                isSelected
                  ? `${colorClass} text-white`
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{icon}</span>
              <span className="capitalize">{category}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isSelected ? "bg-white/20" : "bg-gray-700"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Memory Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredMemories.length} of {memories.length} memories
      </div>

      {/* Memories List */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg">No memories found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          filteredMemories.map((memory) => {
            const category = memory.category || "uncategorized";
            const colorClass = categoryColors[category] || categoryColors.uncategorized;
            const icon = categoryIcons[category] || categoryIcons.uncategorized;

            return (
              <div
                key={memory.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition border border-gray-700 hover:border-gray-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`flex items-center gap-2 px-3 py-1 ${colorClass} rounded-full text-xs font-medium text-white`}>
                    <span>{icon}</span>
                    <span className="capitalize">{category}</span>
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(memory.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(memory.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-white leading-relaxed mb-3">{memory.content}</p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                      style={{ width: `${memory.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {(memory.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
