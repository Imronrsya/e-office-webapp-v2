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
    sealImageUrl?: string | null; // URL stempel yang sudah dibubuhkan
    qrCodeUrl?: string | null; // URL QR code verifikasi
    content?: Record<string, unknown> | null; // Form data untuk generate preview
    contentHtml?: string | null; // HTML content jika sudah di-generate
    tembusan?: Array<{ name: string; description?: string }> | null; // Tembusan recipients dari draft
    attachmentUrls?: Array<{ url: string; name: string }> | null; // Lampiran PDF/JPG/PNG yang diupload oleh staf/supervisor
    signatures: SignatureSummary[];
}

export interface SignatureSummary {
    signerRole: string;
    signerName: string;
    signerNip?: string | null;
    prefix?: string | null; // Awalan/keterangan seperti "Mengetahui,"
    signatureUrl?: string | null; // URL of the actual signature image
    signedAt: string;
    order: number;
    // Position data for signature placement on PDF
    positionX?: number | null;
    positionY?: number | null;
    positionPage?: number | null;
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
    // UI Mode flags
    isVerificationMode?: boolean; // True jika user sedang dalam mode verifikasi (fokus ke form, bukan dokumen)
    isPreDraftMode?: boolean; // True jika dokumen belum ada/belum digenerate
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
    canEditDraftInVerification?: boolean;
    canSubmitVerification?: boolean;
    // Verification actions (Pejabat)
    canVerifySuratHasil?: boolean;
    canSignSuratHasil?: boolean;
    // Return for revision (Supervisor/Manajer TU)
    canReturnForRevision?: boolean;
}

export interface SubmissionDetail {
    id: string;
    submissionValues: SubmissionFormData;
    hasKaprodi: boolean; // Flag from ProgramStudi - true if program has KAPRODI, false if only KADEP
    status: string;
    displayStatus: string;
    priority: string;
    currentActiveRole: string | null;
    signatureConfig: SignatureConfig | null;
    category: "AKADEMIK" | "SUMBER_DAYA" | "UMUM" | null; // Category yang dipilih saat Admin Fakultas forward
    returnTargets: string[]; // Available targets for returning the letter
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

    async sign(
        id: string, 
        signatureData: { 
            signatureData?: string; // base64 data for new signatures
            signatureUrl?: string;  // URL for saved signatures
            saveSignature?: boolean;
            signerName?: string; 
            signerNip?: string;
        }
    ): Promise<ApiResponse<unknown>> {
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
    // STAFF CREATE SURAT (tanpa submission)
    // ========================================================================

    /**
     * Staf creates new surat directly (without submission)
     */
    async createStaffSurat(data: {
        category: 'AKADEMIK' | 'SUMBER_DAYA' | 'UMUM';
        documentType: 'SURAT_TUGAS' | 'SURAT_KEPUTUSAN' | 'SURAT_TUGAS_TABEL';
        signatories: Array<{
            signerRole: string;
            signerName: string;
            signerNip?: string;
            order: number;
            x?: number;
            y?: number;
            page?: number;
        }>;
        tembusan?: string[];
        content?: Record<string, unknown>;
        perihal?: string;
        targetSupervisor?: 'SUPERVISOR_AKADEMIK' | 'SUPERVISOR_SUMBER_DAYA'; // Untuk kategori UMUM
    }): Promise<ApiResponse<{ id: string; documentId: string }>> {
        const response = await api.post<ApiResponse<{ id: string; documentId: string }>>(
            '/api/surat-hasil/create',
            data
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
                x?: number;
                y?: number;
                page?: number;
            }>;
            tembusan?: Array<{ userId: string; name: string; description?: string }> | string[];
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
     * @param mode - "patch" (default) keeps existing data, "overwrite" replaces everything
     */
    async updateDraftSuratHasil(
        documentId: string,
        data: {
            content?: Record<string, unknown>;
            tembusan?: Array<{ userId: string; name: string; description?: string }> | string[];
            perihal?: string;
            mode?: 'patch' | 'overwrite';
            signatories?: Array<{
                signerRole: string;
                signerName: string;
                signerNip?: string;
                order: number;
                x?: number;
                y?: number;
                page?: number;
            }>;
        }
    ): Promise<ApiResponse<unknown>> {
        const response = await api.put<ApiResponse<unknown>>(
            `/api/surat-hasil/document/${documentId}`,
            data
        );
        return response.data;
    },

    /**
     * Supervisor/Manajer TU updates draft during verification
     * Uses letterId (not documentId)
     */
    async updateDraftAsSupervisor(
        letterId: string,
        data: {
            content?: Record<string, unknown>;
            tembusan?: Array<{ userId: string; name: string; description?: string }> | string[];
            perihal?: string;            signatories?: Array<{
                signerRole: string;
                signerName: string;
                signerNip?: string;
                prefix?: string;
                order: number;
                x?: number;
                y?: number;
                page?: number;
            }>;        }
    ): Promise<ApiResponse<unknown>> {
        const response = await api.put<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/supervisor-edit`,
            data
        );
        return response.data;
    },

    /**
     * Staf submits draft for verification
     * Uses letterId (not documentId)
     * @param targetSupervisor - Required for UMUM category letters
     */
    async submitDraftForVerification(letterId: string, targetSupervisor?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/submit`,
            { targetSupervisor }
        );
        return response.data;
    },

    /**
     * Supervisor/Manajer TU approves verification
     * Uses letterId (not documentId)
     * PENTING: Endpoint ini untuk SUPERVISOR dan MANAJER_TU
     */
    async approveSuratHasil(letterId: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/approve`,
            { notes }
        );
        return response.data;
    },

    /**
     * Pejabat (Wadek/Dekan) verifies and forwards to next role
     * Uses letterId (not documentId)
     * PENTING: Ini untuk pejabat yang BUKAN penandatangan, hanya verifikasi
     * Flow SELALU urut sesuai hierarki kategori
     */
    async pejabatVerifySuratHasil(letterId: string, notes?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/pejabat-verify`,
            { notes }
        );
        return response.data;
    },

