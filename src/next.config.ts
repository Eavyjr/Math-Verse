
import type { NextConfig } from 'next';
// We are removing the WebpackConfiguration import as the webpack function is being removed.

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
  // The custom webpack function has been removed.
  // Next.js will use its default webpack configuration.
};

export default nextConfig;
