import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    devIndicators: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config, { isServer }) => {
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
            '@react-native-async-storage/async-storage': 'react-native-async-storage',
        };

        return config;
    },
};

export default nextConfig;
