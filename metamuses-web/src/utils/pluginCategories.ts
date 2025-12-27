import { Category } from "@/contracts/PluginMarketplace";

export interface CategoryConfig {
  name: string;
  icon: string;
  description: string;
  gradient: string;
  color: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  [Category.KNOWLEDGE]: {
    name: "Knowledge",
    icon: "📚",
    description: "Language Tutor, Research Assistant",
    gradient: "from-blue-500 to-cyan-500",
    color: "blue",
  },
  [Category.SKILLS]: {
    name: "Skills",
    icon: "💻",
    description: "Code Assistant Pro, Math Solver",
    gradient: "from-purple-500 to-pink-500",
    color: "purple",
  },
  [Category.PERSONALITY]: {
    name: "Personality",
    icon: "🧠",
    description: "Emotional Intelligence, Social Coach",
    gradient: "from-pink-500 to-rose-500",
    color: "pink",
  },
  [Category.TOOLS]: {
    name: "Tools",
    icon: "🔧",
    description: "Health Coach, Productivity, Task Manager",
    gradient: "from-green-500 to-teal-500",
    color: "green",
  },
  [Category.ENTERTAINMENT]: {
    name: "Entertainment",
    icon: "🎮",
    description: "Games, Creative Writing, Storytelling",
    gradient: "from-orange-500 to-yellow-500",
    color: "orange",
  },
};

// Get all categories as array for UI
export const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(
  ([key, config]) => ({
    value: Number(key) as Category,
    ...config,
  })
);

// Get category config by category enum
export function getCategoryConfig(category: Category): CategoryConfig {
  return CATEGORY_CONFIG[category];
}

// Get category name
export function getCategoryName(category: Category): string {
  return CATEGORY_CONFIG[category]?.name || "Unknown";
}

// Get category icon
export function getCategoryIcon(category: Category): string {
  return CATEGORY_CONFIG[category]?.icon || "🔌";
}

// Get category gradient
export function getCategoryGradient(category: Category): string {
  return CATEGORY_CONFIG[category]?.gradient || "from-gray-500 to-gray-600";
}

// Get category from string name
export function getCategoryFromName(name: string): Category | undefined {
  const entry = Object.entries(CATEGORY_CONFIG).find(
    ([, config]) => config.name.toLowerCase() === name.toLowerCase()
  );
  return entry ? (Number(entry[0]) as Category) : undefined;
}

// Get count of plugins by category (for UI filtering)
export function getCategoryCount(
  category: Category,
  plugins: { category: Category }[]
): number {
  if (category === undefined) return plugins.length;
  return plugins.filter((p) => p.category === category).length;
}

// Get all categories as enum values
export function getAllCategories(): Category[] {
  return [
    Category.KNOWLEDGE,
    Category.SKILLS,
    Category.PERSONALITY,
    Category.TOOLS,
    Category.ENTERTAINMENT,
  ];
}
