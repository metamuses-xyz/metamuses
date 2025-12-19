"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";

// Metis Hyperion Testnet configuration
export const metisHyperionTestnet = defineChain({
  id: 133717,
  name: "Metis Hyperion Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "tMETIS",
    symbol: "tMETIS",
  },
  rpcUrls: {
    default: { http: ["https://hyperion-testnet.metis.io"] },
  },
  blockExplorers: {
    default: {
      name: "Hyperion Explorer",
      url: "https://explorer.hyperion-testnet.metis.io",
    },
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: "MetaMuses - AI Companions NFT",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [metisHyperionTestnet],
  ssr: true, // Enable server-side rendering
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#8b5cf6", // purple-500 to match your design
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
