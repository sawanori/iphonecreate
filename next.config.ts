import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    // Disable Chrome DevTools Workspace integration (causes "Unable to add filesystem" errors in WSL)
    serverSourceMaps: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-448aadce211b432186b92ac8ea5a4e98.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
