/**
 * ====================================================================
 * LETTER SUBMISSION VALIDATION SCHEMA
 * ====================================================================
 * Single Source of Truth untuk validasi form pengajuan surat
 * Digunakan di:
 * - Frontend: React Hook Form validation
 * - Backend: API Route/Server Action validation
 * ====================================================================
 */

import * as z from "zod";

// ============================================================================
// CONSTANTS
// ============================================================================

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

// ============================================================================
// ENUMS
// ============================================================================

export const LetterTypeEnum = z.enum(["SURAT_TUGAS", "SURAT_KEPUTUSAN"], {
  message: "Tipe Surat wajib dipilih salah satu.",
});

export const UserRoleEnum = z.enum(["MAHASISWA", "DOSEN"]);

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validasi NIM/NIP berdasarkan role user
 */
const createIdentityValidator = (role: "MAHASISWA" | "DOSEN") => {
  if (role === "MAHASISWA") {
    return z
      .string()
      .min(1, "NIM wajib diisi.")
      .regex(/^\d{14}$/, "NIM wajib diisi dan harus terdiri dari 14 digit angka.");
  } else {
    return z
      .string()
      .min(1, "NIP wajib diisi.")
      .regex(/^\d{18}$/, "NIP wajib diisi dan harus terdiri dari 18 digit angka.");
  }
};

/**
 * Validasi file upload
 */
const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "Ukuran File Maksimal 5MB per file.",
  })
  .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
    message: "Format File Tidak Sesuai (Hanya PDF, JPG, PNG).",
  });

// ============================================================================
// BASE SCHEMA (Common Fields)
// ============================================================================

const baseLetterSchema = z.object({
  // 1. Tipe Surat
  jenisSurat: LetterTypeEnum,

  // 2. Judul Kegiatan / Acara
  judulSurat: z
    .string()
    .min(1, "Judul Kegiatan / Acara wajib diisi.")
    .trim(),

  // 3. Keperluan (Bebas, tanpa batasan min/max karakter)
  keperluan: z
    .string()
    .trim()
    .refine((val) => val.length > 0, {
      message: "Keperluan surat wajib diisi.",
    }),

  // 4. Nama Lengkap
  namaLengkap: z
    .string()
    .min(1, "Nama lengkap wajib diisi.")
    .trim(),

  // Departemen & Program Studi
  departemen: z.string().min(1, "Departemen wajib dipilih."),
  programStudi: z.string().min(1, "Program Studi wajib dipilih."),

  // 6. Tanggal Mulai
  tanggalAcara: z.date({
    message: "Tanggal Mulai wajib diisi.",
  }),

  // 7. Durasi
  durasiAcara: z
    .string()
    .min(1, "Durasi wajib diisi.")
    .trim(),

  // 8. Lokasi Kegiatan
  lokasiAcara: z
    .string()
    .min(1, "Lokasi Kegiatan wajib diisi.")
    .trim(),

  // 9. Lampiran (Optional)
  attachments: z
    .array(fileSchema)
    .max(MAX_FILES, "Jumlah File Maksimal 5 File.")
    .nullable()
    .optional(),
});

// ============================================================================
// ROLE-SPECIFIC SCHEMAS
// ============================================================================

/**
 * Schema untuk Mahasiswa (NIM 14 digit)
 */
export const mahasiswaLetterSchema = baseLetterSchema.extend({
  nimNip: createIdentityValidator("MAHASISWA"),
});

/**
 * Schema untuk Dosen (NIP 18 digit)
 */
export const dosenLetterSchema = baseLetterSchema.extend({
  nimNip: createIdentityValidator("DOSEN"),
});

// ============================================================================
// DYNAMIC SCHEMA FACTORY
// ============================================================================

/**
 * Factory function untuk membuat schema berdasarkan role
 * Digunakan untuk memilih schema yang tepat secara dynamic
 */
export const createLetterSchema = (role: "MAHASISWA" | "DOSEN") => {
  return role === "MAHASISWA" ? mahasiswaLetterSchema : dosenLetterSchema;
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MahasiswaLetterFormData = z.infer<typeof mahasiswaLetterSchema>;
export type DosenLetterFormData = z.infer<typeof dosenLetterSchema>;
export type LetterFormData = MahasiswaLetterFormData | DosenLetterFormData;

// ============================================================================
// VALIDATION CONSTANTS EXPORT
// ============================================================================

export const VALIDATION_CONFIG = {
  NIM_LENGTH: 14,
  NIP_LENGTH: 18,
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_FILE_TYPES,
} as const;
