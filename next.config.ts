import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Turbopack for dev (default in Next 16) — no special config needed

  // Compress responses
  compress: true,

  // Optimize package imports — tree-shake heavy barrel exports
  experimental: {
    optimizePackageImports: ['lucide-react', 'zustand'],
  },

  // Strict powered headers
  poweredByHeader: false,
};

export default nextConfig;
