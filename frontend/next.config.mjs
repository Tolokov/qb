/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
