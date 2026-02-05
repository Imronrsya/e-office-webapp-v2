"use client";

import * as React from "react";
import { useProdiListByDepartemen, useProdiList } from "@/hooks/useMasterData";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface ProdiSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  filterDepartemen?: string;
  autoFillFromProfile?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * ProdiSelect Component
 * Reusable dropdown for selecting Program Studi with dynamic data from API
 * 
 * Features:
 * - Auto-fill from user profile (if autoFillFromProfile=true)
 * - Filter by department (if filterDepartemen provided)
 * - Loading and error states
 * - Flat list display (not grouped)
 */
export function ProdiSelect({
  value,
  onChange,
  disabled = false,
  filterDepartemen,
  autoFillFromProfile = false,
  placeholder = "Pilih Program Studi",
  className,
}: ProdiSelectProps) {
  const { user } = useAuth();
  const { data: prodiList, isLoading, error } = filterDepartemen
    ? useProdiListByDepartemen(filterDepartemen)
    : useProdiList();

  const [localValue, setLocalValue] = React.useState<string | undefined>(value);

  // Auto-fill from user profile
  React.useEffect(() => {
    if (autoFillFromProfile && user) {
      // Check if user has mahasiswa or pegawai profile with programStudiId
      const programStudiId = 
        (user as any)?.mahasiswa?.programStudiId || 
        (user as any)?.pegawai?.programStudiId;

      if (programStudiId && !localValue) {
        setLocalValue(programStudiId);
        onChange?.(programStudiId);
      }
    }
  }, [autoFillFromProfile, user, localValue, onChange]);

  // Sync with external value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground h-9 px-3 border rounded-md">
        <Loader2 className="size-4 animate-spin" />
        <span>Memuat data prodi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive h-9 px-3 border border-destructive rounded-md flex items-center">
        Gagal memuat data prodi
      </div>
    );
  }

  return (
    <Select
      value={localValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {prodiList.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">
            Tidak ada program studi
          </div>
        ) : (
          prodiList.map((prodi) => (
            <SelectItem key={prodi.id} value={prodi.id}>
              {prodi.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
