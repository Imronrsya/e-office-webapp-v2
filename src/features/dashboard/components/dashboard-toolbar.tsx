"use client";

import { useCallback, useState } from "react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
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
import { BuatSuratDialog } from "./buat-surat-dialog";

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

// Roles that should use the BuatSuratDialog instead of direct link
const STAFF_ROLES = ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"];

export function DashboardToolbar({
  role,
  config,
  filters,
  onFiltersChange,
  availableStatuses,
  tabCounts,
}: DashboardToolbarProps) {
  const [buatSuratDialogOpen, setBuatSuratDialogOpen] = useState(false);

  // Check if this role is a staff role
  const isStaffRole = STAFF_ROLES.includes(role);

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
      {/* Row 1: Buat Surat Button (di atas, lebar sama dengan tabs) */}
      {config.hasInboxOutbox && hasToolbarAction(role, "buat_surat") && (
        <div>
          {isStaffRole ? (
            // Staff roles: Show dialog with category/template selection
            <>
              <Button 
                onClick={() => setBuatSuratDialogOpen(true)}
                className="w-[320px] bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Buat Surat
              </Button>
              <BuatSuratDialog 
                open={buatSuratDialogOpen} 
                onOpenChange={setBuatSuratDialogOpen}
                userRole={role}
              />
            </>
          ) : (
            // Other roles: Direct link to pengajuan form
            <Button asChild className="w-[320px] bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white">
              <Link href="/pengajuan/buat">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Buat Surat
              </Link>
            </Button>
          )}
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
