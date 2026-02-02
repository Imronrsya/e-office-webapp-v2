/**
 * QR Code Generator Utility
 * Untuk generate QR Code verifikasi dokumen
 */

import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 200,
  margin: 1,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

/**
 * Generate QR Code sebagai Data URL (base64)
 * @param data - Data yang akan di-encode ke QR Code
 * @param options - Opsi konfigurasi QR Code
 * @returns Promise<string> - QR Code sebagai data URL
 */
export async function generateQRCodeDataUrl(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      type: 'image/png',
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate QR Code');
  }
}

/**
 * Generate QR Code untuk verifikasi dokumen
 * @param documentId - ID dokumen
 * @param verificationBaseUrl - Base URL untuk verifikasi (default: window.location.origin)
 * @returns Promise<{ qrCodeDataUrl: string; verificationUrl: string }>
 */
export async function generateDocumentVerificationQR(
  documentId: string,
  verificationBaseUrl?: string
): Promise<{ qrCodeDataUrl: string; verificationUrl: string }> {
  const baseUrl = verificationBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const verificationUrl = `${baseUrl}/verify/${documentId}`;
  
  const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, {
    width: 200,
    errorCorrectionLevel: 'H',
  });
  
  return {
    qrCodeDataUrl,
    verificationUrl,
  };
}

/**
 * Generate QR Code sebagai Blob
 * @param data - Data yang akan di-encode ke QR Code
 * @param options - Opsi konfigurasi QR Code
 * @returns Promise<Blob> - QR Code sebagai Blob
 */
export async function generateQRCodeBlob(
  data: string,
  options: QRCodeOptions = {}
): Promise<Blob> {
  const dataUrl = await generateQRCodeDataUrl(data, options);
  
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Generate QR Code sebagai Canvas element
 * Berguna untuk rendering langsung di browser
 */
export async function generateQRCodeCanvas(
  data: string,
  canvas: HTMLCanvasElement,
  options: QRCodeOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    await QRCode.toCanvas(canvas, data, {
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
    });
  } catch (error) {
    console.error('Error generating QR Code to canvas:', error);
    throw new Error('Failed to generate QR Code to canvas');
  }
}
