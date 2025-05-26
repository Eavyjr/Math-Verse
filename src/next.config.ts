
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
  webpack: (config: WebpackConfiguration, options) => {
    // You can add custom webpack configurations here if needed in the future
    return config;
  },
};

export default nextConfig;
