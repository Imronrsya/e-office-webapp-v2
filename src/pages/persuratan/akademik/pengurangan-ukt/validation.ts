import { NIM_PREFIX_MAP } from './constants';

/**
 * Extract program studi from NIM based on the first 6 characters
 */
export const getProgramStudiFromNIM = (nim: string): string => {
  const prefix = nim.substring(0, 6);
  return NIM_PREFIX_MAP[prefix] || 'jurusantidakada';
};

/**
 * Validate Indonesian phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(?:\+62|62|0)[\s\-()]*8[1-9](?:[\s\-()]*[0-9]){7,10}$/;
  return phoneRegex.test(phone);
};

/**
 * Phone number validation rule for Ant Design Form
 */
export const phoneNumberRule = {
  pattern: /^(?:\+62|62|0)[\s\-()]*8[1-9](?:[\s\-()]*[0-9]){7,10}$/,
  message: 'Format nomor HP tidak valid',
};

/**
 * Required field rule
 */
export const requiredRule = (message?: string) => ({
  required: true,
  message: message || 'Mohon diisi',
});

/**
 * Check if file is PDF
 */
export const isPDF = (file: File): boolean => {
  return file.type === 'application/pdf';
};

/**
 * Check if file size is within limit
 */
export const isFileSizeValid = (file: File, maxSizeMB: number): boolean => {
  return file.size / 1024 / 1024 <= maxSizeMB;
};

/**
 * Format supervisor data for API submission
 */
export const formatSupervisorData = (supervisorString: string | undefined) => {
  if (!supervisorString) return null;
  
  try {
    const parsed = JSON.parse(supervisorString);
    return {
      uuid: parsed.uuid,
      nama: parsed.nama,
      nip: parsed.nip,
      program_studi: parsed.program_studi,
      no_hp: parsed.no_hp,
    };
  } catch (error) {
    console.error('Error parsing supervisor data:', error);
    return null;
  }
};