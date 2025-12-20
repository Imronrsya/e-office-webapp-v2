import { useState, useEffect } from 'react';
import { message } from 'antd';
import { AxiosService } from '@/utils/axios';
import { REVISION_STATUSES, PENDING_STATUSES, API_ENDPOINTS } from '../constants';

interface SuratMasuk {
  id: string;
  tipe_suratId: string;
  status: string;
  keterangan_surat?: string;
  listLampiran?: string;
  information?: string;
  [key: string]: any;
}

interface UseExistingApplicationReturn {
  existingApplication: SuratMasuk | undefined;
  isRevisionNeeded: boolean;
  isPending: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useExistingApplication = (
  autoFetch = true
): UseExistingApplicationReturn => {
  const [existingApplication, setExistingApplication] = useState<SuratMasuk | undefined>();
  const [isRevisionNeeded, setIsRevisionNeeded] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkExistingApplication = async () => {
    setLoading(true);
    setError(null);

    try {
      const axios = new AxiosService();
      
      // Get mahasiswa data
      const mahasiswaResponse: any = await axios.get(API_ENDPOINTS.ROLE_MAHASISWA);
      
      if (!mahasiswaResponse?.data?.data?.nim) {
        setLoading(false);
        return;
      }

      const nim = mahasiswaResponse.data.data.nim;

      // Get applications for this mahasiswa
      const applicationsResponse: any = await axios.get(
        API_ENDPOINTS.PENGAJUAN_BY_PEMOHON(nim)
      );

      if (!applicationsResponse?.data?.data) {
        setLoading(false);
        return;
      }

      const applications = applicationsResponse.data.data as SuratMasuk[];

      // Check for revision application (highest priority)
      const revisionApp = applications.find(
        (app) =>
          app.tipe_suratId === 'sppta' &&
          REVISION_STATUSES.includes(app.status)
      );

      // Check for pending application
      const pendingApp = applications.find(
        (app) =>
          app.tipe_suratId === 'sppta' &&
          PENDING_STATUSES.includes(app.status)
      );

      // Prioritize revision over pending
      const result = revisionApp || pendingApp;

      setExistingApplication(result);
      setIsRevisionNeeded(!!revisionApp);
      setIsPending(!!pendingApp && !revisionApp);

    } catch (err) {
      console.error('Error checking existing application:', err);
      const errorMessage = err instanceof Error ? err : new Error('Unknown error');
      setError(errorMessage);
      message.error('Gagal memeriksa pengajuan yang sudah ada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      checkExistingApplication();
    }
  }, [autoFetch]);

  return {
    existingApplication,
    isRevisionNeeded,
    isPending,
    loading,
    error,
    refetch: checkExistingApplication,
  };
};