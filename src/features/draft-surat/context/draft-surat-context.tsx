'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TemplateType } from '@/lib/templates';

// Signer interface for signature placement
export interface Signer {
  id: number;
  name: string;
  role: string; // Jabatan
  nip: string;  // NIP
  prefix: string; // Teks tambahan (e.g. Mengetahui)
  x: number;
  y: number;
  page: number;
  color: string;
}

// Draft data based on template type - matches SuratPengantarData from templates
export interface SuratPengantarFormData {
  nomorSurat: string;
  tanggalSurat: string;
  perihal: string;
  namaTujuan: string;
  jabatanTujuan: string;
  alamatTujuan: string;
  keperluan: string; // Jenis kegiatan (magang, penelitian, dll)
  namaMahasiswa: string;
  nimMahasiswa: string;
  programStudi: string;
  departemen: string;
  judulAcara: string;
  tanggalMulai: string;
  lokasiAcara: string;
  durasiAcara?: string;
  isPengajuMahasiswa?: boolean; // Flag untuk menentukan apakah pengaju mahasiswa (true) atau dosen (false)
}

export interface SuratTugasFormData {
  jenisSurat: 'tugas' | 'keputusan';
  jenisSuratText: string;
  nomorSurat: string;
  namaLengkap: string;
  nimNip: string;
  programStudi: string;
  keperluan: string;
  judulSurat: string;
}

export interface SuratTugasTableFormData {
  nomorSurat: string;
  dataMahasiswa: Array<{ nama: string; nim: string; prodi: string;[key: string]: string }>;
  keterangan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  // Customizable column labels (optional - default values in form)
  namaLabel?: string; // Default: "Nama"
  nimLabel?: string;  // Default: "NIM"
  prodiLabel?: string; // Default: "PRODI"
  // Custom columns (dynamic)
  customColumns?: Array<{ key: string; label: string }>;
}

export interface SuratKeputusanFormData {
  nomorSurat: string;
  tentang: string;
  menimbang: string[];
  mengingat: string[];
  menetapkan: string;
  keputusan: { label: string; content: string }[];
  lampiran: boolean;
  dataPeserta: { nama: string; nim: string }[];
}

// Tembusan recipient type
export interface TembusanRecipient {
  userId: string;
  name: string;
  description?: string;
}

// Submitter info for auto-tembusan
export interface SubmitterInfo {
  id: string;
  name: string;
  nim?: string;
  nip?: string;
}

export type DraftFormData =
  | SuratPengantarFormData
  | SuratTugasFormData
  | SuratTugasTableFormData
  | SuratKeputusanFormData;

export interface DraftSuratState {
  // Current step (1-4)
  currentStep: number;

  // Step 1: Selected template
  selectedTemplate: TemplateType | null;

  // Step 2: Form data
  formData: DraftFormData | null;

  // Step 3: Signers configuration
  signers: Signer[];

  // Tembusan configuration
  tembusan: TembusanRecipient[];

  // Submitter info (for auto-tembusan)
  submitterInfo: SubmitterInfo | null;

  // Step 4: Generated PDF blob (for signature positioning)
  generatedPdfBlob: Blob | null;
  generatedPdfUrl: string | null;

  // Submission ID (if editing existing)
  submissionId: string | null;
}

interface DraftSuratContextType {
  state: DraftSuratState;
  setCurrentStep: (step: number) => void;
  setSelectedTemplate: (template: TemplateType) => void;
  setFormData: (data: DraftFormData) => void;
  setSigners: (signers: Signer[]) => void;
  addSigner: () => void;
  removeSigner: (id: number) => void;
  updateSigner: (id: number, updates: Partial<Signer>) => void;
  setTembusan: (recipients: TembusanRecipient[]) => void;
  setSubmitterInfo: (info: SubmitterInfo | null) => void;
  setGeneratedPdf: (blob: Blob) => void;
  setSubmissionId: (id: string) => void;
  resetDraft: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const initialState: DraftSuratState = {
  currentStep: 1,
  selectedTemplate: null,
  formData: null,
  signers: [],
  tembusan: [],
  submitterInfo: null,
  generatedPdfBlob: null,
  generatedPdfUrl: null,
  submissionId: null,
};

const COLORS = ['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan'];

const DraftSuratContext = createContext<DraftSuratContextType | undefined>(undefined);

export function DraftSuratProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DraftSuratState>(initialState);

