import type { NextConfig } from "next";
import path from "path";

const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20092';
let backendHost = 'localhost';
try {
  backendHost = new URL(backendUrl).hostname;
} catch (e) {
  console.warn("Format URL Backend di .env salah, default ke localhost");
}

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  skipTrailingSlashRedirect: true,

  turbopack: {
    root: path.resolve(process.cwd())
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/e-office-storage/**',
      },
      {
        protocol: 'http',
        hostname: backendHost,
        port: '9000',
        pathname: '/e-office-storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.placeholder.com',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        // Proxy MinIO untuk asset gambar
        source: '/minio-proxy/:path*',
        destination: 'http://localhost:9000/:path*',
      },
    ];
  },

  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      backendHost,
      'localhost',
    ],
  }),
};

export default nextConfig;