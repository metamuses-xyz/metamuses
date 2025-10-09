import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MetaMuse - AI Companions NFT",
  description: "Revolutionary AI companion NFTs on the Metis blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-oid="2c7jp49">
      <body className={inter.className} data-oid="m6_vvz5">
        <Web3Provider data-oid="6nxdsg9">{children}</Web3Provider>
      </body>
    </html>
  );
}
