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

  // Image optimization
  images: {
    domains: ["localhost", "192.168.0.4", "192.168.29.49"],
    formats: ['image/avif', 'image/webp'],
  },

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  compress: true,

  // Experimental features
  experimental: {
    typedRoutes: true,
    optimizePackageImports: [
      '@/components',
      '@/hooks',
      '@/lib',
    ],
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
