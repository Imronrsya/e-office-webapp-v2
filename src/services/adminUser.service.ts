import { api } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
  unitKerja: string | null;
  identifier: string | null;
  jabatan: string | null;
  isActive: boolean;
}

export interface MahasiswaProfile {
  type: "mahasiswa";
  id: string;
  nim: string;
  tahunMasuk: string;
  noHp: string | null;
  alamat: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  departemenId: string;
  departemenName: string;
  programStudiId: string;
  programStudiName: string;
}

export interface PegawaiProfile {
  type: "pegawai";
  id: string;
  nip: string;
  jabatan: string;
  noHp: string | null;
  departemenId: string;
  departemenName: string;
  programStudiId: string;
  programStudiName: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  deletedAt: string | null;
  role: string;
  roleId: string;
  profile: MahasiswaProfile | PegawaiProfile | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: string;
  password?: string;
  nim?: string;
  tahunMasuk?: string;
  noHp?: string;
  nip?: string;
  jabatan?: string;
  departemenId?: string;
  programStudiId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  nim?: string;
  tahunMasuk?: string;
  noHp?: string;
  nip?: string;
  jabatan?: string;
  departemenId?: string;
  programStudiId?: string;
}

export interface RoleOption {
  id: string;
  name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
}

// ============================================================================
// API Calls
// ============================================================================

export async function listAdminUsers(
  params: ListUsersParams = {}
): Promise<{ data: AdminUserListItem[]; meta: PaginationMeta }> {
  const response = await api.get<{
    success: boolean;
    data: AdminUserListItem[];
    meta: PaginationMeta;
  }>("/api/admin/users", { params });
  return { data: response.data.data, meta: response.data.meta };
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const response = await api.get<{
    success: boolean;
    data: AdminUserDetail;
  }>(`/api/admin/users/${id}`);
  return response.data.data;
}

export async function createAdminUser(
  payload: CreateUserPayload
): Promise<{ id: string; defaultPassword: string }> {
  const response = await api.post<{
    success: boolean;
    data: { id: string; defaultPassword: string };
  }>("/api/admin/users", payload);
  return response.data.data;
}

export async function updateAdminUser(
  id: string,
  payload: UpdateUserPayload
): Promise<void> {
  await api.patch(`/api/admin/users/${id}`, payload);
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/api/admin/users/${id}`);
}

export async function resetAdminUserPassword(
  id: string
): Promise<{ defaultPassword: string }> {
  const response = await api.post<{
    success: boolean;
    data: { id: string; defaultPassword: string };
  }>(`/api/admin/users/${id}/reset-password`);
  return response.data.data;
}

export async function getAdminRoles(): Promise<RoleOption[]> {
  const response = await api.get<{
    success: boolean;
    data: RoleOption[];
  }>("/api/admin/roles");
  return response.data.data;
}

export async function reactivateAdminUser(id: string): Promise<void> {
  await api.post(`/api/admin/users/${id}/reactivate`);
}
