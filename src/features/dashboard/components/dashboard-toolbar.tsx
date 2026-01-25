"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Search, Plus, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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

  const handleDateSelect = useCallback((range: { from?: Date; to?: Date } | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: range?.from,
        to: range?.to,
      },
    });
  }, [filters, onFiltersChange]);

  const clearDateFilter = useCallback(() => {
    onFiltersChange({
      ...filters,
      dateRange: { from: undefined, to: undefined },
    });
  }, [filters, onFiltersChange]);

  // Format tanggal untuk display
  const formatDateRange = () => {
    if (!filters.dateRange.from) return "Pilih Tanggal";
    if (!filters.dateRange.to) {
      return format(filters.dateRange.from, "dd MMM yyyy", { locale: localeId });
    }
    return `${format(filters.dateRange.from, "dd MMM", { locale: localeId })} - ${format(filters.dateRange.to, "dd MMM yyyy", { locale: localeId })}`;
  };

  return (
    <header className="space-y-3">
      {/* Row 1: Buat Surat Button (di atas, lebar sama dengan tabs) */}
      {config.hasInboxOutbox && hasToolbarAction(role, "buat_surat") && (
        <div>
          <Button asChild className="w-[320px] bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white">
            <Link href="/pengajuan/buat">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Buat Surat
            </Link>
          </Button>
        </div>
      )}

      {/* Row 2: Tabs + Filters (sejajar) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs Surat Masuk/Keluar */}
        {config.hasInboxOutbox && (
          <nav aria-label="Tipe surat" className="flex">
            <Button
              variant={filters.type === "masuk" ? "default" : "ghost"}
              onClick={() => handleTypeChange("masuk")}
              className={`w-[160px] rounded-r-none border ${filters.type === "masuk"
                ? "bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white border-[#2B2B2B]"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              Surat Masuk
              {tabCounts && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${filters.type === "masuk" ? "bg-white/20" : "bg-gray-100"
                  }`}>
                  {tabCounts.masuk}
                </span>
              )}
            </Button>
            <Button
              variant={filters.type === "keluar" ? "default" : "ghost"}
              onClick={() => handleTypeChange("keluar")}
              className={`w-[160px] rounded-l-none border-l-0 border ${filters.type === "keluar"
                ? "bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white border-[#2B2B2B]"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              Surat Keluar
              {tabCounts && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${filters.type === "keluar" ? "bg-white/20" : "bg-gray-100"
                  }`}>
                  {tabCounts.keluar}
                </span>
              )}
            </Button>
          </nav>
        )}

        {/* Ajukan Surat Button - untuk role Pengaju (Mahasiswa/Dosen) */}
        {hasToolbarAction(role, "ajukan_surat") && (
          <Link href="/pengajuan/buat">
            <Button className="bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajukan Surat
            </Button>
          </Link>
        )}

        {/* Right side filters group - Date, Status, Search */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {/* Date Range Picker */}
          {hasToolbarAction(role, "filter_date") && (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-start text-left font-normal bg-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className={filters.dateRange.from ? "text-foreground" : "text-muted-foreground"}>
                    {formatDateRange()}
                  </span>
                  {filters.dateRange.from && (
                    <X
                      className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateFilter();
                      }}
                      aria-label="Hapus filter tanggal"
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateRange.from,
                    to: filters.dateRange.to,
                  }}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  locale={localeId}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Status Filter */}
          {hasToolbarAction(role, "filter_status") && (
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
                className="pl-9 bg-white"
                aria-label="Cari surat"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
