import { api } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface ProdiItem {
  id: string;
  name: string;
  code: string;
  jenjang: "D3" | "S1" | "S2" | "S3" | "PROFESI";
  hasKaprodi: boolean;
  managedByRole: string | null;
  departemenId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  programStudi: ProdiItem[];
  _count: {
    mahasiswa: number;
    pegawai: number;
  };
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
}

export interface CreateProdiPayload {
  name: string;
  code: string;
  jenjang: "D3" | "S1" | "S2" | "S3" | "PROFESI";
  hasKaprodi?: boolean;
}

export interface UpdateProdiPayload {
  name?: string;
  code?: string;
  jenjang?: "D3" | "S1" | "S2" | "S3" | "PROFESI";
  hasKaprodi?: boolean;
}

// ============================================================================
// API Calls
// ============================================================================

export async function listDepartments(): Promise<DepartmentItem[]> {
  const response = await api.get<{
    success: boolean;
    data: DepartmentItem[];
  }>("/api/admin/departments");
  return response.data.data;
}

export async function createDepartment(
  payload: CreateDepartmentPayload
): Promise<DepartmentItem> {
  const response = await api.post<{
    success: boolean;
    data: DepartmentItem;
  }>("/api/admin/departments", payload);
  return response.data.data;
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload
): Promise<void> {
  await api.patch(`/api/admin/departments/${id}`, payload);
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/api/admin/departments/${id}`);
}

export async function addProdi(
  departmentId: string,
  payload: CreateProdiPayload
): Promise<ProdiItem> {
  const response = await api.post<{
    success: boolean;
    data: ProdiItem;
  }>(`/api/admin/departments/${departmentId}/prodi`, payload);
  return response.data.data;
}

export async function updateProdi(
  id: string,
  payload: UpdateProdiPayload
): Promise<void> {
  await api.patch(`/api/admin/prodi/${id}`, payload);
}

export async function deleteProdi(id: string): Promise<void> {
  await api.delete(`/api/admin/prodi/${id}`);
}
