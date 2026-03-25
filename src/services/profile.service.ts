import { api } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  roles: string[];
  profile: MahasiswaProfileData | PegawaiProfileData | null;
  departemen: { id: string; name: string; code: string } | null;
  programStudi: { id: string; name: string; code: string } | null;
}

export interface MahasiswaProfileData {
  type: "mahasiswa";
  nim: string;
  tahunMasuk: string;
  noHp: string;
  departemenId: string;
  departemenName: string;
  programStudiId: string;
  programStudiName: string;
}

export interface PegawaiProfileData {
  type: "pegawai";
  nip: string;
  jabatan: string;
  noHp: string | null;
  departemenId: string;
  departemenName: string;
  programStudiId: string;
  programStudiName: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  noHp?: string;
  nim?: string;
  tahunMasuk?: string;
  nip?: string;
  jabatan?: string;
  departemenId?: string;
  programStudiId?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// API Calls
// ============================================================================

export const profileService = {
  /**
   * Get current user's full profile
   */
  async getMyProfile(): Promise<ProfileData> {
    const response = await api.get<{
      success: boolean;
      data: ProfileData;
    }>("/api/profile/me");
    return response.data.data;
  },

  /**
   * Update current user's profile data
   */
  async updateMyProfile(payload: UpdateProfilePayload): Promise<{ message: string }> {
    const response = await api.put<{
      success: boolean;
      message: string;
    }>("/api/profile/me", payload);
    return { message: response.data.message };
  },

  /**
   * Change password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await api.put<{
      success: boolean;
      message: string;
    }>("/api/profile/me/password", payload);
    return { message: response.data.message };
  },

  /**
   * Upload avatar (profile picture)
   */
  async uploadAvatar(file: File): Promise<{ image: string; message: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{
      success: boolean;
      message: string;
      data: { image: string };
    }>("/api/profile/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      image: response.data.data.image,
      message: response.data.message,
    };
  },

  /**
   * Delete avatar (revert to default)
   */
  async deleteAvatar(): Promise<{ message: string }> {
    const response = await api.delete<{
      success: boolean;
      message: string;
    }>("/api/profile/me/avatar");
    return { message: response.data.message };
  },
};
