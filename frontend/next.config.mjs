/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Only forward to external host if USE_EXTERNAL_BACKEND is explicitly true.
    // Otherwise, Vercel hosts all UI and API endpoints natively!
    if (process.env.USE_EXTERNAL_BACKEND === "true" && process.env.BACKEND_URL) {
      const backendUrl = process.env.BACKEND_URL.replace(/\/+$/, "");
      return [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/health",
          destination: `${backendUrl}/health`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
