// src/features/dashboard/types/index.ts

/**
 * Pagination structure
 */
export interface DashboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Dashboard Item
 */
export interface DashboardItem {
  id: string;
  judulSurat: string;
  tipeSurat: string;
  jenisSurat?: string;
  nomorSurat?: string;
  namaPengaju?: string;
  tanggalSurat: string;
  status: string;
  displayStatus: string;
  actions: string[];
}

export interface DashboardColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface DashboardTab {
  key: string;
  label: string;
  count: number;
}

export interface DashboardStatistics {
  total: number;
  pending: number;
  completed: number;
  waiting?: number;
  thisMonth?: number;
  rejected?: number;
}

/**
 * Response structure from /dash
 */
export interface DashboardResponse {
  userRole: string;
  items: DashboardItem[];
  pagination: DashboardPagination;
  columns: DashboardColumn[];
  statistics: DashboardStatistics;
  tabs?: DashboardTab[];
  filters?: {
    status: string[];
  };
}

export interface RecentActivity {
  id: string;
  action: string;
  letterTitle: string;
  documentType: string;
  actorName: string;
  timestamp: string;
}

export interface DashboardParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}