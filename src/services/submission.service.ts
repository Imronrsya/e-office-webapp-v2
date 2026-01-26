// src/services/submission.service.ts
import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LetterType {
    id: string;
    name: string;
    code: string;
    description: string | null;
    category: string;
    defaultTargetSigner?: string;
}

// Data Diri & Detail Surat (Inner Object)
export interface SubmissionFormData {
    nama: string;
    nim?: string;
    nip?: string;
    departemen: string;
    programStudi: string;
    jenisSurat: "SURAT_TUGAS" | "SURAT_KEPUTUSAN";
    keperluan: string;
    judulAcara: string;
    tanggalAcara: string;
    durasiAcara?: string;
    lokasiAcara: string;
    butuhTtdKadep: boolean;
}

// Signature Config (Inner Object)
export interface SignatureConfig {
    targetSigner: "DEKAN" | "WADEK_1" | "WADEK_2";
    requestKadepSign: boolean;
}

// Payload untuk Endpoint JSON (POST /api/submission)
export interface CreateSubmissionJSON {
    letterTypeId: string;
    formData: SubmissionFormData;
    signatureConfig: SignatureConfig;
}

export interface SubmissionResponse {
    success: boolean;
    message: string;
    data?: {
        id: string;
        status: string;
        submittedAt: string;
    };
}

// ============================================================================
// SUBMISSION SERVICE
// ============================================================================

export const submissionService = {
    /**
     * Get available letter types
     * Endpoint: GET /api/submission/letter-types (PUBLIC)
     * Backend returns: { success: boolean; message: string; data: LetterType[] }
     */
    async getLetterTypes(): Promise<LetterType[]> {
        try {
            const response = await api.get<{ success: boolean; message: string; data: LetterType[] }>(
                "/api/submission/letter-types"
            );
            // Backend mengembalikan data langsung sebagai array, bukan { letterTypes: [...] }
            return response.data.data || [];
        } catch (error) {
            console.error("Failed to get letter types:", error);
            return [];
        }
    },

    /**
     * Create submission WITHOUT files
     * Endpoint: POST /api/submission (JSON Body)
     */
    async createSubmission(payload: CreateSubmissionJSON): Promise<SubmissionResponse> {
        const response = await api.post<SubmissionResponse>(
            "/api/submission",
            payload
        );
        return response.data;
    },

    /**
     * Create submission WITH files
     * Endpoint: POST /api/submission/with-files (Multipart/FormData)
     * Struktur: Flat Key-Value
     */
    async createSubmissionWithFiles(
        payload: CreateSubmissionJSON,
        files: File[]
    ): Promise<SubmissionResponse> {
        const formData = new FormData();

        // 1. Root Fields
        formData.append("letterTypeId", payload.letterTypeId);

        // 2. Form Data Fields (Flattened)
        Object.entries(payload.formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        // 3. Signature Config Fields (Flattened)
        formData.append("targetSigner", payload.signatureConfig.targetSigner);
        formData.append("requestKadepSign", String(payload.signatureConfig.requestKadepSign));

        // 4. Attachments
        files.forEach((file) => {
            formData.append("attachments", file);
        });

        const response = await api.post<SubmissionResponse>(
            "/api/submission/with-files",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },
};