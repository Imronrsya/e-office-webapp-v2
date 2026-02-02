"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <nav 
      aria-label="Navigasi halaman" 
      className="flex items-center justify-center gap-1 py-4"
    >
      {/* Previous Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Halaman sebelumnya"
        className="h-9 px-3 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, index) =>
          pageNum === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Halaman ${pageNum}`}
              aria-current={page === pageNum ? "page" : undefined}
              className={`h-9 w-9 p-0 ${
                page === pageNum 
                  ? "bg-slate-800 hover:bg-slate-700 text-white" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pageNum}
            </Button>
          )
        )}
      </div>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Halaman selanjutnya"
        className="h-9 px-3 text-muted-foreground hover:text-foreground"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  );
}
