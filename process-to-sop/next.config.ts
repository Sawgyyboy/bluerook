import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // This app lives inside the Bluerook static-site repo; pin the root so
    // Next.js doesn't infer a parent directory from stray lockfiles.
    root: path.join(__dirname),
  },
};

export default nextConfig;
