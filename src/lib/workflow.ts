// src/lib/workflow.ts
import { UserRole, KategoriSurat } from "@/types/schema";

// Helper: Cek Level Jabatan (Semakin kecil semakin tinggi)
const RANK_LEVEL: Record<string, number> = {
  'dekan': 1,
  'wadek1': 2, 'wadek2': 2,
  'manajer_tu': 3,
  'spv_akademik': 4, 'spv_sdm': 4,
  'staf_akademik': 5, 'staf_sdm': 5
};

/**
 * LOGIC 1: DISPOSISI SURAT MASUK (Top-Down)
 * Aturan: Hanya boleh ke bawahan sesuai jalur (Akademik/SDM/Umum)
 */
export const getDisposisiTargets = (
  currentRole: UserRole, 
  kategori: KategoriSurat
): UserRole[] => {
  switch (currentRole) {
    case 'dekan':
      if (kategori === 'Akademik') return ['wadek1', 'manajer_tu']; // Boleh lompat
      if (kategori === 'SDM') return ['wadek2', 'manajer_tu'];
      return ['wadek1', 'wadek2', 'manajer_tu']; // Umum

    case 'wadek1':
    case 'wadek2':
      return ['manajer_tu'];

    case 'manajer_tu':
      if (kategori === 'Akademik') return ['spv_akademik'];
      if (kategori === 'SDM') return ['spv_sdm'];
      return ['spv_akademik', 'spv_sdm']; // Umum

    case 'spv_akademik': return ['staf_akademik'];
    case 'spv_sdm': return ['staf_sdm'];
    
    default: return [];
  }
};

/**
 * LOGIC 2: VERIFIKASI SURAT KELUAR (Bottom-Up)
 * Aturan: Staf -> Spv -> MTU -> Wadek -> Dekan
 */
export const getNextVerificationStep = (
  currentRole: UserRole,
  kategori: KategoriSurat
): UserRole | 'upa' | 'wadek_selection' | null => {
  
  // Jalur Staf -> Supervisor
  if (currentRole === 'staf_akademik') return 'spv_akademik';
  if (currentRole === 'staf_sdm') return 'spv_sdm';

  // Jalur Supervisor -> Manajer TU
  if (currentRole === 'spv_akademik' || currentRole === 'spv_sdm') return 'manajer_tu';

  // Jalur Manajer TU
  if (currentRole === 'manajer_tu') {
    if (kategori === 'Akademik') return 'wadek1';
    if (kategori === 'SDM') return 'wadek2';
    if (kategori === 'Umum') return 'wadek_selection'; // Special case: UI harus munculin pilihan Wadek 1/2
  }

  // Jalur Wadek -> Dekan
  if (currentRole === 'wadek1' || currentRole === 'wadek2') return 'dekan';

  // Dekan -> UPA
  if (currentRole === 'dekan') return 'upa';

  return null;
};