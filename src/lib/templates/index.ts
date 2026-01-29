// Export all templates
export { generateSuratPengantarHTML, generateSuratPengantarHTML as suratPengantarTemplate, type SuratPengantarData } from './surat-pengantar';
export { suratTugasTemplate, type SuratTugasData, type SignatureBlock } from './surat-tugas';
export { suratTugasTableTemplate, type SuratTugasTableData } from './surat-tugas-table';
export { suratKeputusanTemplate, type SuratKeputusanData } from './surat-keputusan';

// Template types
export type TemplateType = 'surat-pengantar' | 'surat-tugas' | 'surat-tugas-table' | 'surat-keputusan';

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  description: string;
  icon: string;
  availableFor: ('admin-prodi' | 'staf' | 'supervisor')[];
}

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    id: 'surat-pengantar',
    name: 'Surat Pengantar',
    description: 'Surat permohonan izin magang/penelitian ke instansi',
    icon: 'FileText',
    availableFor: ['admin-prodi'],
  },
  {
    id: 'surat-tugas',
    name: 'Surat Tugas',
    description: 'Surat tugas untuk kegiatan tertentu',
    icon: 'ClipboardList',
    availableFor: ['staf', 'supervisor'],
  },
  {
    id: 'surat-tugas-table',
    name: 'Surat Tugas (Tabel)',
    description: 'Surat tugas dengan daftar peserta dalam tabel',
    icon: 'Table',
    availableFor: ['staf', 'supervisor'],
  },
  {
    id: 'surat-keputusan',
    name: 'Surat Keputusan',
    description: 'Surat keputusan dekan untuk kegiatan/acara',
    icon: 'Award',
    availableFor: ['staf', 'supervisor'],
  },
];
