import { useState } from 'react';
import { message } from 'antd';
import qs from 'qs';
import { AxiosService } from '@/utils/axios';
import { spptaLampiranLabels } from '@/constants/labels';

interface SupervisorData {
  uuid: string;
  nama: string;
  nip: string;
  program_studi: string;
  no_hp: string;
}

interface KaprodiData {
  name: string;
  Pegawai: {
    nip: string;
    id_prodi: string | null;
    no_hp: string;
  };
}

export interface SubmissionData {
  values: Record<string, any>;
  fileUploads: {
    lampiranTugasAkhir: string[];
    suratPermohonan: string[];
    suratKeteranganLulus: string[];
    buktiBayarUkt: string[];
    fotoBukuRekening: string[];
  };
  kaprodi: KaprodiData;
  isRevision?: boolean;
  existingId?: string;
}

export const useApplicationSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | undefined>();

  const parseSupevisorData = (dataString: string | undefined): SupervisorData | null => {
    if (!dataString) return null;
    try {
      return JSON.parse(dataString);
    } catch {
      return null;
    }
  };

  const buildLampiranList = (fileUploads: SubmissionData['fileUploads']) => {
    const lampirans: Array<{ label: string; file: string }> = [];
    
    if (fileUploads.lampiranTugasAkhir.length) {
      lampirans.push({
        label: spptaLampiranLabels[0],
        file: fileUploads.lampiranTugasAkhir[0]
      });
    }
    if (fileUploads.suratPermohonan.length) {
      lampirans.push({
        label: spptaLampiranLabels[1],
        file: fileUploads.suratPermohonan[0]
      });
    }
    if (fileUploads.suratKeteranganLulus.length) {
      lampirans.push({
        label: spptaLampiranLabels[2],
        file: fileUploads.suratKeteranganLulus[0]
      });
    }
    if (fileUploads.buktiBayarUkt.length) {
      lampirans.push({
        label: spptaLampiranLabels[3],
        file: fileUploads.buktiBayarUkt[0]
      });
    }
    if (fileUploads.fotoBukuRekening.length) {
      lampirans.push({
        label: spptaLampiranLabels[4],
        file: fileUploads.fotoBukuRekening[0]
      });
    }
    
    return lampirans;
  };

  const buildStateSurat = (
    values: Record<string, any>,
    supervisor1: SupervisorData | null,
    supervisor2: SupervisorData | null,
    kaprodi: KaprodiData
  ) => {
    return {
      nama: values.nama,
      nim: values.nim,
      program_studi: values.program_studi,
      noHP: values.no_hp,
      judul: values.judul,
      tanggal: '',
      checkProgress: {
        bab1: '',
        bab2: '',
        bab3: '',
        bab4: '',
        bab5: '',
      },
      log: [],
      dosen: {
        pembimbing1: {
          nama: supervisor1?.nama || '',
          nip: supervisor1?.nip || '',
          program_studi: supervisor1?.program_studi || '',
          noHP: supervisor1?.no_hp || '',
          ttd: '',
        },
        pembimbing2: {
          nama: supervisor2?.nama || '',
          nip: supervisor2?.nip || '',
          program_studi: supervisor2?.program_studi || '',
          noHP: supervisor2?.no_hp || '',
          ttd: '',
        },
        kaprodi: {
          nama: kaprodi?.name || '',
          nip: kaprodi?.Pegawai?.nip || '',
          program_studi: kaprodi?.Pegawai?.id_prodi ? String(kaprodi.Pegawai.id_prodi) : '',
          noHP: kaprodi?.Pegawai?.no_hp || '',
          ttd: '',
        },
      },
    };
  };

  const submitApplication = async (data: SubmissionData): Promise<string | null> => {
    setLoading(true);
    
    try {
      const { values, fileUploads, kaprodi } = data;
      
      // Parse supervisor data
      const supervisor1 = parseSupevisorData(values.pembimbing1_uuid);
      const supervisor2 = parseSupevisorData(values.pembimbing2_uuid);

      // Validate supervisors
      if (supervisor1 && supervisor2 && supervisor1.uuid === supervisor2.uuid) {
        message.error('Pembimbing 1 dan Pembimbing 2 tidak boleh sama');
        return null;
      }

      if (!supervisor1 && supervisor2) {
        message.error('Harap pilih Pembimbing 1 terlebih dahulu sebelum memilih Pembimbing 2');
        return null;
      }

      // Build form data
      const formData = new FormData();
      formData.append('tipe_suratId', 'sppta');
      formData.append('information', JSON.stringify(values));

      if (supervisor1) {
        formData.append('pembimbing1_uuid', supervisor1.uuid);
        if (supervisor2) {
          formData.append('pembimbing2_uuid', supervisor2.uuid);
        }
      }

      const lampiranList = buildLampiranList(fileUploads);
      formData.append('listLampiran', JSON.stringify(lampiranList));

      // Submit application
      const axios = new AxiosService();
      const response = await axios.post('/v1/pengajuan', formData);
      const id = (response.data as { data: { id: string } }).data.id;
      
      // Update state surat
      const stateSuratData = qs.stringify({
        state_surat: JSON.stringify(buildStateSurat(values, supervisor1, supervisor2, kaprodi))
      });

      await axios.patch(`/v1/pengajuan/${id}/changeStateSurat`, stateSuratData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setSubmittedId(id);
      message.success('Pengajuan Surat Pengantar Perkembangan Tugas Akhir Berhasil Dikirim!');
      
      return id;
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Gagal mengirim form');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submittedId,
    submitApplication
  };
};