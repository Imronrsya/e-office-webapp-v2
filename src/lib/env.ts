// src/lib/env.ts
// Konfigurasi environment variables dengan type-safe access

/**
 * Fungsi untuk mendapatkan base API URL yang dinamis
 * Prioritas: environment variable > window location (client-side) > fallback
 * Backend API: e-office-api-v2 running on port 3079
 */
export const getApiUrl = (): string => {
  // Prioritas: environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Client-side: gunakan window.location untuk mendapatkan host yang sama
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Backend e-office-api-v2 uses port 3079
    const apiPort = process.env.NEXT_PUBLIC_API_PORT || '3079';
    return `${protocol}//${hostname}:${apiPort}`;
  }
  
  // Fallback untuk server-side - backend e-office-api-v2
  return "http://localhost:3079";
};

/**
 * Environment configuration
 */
export const env = {
  apiUrl: getApiUrl(),
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;
