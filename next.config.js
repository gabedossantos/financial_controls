const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    // Ensure tracing stays within this app; prevents pulling files from parent workspace
    outputFileTracingRoot: __dirname,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
