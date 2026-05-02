import type { NextConfig } from "next";

/**
 * next-auth/react reads NEXTAUTH_URL in the client bundle. Mirror AUTH_URL so OAuth redirects
 * and session fetches resolve to the real deployment host (not only localhost from missing env).
 */
const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL:
      process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  },
};

export default nextConfig;
