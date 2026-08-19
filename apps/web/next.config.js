/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow LAN-origin requests during development (e.g. testing from another device).
  allowedDevOrigins: [
    "192.168.0.5",
    "localhost",
    "192.168.0.4",
    "192.168.29.49",
  ],
  images: {
    domains: ["localhost", "192.168.0.4", "192.168.29.49"],
  },
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
