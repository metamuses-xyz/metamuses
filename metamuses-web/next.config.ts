import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Simple Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      // Handle async-storage polyfill for MetaMask SDK
      "@react-native-async-storage/async-storage": "react-native-async-storage",
    },
  },
  // Webpack configuration (fallback for production)
  webpack: (config, { isServer, dev }) => {
    // Add polyfills for browser APIs in server-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Handle async-storage polyfill for MetaMask SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": "react-native-async-storage",
    };

    // Exclude problematic modules from client bundle in production
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pino': 'commonjs pino',
        'thread-stream': 'commonjs thread-stream',
      });
    }

    // Support for Live2D model3.json files
    config.module.rules.push({
      test: /\.model3\.json$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
