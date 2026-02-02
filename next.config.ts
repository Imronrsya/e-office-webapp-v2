import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3079';
let apiHost = 'localhost';
try {
  apiHost = new URL(apiUrl).hostname;
} catch (e) {
  console.warn("Format URL API di .env salah, default ke localhost");
}

const nextConfig: NextConfig = {
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
        hostname: apiHost, 
        port: '9000',
        pathname: '/e-office-storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.placeholder.com',
      },
    ],
  },

  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      apiHost,      
      'localhost',   
    ],
  }),
};

export default nextConfig;