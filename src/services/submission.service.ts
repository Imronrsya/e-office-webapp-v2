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
    requiresPengantar: boolean;
    requiresDekanSign: boolean;
    requiresWadekSign: boolean;
}

export interface SubmissionFormData {
    letterTypeId: string;
    // Data Diri
    nama: string;
    nim?: string;
    nip?: string;
    email: string;
    noHp: string;
    departemen: string;
    programStudi: string;
    // Detail Surat
    jenisSurat: "SURAT_TUGAS" | "SURAT_KEPUTUSAN";
    keperluan: string;
    judulAcara: string;
    tanggalAcara: string;
    tanggalSelesai?: string;
    durasiAcara?: string;
    lokasiAcara: string;
    // Signature Config
    targetSigner: "DEKAN" | "WADEK_1" | "WADEK_2";
    requestKadepSign?: boolean;
    requestWadekSign?: boolean;
    butuhTtdKadep?: boolean;
    catatan?: string;
}

export interface SubmissionResponse {
    success: boolean;
    message: string;
    data?: {
        id: string;
        status: string;
    };
}

// ============================================================================
// SUBMISSION SERVICE
// ============================================================================

export const submissionService = {
    /**
     * Get available letter types for submission form
     * Backend: GET /api/submission/letter-types
     */
    async getLetterTypes(): Promise<LetterType[]> {
        try {
            const response = await api.get<{ success: boolean; data: LetterType[] }>(
                "/api/submission/letter-types"
            );
            return response.data.data || [];
        } catch (error) {
            console.error("Failed to get letter types:", error);
            return [];
        }
    },

    /**
     * Create new submission with file attachments
     * Backend: POST /api/submission/with-files
     *
     * Uses multipart/form-data for file upload
     */
    async createSubmission(
        formData: SubmissionFormData,
        files?: File[]
    ): Promise<SubmissionResponse> {
        const data = new FormData();

        // Append all form fields
        data.append("letterTypeId", formData.letterTypeId);
        data.append("nama", formData.nama);
        if (formData.nim) data.append("nim", formData.nim);
        if (formData.nip) data.append("nip", formData.nip);
        data.append("email", formData.email);
        data.append("noHp", formData.noHp);
        data.append("departemen", formData.departemen);
        data.append("programStudi", formData.programStudi);
        data.append("jenisSurat", formData.jenisSurat);
        data.append("keperluan", formData.keperluan);
        data.append("judulAcara", formData.judulAcara);
        data.append("tanggalAcara", formData.tanggalAcara);
        if (formData.tanggalSelesai)
            data.append("tanggalSelesai", formData.tanggalSelesai);
        if (formData.durasiAcara) data.append("durasiAcara", formData.durasiAcara);
        data.append("lokasiAcara", formData.lokasiAcara);
        data.append("targetSigner", formData.targetSigner);
        if (formData.requestKadepSign !== undefined)
            data.append("requestKadepSign", String(formData.requestKadepSign));
        if (formData.requestWadekSign !== undefined)
            data.append("requestWadekSign", String(formData.requestWadekSign));
        if (formData.butuhTtdKadep !== undefined)
            data.append("butuhTtdKadep", String(formData.butuhTtdKadep));
        if (formData.catatan) data.append("catatan", formData.catatan);

        // Append files
        if (files && files.length > 0) {
            files.forEach((file) => {
                data.append("attachments", file);
            });
        }

        const response = await api.post<SubmissionResponse>(
            "/api/submission/with-files",
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },
};
