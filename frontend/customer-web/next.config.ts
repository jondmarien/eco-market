import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for development
  experimental: {
    // Future experimental features can be added here
  },
  
  // API routes configuration for development proxy
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: 'http://localhost:8001/api/:path*',
      },
      {
        source: '/api/products/:path*',
        destination: 'http://localhost:8002/api/:path*',
      },
      {
        source: '/api/orders/:path*',
        destination: 'http://localhost:8003/api/:path*',
      },
      {
        source: '/api/payments/:path*',
        destination: 'http://localhost:8004/api/:path*',
      },
      {
        source: '/api/inventory/:path*',
        destination: 'http://localhost:8005/api/:path*',
      },
    ];
  },
};

export default nextConfig;
