"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { metis } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";

const config = getDefaultConfig({
  appName: "MetaMuses - AI Companions NFT",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [metis],
  ssr: true, // Enable server-side rendering
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config} data-oid="ji0:kpf">
      <QueryClientProvider client={queryClient} data-oid="l6txpa5">
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#8b5cf6", // purple-500 to match your design
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
          })}
          data-oid="g9yydyr"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
