// src/services/dashboard.service.ts
import { api } from '@/lib/api';
import type {
  DashboardResponse,
  DashboardParams,
  DashboardStatistics,
  RecentActivity
} from '@/features/dashboard/types';

export const dashboardService = {
  /**
   * Get dashboard data based on user role
   * Backend: /dash (authGuard protected)
   */
  getDashboard: async (params?: DashboardParams): Promise<{ success: boolean; data: DashboardResponse }> => {
    // KOREKSI: Tambahkan wrapper { success, data } agar sesuai dengan format JSON backend
    const response = await api.get<{ success: boolean; data: DashboardResponse }>('/dash', { params });
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

  /**
   * Get unread waiting count for dashboard badge
   * Backend: /dash/unread
   */
  getUnreadCount: async (): Promise<{ success: boolean; data: { count: number } }> => {
    const response = await api.get<{ success: boolean; data: { count: number } }>('/dash/unread');
    return response.data;
  },
};