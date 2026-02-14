import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "resources.cdn-kaspi.kz",
      },
    ],
  },
};

export default nextConfig;
