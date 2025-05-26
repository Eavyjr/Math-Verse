
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';
// import MiniCssExtractPlugin from 'mini-css-extract-plugin'; // Temporarily remove

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
    // config.plugins = config.plugins || []; // Temporarily remove custom plugin logic
    // if (!config.plugins.some(plugin => plugin instanceof MiniCssExtractPlugin)) {
    //   config.plugins.push(new MiniCssExtractPlugin());
    // }
    return config;
  },
};

export default nextConfig;
