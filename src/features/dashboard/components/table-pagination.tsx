"use client";

import { Pagination } from "@heroui/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TablePaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LIMIT_OPTIONS = [5, 10, 15, 20, 50];

// ============================================================================
// COMPONENT
// ============================================================================

export function TablePagination({
  pagination,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  const { page, limit, totalPages } = pagination;

  // Don't render at all if no data and no limit changer
  if (totalPages < 1 && !onLimitChange) {
    return null;
  }

  // Always show at least 1 page
  const effectiveTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex w-full flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
      {/* Rows per page */}
      {onLimitChange ? (
        <Select
          value={String(limit)}
          onValueChange={(val) => onLimitChange(Number(val))}
        >
          <SelectTrigger size="sm" className="w-fit min-w-[60px] gap-1 rounded-lg border-none bg-gray-100 text-xs font-medium shadow-none hover:bg-gray-200 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top" align="start" className="min-w-[60px]">
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div />
      )}

      {/* Page navigation — always visible */}
      <Pagination
        isCompact
        showControls
        page={page}
        total={effectiveTotalPages}
        onChange={onPageChange}
        isDisabled={effectiveTotalPages <= 1}
      />
    </div>
  );
}
