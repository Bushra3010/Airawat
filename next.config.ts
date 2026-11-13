import type { NextConfig } from "next";
import { oldSiteRedirects } from "./lib/old-site-redirects.mjs";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return oldSiteRedirects();
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
