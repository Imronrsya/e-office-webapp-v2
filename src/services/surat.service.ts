import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS (sesuai backend submission.types.ts)
// ============================================================================

export interface SubmissionFormData {
    nama: string;
    nim?: string;
    nip?: string;
    departemen: string;
    programStudi: string;
    jenisSurat: 'SURAT_TUGAS' | 'SURAT_KEPUTUSAN';
    keperluan: string;
    judulAcara: string;
    tanggalAcara: string;
    durasiAcara?: string;
    lokasiAcara: string;
    butuhTtdKadep: boolean;
}

export interface SignatureConfig {
    targetSigner: 'DEKAN' | 'WADEK_1' | 'WADEK_2';
    requestKadepSign: boolean;
}

export interface DocumentSummary {
    id: string;
    type: 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN';
    nomorSurat: string | null;
    tanggalSurat: string | null;
    perihal: string | null;
    isSigned: boolean;
    fileUrl: string | null;
    content?: Record<string, unknown> | null; // Form data untuk generate preview
    contentHtml?: string | null; // HTML content jika sudah di-generate
    signatures: SignatureSummary[];
}

export interface SignatureSummary {
    signerRole: string;
    signerName: string;
    signedAt: string;
    order: number;
}

export interface AttachmentSummary {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number | null;
    mimeType: string | null;
    description: string | null;
    uploadedAt: string;
}

export interface LogSummary {
    id: string;
    action: string;
    actorName: string;
    actorRole: string;
    fromStatus: string | null;
    toStatus: string | null;
    notes: string | null;
    createdAt: string;
}

export interface SubmissionPermissions {
    canEdit: boolean;
    canCancel: boolean;
    canDownload: boolean;
    canResubmit: boolean;
    showSuratPengantar: boolean;
    showSuratHasil: boolean;
    showFormulirAwal: boolean;
    showRiwayat: boolean;
    showAlasanDitolak: boolean;
    // Department approval actions
    canApprove?: boolean;
    canReject?: boolean;
    canSign?: boolean;
    canDraft?: boolean;
    canSubmitDraft?: boolean;
    // Faculty actions
    canReceive?: boolean;
    canForward?: boolean;
    canDispose?: boolean;
    canComplete?: boolean;
    canVerify?: boolean;
    canReturn?: boolean;
    canFinish?: boolean;
    canAssignNumber?: boolean;
    canStamp?: boolean;
    // Surat Hasil (Staf)
    canDraftSuratHasil?: boolean;
    canEditDraft?: boolean;
    canSubmitVerification?: boolean;
    // Verification actions (Pejabat)
    canVerifySuratHasil?: boolean;
    canSignSuratHasil?: boolean;
}

export interface SubmissionDetail {
    id: string;
    submissionValues: SubmissionFormData;
    status: string;
    displayStatus: string;
    priority: string;
    currentActiveRole: string | null;
    signatureConfig: SignatureConfig | null;
    letterType: {
        id: string;
        name: string;
        code: string;
        category: string;
    };
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    documents: DocumentSummary[];
    attachments: AttachmentSummary[];
    logs: LogSummary[];
    submittedAt: string;
    completedAt: string | null;
    permissions: SubmissionPermissions;
    rejectionReason?: string | null;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

// Legacy types for backward compatibility
export type TipeSurat = 'SURAT_TUGAS' | 'SURAT_KEPUTUSAN';
export type StatusSurat = 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'DIKEMBALIKAN';

export interface Surat {
    id: string;
    judulSurat: string;
    tipeSurat: TipeSurat;
    tanggalSurat: string;
    status: StatusSurat;
    namaPengaju?: string;
    [key: string]: unknown;
}

// ============================================================================
// SURAT SERVICE
// ============================================================================

export const suratService = {
    /**
     * Get submission detail by ID
     * Endpoint: GET /api/submission/:id
     */
    async getDetail(id: string): Promise<SubmissionDetail | null> {
        try {
            const response = await api.get<ApiResponse<SubmissionDetail>>(
                `/api/submission/${id}`
            );
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error("Failed to get submission detail:", error);
            return null;
        }
    },

    /**
     * Download surat document
     * Endpoint: GET /api/surat-hasil/:id/download
     */
    async downloadDocument(documentId: string): Promise<Blob | null> {
        try {
            const response = await api.get(`/api/surat-hasil/${documentId}/download`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error("Failed to download document:", error);
            return null;
        }
    },

    /**
     * Download attachment
     */
    async downloadAttachment(submissionId: string, attachmentId: string): Promise<Blob | null> {
        try {
            const response = await api.get(
                `/api/submission/${submissionId}/attachments/${attachmentId}/download`,
                { responseType: 'blob' }
            );
            return response.data;
        } catch (error) {
            console.error("Failed to download attachment:", error);
            return null;
        }
    },

    // ========================================================================
    // DEPARTMENT APPROVAL ACTIONS
    // ========================================================================

    async approve(id: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/department-approval/${id}/approve`,
            { notes }
        );
        return response.data;
    },

    async reject(id: string, reason: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/department-approval/${id}/reject`,
            { reason }
        );
        return response.data;
    },

    /**
     * Admin Prodi creates initial surat pengantar draft
     */
    async createDraft(id: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/department-approval/${id}/create-draft`
        );
        return response.data;
    },

    /**
     * Admin Prodi saves surat pengantar draft with content
     */
    async savePengantarDraft(
        id: string,
        data: {
            content: Record<string, unknown>;
            tembusan?: string[];
            signatories: Array<{
                signerRole: string;
                signerName: string;
                signerNip?: string;
                order: number;
            }>;
        }
    ): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/department-approval/${id}/draft`,
            data
        );
        return response.data;
    },

