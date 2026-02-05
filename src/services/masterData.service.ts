// src/services/masterData.service.ts
import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Departemen {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProgramStudi {
  id: string;
  name: string;
  code: string;
  jenjang: "D3" | "S1" | "S2" | "S3" | "PROFESI";
  departemenId: string;
  hasKaprodi: boolean;
  managedByRole: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  departemen: Departemen;
}

export interface DepartemenWithProdi extends Departemen {
  programStudi: ProgramStudi[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all program studi with department information
 */
export async function getProdiList(): Promise<ProgramStudi[]> {
  const response = await api.get<{ success: boolean; data: ProgramStudi[] }>(
    "/api/master-data/prodi"
  );
  return response.data.data;
}

/**
 * Get single program studi details
 */
export async function getProdiDetail(id: string): Promise<ProgramStudi> {
  const response = await api.get<{ success: boolean; data: ProgramStudi }>(
    `/api/master-data/prodi/${id}`
  );
  return response.data.data;
}

/**
 * Get all departments with their program studi
 */
export async function getDepartemenList(): Promise<DepartemenWithProdi[]> {
  const response = await api.get<{ success: boolean; data: DepartemenWithProdi[] }>(
    "/api/master-data/departemen"
  );
  return response.data.data;
}

/**
 * Get single department details
 */
export async function getDepartemenDetail(id: string): Promise<DepartemenWithProdi> {
  const response = await api.get<{ success: boolean; data: DepartemenWithProdi }>(
    `/api/master-data/departemen/${id}`
  );
  return response.data.data;
}
