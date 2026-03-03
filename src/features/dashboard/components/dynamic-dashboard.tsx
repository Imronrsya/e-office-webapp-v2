"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardItem, DashboardPagination } from "@/features/dashboard/types";

import { DashboardToolbar, type DashboardFilters, type TabCount } from "./dashboard-toolbar";
import { LetterTable } from "./letter-table";
import { TablePagination } from "./table-pagination";
import { getDashboardConfig, getColumnsForRole } from "../config/dashboard-config";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardState {
  items: DashboardItem[];
  pagination: DashboardPagination;
  availableStatuses: string[];
  tabCounts?: TabCount;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Row 1: Buat Surat Button Skeleton */}
      <div>
        <Skeleton className="h-9 w-[320px]" />
      </div>

      {/* Row 2: Tabs + Filters Skeleton (sejajar) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs Skeleton */}
        <div className="flex">
          <Skeleton className="h-9 w-[160px] rounded-r-none" />
          <Skeleton className="h-9 w-[160px] rounded-l-none" />
        </div>

        {/* Filters Skeleton (right side) */}
        <div className="flex items-center gap-3 ml-auto">
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[200px]" />
        </div>
      </div>

      {/* Table Skeleton - mirip struktur table sebenarnya */}
      <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="bg-slate-50 border-b px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px] ml-auto" />
        </div>
        {/* Data Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b last:border-0 flex gap-4 items-center">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-8 w-[70px] ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    >
      <h3 className="text-lg font-semibold text-red-800">Terjadi Kesalahan</h3>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DynamicDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = user?.role?.toUpperCase() || "MAHASISWA";

  // Read tab from URL query parameter (default to "masuk" if not specified)
  const tabFromUrl = searchParams?.get("tab");
  const initialTab = tabFromUrl === "keluar" ? "keluar" : "masuk";

  // State
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    search: "",
    status: "",
    dateRange: { from: undefined, to: undefined },
    type: initialTab,
  });
  const [page, setPage] = useState(1);

  // Get role configuration
  const config = useMemo(() => getDashboardConfig(userRole), [userRole]);

  // Get columns based on role and current type
  const columns = useMemo(
    () => getColumnsForRole(userRole, config.hasInboxOutbox ? filters.type : undefined),
    [userRole, config.hasInboxOutbox, filters.type]
  );

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Format date range (YYYY-MM-DD in local time)
      const formatToLocalDateString = (date?: Date) => {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const dateFrom = formatToLocalDateString(filters.dateRange.from);
      const dateTo = formatToLocalDateString(filters.dateRange.to);

      // Send displayStatus filter to backend for server-side filtering
      const params = {
        page,
        limit: 5, // 5 rows per page
        search: filters.search || undefined,
        displayStatus: filters.status || undefined, // Server-side displayStatus filter
        type: config.hasInboxOutbox ? filters.type : undefined,
        dateFrom,
        dateTo,
      };

      const response = await dashboardService.getDashboard(params);

      // Extract tab counts from response tabs
      const tabCounts = response.data.tabs?.reduce(
        (acc, tab) => {
          if (tab.key === "masuk") {
            acc.masuk = tab.count;
            acc.masukWaiting = (tab as any).waitingCount ?? 0;
          }
          if (tab.key === "keluar") {
            acc.keluar = tab.count;
            acc.keluarWaiting = (tab as any).waitingCount ?? 0;
          }
          return acc;
        },
        { masuk: 0, keluar: 0, masukWaiting: 0, keluarWaiting: 0 } as TabCount
      );

      setData({
        items: response.data.items,
        pagination: response.data.pagination,
        availableStatuses: response.data.filters?.status || [],
        tabCounts,
      });
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);

      // Handle unauthorized - redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
        return;
      }

      setError(err.response?.data?.message || "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, [page, filters.search, filters.status, filters.type, filters.dateRange, config.hasInboxOutbox, router]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, filters.search ? 500 : 0); // Debounce untuk search

    return () => clearTimeout(timeoutId);
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status, filters.type, filters.dateRange]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Render loading state
  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  // Render error state
  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section
      aria-label="Dashboard Surat"
      className="space-y-4"
    >
      {/* Toolbar */}
      <DashboardToolbar
        role={userRole}
        config={config}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableStatuses={data?.availableStatuses || []}
        tabCounts={data?.tabCounts}
      />

      {/* Table */}
      <LetterTable
        columns={columns}
        data={data?.items || []}
        loading={loading}
        filterType={config.hasInboxOutbox ? filters.type : undefined}
        emptyMessage={
          filters.search
            ? `Tidak ditemukan hasil untuk "${filters.search}"`
            : filters.status
              ? `Tidak ada surat dengan status "${filters.status}"`
              : "Belum ada data surat"
        }
      />

      {/* Pagination */}
      {data?.pagination && (
        <TablePagination
          pagination={data.pagination}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
}
