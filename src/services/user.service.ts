import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TembusanUser {
  id: string;
  name: string;
  email: string;
  type: 'mahasiswa' | 'pegawai';
  identifier: string; // NIM for mahasiswa, NIP for pegawai
  department?: string;
  programStudi?: string;
  jabatan?: string; // For pegawai
}

export interface TembusanRecipient {
  userId: string;
  name: string;
  description?: string;
}

export interface TembusanUserListResponse {
  success: boolean;
  data?: {
    users: TembusanUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface UserSearchResponse {
  success: boolean;
  data?: TembusanUser[];
  error?: string;
}

// ============================================================================
// USER SERVICE FOR TEMBUSAN
// ============================================================================

export const userService = {
  /**
   * Get list of users for tembusan selection
   * Only accessible by staff (STAF_AKADEMIK, STAF_SUMBER_DAYA)
   */
  async getTembusanUserList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'all' | 'mahasiswa' | 'pegawai';
  }): Promise<TembusanUserListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.search) queryParams.append('search', params.search);
      if (params?.type) queryParams.append('type', params.type);

      const response = await api.get<TembusanUserListResponse>(
        `/api/users/tembusan-list?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get tembusan user list:", error);
      return { success: false, error: "Gagal memuat daftar pengguna" };
    }
  },

  /**
   * Search users by name for autocomplete
   */
  async searchUsers(query: string): Promise<UserSearchResponse> {
    try {
      if (query.length < 2) {
        return { success: true, data: [] };
      }

      const response = await api.get<UserSearchResponse>(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to search users:", error);
      return { success: false, error: "Gagal mencari pengguna" };
    }
  },

  /**
   * Convert TembusanUser to TembusanRecipient format for saving
   */
  userToRecipient(user: TembusanUser): TembusanRecipient {
    const description = user.type === 'mahasiswa'
      ? `Mahasiswa - ${user.programStudi || ''}`
      : `${user.jabatan || 'Pegawai'} - ${user.programStudi || ''}`;

    return {
      userId: user.id,
      name: user.name,
      description: description.trim().replace(/^- |-$/, '')
    };
  },

  /**
   * Format user display name
   */
  formatUserDisplay(user: TembusanUser): string {
    const parts = [user.name];
    if (user.type === 'mahasiswa') {
      parts.push(`(${user.identifier})`);
      if (user.programStudi) parts.push(`- ${user.programStudi}`);
    } else {
      if (user.jabatan) parts.push(`(${user.jabatan})`);
      if (user.identifier) parts.push(`- NIP: ${user.identifier}`);
    }
    return parts.join(' ');
  }
};
