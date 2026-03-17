/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow LAN-origin requests during development (e.g. testing from another device).
  allowedDevOrigins: ["192.168.0.5", "localhost", "192.168.31.220"],
  images: {
    domains: ["localhost", "192.168.31.220"],
  },
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
