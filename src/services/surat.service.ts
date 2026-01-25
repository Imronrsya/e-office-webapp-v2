import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export type TipeSurat = 'SURAT_TUGAS' | 'SURAT_KEPUTUSAN';
export type StatusSurat = 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'DIKEMBALIKAN';

export interface Surat {
    id: string;
    judulSurat: string;
    tipeSurat: TipeSurat;
    tanggalSurat: string;
    status: StatusSurat;
    namaPengaju?: string;
    [key: string]: any;
}

// Interface untuk parameter filter
interface GetSuratParams {
    tipeSurat?: TipeSurat;
    status?: StatusSurat | 'semua';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

// Interface untuk response API
interface GetSuratResponse {
    data: Surat[];
    total: number;
    page: number;
    totalPages: number;
}

export const suratService = {
    /**
     * Get all surat with filters
     * Backend: GET /api/surat
     */
    async getAll(params?: GetSuratParams): Promise<GetSuratResponse> {
        const response = await api.get<GetSuratResponse>('/api/surat', { params });
        return response.data;
    },

    /**
     * Get surat by ID
     * Backend: GET /api/surat/:id
     */
    async getById(id: string): Promise<Surat | null> {
        try {
            const response = await api.get<Surat>(`/api/surat/${id}`);
            return response.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Create new surat
     * Backend: POST /api/surat
     */
    async create(data: Omit<Surat, 'id' | 'tanggalSurat'>): Promise<Surat> {
        const response = await api.post<Surat>('/api/surat', data);
        return response.data;
    },

    /**
     * Update surat
     * Backend: PUT /api/surat/:id
     */
    async update(id: string, data: Partial<Surat>): Promise<Surat> {
        const response = await api.put<Surat>(`/api/surat/${id}`, data);
        return response.data;
    },

    /**
     * Delete surat
     * Backend: DELETE /api/surat/:id
     */
    async delete(id: string): Promise<void> {
        await api.delete(`/api/surat/${id}`);
    },

    /**
     * Update surat status
     * Backend: PATCH /api/surat/:id/status
     */
    async updateStatus(id: string, status: StatusSurat): Promise<Surat> {
        const response = await api.patch<Surat>(`/api/surat/${id}/status`, { status });
        return response.data;
    }
};
