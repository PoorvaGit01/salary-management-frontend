import type { NextConfig } from "next";

/** Default matches Rails on port 3000 — see /INTEGRATION.md at repo root */
const backendUrl =
  process.env.BACKEND_URL ?? "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
