// IPFS Gateway configuration
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

// Plugin metadata schema (stored in IPFS)
export interface PluginMetadata {
  name: string;
  description: string;
  longDescription?: string;
  icon: string; // Emoji or URL
  images?: string[]; // Screenshot URLs
  features?: string[];
  author: string;
  authorAvatar?: string;
  website?: string;
  documentation?: string;
  repository?: string;
  tags?: string[];
  version?: string;
  changelog?: string;
}

// Default metadata for missing fields
const DEFAULT_METADATA: PluginMetadata = {
  name: "Unknown Plugin",
  description: "No description available",
  icon: "🔌",
  author: "Unknown",
};

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUri: string, gatewayIndex = 0): string {
  if (!ipfsUri) return "";

  // Handle ipfs:// protocol
  if (ipfsUri.startsWith("ipfs://")) {
    const cid = ipfsUri.replace("ipfs://", "");
    return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
  }

  // Handle Qm... CID directly
  if (ipfsUri.startsWith("Qm") || ipfsUri.startsWith("bafy")) {
    return `${IPFS_GATEWAYS[gatewayIndex]}${ipfsUri}`;
  }

  // Already HTTP URL
  if (ipfsUri.startsWith("http://") || ipfsUri.startsWith("https://")) {
    return ipfsUri;
  }

  // Assume it's a CID
  return `${IPFS_GATEWAYS[gatewayIndex]}${ipfsUri}`;
}

/**
 * Fetch plugin metadata from IPFS with fallback gateways
 */
export async function fetchPluginMetadata(
  metadataURI: string
): Promise<PluginMetadata> {
  if (!metadataURI) {
    return DEFAULT_METADATA;
  }

  // Try each gateway until one works
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const url = ipfsToHttp(metadataURI, i);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      // Validate and merge with defaults
      return {
        ...DEFAULT_METADATA,
        ...data,
      };
    } catch (error) {
      console.warn(`IPFS gateway ${i} failed for ${metadataURI}:`, error);
      continue;
    }
  }

  // All gateways failed, return default
  console.error(`Failed to fetch metadata from all gateways: ${metadataURI}`);
  return DEFAULT_METADATA;
}

/**
 * Fetch multiple plugin metadata in parallel
 */
export async function fetchMultipleMetadata(
  uris: string[]
): Promise<Map<string, PluginMetadata>> {
  const results = new Map<string, PluginMetadata>();

  const promises = uris.map(async (uri) => {
    const metadata = await fetchPluginMetadata(uri);
    results.set(uri, metadata);
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * Validate metadata object
 */
export function validateMetadata(metadata: unknown): metadata is PluginMetadata {
  if (typeof metadata !== "object" || metadata === null) {
    return false;
  }

  const obj = metadata as Record<string, unknown>;

  // Required fields
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    return false;
  }
  if (typeof obj.description !== "string" || obj.description.length === 0) {
    return false;
  }
  if (typeof obj.author !== "string" || obj.author.length === 0) {
    return false;
  }

  // Optional fields validation
  if (obj.icon !== undefined && typeof obj.icon !== "string") {
    return false;
  }
  if (obj.features !== undefined && !Array.isArray(obj.features)) {
    return false;
  }
  if (obj.tags !== undefined && !Array.isArray(obj.tags)) {
    return false;
  }
  if (obj.images !== undefined && !Array.isArray(obj.images)) {
    return false;
  }

  return true;
}

/**
 * Create metadata JSON for uploading to IPFS
 */
export function createMetadataJson(metadata: PluginMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Extract icon from metadata (handle emoji vs URL)
 */
export function getIconDisplay(icon: string): { type: "emoji" | "url"; value: string } {
  if (!icon) {
    return { type: "emoji", value: "🔌" };
  }

  // Check if it's a URL
  if (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("ipfs://")) {
    return { type: "url", value: icon };
  }

  // Assume it's an emoji
  return { type: "emoji", value: icon };
}

/**
 * Get image URLs with IPFS conversion
 */
export function getImageUrls(images: string[] | undefined): string[] {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map((img) => ipfsToHttp(img));
}

/**
 * Check if a CID is valid
 */
export function isValidCid(cid: string): boolean {
  // Basic CID validation (v0 and v1)
  if (cid.startsWith("Qm") && cid.length === 46) {
    return true; // CIDv0
  }
  if (cid.startsWith("bafy") && cid.length >= 59) {
    return true; // CIDv1
  }
  return false;
}

/**
 * Extract CID from various formats
 */
export function extractCid(uri: string): string | null {
  if (!uri) return null;

  // Handle ipfs:// protocol
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "").split("/")[0];
  }

  // Handle gateway URLs
  for (const gateway of IPFS_GATEWAYS) {
    if (uri.startsWith(gateway)) {
      return uri.replace(gateway, "").split("/")[0];
    }
  }

  // Handle raw CID
  if (isValidCid(uri)) {
    return uri;
  }

  return null;
}