    /**
     * Supervisor/Pejabat returns for revision
     * Uses letterId (not documentId)
     * @param targetStaff - Optional target staff for UMUM category letters
     */
    async returnSuratHasil(letterId: string, reason: string, targetStaff?: string): Promise<ApiResponse<unknown>> {
        const response = await api.post<ApiResponse<unknown>>(
            `/api/surat-hasil/${letterId}/return`,
            { reason, targetStaff }
        );
        return response.data;
    },

    /**
     * Pejabat signs the document
     * Uses letterId (not documentId)
     * Supports both base64 signatureData and existing signatureUrl
     */
    async signSuratHasil(
        letterId: string, 
        signatureData: { 
            signatureData?: string; // base64 data for new signatures
            signatureUrl?: string;  // URL for saved signatures
            saveSignature?: boolean;
            signerName?: string; 
            signerNip?: string;
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
        departemenId?: string | null;
        departemenName?: string | null;
        programStudiId?: string | null;
        programStudiName?: string | null;
    }>>> {
        const response = await api.get<ApiResponse<Array<{
            role: string;
            name: string;
            nip?: string;
            departemenId?: string | null;
            departemenName?: string | null;
            programStudiId?: string | null;
            programStudiName?: string | null;
        }>>>('/api/users/pejabat');
        return response.data;
    },

    // =========================================================================
    // ATTACHMENT MANAGEMENT
    // =========================================================================

    /**
     * Upload attachments to document
     * Supported formats: PDF, JPG, PNG
     */
    async uploadAttachments(
        documentId: string,
        files: File[]
    ): Promise<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        const response = await api.post<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>>(
            `/api/surat-hasil/document/${documentId}/attachments`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Remove attachment from document
     */
    async removeAttachment(
        documentId: string,
        index: number
    ): Promise<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>> {
        const response = await api.delete<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>>(
            `/api/surat-hasil/document/${documentId}/attachments/${index}`
        );
        return response.data;
    },

    /**
     * Remove attachment from document by filename
     */
    async removeAttachmentByName(
        documentId: string,
        fileName: string
    ): Promise<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>> {
        const response = await api.delete<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>>(
            `/api/surat-hasil/document/${documentId}/attachments/file/${encodeURIComponent(fileName)}`
        );
        return response.data;
    },

    /**
     * Get attachments for document
     */
    async getAttachments(documentId: string): Promise<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>> {
        const response = await api.get<ApiResponse<{ attachmentUrls: Array<{ url: string; name: string }> }>>(
            `/api/surat-hasil/document/${documentId}/attachments`
        );
        return response.data;
    },

    /**
     * Remove pengaju attachment (for Admin Prodi during drafting)
     * This removes attachments from LetterAttachment table (uploaded by pengaju)
     */
    async removePengajuAttachment(
        letterId: string,
        attachmentId: string
    ): Promise<ApiResponse<{ message: string; attachmentId: string }>> {
        const response = await api.delete<ApiResponse<{ message: string; attachmentId: string }>>(
            `/api/department-approval/${letterId}/attachments/${attachmentId}`
        );
        return response.data;
    },
};

