import { api } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface RoleStats {
  role: string;
  count: number;
}

export interface UserStats {
  total: number;
  byRole: RoleStats[];
}

export interface DepartmentStats {
  totalDepartments: number;
  totalProdi: number;
  totalMahasiswa: number;
  totalPegawai: number;
}

export interface DashboardStats {
  users: UserStats;
  departments: DepartmentStats;
}

// ============================================================================
// API Calls
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<{
    success: boolean;
    data: DashboardStats;
  }>("/api/admin/dashboard/stats");
  return response.data.data;
}
