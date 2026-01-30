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
 * Aturan berdasarkan jabatan:
 * - Dekan: bisa ke semua jabatan di bawahnya
 * - Wadek 1: hanya ke supervisor akademik dan staf akademik
 * - Wadek 2: hanya ke supervisor sumber daya dan staf sumber daya
 * - Manajer TU: ke supervisor dan staf sesuai kategori
 * - Supervisor: ke staf di bawahnya
 */
export const getDisposisiTargets = (
  currentRole: UserRole, 
  kategori: KategoriSurat
): UserRole[] => {
  switch (currentRole) {
    case 'dekan':
      // Dekan bisa ke semua jabatan di bawahnya
      if (kategori === 'Akademik') return ['wadek1', 'manajer_tu', 'spv_akademik', 'staf_akademik'];
      if (kategori === 'SDM') return ['wadek2', 'manajer_tu', 'spv_sdm', 'staf_sdm'];
      // Umum - bisa ke semua
      return ['wadek1', 'wadek2', 'manajer_tu', 'spv_akademik', 'spv_sdm', 'staf_akademik', 'staf_sdm'];

    case 'wadek1':
      // Wadek 1 hanya bisa ke supervisor akademik dan staf akademik
      return ['spv_akademik', 'staf_akademik'];

    case 'wadek2':
      // Wadek 2 hanya bisa ke supervisor sumber daya dan staf sumber daya
      return ['spv_sdm', 'staf_sdm'];

    case 'manajer_tu':
      if (kategori === 'Akademik') return ['spv_akademik', 'staf_akademik'];
      if (kategori === 'SDM') return ['spv_sdm', 'staf_sdm'];
      return ['spv_akademik', 'spv_sdm', 'staf_akademik', 'staf_sdm'];

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