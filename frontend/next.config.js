/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "https://capable-energy-production-bf2e.up.railway.app";
    
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/resource/:path*",
        destination: `${backendUrl}/resource/:path*`,
      },
      {
        source: "/editor-runtime/tileset-editor",
        destination: `${backendUrl}/tools/tileset-editor`,
      },
      {
        source: "/editor-runtime/map-test",
        destination: `${backendUrl}/tools/map-test`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

module.exports = nextConfig;
