// src/utils/urlHelper.ts

export const getAssetUrl = (url: string | null | undefined) => {
  if (!url) return '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3079';
  let targetHost = 'localhost';
  
  try {
     targetHost = new URL(apiUrl).hostname;
  } catch(e) { /* ignore */ }

  if (targetHost === 'localhost') {
    return url;
  }

  if (url.includes('localhost')) {
    return url.replace('localhost', targetHost);
  }

  return url;
};