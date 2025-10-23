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
    <html lang="en" data-oid="uqh8gg0">
      <body className={inter.className} data-oid="91bzhzv">
        <Web3Provider data-oid="6e..ajl">{children}</Web3Provider>
      </body>
    </html>
  );
}
