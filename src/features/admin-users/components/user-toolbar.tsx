"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { ROLE_LABELS } from "@/lib/role-mapper";
import type { RoleOption } from "@/services/adminUser.service";

interface UserToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  roles: RoleOption[];
}

export function UserToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  roles,
}: UserToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={roleFilter === "" ? "ALL" : roleFilter}
        onValueChange={(val) => onRoleFilterChange(val === "ALL" ? "" : val)}
      >
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="Semua Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Role</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.name}>
              {ROLE_LABELS[role.name] || role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
