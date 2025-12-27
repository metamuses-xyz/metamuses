import { Address } from "viem";

// PluginMarketplace Contract - Deployed on Metis Hyperion Testnet
// Contract: <TO_BE_DEPLOYED>
// Explorer: https://hyperion-testnet-explorer.metisdevops.link/address/<ADDRESS>
// NOTE: Update address after deployment

export const PLUGIN_MARKETPLACE_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_PLUGIN_MARKETPLACE_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000"; // Placeholder - update after deployment

// Enums
export enum AccessType {
  PERMANENT = 0, // Buy once, own forever
  SUBSCRIPTION = 1, // Time-based access (monthly/yearly)
  USAGE_BASED = 2, // Pay per inference/use
}

export enum Category {
  KNOWLEDGE = 0, // Language Tutor, Research Assistant
  SKILLS = 1, // Code Assistant Pro, Math Solver
  PERSONALITY = 2, // Emotional Intelligence, Social Coach
  TOOLS = 3, // Health Coach, Productivity, Task Manager
  ENTERTAINMENT = 4, // Games, Creative Writing, Storytelling
}

// TypeScript interfaces matching Solidity structs
export interface Plugin {
  id: bigint;
  name: string;
  metadataURI: string;
  wasmHash: string;
  creator: Address;
  category: Category;
  currentVersion: bigint;
  createdAt: bigint;
  active: boolean;
  totalInstalls: bigint;
  totalRevenue: bigint;
  rating: bigint; // Stored as rating * 100 for precision
  ratingCount: bigint;
}

export interface PluginVersion {
  version: bigint;
  wasmHash: string;
  changelog: string;
  releaseDate: bigint;
  deprecated: boolean;
}

export interface PluginListing {
  pluginId: bigint;
  accessType: AccessType;
  price: bigint;
  usageQuota: bigint;
  duration: bigint;
  trialDuration: bigint;
  active: boolean;
}

export interface Installation {
  museId: bigint;
  pluginId: bigint;
  listingId: bigint;
  accessType: AccessType;
  version: bigint;
  remainingQuota: bigint;
  expiresAt: bigint;
  trialEndsAt: bigint;
  installedAt: bigint;
  active: boolean;
}

// Helper function to convert rating from contract format
export function formatRating(rating: bigint): number {
  return Number(rating) / 100;
}

