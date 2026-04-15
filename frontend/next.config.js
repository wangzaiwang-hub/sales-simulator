/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    domains: [],
  },
  // 优化开发体验
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "https://capable-energy-production-bf2e.up.railway.app";
    
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/editor-runtime/tileset-editor",
        destination: `${backendUrl}/tools/tileset-editor`,
      },
      {
        source: "/editor-runtime/map-editor",
        destination: `${backendUrl}/tools/map-editor`,
      },
      {
        source: "/editor-runtime/map-test",
        destination: `${backendUrl}/tools/map-test`,
      },
    ];
  },
};

module.exports = nextConfig;
