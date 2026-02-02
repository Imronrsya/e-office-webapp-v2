// src/types/schema.ts

// 1. Role User Lengkap (Sesuai Skenario)
export type UserRole = 
  // Lingkup Departemen
  | 'mahasiswa' | 'dosen' 
  | 'kaprodi' | 'admin_prodi' | 'kadep' // <-- Ketua Departemen (Baru)

  // Lingkup Fakultas (Admin & Pimpinan)
  | 'admin_fakultas'  // Menerima Surat Masuk
  | 'manajer_tu' 
  | 'dekan' | 'wadek1' | 'wadek2' 
  
  // Lingkup Fakultas (Pelaksana)
  | 'spv_akademik' | 'spv_sdm' 
  | 'staf_akademik' | 'staf_sdm'
  
  // Output Akhir
  | 'upa'; // Penomoran & Stempel

// 2. Jenis & Status Surat
export type JenisSurat = 'Surat Tugas' | 'SK Dekan' | 'Surat Pengantar';
export type KategoriSurat = 'Akademik' | 'SDM' | 'Umum';

export type SubmissionStatus = 
  | 'draft'               // Masih di user
  | 'diajukan'            // Menunggu Kaprodi
  | 'verifikasi_kaprodi'  // Di meja Kaprodi
  | 'proses_admin_prodi'  // Admin Prodi sedang drafting Pengantar
  | 'verifikasi_kadep'    // Di meja Kadep (Setelah Kaprodi TTD ulang)
  | 'disposisi_fakultas'  // Surat Masuk berputar di Fakultas
  | 'drafting_surat_keluar' // Staf Fakultas bikin SK/Surat Tugas
  | 'verifikasi_berjenjang' // Spv -> MTU -> Wadek -> Dekan
  | 'proses_upa'          // Penomoran
  | 'selesai' 
  | 'ditolak'
  | 'revisi';

// 3. Struktur Isi Surat (Dynamic Content)
export interface SuratTugasContent {
  tipe: 'tugas';
  menimbang?: string[]; 
  dasar?: string[];     
  untuk: string;        // "Untuk melaksanakan..."
  petugas: Array<{ 
    id: string; 
    nama: string; 
    nip: string; 
    jabatan: string; 
    pangkat?: string; 
  }>;
}

export interface SKDekanContent {
  tipe: 'sk';
  tentang: string;      // Judul SK Kapital
  menimbang: string[];  // Poin a, b, c...
  mengingat: string[];  // UU No...
  memutuskan: {
    menetapkan: string; // "KEPUTUSAN DEKAN TENTANG..."
    kesatu: string;     // "Mengangkat..."
    kedua: string;      // "Tugas..."
    ketiga: string;
    keempat?: string;
  };
}

export interface SuratPengantarContent {
  tipe: 'pengantar';
  nomor: string;
  lampiran: string;
  hal: string;
  kepada: string;
  isi: string; // HTML string dari editor
}

// 4. Konfigurasi Tanda Tangan (Dynamic Grid)
export interface SignatureConfig {
  id: string;           // ID User
  nama: string;
  nip: string;
  jabatan: string;      // Jabatan yang tampil di surat
  urutan: number;       // 1 (Kanan Bawah), 2 (Kiri Bawah), 3 (Tengah Mengetahui)
  posisi: 'kiri' | 'kanan' | 'tengah';
  status: 'pending' | 'signed' | 'rejected';
  label?: string;       // "Menyetujui", "Mengesahkan", "Mengetahui"
  image?: string;       // URL TTD Digital
}

// 5. Object Utama
export interface Submission {
  id: string;
  
  // Header Info
  nomorSurat?: string;  // Diisi UPA
  tanggalSurat?: string; // Diisi UPA
  jenis: JenisSurat;
  kategori: KategoriSurat;
  
  // Aktor
  pengaju: {
    id: string;
    nama: string;
    role: UserRole;
    unit?: string;
  };
  
  // State
  status: SubmissionStatus;
  posisiSekarang: UserRole | 'Selesai'; 
  
  // Data
  content: SuratTugasContent | SKDekanContent | SuratPengantarContent; 
  signatures: SignatureConfig[];
  tembusan: string[]; // List string manual atau ID
  lampiran: Array<{ name: string; url: string; size: number }>;
  
  // Tracking
  history: Array<{
    date: string;
    action: string;
    actorName: string;
    actorRole: UserRole;
    note?: string;
  }>;

  createdAt: string;
  updatedAt: string;
}