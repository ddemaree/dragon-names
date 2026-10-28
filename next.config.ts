import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Word lists and the share image font are read from disk at request time
  outputFileTracingIncludes: {
    "/api/story": ["./data/**/*"],
    "/stories/[storyId]/opengraph-image": ["./src/fonts/licensed/RoslindaleV2-DisplayLight.ttf"],
  },
};

export default nextConfig;