    /**
     * Admin Prodi submits draft for signature
     */
    async submitDraft(id: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/department-approval/${id}/submit-draft`
        );
        return response.data;
    },

    async sign(id: string, signatureData: { signatureUrl: string; signerName: string; signerNip?: string }): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/department-approval/${id}/sign`,
            signatureData
        );
        return response.data;
    },

    // ========================================================================
    // FACULTY ACTIONS
    // ========================================================================

    /**
     * Admin Fakultas categorizes and receives letter
     */
    async categorize(id: string, category: 'AKADEMIK' | 'SUMBER_DAYA' | 'UMUM'): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-disposition/${id}/categorize`,
            { category }
        );
        return response.data;
    },

    /**
     * Admin Fakultas forwards letter to target role
     */
    async forward(id: string, targetRole: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-disposition/${id}/forward`,
            { targetRole, notes }
        );
        return response.data;
    },

    /**
     * Pejabat disposisi ke pejabat bawah
     * Note: Uses same endpoint as forward - backend determines action based on user role
     */
    async dispose(id: string, targetRole: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-disposition/${id}/forward`,
            { targetRole, notes }
        );
        return response.data;
    },

    /**
     * Pejabat selesaikan surat (tidak perlu proses lebih lanjut)
     */
    async complete(id: string, notes: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-disposition/${id}/complete`,
            { notes }
        );
        return response.data;
    },

    /**
     * Pejabat kembalikan surat ke pejabat sebelumnya
     */
    async returnLetter(id: string, targetRole: string, reason: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-disposition/${id}/return`,
            { targetRole, reason }
        );
        return response.data;
    },

    async verify(id: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-approval/${id}/verify`,
            { notes }
        );
        return response.data;
    },

    async returnDoc(id: string, targetUserId: string, reason: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-approval/${id}/return`,
            { targetUserId, reason }
        );
        return response.data;
    },

    async finish(id: string, notes: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/faculty-disposition/${id}/finish`,
            { notes }
        );
        return response.data;
    },

    async assignNumber(id: string, nomorSurat: string, tanggalSurat: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${id}/assign-number`,
            { nomorSurat, tanggalSurat }
        );
        return response.data;
    },

    async applyStamp(id: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${id}/stamp`
        );
        return response.data;
    },

    // ========================================================================
    // SURAT HASIL (SK/ST) ACTIONS
    // ========================================================================

    /**
     * Staf creates draft SK/ST
     */
    async createDraftSuratHasil(
        id: string, 
        data: {
            documentType: 'SURAT_TUGAS' | 'SURAT_KEPUTUSAN' | 'SURAT_PENGANTAR' | 'SURAT_TUGAS_TABEL';
            signatories: Array<{
                signerRole: string;
                signerName: string;
                signerNip?: string;
                order: number;
            }>;
            tembusan?: string[];
            content?: Record<string, unknown>;
            perihal?: string;
        }
    ): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${id}/draft`,
            data
        );
        return response.data;
    },

    /**
     * Staf updates draft SK/ST
     */
    async updateDraftSuratHasil(
        documentId: string,
        data: {
            content?: Record<string, unknown>;
            tembusan?: string[];
            perihal?: string;
        }
    ): Promise<ApiResponse<unknown>> {
        const response = await api.put<ApiResponse<unknown>>(
            `/api/surat-hasil/document/${documentId}`,
            data
        );
        return response.data;
    },

    /**
     * Staf submits draft for verification
     * Uses letterId (not documentId)
     */
    async submitDraftForVerification(letterId: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/submit`,
            {}
        );
        return response.data;
    },

    /**
     * Supervisor/Pejabat approves verification
     * Uses letterId (not documentId)
     */
    async approveSuratHasil(letterId: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/approve`,
            { notes }
        );
        return response.data;
    },

    /**
     * Supervisor/Pejabat returns for revision
     * Uses letterId (not documentId)
     */
    async returnSuratHasil(letterId: string, reason: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/return`,
            { reason }
        );
        return response.data;
    },

    /**
     * Pejabat signs the document
     * Uses letterId (not documentId)
     */
    async signSuratHasil(
        letterId: string, 
        signatureData: { 
            signatureUrl: string; 
            signerName: string; 
            signerNip?: string 
        }
    ): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/sign`,
            signatureData
        );
        return response.data;
    },

    /**
     * Get pejabat list for signature selection
     */
    async getPejabatList(): Promise<ApiResponse<Array<{
        role: string;
        name: string;
        nip?: string;
    }>>> {
        const response = await api.get<ApiResponse<Array<{
            role: string;
            name: string;
            nip?: string;
        }>>>('/api/users/pejabat');
        return response.data;
    },
};

