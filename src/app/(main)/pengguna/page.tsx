"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAdminUsers } from "@/features/admin-users/hooks/useAdminUsers";
import { UserToolbar } from "@/features/admin-users/components/user-toolbar";
import { AdminUserTable } from "@/features/admin-users/components/admin-user-table";
import { UserFormDialog } from "@/features/admin-users/components/user-form-dialog";
import { ResetPasswordDialog } from "@/features/admin-users/components/reset-password-dialog";
import { DeleteUserDialog } from "@/features/admin-users/components/delete-user-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/layout/bottom-nav";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const {
    users,
    meta,
    isLoading,
    roles,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    page,
    setPage,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleResetPassword,
    handleGetDetail,
  } = useAdminUsers();

  // ── Dialog state ──
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editData, setEditData] = useState<AdminUserDetail | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

  const handleFormSubmit = async (
    payload: CreateUserPayload | UpdateUserPayload
  ) => {
    if (formMode === "create") {
      await handleCreate(payload as CreateUserPayload);
    } else if (editData) {
      await handleUpdate(editData.id, payload as UpdateUserPayload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
          <h1 className="text-2xl font-bold text-black">Manajemen Pengguna</h1>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Tambah Pengguna
        </Button>
      </div>

      <UserToolbar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        roles={roles}
      />

      <AdminUserTable
        users={users}
        meta={meta}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onEdit={(id) => openEditDialog(id)}
        onResetPassword={(id, name) => openResetDialog(id, name)}
        onDelete={(id, name) => openDeleteDialog(id, name)}
      />

      {/* ── Smart Form Dialog ── */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        roles={roles}
        editData={editData}
        onSubmit={handleFormSubmit}
      />

      {/* ── Reset Password Dialog ── */}
      {resetTarget && (
        <ResetPasswordDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          userName={resetTarget.name}
          onConfirm={async () => { await handleResetPassword(resetTarget.id); }}
        />
      )}

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <DeleteUserDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          userName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}

      {/* Spacer for bottom nav */}
      <div className="h-24"></div>

      <BottomNav
        leftContent={
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="bg-white hover:bg-gray-50 text-base-black font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />
    </div>
  );
}

// ── Skeleton Loader ──
function PenggunaSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
          <h1 className="text-2xl font-bold text-black">Manajemen Pengguna</h1>
        </div>
        <Skeleton className="h-10 w-40 bg-zinc-200" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1 bg-zinc-200" />
        <Skeleton className="h-10 w-[180px] bg-zinc-200" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-[150px] bg-zinc-200" />
          <Skeleton className="h-4 w-[120px] bg-zinc-200" />
          <Skeleton className="h-4 w-[100px] bg-zinc-200" />
          <Skeleton className="h-4 w-[100px] bg-zinc-200" />
          <Skeleton className="h-4 w-[60px] ml-auto bg-zinc-200" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b last:border-0 flex gap-4 items-center">
            <Skeleton className="h-4 w-[150px] bg-zinc-200" />
            <Skeleton className="h-4 w-[120px] bg-zinc-200" />
            <Skeleton className="h-4 w-[100px] bg-zinc-200" />
            <Skeleton className="h-4 w-[100px] bg-zinc-200" />
            <Skeleton className="h-8 w-[70px] ml-auto bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
