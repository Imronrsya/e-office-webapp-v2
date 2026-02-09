import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TembusanInboxItem {
  id: string;
  documentId: string;
  nomorSurat: string | null;
  perihal: string | null;
  tanggalSurat: string | null;
  jenisDocument: string;
  fileUrl: string | null;
  pemohon: {
    id: string;
    nama: string;
    nim?: string | null;
    email: string;
  };
  penandatangan: Array<{
    nama: string;
    jabatan: string;
    signedAt: string | null;
  }>;
  diterimaTanggal: string;
  sudahDibaca: boolean;
}

export interface TembusanDetail extends TembusanInboxItem {
  letterType: {
    id: string;
    name: string;
    code: string;
  };
  // Document type for frontend template selection
  documentType: 'SURAT_TUGAS' | 'SURAT_KEPUTUSAN' | 'SURAT_TUGAS_TABEL' | 'SURAT_PENGANTAR';
  // Form data JSON for frontend template rendering
  content: Record<string, unknown> | null;
  submissionValues: Record<string, unknown>;
  contentHtml?: string | null;
  qrCodeUrl?: string | null;
  attachmentUrls?: Array<string | { url: string; name: string }> | null;
  // Full signature data for frontend rendering
  signaturesFull: Array<{
    signerRole: string;
    signerName: string;
    signerNip?: string | null;
    signatureUrl?: string | null;
    prefix?: string | null;
    signedAt: string | null;
    order: number;
  }>;
  // Tembusan recipient list for template rendering
  tembusanList: Array<{
    userId?: string;
    name: string;
    description?: string;
  }>;
  // Stempel/seal info
  sealImageUrl?: string | null;
}

export interface TembusanInboxResponse {
  success: boolean;
  data?: {
    data: TembusanInboxItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface TembusanDetailResponse {
  success: boolean;
  data?: TembusanDetail;
  error?: string;
}

export interface TembusanCountResponse {
  success: boolean;
  data?: {
    count: number;
  };
  error?: string;
}

// ============================================================================
// TEMBUSAN SERVICE
// ============================================================================

export const tembusanService = {
  /**
   * Get inbox - daftar surat yang diterima sebagai tembusan
   */
  async getInbox(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<TembusanInboxResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await api.get<TembusanInboxResponse>(
        `/api/tembusan/inbox?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get tembusan inbox:", error);
      return { success: false, error: "Gagal memuat daftar surat tembusan" };
    }
  },

  /**
   * Get detail surat tembusan
   */
  async getDetail(documentId: string): Promise<TembusanDetailResponse> {
    try {
      const response = await api.get<TembusanDetailResponse>(
        `/api/tembusan/${documentId}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get tembusan detail:", error);
      return { success: false, error: "Gagal memuat detail surat tembusan" };
    }
  },

  /**
   * Mark surat tembusan sebagai sudah dibaca
   */
  async markAsRead(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ success: boolean; error?: string }>(
        `/api/tembusan/${documentId}/mark-read`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to mark as read:", error);
      return { success: false, error: "Gagal menandai surat sebagai dibaca" };
    }
  },

  /**
   * Get jumlah surat tembusan yang belum dibaca
   */
  async getUnreadCount(): Promise<TembusanCountResponse> {
    try {
      const response = await api.get<TembusanCountResponse>(
        `/api/tembusan/count`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return { success: false, error: "Gagal mendapatkan jumlah surat belum dibaca" };
    }
  },

  /**
   * Check if user can download a document
   */
  async canDownloadDocument(documentId: string): Promise<{
    success: boolean;
    data?: { canDownload: boolean; fileUrl?: string };
    error?: string;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data?: { canDownload: boolean; fileUrl?: string };
        error?: string;
      }>(`/api/tembusan/${documentId}/can-download`);
      return response.data;
    } catch (error) {
      console.error("Failed to check download access:", error);
      return { success: false, error: "Gagal memeriksa akses unduh" };
    }
  },

  /**
   * Download dokumen tembusan
   */
  async downloadDocument(fileUrl: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'surat-tembusan.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      throw error;
    }
  },
};
