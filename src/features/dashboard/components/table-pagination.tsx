"use client";

import { Pagination } from "@heroui/react";

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
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TablePagination({ pagination, onPageChange }: TablePaginationProps) {
  const { page, totalPages } = pagination;

  // Tidak tampilkan jika tidak ada data atau hanya 1 halaman
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex w-full justify-end py-4">
      <Pagination
        isCompact
        showControls
        page={page}
        total={totalPages}
        onChange={onPageChange}
      />
    </div>
  );
}
