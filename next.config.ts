import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
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
      '10.137.138.81',   // IP Wi-Fi
      '192.168.253.1',   // ✅ Tambahkan IP VMware ini (sesuai error log)
      'localhost',
    ],
  }),
};
export default nextConfig;