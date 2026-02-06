// src/services/department-approval.service.ts
import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CheckNomorSuratResponse {
    success: boolean;
    message: string;
    data?: {
        isAvailable: boolean;
        nomorSurat: string;
        message: string;
        existingLetter: {
            id: string;
        } | null;
    };
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class DepartmentApprovalService {
    /**
     * Check if nomor surat is already used
     * @param nomorSurat - Nomor surat yang akan dicek
     * @param letterId - Optional: Letter ID untuk exclude saat edit
     */
    async checkNomorSurat(nomorSurat: string, letterId?: string): Promise<CheckNomorSuratResponse> {
        try {
            const params: Record<string, string> = {
                nomorSurat: nomorSurat.trim()
            };
            
            if (letterId) {
                params.letterId = letterId;
            }

            const response = await api.get<CheckNomorSuratResponse>(
                '/api/department-approval/check-nomor-surat',
                { params }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error checking nomor surat:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal mengecek nomor surat',
            };
        }
    }
}

export const departmentApprovalService = new DepartmentApprovalService();
