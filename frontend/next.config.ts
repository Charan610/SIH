import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable full client-side React hydration & HMR for devices accessing over local network / Wi-Fi
  allowedDevOrigins: [
    "192.168.137.5",
    "192.168.137.5:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
  ],
};

export default nextConfig;
