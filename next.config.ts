import type { NextConfig } from "next";
import { buildCsp } from "./src/lib/security/csp";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
        },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        // まず Report-Only で入れる。強制の Content-Security-Policy ではない
        { key: "Content-Security-Policy-Report-Only", value: buildCsp(isDev) },
      ],
    },
  ],
};

export default nextConfig;
