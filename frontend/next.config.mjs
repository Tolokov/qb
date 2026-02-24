import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Must be false so build fails on TS errors (CI/CD safety)
    ignoreBuildErrors: false,
  },
  turbopack: {
    // Explicit project root prevents wrong root inference in dev.
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const base = backend.replace(/\/$/, "") || "http://localhost:8000";
    return [{ source: "/api/v1/:path*", destination: `${base}/api/v1/:path*` }];
  },
}

export default nextConfig