// Contract ABI
export const PLUGIN_MARKETPLACE_ABI = [
  // Constructor
  {
    type: "constructor",
    inputs: [
      { name: "_museNFT", type: "address", internalType: "address" },
      { name: "_platformWallet", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  // Constants
  {
    type: "function",
    name: "BASIS_POINTS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_PLATFORM_FEE",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_RATING",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  // State Variables
  {
    type: "function",
    name: "pluginCounter",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformWallet",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "museNFT",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usageTracker",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "companionFactory",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  // Plugin Management
  {
    type: "function",
    name: "registerPlugin",
    inputs: [
      { name: "_name", type: "string", internalType: "string" },
      { name: "_metadataURI", type: "string", internalType: "string" },
      { name: "_wasmHash", type: "string", internalType: "string" },
      { name: "_category", type: "uint8", internalType: "enum IPluginMarketplace.Category" },
    ],
    outputs: [{ name: "pluginId", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createListing",
    inputs: [
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_accessType", type: "uint8", internalType: "enum IPluginMarketplace.AccessType" },
      { name: "_price", type: "uint256", internalType: "uint256" },
      { name: "_usageQuota", type: "uint256", internalType: "uint256" },
      { name: "_duration", type: "uint256", internalType: "uint256" },
      { name: "_trialDuration", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "listingId", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateListing",
    inputs: [
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_listingId", type: "uint256", internalType: "uint256" },
      { name: "_price", type: "uint256", internalType: "uint256" },
      { name: "_active", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "publishVersion",
    inputs: [
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_wasmHash", type: "string", internalType: "string" },
      { name: "_changelog", type: "string", internalType: "string" },
    ],
    outputs: [{ name: "version", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deprecateVersion",
    inputs: [
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_version", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivatePlugin",
    inputs: [{ name: "_pluginId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Installation
  {
    type: "function",
    name: "installPlugin",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_listingId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "startTrial",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_listingId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "upgradePlugin",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "uninstallPlugin",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renewSubscription",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_listingId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "purchaseQuota",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_listingId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  // Usage Tracking
  {
    type: "function",
    name: "recordUsage",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasAccess",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInstallation",
    inputs: [
      { name: "_museId", type: "uint256", internalType: "uint256" },
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IPluginMarketplace.Installation",
        components: [
          { name: "museId", type: "uint256", internalType: "uint256" },
          { name: "pluginId", type: "uint256", internalType: "uint256" },
          { name: "listingId", type: "uint256", internalType: "uint256" },
          { name: "accessType", type: "uint8", internalType: "enum IPluginMarketplace.AccessType" },
          { name: "version", type: "uint256", internalType: "uint256" },
          { name: "remainingQuota", type: "uint256", internalType: "uint256" },
          { name: "expiresAt", type: "uint256", internalType: "uint256" },
          { name: "trialEndsAt", type: "uint256", internalType: "uint256" },
          { name: "installedAt", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // Rating & Discovery
  {
    type: "function",
    name: "ratePlugin",
    inputs: [
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_rating", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPluginsByCategory",
    inputs: [{ name: "_category", type: "uint8", internalType: "enum IPluginMarketplace.Category" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTopPlugins",
    inputs: [{ name: "_limit", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreatorPlugins",
    inputs: [{ name: "_creator", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  // Getters
  {
    type: "function",
    name: "getPlugin",
    inputs: [{ name: "_pluginId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IPluginMarketplace.Plugin",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "name", type: "string", internalType: "string" },
          { name: "metadataURI", type: "string", internalType: "string" },
          { name: "wasmHash", type: "string", internalType: "string" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "category", type: "uint8", internalType: "enum IPluginMarketplace.Category" },
          { name: "currentVersion", type: "uint256", internalType: "uint256" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
          { name: "totalInstalls", type: "uint256", internalType: "uint256" },
          { name: "totalRevenue", type: "uint256", internalType: "uint256" },
          { name: "rating", type: "uint256", internalType: "uint256" },
          { name: "ratingCount", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPluginVersion",
    inputs: [
      { name: "_pluginId", type: "uint256", internalType: "uint256" },
      { name: "_version", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IPluginMarketplace.PluginVersion",
        components: [
          { name: "version", type: "uint256", internalType: "uint256" },
          { name: "wasmHash", type: "string", internalType: "string" },
          { name: "changelog", type: "string", internalType: "string" },
          { name: "releaseDate", type: "uint256", internalType: "uint256" },
          { name: "deprecated", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPluginListings",
    inputs: [{ name: "_pluginId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IPluginMarketplace.PluginListing[]",
        components: [
          { name: "pluginId", type: "uint256", internalType: "uint256" },
          { name: "accessType", type: "uint8", internalType: "enum IPluginMarketplace.AccessType" },
          { name: "price", type: "uint256", internalType: "uint256" },
          { name: "usageQuota", type: "uint256", internalType: "uint256" },
          { name: "duration", type: "uint256", internalType: "uint256" },
          { name: "trialDuration", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMusePlugins",
    inputs: [{ name: "_museId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  // Earnings
  {
    type: "function",
    name: "withdrawEarnings",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCreatorEarnings",
    inputs: [{ name: "_creator", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  // Admin Functions
  {
    type: "function",
    name: "setPlatformFee",
    inputs: [{ name: "_newFee", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPlatformWallet",
    inputs: [{ name: "_newWallet", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMuseNFT",
    inputs: [{ name: "_museNFT", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setUsageTracker",
    inputs: [{ name: "_tracker", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setCompanionFactory",
    inputs: [{ name: "_factory", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawPlatformFees",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "PluginRegistered",
    inputs: [
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      { name: "category", type: "uint8", indexed: false, internalType: "enum IPluginMarketplace.Category" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ListingCreated",
    inputs: [
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "listingId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "accessType", type: "uint8", indexed: false, internalType: "enum IPluginMarketplace.AccessType" },
      { name: "price", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ListingUpdated",
    inputs: [
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "listingId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "price", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "active", type: "bool", indexed: false, internalType: "bool" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VersionPublished",
    inputs: [
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "version", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "wasmHash", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PluginInstalled",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "listingId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "accessType", type: "uint8", indexed: false, internalType: "enum IPluginMarketplace.AccessType" },
      { name: "price", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TrialStarted",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "trialEndsAt", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PluginUpgraded",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "fromVersion", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "toVersion", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PluginUninstalled",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SubscriptionRenewed",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "newExpiresAt", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "QuotaPurchased",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "quotaAdded", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newTotal", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "UsageRecorded",
    inputs: [
      { name: "museId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "remainingQuota", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PluginRated",
    inputs: [
      { name: "pluginId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "rater", type: "address", indexed: true, internalType: "address" },
      { name: "rating", type: "uint8", indexed: false, internalType: "uint8" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "EarningsWithdrawn",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformFeeUpdated",
    inputs: [{ name: "newFee", type: "uint256", indexed: false, internalType: "uint256" }],
    anonymous: false,
  },
] as const;
