import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      '10.137.138.81',   // IP Wi-Fi
      '192.168.253.1',   // ✅ Tambahkan IP VMware ini (sesuai error log)
      'localhost',
    ],
  }),
};
export default nextConfig;