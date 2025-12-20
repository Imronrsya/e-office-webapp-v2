// Application Status Constants
export const REVISION_STATUSES = ['REVISI'];

export const PENDING_STATUSES = [
  'MENUNGGU_LAMPIRAN_TANDA_TANGAN',
  'MENUNGGU_VERIFIKASI_DOSEN_PEMBIMBING',
  'MENUNGGU_VERIFIKASI_DOSEN_KOORDINATOR',
  'MENUNGGU_VERIFIKASI_KAPRODI',
  'MENUNGGU_VERIFIKASI_MANAJER_TU',
  'MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK',
  'MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1',
  'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK',
  'SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK',
  'SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU',
  'SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1',
  'PENOMORAN',
];

// Program Studi Options
export const PROGRAM_STUDI_OPTIONS = [
  { label: 'Informatika', value: 'Informatika' },
  { label: 'Matematika', value: 'Matematika' },
  { label: 'Fisika', value: 'Fisika' },
  { label: 'Kimia', value: 'Kimia' },
  { label: 'Biologi', value: 'Biologi' },
  { label: 'Statistika', value: 'Statistika' },
  { label: 'Bioteknologi', value: 'Bioteknologi' },
  { label: 'Magister Matematika', value: 'Magister Matematika' },
  { label: 'Magister Biologi', value: 'Magister Biologi' },
  { label: 'Magister Kimia', value: 'Magister Kimia' },
  { label: 'Magister Fisika', value: 'Magister Fisika' },
  { label: 'Doktor Sains dan Matematika', value: 'Doktor Sains dan Matematika' },
  { label: 'Profesi Fisikawan Medik', value: 'Profesi Fisikawan Medik' },
];

// NIM to Program Studi Mapping
export const NIM_PREFIX_MAP: Record<string, string> = {
  '240101': 'Matematika',
  '240401': 'Fisika',
  '240501': 'Statistika',
  '240301': 'Kimia',
  '240201': 'Biologi',
  '240202': 'Bioteknologi',
  '240601': 'Informatika',
};

// Field Labels
export const FIELD_LABELS = {
  nama: 'Nama',
  nim: 'NIM',
  program_studi: 'Program Studi',
  no_hp: 'No HP',
  pengantar_untuk: 'Pengantar Untuk',
  deskripsi: 'Deskripsi Utama',
  deskripsi_tambahan: 'Deskripsi Tambahan',
  judul: 'Judul Skripsi/Tugas Akhir',
  nama_dosen_pembimbing_1: 'Dosen Pembimbing 1',
  nip_dosen_pembimbing_1: 'NIP Dosen Pembimbing 1',
  nama_dosen_pembimbing_2: 'Dosen Pembimbing 2',
  nip_dosen_pembimbing_2: 'NIP Dosen Pembimbing 2',
};

// File Upload Constants
export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_FILE_TYPE = 'application/pdf';

// API Endpoints
export const API_ENDPOINTS = {
  MAHASISWA: '/v1/mahasiswa',
  ROLE_MAHASISWA: '/v1/role/mahasiswa',
  PENGAJUAN: '/v1/pengajuan',
  PENGAJUAN_BY_PEMOHON: (nim: string) => `/v1/pengajuan/pemohon/${nim}`,
  CHANGE_STATE_SURAT: (id: string) => `/v1/pengajuan/${id}/changeStateSurat`,
  PEGAWAI_BY_ROLE: (roleId: number) => `/v1/pegawai/${roleId}`,
  PEGAWAI_BY_PRODI: (roleId: number, prefix: string) => `/v1/pegawai/prodi/${roleId}/${prefix}`,
  UPLOAD_LAMPIRAN: '/v1/pengajuan/lampiran/upload',
};