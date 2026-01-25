"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import type { ColumnConfig } from "../config/dashboard-config";
import type { DashboardItem } from "@/features/dashboard/types";
// ============================================================================
// TYPES
// ============================================================================

interface LetterTableProps {
  columns: ColumnConfig[];
  data: DashboardItem[];
  loading?: boolean;
  emptyMessage?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "d/M/yyyy", { locale: localeId });
  } catch {
    return dateString;
  }
}

function formatTipeSurat(tipe: string): string {
  const mapping: Record<string, string> = {
    SURAT_TUGAS: "Surat Tugas",
    SURAT_KEPUTUSAN: "Surat Keputusan",
    "Surat Tugas": "Surat Tugas",
    "Surat Keputusan": "Surat Keputusan",
  };
  return mapping[tipe] || tipe;
}

function formatJenisSurat(jenis: string): string {
  const mapping: Record<string, string> = {
    AKADEMIK: "Akademik",
    SUMBER_DAYA: "Sumber Daya",
    UMUM: "Umum",
  };
  return mapping[jenis] || jenis || "-";
}

function formatStatus(status: string): string {
  // Return as-is (snake_case) like in the design
  return status.toLowerCase();
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TableSkeleton({ columns }: { columns: ColumnConfig[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {columns.map((col) => (
            <TableCell key={col.key} className="py-4">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ============================================================================
// CELL RENDERER
// ============================================================================

interface CellRendererProps {
  column: ColumnConfig;
  item: DashboardItem;
}

function CellRenderer({ column, item }: CellRendererProps) {
  switch (column.key) {
    case "namaPengaju":
      return (
        <span className="text-sm text-foreground block truncate" title={item.namaPengaju || "-"}>
          {item.namaPengaju || "-"}
        </span>
      );

    case "judulSurat":
      return (
        <span className="text-sm text-foreground block truncate" title={item.judulSurat}>
          {item.judulSurat}
        </span>
      );

    case "nomorSurat":
      return (
        <span className="text-sm text-muted-foreground font-mono block truncate" title={item.nomorSurat || "-"}>
          {item.nomorSurat || "-"}
        </span>
      );

    case "tipeSurat":
      return (
        <span className="text-sm text-foreground">
          {formatTipeSurat(item.tipeSurat)}
        </span>
      );

    case "jenisSurat":
      return (
        <span className="text-sm text-foreground">
          {formatJenisSurat(item.jenisSurat || "")}
        </span>
      );

    case "tanggalSurat":
      return (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(item.tanggalSurat)}
        </span>
      );

    case "status":
      return (
        <span className="text-sm text-blue-600 hover:underline cursor-default">
          {formatStatus(item.displayStatus || item.status)}
        </span>
      );

    case "actions":
      return (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8 px-3 text-sm"
        >
          <Link href={`/detail/${item.id}`}>
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Detail
          </Link>
        </Button>
      );

    default:
      return <span className="text-sm">-</span>;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LetterTable({
  columns,
  data,
  loading = false,
  emptyMessage = "Tidak ada data yang ditemukan",
}: LetterTableProps) {
  return (
    <div className="rounded-lg border border-border bg-white shadow-sm overflow-x-auto">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50 border-b">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`text-sm font-medium text-slate-700 py-3 px-4 whitespace-nowrap ${column.className || ""}`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton columns={columns} />
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50 border-b last:border-0">
                {columns.map((column) => (
                  <TableCell key={column.key} className={`py-3.5 px-4 ${column.className || ""}`}>
                    <CellRenderer column={column} item={item} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
