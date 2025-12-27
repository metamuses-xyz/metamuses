import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  PLUGIN_MARKETPLACE_ADDRESS,
  PLUGIN_MARKETPLACE_ABI,
  Category,
  AccessType,
} from "@/contracts/PluginMarketplace";
import { Address } from "viem";

export function usePluginMarketplace() {
  // Read functions
  const { data: pluginCounter, refetch: refetchPluginCounter } =
    useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "pluginCounter",
    });

  const { data: platformFee } = useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "platformFee",
  });

  // Write functions
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Install plugin with payment
  const installPlugin = (
    museId: bigint,
    pluginId: bigint,
    listingId: bigint,
    price: bigint
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "installPlugin",
      args: [museId, pluginId, listingId],
      value: price,
    });
  };

  // Start free trial
  const startTrial = (museId: bigint, pluginId: bigint, listingId: bigint) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "startTrial",
      args: [museId, pluginId, listingId],
    });
  };

  // Upgrade to latest version
  const upgradePlugin = (museId: bigint, pluginId: bigint) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "upgradePlugin",
      args: [museId, pluginId],
    });
  };

  // Uninstall plugin
  const uninstallPlugin = (museId: bigint, pluginId: bigint) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "uninstallPlugin",
      args: [museId, pluginId],
    });
  };

  // Renew subscription with payment
  const renewSubscription = (
    museId: bigint,
    pluginId: bigint,
    listingId: bigint,
    price: bigint
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "renewSubscription",
      args: [museId, pluginId, listingId],
      value: price,
    });
  };

  // Purchase additional quota
  const purchaseQuota = (
    museId: bigint,
    pluginId: bigint,
    listingId: bigint,
    price: bigint
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "purchaseQuota",
      args: [museId, pluginId, listingId],
      value: price,
    });
  };

  // Register a new plugin (for developers)
  const registerPlugin = (
    name: string,
    metadataURI: string,
    wasmHash: string,
    category: Category
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "registerPlugin",
      args: [name, metadataURI, wasmHash, category],
    });
  };

  // Create a pricing listing (for developers)
  const createListing = (
    pluginId: bigint,
    accessType: AccessType,
    price: bigint,
    usageQuota: bigint,
    duration: bigint,
    trialDuration: bigint
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "createListing",
      args: [pluginId, accessType, price, usageQuota, duration, trialDuration],
    });
  };

  // Update listing (for developers)
  const updateListing = (
    pluginId: bigint,
    listingId: bigint,
    price: bigint,
    active: boolean
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "updateListing",
      args: [pluginId, listingId, price, active],
    });
  };

  // Publish new version (for developers)
  const publishVersion = (
    pluginId: bigint,
    wasmHash: string,
    changelog: string
  ) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "publishVersion",
      args: [pluginId, wasmHash, changelog],
    });
  };

  // Rate a plugin
  const ratePlugin = (pluginId: bigint, rating: number) => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "ratePlugin",
      args: [pluginId, rating],
    });
  };

  // Withdraw earnings (for developers)
  const withdrawEarnings = () => {
    writeContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "withdrawEarnings",
      args: [],
    });
  };

  // Hook: Get plugin details
  const useGetPlugin = (pluginId?: bigint) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getPlugin",
      args: pluginId !== undefined ? [pluginId] : undefined,
      query: {
        enabled: pluginId !== undefined,
      },
    });
  };

  // Hook: Get plugin listings
  const useGetPluginListings = (pluginId?: bigint) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getPluginListings",
      args: pluginId !== undefined ? [pluginId] : undefined,
      query: {
        enabled: pluginId !== undefined,
      },
    });
  };

  // Hook: Get plugin version
  const useGetPluginVersion = (pluginId?: bigint, version?: bigint) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getPluginVersion",
      args:
        pluginId !== undefined && version !== undefined
          ? [pluginId, version]
          : undefined,
      query: {
        enabled: pluginId !== undefined && version !== undefined,
      },
    });
  };

  // Hook: Get plugins by category
  const useGetPluginsByCategory = (category?: Category) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getPluginsByCategory",
      args: category !== undefined ? [category] : undefined,
      query: {
        enabled: category !== undefined,
      },
    });
  };

  // Hook: Get top plugins
  const useGetTopPlugins = (limit: bigint = BigInt(10)) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getTopPlugins",
      args: [limit],
    });
  };

  // Hook: Get installation status
  const useGetInstallation = (museId?: bigint, pluginId?: bigint) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getInstallation",
      args:
        museId !== undefined && pluginId !== undefined
          ? [museId, pluginId]
          : undefined,
      query: {
        enabled: museId !== undefined && pluginId !== undefined,
      },
    });
  };

  // Hook: Check access
  const useHasAccess = (museId?: bigint, pluginId?: bigint) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "hasAccess",
      args:
        museId !== undefined && pluginId !== undefined
          ? [museId, pluginId]
          : undefined,
      query: {
        enabled: museId !== undefined && pluginId !== undefined,
      },
    });
  };

  // Hook: Get Muse's installed plugins
  const useGetMusePlugins = (museId?: bigint) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getMusePlugins",
      args: museId !== undefined ? [museId] : undefined,
      query: {
        enabled: museId !== undefined,
      },
    });
  };

  // Hook: Get creator's plugins
  const useGetCreatorPlugins = (creator?: Address) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getCreatorPlugins",
      args: creator ? [creator] : undefined,
      query: {
        enabled: !!creator,
      },
    });
  };

  // Hook: Get creator's earnings
  const useGetCreatorEarnings = (creator?: Address) => {
    return useReadContract({
      address: PLUGIN_MARKETPLACE_ADDRESS,
      abi: PLUGIN_MARKETPLACE_ABI,
      functionName: "getCreatorEarnings",
      args: creator ? [creator] : undefined,
      query: {
        enabled: !!creator,
      },
    });
  };

  return {
    // Contract state
    pluginCounter: pluginCounter ? Number(pluginCounter) : 0,
    platformFee: platformFee ? Number(platformFee) : 250, // Default 2.5%

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    receipt,
    reset,
    refetchPluginCounter,

    // User write functions
    installPlugin,
    startTrial,
    upgradePlugin,
    uninstallPlugin,
    renewSubscription,
    purchaseQuota,
    ratePlugin,

    // Developer write functions
    registerPlugin,
    createListing,
    updateListing,
    publishVersion,
    withdrawEarnings,

    // Query hooks
    useGetPlugin,
    useGetPluginListings,
    useGetPluginVersion,
    useGetPluginsByCategory,
    useGetTopPlugins,
    useGetInstallation,
    useHasAccess,
    useGetMusePlugins,
    useGetCreatorPlugins,
    useGetCreatorEarnings,
  };
}

