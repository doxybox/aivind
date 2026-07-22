import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
  "connect-src 'self' https://*.supabase.co https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google-analytics.com https://analytics.google.com https://api.stripe.com",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://js.stripe.com https://hooks.stripe.com",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  pageExtensions: ["page.jsx", "page.js", "page.tsx", "page.ts", "js"],
  env: {
    NEXT_PUBLIC_BASE44_APP_ID:
      process.env.NEXT_PUBLIC_BASE44_APP_ID || process.env.VITE_BASE44_APP_ID,
    NEXT_PUBLIC_BASE44_FUNCTIONS_VERSION:
      process.env.NEXT_PUBLIC_BASE44_FUNCTIONS_VERSION || process.env.VITE_BASE44_FUNCTIONS_VERSION,
    NEXT_PUBLIC_BASE44_APP_BASE_URL:
      process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL || process.env.VITE_BASE44_APP_BASE_URL,
  },
  async rewrites() {
    const appBaseUrl = process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL || process.env.VITE_BASE44_APP_BASE_URL;

    if (
      !appBaseUrl ||
      process.env.NODE_ENV === "production" ||
      process.env.ALLOW_BASE44_API_REWRITE !== "true"
    ) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${appBaseUrl.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
