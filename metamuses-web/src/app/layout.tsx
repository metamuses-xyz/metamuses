import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="en" data-oid="8mtd6l6">
      <body className={inter.className} data-oid="0fe3ljn">
        {children}
      </body>
    </html>
  );
}
