import { formatEther, parseEther } from "viem";
import { AccessType, PluginListing } from "@/contracts/PluginMarketplace";

// Format price from wei to display string
export function formatPluginPrice(priceWei: bigint): string {
  if (priceWei === BigInt(0)) return "Free";
  const eth = formatEther(priceWei);
  // Remove trailing zeros
  const formatted = parseFloat(eth).toString();
  return `${formatted} tMETIS`;
}

// Parse price string to wei
export function parsePluginPrice(priceString: string): bigint {
  return parseEther(priceString);
}

// Get access type label
export function getAccessTypeLabel(accessType: AccessType): string {
  switch (accessType) {
    case AccessType.PERMANENT:
      return "Buy Once";
    case AccessType.SUBSCRIPTION:
      return "Subscription";
    case AccessType.USAGE_BASED:
      return "Pay Per Use";
    default:
      return "Unknown";
  }
}

// Get access type description
export function getAccessTypeDescription(accessType: AccessType): string {
  switch (accessType) {
    case AccessType.PERMANENT:
      return "One-time purchase, own forever";
    case AccessType.SUBSCRIPTION:
      return "Time-based access, renews periodically";
    case AccessType.USAGE_BASED:
      return "Pay for what you use";
    default:
      return "";
  }
}

// Get access type icon
export function getAccessTypeIcon(accessType: AccessType): string {
  switch (accessType) {
    case AccessType.PERMANENT:
      return "🔓";
    case AccessType.SUBSCRIPTION:
      return "🔄";
    case AccessType.USAGE_BASED:
      return "📊";
    default:
      return "❓";
  }
}

// Get access type color
export function getAccessTypeColor(accessType: AccessType): string {
  switch (accessType) {
    case AccessType.PERMANENT:
      return "green";
    case AccessType.SUBSCRIPTION:
      return "blue";
    case AccessType.USAGE_BASED:
      return "purple";
    default:
      return "gray";
  }
}

// Format duration from seconds to human-readable string
export function formatDuration(seconds: bigint): string {
  const secs = Number(seconds);

  if (secs === 0) return "N/A";

  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);

  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 year" : `${years} years`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  if (days > 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return `${secs} seconds`;
}

// Format quota
export function formatQuota(quota: bigint): string {
  const num = Number(quota);
  if (num === 0) return "Unlimited";
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M uses`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K uses`;
  }
  return `${num} uses`;
}

// Format rating from contract value (stored as rating * 100)
export function formatRating(rating: bigint, ratingCount: bigint): string {
  if (ratingCount === BigInt(0)) return "No ratings";
  const ratingValue = Number(rating) / 100;
  return ratingValue.toFixed(1);
}

// Get star rating display (1-5 stars)
export function getStarRating(rating: bigint): number {
  return Number(rating) / 100;
}

// Format download/install count
export function formatInstallCount(count: bigint): string {
  const num = Number(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Check if listing has trial available
export function hasTrialAvailable(listing: PluginListing): boolean {
  return listing.trialDuration > BigInt(0);
}

// Get listing summary string
export function getListingSummary(listing: PluginListing): string {
  const price = formatPluginPrice(listing.price);
  const accessType = getAccessTypeLabel(listing.accessType);

  switch (listing.accessType) {
    case AccessType.PERMANENT:
      return `${price} (${accessType})`;
    case AccessType.SUBSCRIPTION:
      return `${price}/${formatDuration(listing.duration)}`;
    case AccessType.USAGE_BASED:
      return `${price} for ${formatQuota(listing.usageQuota)}`;
    default:
      return price;
  }
}

// Calculate remaining time for subscription
export function getRemainingTime(expiresAt: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (expiresAt <= now) return "Expired";

  const remaining = expiresAt - now;
  return formatDuration(remaining);
}

// Check if subscription is expired
export function isSubscriptionExpired(expiresAt: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return expiresAt <= now;
}

// Check if trial is expired
export function isTrialExpired(trialEndsAt: bigint): boolean {
  if (trialEndsAt === BigInt(0)) return false; // No trial
  const now = BigInt(Math.floor(Date.now() / 1000));
  return trialEndsAt <= now;
}

// Sort listings by price (cheapest first)
export function sortListingsByPrice(listings: PluginListing[]): PluginListing[] {
  return [...listings].sort((a, b) => {
    if (a.price < b.price) return -1;
    if (a.price > b.price) return 1;
    return 0;
  });
}

// Get the cheapest listing
export function getCheapestListing(
  listings: PluginListing[]
): PluginListing | undefined {
  const activeListings = listings.filter((l) => l.active);
  if (activeListings.length === 0) return undefined;
  return sortListingsByPrice(activeListings)[0];
}

// Get free listing if available
export function getFreeListing(
  listings: PluginListing[]
): PluginListing | undefined {
  return listings.find((l) => l.active && l.price === BigInt(0));
}
