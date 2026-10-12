import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.171",
    "192.168.1.*",
    "192.168.*",
    "*.local",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.1.171:3000",
        "192.168.1.171",
        "localhost:3000",
      ],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
