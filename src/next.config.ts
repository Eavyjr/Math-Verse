
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

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
  webpack: (
    config: WebpackConfiguration,
    // { isServer, dev, buildId, config: nextInstanceConfig, defaultLoaders, webpack } // Parameters can be omitted if not used
  ) => {
    // config.plugins = config.plugins || []; // Ensure plugins array exists
    // const miniCssExtractPluginExists = config.plugins.some(
    //   (plugin) => plugin && plugin.constructor && plugin.constructor.name === 'MiniCssExtractPlugin'
    // );
    // if (!miniCssExtractPluginExists) {
    //   config.plugins.push(new MiniCssExtractPlugin());
    // }
    return config;
  },
};

export default nextConfig;
