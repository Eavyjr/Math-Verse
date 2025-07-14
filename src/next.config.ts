
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: false, // Disables Turbopack which can sometimes cause issues
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
      },
      {
        protocol: 'https',
        hostname: 'www1.wolframalpha.com',
      }
    ],
  },
};

export default nextConfig;
