"use client";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, KeyRound, Trash2, Users, RotateCcw } from "lucide-react";
import { ROLE_LABELS } from "@/lib/role-mapper";
import type { AdminUserListItem, PaginationMeta } from "@/services/adminUser.service";

// ============================================================================
// TYPES
// ============================================================================

interface AdminUserTableProps {
  users: AdminUserListItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEdit: (userId: string) => void;
  onResetPassword: (userId: string, userName: string) => void;
  onDelete: (userId: string, userName: string) => void;
  statusFilter?: 'active' | 'inactive';
  onReactivate?: (userId: string, userName: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  const fakultasRoles = [
    "DEKAN", "WADEK_1", "WADEK_2", "MANAJER_TU",
    "SUPERVISOR_AKADEMIK", "SUPERVISOR_SUMBER_DAYA",
    "STAF_AKADEMIK", "STAF_SUMBER_DAYA", "ADMIN_FAKULTAS", "UPA",
  ];
  if (role === "SUPERADMIN") return "destructive";
  if (fakultasRoles.includes(role)) return "default";
  if (role === "MAHASISWA") return "secondary";
  return "outline";
}

// ============================================================================
// SKELETON — hanya rows, card wrapper dihandle di page.tsx
// ============================================================================

export function AdminUserTableSkeleton() {
  return (
    <>
      {/* Header Row */}
      <div className="bg-slate-50 border-b px-4 py-3 flex gap-6 sticky top-0 z-10">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[220px]" />
        <Skeleton className="h-4 w-[140px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[80px] ml-auto" />
      </div>
      {/* Data Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 border-b last:border-0 flex gap-6 items-center">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[220px]" />
          <Skeleton className="h-6 w-[140px] rounded-full" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-8 w-[80px] ml-auto" />
        </div>
      ))}
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdminUserTable({
  users,
  isLoading,
  onEdit,
  onResetPassword,
  onDelete,
  statusFilter = 'active',
  onReactivate,
}: AdminUserTableProps) {
  if (isLoading) {
    return <AdminUserTableSkeleton />;
  }

  return (
    <table className="w-full table-fixed caption-bottom text-sm">
      {/* Header sticky di dalam card */}
      <TableHeader className="sticky top-0 z-20">
        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b shadow-[0_1px_0_0_theme(colors.border)]">
          <TableHead className="text-sm font-medium text-slate-700 py-3 px-4 whitespace-nowrap">
            Nama
          </TableHead>
          <TableHead className="text-sm font-medium text-slate-700 py-3 px-4 whitespace-nowrap">
            Email
          </TableHead>
          <TableHead className="text-sm font-medium text-slate-700 py-3 px-4 whitespace-nowrap">
            Role
          </TableHead>
          <TableHead className="text-sm font-medium text-slate-700 py-3 px-4 whitespace-nowrap">
            NIM/NIP
          </TableHead>
          <TableHead className="text-sm font-medium text-slate-700 py-3 px-4 whitespace-nowrap w-[140px] sticky right-0 bg-slate-50 z-30 shadow-[-1px_0_0_0_theme(colors.border)]">
            Aksi
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={5} className="h-auto text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-zinc-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-1">
                  {statusFilter === 'inactive'
                    ? 'Tidak ada akun nonaktif'
                    : 'Tidak ada pengguna ditemukan'}
                </h3>
                <p className="text-sm text-zinc-500 max-w-md">
                  {statusFilter === 'inactive'
                    ? 'Akun yang dinonaktifkan akan muncul di sini.'
                    : 'Pengguna akan muncul di sini setelah ditambahkan melalui tombol Tambah Pengguna.'}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow
              key={user.id}
              className="border-b last:border-0 hover:bg-transparent"
            >
              <TableCell className="py-3.5 px-4 font-medium text-sm text-foreground truncate">
                {user.name}
              </TableCell>
              <TableCell className="py-3.5 px-4 text-sm text-muted-foreground truncate">
                {user.email}
              </TableCell>
              <TableCell className="py-3.5 px-4">
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </TableCell>
              <TableCell className="py-3.5 px-4 font-mono text-sm text-foreground truncate">
                {user.identifier || "—"}
              </TableCell>
              <TableCell className="py-3.5 px-4 w-[140px] sticky right-0 bg-white z-10 shadow-[-1px_0_0_0_theme(colors.border)]">
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user.id)}
                    title="Edit"
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {statusFilter === 'inactive' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReactivate?.(user.id, user.name)}
                      title="Aktifkan Kembali"
                      className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResetPassword(user.id, user.name)}
                        title="Reset Password"
                        className="h-8 w-8 p-0"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user.id, user.name)}
                        title="Hapus"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </table>
  );
}
