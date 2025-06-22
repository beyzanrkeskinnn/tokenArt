import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Ignore specific warnings for Stellar SDK
    config.ignoreWarnings = [
      {
        module: /node_modules\/sodium-native/,
      },
      {
        module: /node_modules\/require-addon/,
      }
    ];

    // Add fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
      };
    }

    return config;
  },
  
  // Suppress webpack warnings in development
  serverExternalPackages: ['@stellar/stellar-sdk'],
};

export default nextConfig;
