// src/services/dashboard.service.ts
import { api } from '@/lib/api';

export interface DashboardColumn {
  key: string;
  label: string;
}

export interface DashboardTab {
  key: string;
  label: string;
  count: number;
}

export interface DashboardItem {
  id: string;
  judulSurat: string;
  tipeSurat: string;
  tanggalSurat: string;
  status: string;
  displayStatus: string;  // Backend returns 'displayStatus' not 'statusDisplay'
  actions: string | string[];  // Backend may return string or array
  namaPengaju?: string;
  jenisSurat?: string;
  nomorSurat?: string;
}

export interface DashboardFilters {
  search: boolean;
  type?: string[];
  status: string[];
  tipeSurat: string[];
  jenisSurat?: string[];
}

export interface DashboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardData {
  items: DashboardItem[];
  pagination: DashboardPagination;
  columns: DashboardColumn[];
  filters?: DashboardFilters;
  availableActions?: string[];
  tabs?: DashboardTab[];
  statistics?: {
    total: number;
    pending: number;
    completed: number;
    waiting: number;
  };
  userRole?: string;
}

export interface DashboardResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}

export interface DashboardParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  letterType?: string;
  category?: string;
  type?: string;
}

export interface DashboardStatistics {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  thisMonth: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  letterTitle: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
}

export const dashboardService = {
  /**
   * Get dashboard data based on user role
   * Backend: /dash/ (authGuard protected)
   */
  getDashboard: async (params?: DashboardParams): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/dash/', { params });
    return response.data;
  },

  /**
   * Get dashboard statistics
   * Backend: /dash/statistics
   */
  getStatistics: async (): Promise<{ success: boolean; data: DashboardStatistics }> => {
    const response = await api.get<{ success: boolean; data: DashboardStatistics }>('/dash/statistics');
    return response.data;
  },

  /**
   * Get recent activities
   * Backend: /dash/recent
   */
  getRecent: async (): Promise<{ success: boolean; data: RecentActivity[] }> => {
    const response = await api.get<{ success: boolean; data: RecentActivity[] }>('/dash/recent');
    return response.data;
  },
};
