/**
 * ====================================================================
 * SURAT TUGAS (STAFF) FORM VALIDATION SCHEMA
 * ====================================================================
 * Validasi form pembuatan Surat Tugas oleh Staf Akademik / Staf Sumber Daya.
 * NIM/NIP: harus tepat 14 digit (NIM) atau 18 digit (NIP).
 * ====================================================================
 */

import * as z from "zod";

// ============================================================================
// NIM/NIP VALIDATOR
// ============================================================================

/**
 * NIM = 14 digit angka, NIP = 18 digit angka.
 * Tidak boleh di antara keduanya (15, 16, 17 digit tidak valid).
 */
const nimNipValidator = z
  .string()
  .min(1, "NIM/NIP wajib diisi.")
  .regex(/^\d+$/, "NIM/NIP harus berupa angka.")
  .refine(
    (val) => val.length === 14 || val.length === 18,
    "NIM/NIP harus 14 digit (NIM) atau 18 digit (NIP)."
  );

// ============================================================================
// SURAT TUGAS STAFF SCHEMA
// ============================================================================

export const suratTugasStaffSchema = z.object({
  // Jenis Surat (default 'tugas', always has value)
  jenisSurat: z.enum(["tugas", "keputusan"]),

  // Jenis Surat Text (auto-generated)
  jenisSuratText: z.string(),

  // Nomor Surat (opsional, bisa diisi nanti)
  nomorSurat: z.string().optional(),

  // Judul Surat *
  judulSurat: z
    .string()
    .min(1, "Judul Surat wajib diisi.")
    .trim(),

  // Nama Lengkap *
  namaLengkap: z
    .string()
    .min(1, "Nama Lengkap wajib diisi.")
    .trim(),

  // NIM/NIP * (14 digit NIM atau 18 digit NIP)
  nimNip: nimNipValidator,

  // Program Studi (opsional, auto-filled)
  programStudi: z.string().optional(),

  // Keperluan *
  keperluan: z
    .string()
    .trim()
    .refine((val) => val.length > 0, {
      message: "Keperluan wajib diisi.",
    }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SuratTugasStaffFormData = z.infer<typeof suratTugasStaffSchema>;
