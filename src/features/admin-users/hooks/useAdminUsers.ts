"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
  reactivateAdminUser,
  getAdminRoles,
  type AdminUserListItem,
  type AdminUserDetail,
  type CreateUserPayload,
  type UpdateUserPayload,
  type RoleOption,
  type PaginationMeta,
  type ListUsersParams,
} from "@/services/adminUser.service";
import { toast } from "sonner";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: ListUsersParams = {
        page,
        limit,
        status: statusFilter,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      };
      const result = await listAdminUsers(params);
      setUsers(result.data);
      setMeta(result.meta);
    } catch (error) {
      toast.error("Gagal mengambil daftar pengguna");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter]);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await getAdminRoles();
      setRoles(data);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (payload: CreateUserPayload) => {
    const result = await createAdminUser(payload);
    toast.success(
      `User berhasil dibuat. Password default: ${result.defaultPassword}`
    );
    await fetchUsers();
    return result;
  };

  const handleUpdate = async (id: string, payload: UpdateUserPayload) => {
    await updateAdminUser(id, payload);
    toast.success("User berhasil diperbarui");
    await fetchUsers();
  };

  const handleDelete = async (id: string) => {
    await deleteAdminUser(id);
    toast.success("User berhasil dihapus");
    await fetchUsers();
  };

  const handleResetPassword = async (id: string) => {
    const result = await resetAdminUserPassword(id);
    toast.success(
      `Password berhasil direset ke: ${result.defaultPassword}`
    );
    return result;
  };

  const handleGetDetail = async (id: string): Promise<AdminUserDetail> => {
    return await getAdminUser(id);
  };

  const handleReactivate = async (id: string) => {
    await reactivateAdminUser(id);
    toast.success("Akun berhasil diaktifkan kembali");
    await fetchUsers();
  };

  return {
    users,
    meta,
    isLoading,
    roles,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    handleStatusFilterChange: (status: 'active' | 'inactive') => {
      setPage(1);
      setStatusFilter(status);
    },
    page,
    setPage,
    limit,
    handleLimitChange: (newLimit: number) => {
      setPage(1);
      setLimit(newLimit);
    },
    fetchUsers,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleResetPassword,
    handleGetDetail,
    handleReactivate,
  };
}
