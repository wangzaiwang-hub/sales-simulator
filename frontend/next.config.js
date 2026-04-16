const isNetlifyBuild = process.env.NETLIFY === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  ...(isNetlifyBuild ? { output: "export" } : {}),
  images: {
    domains: [],
    unoptimized: isNetlifyBuild,
  },
  // 优化开发体验
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

if (!isNetlifyBuild) {
  nextConfig.rewrites = async () => {
    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

    if (!backendUrl) {
      throw new Error("BACKEND_URL is required for production builds");
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  };
}

module.exports = nextConfig;
