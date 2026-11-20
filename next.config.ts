import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules must stay on the server and not be bundled.
  serverExternalPackages: ["better-sqlite3", "sharp"],
  experimental: {
    // Couple and venue photos are uploaded through route handlers.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
