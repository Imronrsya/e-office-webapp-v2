"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import { DateRangePicker } from "rsuite";
import "rsuite/DateRangePicker/styles/index.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type ToolbarAction,
  type RoleDashboardConfig,
  hasToolbarAction
} from "../config/dashboard-config";

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardFilters {
  search: string;
  status: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  type: "masuk" | "keluar";
}

export interface TabCount {
  masuk: number;
  keluar: number;
  masukWaiting: number;
  keluarWaiting: number;
}

interface DashboardToolbarProps {
  role: string;
  config: RoleDashboardConfig;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  availableStatuses: string[];
  tabCounts?: TabCount;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardToolbar({
  role,
  config,
  filters,
  onFiltersChange,
  availableStatuses,
  tabCounts,
}: DashboardToolbarProps) {

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, search: value });
  }, [filters, onFiltersChange]);

  const handleStatusChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, status: value === "all" ? "" : value });
  }, [filters, onFiltersChange]);

  const handleTypeChange = useCallback((type: "masuk" | "keluar") => {
    onFiltersChange({ ...filters, type });
  }, [filters, onFiltersChange]);

  const handleDateRangeChange = useCallback((value: [Date, Date] | null) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: value?.[0],
        to: value?.[1],
      },
    });
  }, [filters, onFiltersChange]);

  return (
    <header className="space-y-3">
      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs Surat Masuk/Keluar */}
        {config.hasInboxOutbox && (
          <nav aria-label="Tipe surat" className="flex">
            <Button
              variant={filters.type === "masuk" ? "default" : "ghost"}
              onClick={() => handleTypeChange("masuk")}
              className={`w-[160px] rounded-r-none border ${filters.type === "masuk"
                ? "bg-base-black hover:bg-base-black/90 text-white border-base-black"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              Surat Masuk
              {tabCounts && tabCounts.masukWaiting > 0 && (
                <span
                  className={`ml-2 min-w-[20px] h-[18px] px-1.5 text-[11px] font-bold rounded-full inline-flex items-center justify-center align-middle ${filters.type === "masuk"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                    }`}
                >
                  {tabCounts.masukWaiting > 99 ? "99+" : tabCounts.masukWaiting}
                </span>
              )}
            </Button>
            <Button
              variant={filters.type === "keluar" ? "default" : "ghost"}
              onClick={() => handleTypeChange("keluar")}
              className={`w-[160px] rounded-l-none border-l-0 border ${filters.type === "keluar"
                ? "bg-base-black hover:bg-base-black/90 text-white border-base-black"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              Surat Keluar
              {tabCounts && tabCounts.keluarWaiting > 0 && (
                <span
                  className={`ml-2 min-w-[20px] h-[18px] px-1.5 text-[11px] font-bold rounded-full inline-flex items-center justify-center align-middle ${filters.type === "keluar"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                    }`}
                >
                  {tabCounts.keluarWaiting > 99 ? "99+" : tabCounts.keluarWaiting}
                </span>
              )}
            </Button>
          </nav>
        )}

        {/* Right side filters group - Date, Status, Search */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {/* Date Range Picker - using rsuite */}
          {hasToolbarAction(role, "filter_date") && (
            <DateRangePicker
              format="dd MMM yyyy"
              character=" - "
              placeholder="Pilih Tanggal"
              value={
                filters.dateRange.from && filters.dateRange.to
                  ? [filters.dateRange.from, filters.dateRange.to]
                  : null
              }
              onChange={handleDateRangeChange}
              showOneCalendar={false}
              cleanable
              placement="bottomEnd"
              style={{ width: 240 }}
              className="[&_.rs-picker-toggle]:!border-input [&_.rs-picker-toggle]:!rounded-md [&_.rs-picker-toggle]:!bg-white [&_.rs-picker-toggle]:!h-9 [&_.rs-picker-toggle]:!text-sm"
            />
          )}

          {/* Status Filter */}
          {hasToolbarAction(role, "filter_status") && availableStatuses.length > 0 && (
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
                className="w-[160px] bg-white"
                aria-label="Filter berdasarkan status"
              >
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Search */}
          {hasToolbarAction(role, "search") && (
            <div className="relative w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Cari"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Cari surat"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
