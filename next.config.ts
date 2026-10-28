import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Word lists are read from disk at request time
  outputFileTracingIncludes: {
    "/api/story": ["./data/**/*"],
  },
};

export default nextConfig;
