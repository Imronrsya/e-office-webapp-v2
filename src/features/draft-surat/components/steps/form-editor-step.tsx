'use client';

import { useDraftSurat } from '../../context/draft-surat-context';
import { SuratPengantarForm } from '../forms/surat-pengantar-form';
import { SuratTugasForm } from '../forms/surat-tugas-form';
import { SuratTugasTableForm } from '../forms/surat-tugas-table-form';
import { SuratKeputusanForm } from '../forms/surat-keputusan-form';

export function FormEditorStep() {
  const { state } = useDraftSurat();

  switch (state.selectedTemplate) {
    case 'surat-pengantar':
      return <SuratPengantarForm />;
    case 'surat-tugas':
      return <SuratTugasForm />;
    case 'surat-tugas-table':
      return <SuratTugasTableForm />;
    case 'surat-keputusan':
      return <SuratKeputusanForm />;
    default:
      return (
        <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
          Template tidak ditemukan. Silakan kembali dan pilih template.
        </div>
      );
  }
}
