
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration, WebpackPluginInstance } from 'webpack'; // Added WebpackPluginInstance

// Try to require the plugin at the top level to see if it's available
let MiniCssExtractPlugin: (new (options?: any) => WebpackPluginInstance) | null = null;
try {
  MiniCssExtractPlugin = require('mini-css-extract-plugin');
  if (!MiniCssExtractPlugin) {
    console.warn("mini-css-extract-plugin could not be required. CSS extraction might fail.");
  }
} catch (e) {
  console.warn("Failed to require mini-css-extract-plugin:", e, "CSS extraction might fail.");
}

const nextConfig: NextConfig = {
  experimental: {
    turbo: false, // Disables Turbopack
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config: WebpackConfiguration, { isServer }) => {
    if (!isServer && MiniCssExtractPlugin) {
      const miniCssExtractPluginExists = config.plugins?.some(
        (plugin) => plugin instanceof MiniCssExtractPlugin
      );

      if (!miniCssExtractPluginExists) {
        console.log("Manually adding MiniCssExtractPlugin to webpack config.");
        config.plugins = [...(config.plugins || []), new MiniCssExtractPlugin()];
      } else {
        // console.log("MiniCssExtractPlugin already exists in webpack config.");
      }
    } else if (!isServer && !MiniCssExtractPlugin) {
        console.error("MiniCssExtractPlugin is not available, cannot add to webpack config. CSS extraction likely to fail.");
    }
    return config;
  },
};

export default nextConfig;
