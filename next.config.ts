import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ['lucide-react', 'zustand'],
  },

  // Long-lived cache headers for static assets
  headers: async () => [
    {
      source: '/:path*.woff2',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400' },
      ],
    },
  ],
};

export default nextConfig;
