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
        // CSP は強制で配信する（2026-11-28、qr_code_create-28o で Report-Only から切り替え）。方針の組み立ては src/lib/security/csp.ts
        { key: "Content-Security-Policy", value: buildCsp(isDev) },
      ],
    },
  ],
};

export default nextConfig;
