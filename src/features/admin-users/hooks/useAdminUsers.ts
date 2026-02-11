"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
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
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: ListUsersParams = {
        page,
        limit: 10,
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
  }, [page, search, roleFilter]);

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

  return {
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
    fetchUsers,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleResetPassword,
    handleGetDetail,
  };
}
