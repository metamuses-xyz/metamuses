import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Analytics } from "@vercel/analytics/next";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "MetaMuses - AI companion you truly own, with a verifiable personality",
  description: "Revolutionary AI companion NFTs on the Metis blockchain",
  applicationName: "MetaMuses",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MetaMuses",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "MetaMuses",
    title: "MetaMuses - AI Companion NFTs",
    description: "AI companion you truly own, with a verifiable personality on Metis blockchain",
    images: [{ url: "/metamuses_logo_2.png", width: 500, height: 484 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MetaMuses - AI Companion NFTs",
    description: "AI companion you truly own, with a verifiable personality",
    images: ["/metamuses_logo_2.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <Web3Provider>{children}</Web3Provider>
        <PWAInstallPrompt />
        <Analytics />
      </body>
    </html>
  );
}