// Standalone hook for getting plugin details
export function usePluginDetails(pluginId?: bigint) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getPlugin",
    args: pluginId !== undefined ? [pluginId] : undefined,
    query: {
      enabled: pluginId !== undefined,
    },
  });
}

// Standalone hook for getting plugin listings
export function usePluginListings(pluginId?: bigint) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getPluginListings",
    args: pluginId !== undefined ? [pluginId] : undefined,
    query: {
      enabled: pluginId !== undefined,
    },
  });
}

// Standalone hook for checking access
export function useHasPluginAccess(museId?: bigint, pluginId?: bigint) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "hasAccess",
    args:
      museId !== undefined && pluginId !== undefined
        ? [museId, pluginId]
        : undefined,
    query: {
      enabled: museId !== undefined && pluginId !== undefined,
    },
  });
}

// Standalone hook for getting installation
export function usePluginInstallation(museId?: bigint, pluginId?: bigint) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getInstallation",
    args:
      museId !== undefined && pluginId !== undefined
        ? [museId, pluginId]
        : undefined,
    query: {
      enabled: museId !== undefined && pluginId !== undefined,
    },
  });
}

// Standalone hook for getting top plugins
export function useTopPlugins(limit: bigint = BigInt(10)) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getTopPlugins",
    args: [limit],
  });
}

// Standalone hook for getting plugins by category
export function usePluginsByCategory(category?: Category) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getPluginsByCategory",
    args: category !== undefined ? [category] : undefined,
    query: {
      enabled: category !== undefined,
    },
  });
}

// Standalone hook for Muse's installed plugins
export function useMuseInstalledPlugins(museId?: bigint) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getMusePlugins",
    args: museId !== undefined ? [museId] : undefined,
    query: {
      enabled: museId !== undefined,
    },
  });
}

// Standalone hook for creator's plugins
export function useCreatorPlugins(creator?: Address) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getCreatorPlugins",
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!creator,
    },
  });
}

// Standalone hook for creator's earnings
export function useCreatorEarnings(creator?: Address) {
  return useReadContract({
    address: PLUGIN_MARKETPLACE_ADDRESS,
    abi: PLUGIN_MARKETPLACE_ABI,
    functionName: "getCreatorEarnings",
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!creator,
    },
  });
}
