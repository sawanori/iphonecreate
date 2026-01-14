import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    // Disable Chrome DevTools Workspace integration (causes "Unable to add filesystem" errors in WSL)
    serverSourceMaps: false,
  },
};

export default nextConfig;
