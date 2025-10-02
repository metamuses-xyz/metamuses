import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetaMuses - AI Companions on Blockchain",
  description:
    "Create unique AI companions with verifiable blockchain interactions, persistent memory, and customizable personalities.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-oid="xem1bm7">
      <body className="antialiased" data-oid="nkg:j6m">
        {children}
        <Script
          type="module"
          strategy="afterInteractive"
          src="https://cdn.jsdelivr.net/gh/onlook-dev/onlook@main/apps/web/client/public/onlook-preload-script.js"
          data-oid="px:apb-"
        />
      </body>
    </html>
  );
}
