import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["@node-rs/argon2"],
  experimental: {
    // Uploads (credentials, reports, food guides) are capped at 10 MB per file in src/lib/storage.ts.
    serverActions: { bodySizeLimit: "12mb" },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
