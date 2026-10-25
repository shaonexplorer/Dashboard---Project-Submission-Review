/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Accept both `http://localhost:5000` and `http://localhost:5000/api`
    // shapes for NEXT_PUBLIC_API_URL so the trailing `/api` is only
    // applied once (mirrors getServerApiUrl in client/src/lib/server/api.ts).
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    )
      .replace(/\/+$/, "")
      .replace(/\/api$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
