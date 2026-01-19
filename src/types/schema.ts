// Global type definitions

export interface User {
  id: string;
  name: string;
  email: string;
  unit: string;
  jabatan: string;
  role: "Operator" | "Drafter" | "Verifikator Akademik" | "Verifikator Sumber Daya" | "Dekan";
}

export interface Submission {
  id: string;
  namaSurat: string;
  yangMengajukan: string;
  unit: string;
  status: "Semua" | "Menunggu Verifikasi" | "Permohonan Dekan" | "Ditolak" | "Draf" | "Diajukan";
  tanggalDiajukan?: string;
  lamaWaktu?: string;
  progress?: {
    selesai: boolean;
    pengajuanDekan: boolean;
    verifikasiDrafter?: boolean;
  };
}

export interface SubmissionDetail extends Submission {
  pengajuDraf: string;
  tanggalDiajukan: string;
  jenisNomor?: string;
  nomor?: string;
  kodeManual?: boolean;
  kodeSurat?: string;
  judul: string;
  menimbang?: string[];
  mengingat?: string[];
  menetapkan?: string[];
  poinMenetapkanLebihLanjut?: boolean;
  menetapkanYangLebihDalam?: string[];
  menetapkanDanMengingat?: string[];
  salinan?: string[];
  lampiran?: {
    name: string;
    size: number;
  }[];
}
