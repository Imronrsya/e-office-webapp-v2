"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert } from "lucide-react";
import { useAdminUsers } from "@/features/admin-users/hooks/useAdminUsers";
import { UserToolbar } from "@/features/admin-users/components/user-toolbar";
import { AdminUserTable, AdminUserTableSkeleton } from "@/features/admin-users/components/admin-user-table";
import { UserFormDialog } from "@/features/admin-users/components/user-form-dialog";
import { ResetPasswordDialog } from "@/features/admin-users/components/reset-password-dialog";
import { DeleteUserDialog } from "@/features/admin-users/components/delete-user-dialog";
import { ReactivateUserDialog } from "@/features/admin-users/components/reactivate-user-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/features/dashboard/components/table-pagination";
import type {
  AdminUserDetail,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/services/adminUser.service";

export default function PenggunaPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PenggunaSkeleton />;
  }

  // ── SUPERADMIN guard ──
  if (user && user.role !== "SUPERADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <ShieldAlert className="size-12 text-destructive" />
        <h2 className="text-xl font-semibold">Akses Ditolak</h2>
        <p className="text-muted-foreground">
          Halaman ini hanya dapat diakses oleh Super Admin.
        </p>
      </div>
    );
  }

  return <PenggunaContent />;
}

// ── Separated so hooks are called only for SUPERADMIN ──
function PenggunaContent() {
  const {
    users,
    meta,
    isLoading,
    roles,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    handleStatusFilterChange,
    page,
    setPage,
    limit,
    handleLimitChange,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleResetPassword,
    handleGetDetail,
    handleReactivate,
  } = useAdminUsers();

  // ── Dialog state ──
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editData, setEditData] = useState<AdminUserDetail | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Handlers ──
  const openCreateDialog = () => {
    setFormMode("create");
    setEditData(null);
    setFormOpen(true);
  };

  const openEditDialog = async (userId: string) => {
    const detail = await handleGetDetail(userId);
    if (detail) {
      setFormMode("edit");
      setEditData(detail);
      setFormOpen(true);
    }
  };

  const openResetDialog = (id: string, name: string) => {
    setResetTarget({ id, name });
    setResetOpen(true);
  };

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteOpen(true);
  };

  const openReactivateDialog = (id: string, name: string) => {
    setReactivateTarget({ id, name });
    setReactivateOpen(true);
  };

  const handleFormSubmit = async (payload: CreateUserPayload | UpdateUserPayload) => {
    if (formMode === "create") {
      await handleCreate(payload as CreateUserPayload);
    } else if (editData) {
      await handleUpdate(editData.id, payload as UpdateUserPayload);
    }
  };

  return (
    // Layout identik dengan DynamicDashboard
    <section aria-label="Manajemen Pengguna" className="flex flex-1 flex-col min-h-0">

      {/* Toolbar: header + search + filter */}
      <div className="shrink-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
            <h1 className="text-2xl font-bold text-black">Manajemen Pengguna</h1>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Status Toggle — Akun Aktif / Akun Nonaktif */}
        <nav aria-label="Status akun" className="flex mb-3">
          <Button
            variant={statusFilter === "active" ? "default" : "ghost"}
            onClick={() => handleStatusFilterChange("active")}
            className={`w-[140px] rounded-r-none border ${
              statusFilter === "active"
                ? "bg-base-black hover:bg-base-black/90 text-white border-base-black"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            Akun Aktif
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "ghost"}
            onClick={() => handleStatusFilterChange("inactive")}
            className={`w-[160px] rounded-l-none border-l-0 border ${
              statusFilter === "inactive"
                ? "bg-base-black hover:bg-base-black/90 text-white border-base-black"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            Akun Nonaktif
          </Button>
        </nav>

        {/* Search + Role Filter */}
        <UserToolbar
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          roles={roles}
        />
      </div>

      {/* Table Card — scrollbar di dalam card, identik dengan DynamicDashboard */}
      <div
        className="mt-4 flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-white"
      >
        <div className="h-full overflow-auto">
          <AdminUserTable
            users={users}
            meta={meta}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            isLoading={isLoading}
            onEdit={(id) => openEditDialog(id)}
            onResetPassword={(id, name) => openResetDialog(id, name)}
            onDelete={(id, name) => openDeleteDialog(id, name)}
            statusFilter={statusFilter}
            onReactivate={(id, name) => openReactivateDialog(id, name)}
          />
        </div>
      </div>

      {/* Pagination — identik dengan DynamicDashboard */}
      <div className="shrink-0 mt-4 border-t border-gray-200 pt-2">
        <TablePagination
          pagination={{
            page,
            limit,
            total: meta.total,
            totalPages: meta.totalPages,
          }}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* ── Dialogs ── */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        roles={roles}
        editData={editData}
        onSubmit={handleFormSubmit}
      />
      {resetTarget && (
        <ResetPasswordDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          userName={resetTarget.name}
          onConfirm={async () => { await handleResetPassword(resetTarget.id); }}
        />
      )}
      {deleteTarget && (
        <DeleteUserDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          userName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
      {reactivateTarget && (
        <ReactivateUserDialog
          open={reactivateOpen}
          onOpenChange={setReactivateOpen}
          userName={reactivateTarget.name}
          onConfirm={() => handleReactivate(reactivateTarget.id)}
        />
      )}
    </section>
  );
}

// ── Skeleton Loader ──
function PenggunaSkeleton() {
  return (
    <section className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
            <h1 className="text-2xl font-bold text-black">Manajemen Pengguna</h1>
          </div>
          <Skeleton className="h-10 w-40 bg-zinc-200" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1 bg-zinc-200" />
          <Skeleton className="h-10 w-[180px] bg-zinc-200" />
        </div>
      </div>

      {/* Table Card Skeleton — identik dengan DynamicDashboard skeleton */}
      <div className="mt-4 flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-white">
        <div className="h-full overflow-auto">
          <AdminUserTableSkeleton />
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="shrink-0 mt-4 border-t border-gray-200 pt-2">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-8 w-[60px] rounded-lg bg-zinc-200" />
          <Skeleton className="h-8 w-[180px] rounded-lg bg-zinc-200" />
        </div>
      </div>
    </section>
  );
}
