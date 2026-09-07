import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone mode for Docker, Vercel & Cloudflare Pages adaptivity
  output: process.env.NEXT_BUILD_STANDALONE ? "standalone" : undefined,
};

export default nextConfig;
