import type { NextConfig } from "next";

const POLICY_SLUGS = ["shipping", "returns", "copyright", "terms", "privacy"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async rewrites() {
    // Top-level policy routes (spec: /shipping, /returns, …) served by the shared renderer.
    return POLICY_SLUGS.map((slug) => ({
      source: `/${slug}`,
      destination: `/info/${slug}`,
    }));
  },
};

export default nextConfig;