  const setCurrentStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const setSelectedTemplate = (template: TemplateType) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  };

  const setFormData = (data: DraftFormData) => {
    setState(prev => ({ ...prev, formData: data }));
  };

  const setSigners = (signers: Signer[]) => {
    setState(prev => ({ ...prev, signers }));
  };

  const addSigner = () => {
    setState(prev => {
      const newId = prev.signers.length > 0
        ? Math.max(...prev.signers.map(s => s.id)) + 1
        : 1;

      const colorIndex = prev.signers.length % COLORS.length;

      // Position calculation based on existing signers
      const BOX_H = 95;
      const START_Y = 430;
      const ROW_GAP = 40;
      const ROW_2_Y = START_Y + BOX_H + ROW_GAP;
      const X_LEFT = 50;
      const X_RIGHT = 246;
      const X_CENTER = (X_LEFT + X_RIGHT) / 2;

      const count = prev.signers.length + 1;
      let x = X_RIGHT;
      let y = START_Y;

      if (count === 1) {
        x = X_RIGHT; y = START_Y;
      } else if (count === 2) {
        x = X_LEFT; y = START_Y;
      } else if (count === 3) {
        x = X_CENTER; y = ROW_2_Y;
      } else if (count === 4) {
        x = X_LEFT; y = ROW_2_Y;
      }

      const newSigner: Signer = {
        id: newId,
        name: '',
        role: '',
        nip: '',
        prefix: '',
        x,
        y,
        page: 1,
        color: COLORS[colorIndex],
      };

      return { ...prev, signers: [...prev.signers, newSigner] };
    });
  };

  const removeSigner = (id: number) => {
    setState(prev => ({
      ...prev,
      signers: prev.signers.filter(s => s.id !== id),
    }));
  };

  const updateSigner = (id: number, updates: Partial<Signer>) => {
    setState(prev => ({
      ...prev,
      signers: prev.signers.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const setTembusan = (recipients: TembusanRecipient[]) => {
    setState(prev => ({ ...prev, tembusan: recipients }));
  };

  const setSubmitterInfo = (info: SubmitterInfo | null) => {
    setState(prev => ({ ...prev, submitterInfo: info }));
  };

  const setGeneratedPdf = (blob: Blob) => {
    // Revoke old URL if exists
    if (state.generatedPdfUrl) {
      URL.revokeObjectURL(state.generatedPdfUrl);
    }
    const url = URL.createObjectURL(blob);
    setState(prev => ({
      ...prev,
      generatedPdfBlob: blob,
      generatedPdfUrl: url,
    }));
  };

  const setSubmissionId = (id: string) => {
    setState(prev => ({ ...prev, submissionId: id }));
  };

  const resetDraft = () => {
    if (state.generatedPdfUrl) {
      URL.revokeObjectURL(state.generatedPdfUrl);
    }
    setState(initialState);
  };

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4),
    }));
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  };

  return (
    <DraftSuratContext.Provider
      value={{
        state,
        setCurrentStep,
        setSelectedTemplate,
        setFormData,
        setSigners,
        addSigner,
        removeSigner,
        updateSigner,
        setTembusan,
        setSubmitterInfo,
        setGeneratedPdf,
        setSubmissionId,
        resetDraft,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </DraftSuratContext.Provider>
  );
}

export function useDraftSurat() {
  const context = useContext(DraftSuratContext);
  if (!context) {
    throw new Error('useDraftSurat must be used within DraftSuratProvider');
  }
  return context;
}
