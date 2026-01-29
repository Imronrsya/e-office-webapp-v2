import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CheckNumberResponse {
  success: boolean;
  data?: {
    isAvailable: boolean;
    existingDocument?: {
      perihal: string;
      tanggalSurat: string;
      letterType: string;
    };
    suggestion?: string;
  };
  error?: string;
}

export interface AssignNumberResponse {
  success: boolean;
  data?: {
    id: string;
    nomorSurat: string;
    tanggalSurat: string;
    legalisasiStatus: string;
  };
  error?: string;
}

export interface StampResponse {
  success: boolean;
  data?: {
    id: string;
    sealImageUrl: string;
    legalisasiStatus: string;
  };
  error?: string;
}

export interface QRCodeResponse {
  success: boolean;
  data?: {
    qrCodeBase64: string;
    qrCodeDataUrl: string;
    encryptedToken: string;
    verificationUrl: string;
  };
  error?: string;
}

export interface FinalizeResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    readyToDistribute: boolean;
  };
  error?: string;
}

export interface LegalisasiQueueItem {
  id: string;
  documentId: string;
  judulSurat: string;
  nomorSurat: string | null;
  tipeSurat: string;
  kategoriSurat: string;
  tanggalMasuk: string;
  status: string;
  legalisasiStatus: string;
  displayStatus: string;
  needsAction: boolean;
  actionType: string;
  pemohon: {
    id: string;
    name: string;
    nim?: string;
    prodi?: string;
  };
  signatures: Array<{
    signerName: string;
    signerRole: string;
    signedAt: string | null;
    status: string;
  }>;
}

export interface LegalisasiQueueResponse {
  success: boolean;
  data?: {
    data: LegalisasiQueueItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface LegalisasiDetail {
  letterInstance: {
    id: string;
    status: string;
    letterCategory: string;
    submissionValues: Record<string, unknown>;
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
      nim?: string;
      email: string;
      prodi?: string;
      departemen?: string;
    };
    letterType: {
      id: string;
      name: string;
      code: string;
    };
  };
  document: {
    id: string;
    type: string;
    perihal: string | null;
    nomorSurat: string | null;
    tanggalSurat: string | null;
    fileUrl: string | null;
    legalisasiStatus: string;
    sealImageUrl: string | null;
    barcodeData: string | null;
    qrCodeUrl: string | null;
    readyToDistribute: boolean;
    signatures: Array<{
      id: string;
      signerId: string;
      signerName: string;
      signerRole: string;
      signerNip: string | null;
      signatureUrl: string | null;
      status: string;
      signedAt: string | null;
      order: number;
    }>;
  };
  tembusan: Array<{
    name: string;
    email?: string;
    unit?: string;
  }>;
  permissions: {
    canAssignNumber: boolean;
    canStamp: boolean;
    canGenerateQR: boolean;
    canFinalize: boolean;
  };
  nomorSuggestion: string;
}

export interface LegalisasiDetailResponse {
  success: boolean;
  data?: LegalisasiDetail;
  error?: string;
}

// ============================================================================
// LEGALISASI SERVICE
// ============================================================================

export const legalisasiService = {
  /**
   * Get UPA processing queue
   */
  async getQueue(params?: {
    page?: number;
    limit?: number;
    status?: string;
    legalisasiStatus?: string;
    kategori?: string;
    search?: string;
  }): Promise<LegalisasiQueueResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.status) queryParams.append('status', params.status);
      if (params?.legalisasiStatus) queryParams.append('legalisasiStatus', params.legalisasiStatus);
      if (params?.kategori) queryParams.append('kategori', params.kategori);
      if (params?.search) queryParams.append('search', params.search);

      const response = await api.get<LegalisasiQueueResponse>(
        `/api/legalisasi/queue?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get legalisasi queue:", error);
      return { success: false, error: "Gagal memuat antrian legalisasi" };
    }
  },

  /**
   * Get letter detail for legalisasi
   */
  async getDetail(letterId: string): Promise<LegalisasiDetailResponse> {
    try {
      const response = await api.get<LegalisasiDetailResponse>(
        `/api/legalisasi/${letterId}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get legalisasi detail:", error);
      return { success: false, error: "Gagal memuat detail surat" };
    }
  },

  /**
   * Check if nomor surat is available
   */
  async checkNumber(nomorSurat: string): Promise<CheckNumberResponse> {
    try {
      const response = await api.get<CheckNumberResponse>(
        `/api/legalisasi/check-number?nomorSurat=${encodeURIComponent(nomorSurat)}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to check nomor surat:", error);
      return { success: false, error: "Gagal memeriksa nomor surat" };
    }
  },

  /**
   * Assign nomor surat to document
   */
  async assignNumber(
    documentId: string,
    data: { nomorSurat: string; tanggalSurat: string }
  ): Promise<AssignNumberResponse> {
    try {
      const response = await api.post<AssignNumberResponse>(
        `/api/legalisasi/document/${documentId}/assign-number`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to assign nomor surat:", error);
      return { success: false, error: "Gagal memberikan nomor surat" };
    }
  },

  /**
   * Assign nomor surat to document with position for PDF overlay
   */
  async assignNumberWithPosition(
    documentId: string,
    data: { 
      nomorSurat: string; 
      tanggalSurat: string;
      position: {
        x: number;
        y: number;
        page: number;
        fontSize: number;
      };
    }
  ): Promise<AssignNumberResponse> {
    try {
      const response = await api.post<AssignNumberResponse>(
        `/api/legalisasi/document/${documentId}/assign-number`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to assign nomor surat with position:", error);
      return { success: false, error: "Gagal memberikan nomor surat" };
    }
  },

  /**
   * Apply stempel to document
   */
  async applyStamp(
    documentId: string,
    sealImageUrl?: string
  ): Promise<StampResponse> {
    try {
      const response = await api.post<StampResponse>(
        `/api/legalisasi/document/${documentId}/stamp`,
        { sealImageUrl }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to apply stamp:", error);
      return { success: false, error: "Gagal membubuhkan stempel" };
    }
  },

  /**
   * Generate QR code for document
   */
  async generateQRCode(documentId: string): Promise<QRCodeResponse> {
    try {
      const response = await api.post<QRCodeResponse>(
        `/api/legalisasi/document/${documentId}/generate-qr`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      return { success: false, error: "Gagal generate QR Code" };
    }
  },

  /**
   * Finalize document (complete legalisasi process)
   */
  async finalize(
    documentId: string,
    data: { fileUrl: string; notes?: string }
  ): Promise<FinalizeResponse> {
    try {
      const response = await api.post<FinalizeResponse>(
        `/api/legalisasi/document/${documentId}/finalize`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to finalize document:", error);
      return { success: false, error: "Gagal menyelesaikan legalisasi" };
    }
  },

  /**
   * Get PDF proxy URL for a document
   * This bypasses signed URL issues by fetching PDF through the backend proxy
   * @param documentId - The document ID
   * @returns URL to the PDF proxy endpoint
   */
  getPdfProxyUrl(documentId: string): string {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/api/legalisasi/document/${documentId}/pdf`;
  },
};
