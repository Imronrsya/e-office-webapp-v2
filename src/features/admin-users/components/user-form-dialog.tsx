"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/role-mapper";
import { useDepartemenList, useProdiList } from "@/hooks/useMasterData";
import type {
  AdminUserDetail,
  CreateUserPayload,
  UpdateUserPayload,
  RoleOption,
} from "@/services/adminUser.service";
import { toast } from "sonner";

// ============================================================================
// Zod Schema — Conditional validation per role
// ============================================================================

const baseSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.string().min(1, "Role wajib dipilih"),
  nim: z.string().optional(),
  tahunMasuk: z.string().optional(),
  noHp: z.string().optional(),
  nip: z.string().optional(),
  jabatan: z.string().optional(),
  departemenId: z.string().optional(),
  programStudiId: z.string().optional(),
});

const userFormSchema = baseSchema.superRefine((data, ctx) => {
  if (data.role === "MAHASISWA") {
    if (!data.nim) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NIM wajib diisi", path: ["nim"] });
    } else if (!/^\d{14}$/.test(data.nim)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NIM harus 14 digit angka", path: ["nim"] });
    }
    if (!data.departemenId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Departemen wajib dipilih", path: ["departemenId"] });
    }
    if (!data.programStudiId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Program Studi wajib dipilih", path: ["programStudiId"] });
    }
  }

  const pegawaiRoles = [
    "DOSEN", "KAPRODI", "ADMIN_PRODI", "KADEP",
    "ADMIN_FAKULTAS", "DEKAN", "WADEK_1", "WADEK_2", "MANAJER_TU",
    "SUPERVISOR_AKADEMIK", "SUPERVISOR_SUMBER_DAYA",
    "STAF_AKADEMIK", "STAF_SUMBER_DAYA", "UPA",
  ];
  if (pegawaiRoles.includes(data.role)) {
    if (!data.nip) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NIP wajib diisi", path: ["nip"] });
    } else if (!/^\d{18}$/.test(data.nip)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NIP harus 18 digit angka", path: ["nip"] });
    }
  }

  const deptLevelRoles = ["DOSEN", "KAPRODI", "ADMIN_PRODI", "KADEP", "MAHASISWA"];
  if (deptLevelRoles.includes(data.role) && data.role !== "MAHASISWA") {
    if (!data.departemenId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Departemen wajib dipilih", path: ["departemenId"] });
    }
  }

  if (["KAPRODI", "ADMIN_PRODI", "DOSEN", "KADEP"].includes(data.role)) {
    if (!data.programStudiId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Program Studi wajib dipilih", path: ["programStudiId"] });
    }
  }
});

type UserFormValues = z.infer<typeof baseSchema>;

// ============================================================================
// Props
// ============================================================================

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  roles: RoleOption[];
  editData?: AdminUserDetail | null;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
}

// ============================================================================
// Role groupings
// ============================================================================

const FAKULTAS_LEVEL_ROLES = [
  "ADMIN_FAKULTAS", "DEKAN", "WADEK_1", "WADEK_2", "MANAJER_TU",
  "SUPERVISOR_AKADEMIK", "SUPERVISOR_SUMBER_DAYA",
  "STAF_AKADEMIK", "STAF_SUMBER_DAYA", "UPA",
];

const DEPT_LEVEL_ROLES = ["MAHASISWA", "DOSEN", "KAPRODI", "ADMIN_PRODI", "KADEP"];

// ============================================================================
// Component
// ============================================================================

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  roles,
  editData,
  onSubmit,
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: departemenList } = useDepartemenList();
  const { data: prodiList } = useProdiList();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      nim: "",
      tahunMasuk: new Date().getFullYear().toString(),
      noHp: "",
      nip: "",
      jabatan: "",
      departemenId: "",
      programStudiId: "",
    },
  });

  const watchedRole = form.watch("role");
  const watchedDeptId = form.watch("departemenId");

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && editData) {
      form.reset({
        name: editData.name,
        email: editData.email,
        role: editData.role,
        nim: editData.profile?.type === "mahasiswa" ? editData.profile.nim : "",
        tahunMasuk: editData.profile?.type === "mahasiswa" ? editData.profile.tahunMasuk : "",
        noHp: editData.profile?.noHp || "",
        nip: editData.profile?.type === "pegawai" ? editData.profile.nip : "",
        jabatan: editData.profile?.type === "pegawai" ? editData.profile.jabatan : "",
        departemenId: editData.profile?.departemenId || "",
        programStudiId: editData.profile?.programStudiId || "",
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        email: "",
        role: "",
        nim: "",
        tahunMasuk: new Date().getFullYear().toString(),
        noHp: "",
        nip: "",
        jabatan: "",
        departemenId: "",
        programStudiId: "",
      });
    }
  }, [mode, editData, form, open]);

  // Filter prodi based on selected department
  const filteredProdi = watchedDeptId
    ? prodiList.filter((p) => p.departemenId === watchedDeptId)
    : prodiList;

  // For KAPRODI, only show prodi with hasKaprodi=true
  const availableProdi =
    watchedRole === "KAPRODI"
      ? filteredProdi.filter((p) => p.hasKaprodi)
      : filteredProdi;

  // UI visibility logic
  const isMahasiswa = watchedRole === "MAHASISWA";
  const isFakultasLevel = FAKULTAS_LEVEL_ROLES.includes(watchedRole);
  const isDeptLevel = DEPT_LEVEL_ROLES.includes(watchedRole);
  const showNim = isMahasiswa;
  const showNip = !isMahasiswa && watchedRole !== "" && watchedRole !== "SUPERADMIN";
  const showDepartemen = isDeptLevel;
  const showProdi = ["MAHASISWA", "DOSEN", "KAPRODI", "ADMIN_PRODI", "KADEP"].includes(watchedRole);

  const handleSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      // Build payload — only include relevant fields based on role
      const payload: any = {
        name: values.name,
        email: values.email.toLowerCase().trim(),
        role: values.role,
      };

      if (isMahasiswa) {
        payload.nim = values.nim;
        payload.tahunMasuk = values.tahunMasuk;
        payload.noHp = values.noHp;
        payload.departemenId = values.departemenId;
        payload.programStudiId = values.programStudiId;
      } else if (!isFakultasLevel && watchedRole !== "SUPERADMIN") {
        payload.nip = values.nip;
        payload.jabatan = values.jabatan;
        payload.noHp = values.noHp;
        payload.departemenId = values.departemenId;
        payload.programStudiId = values.programStudiId;
      } else if (isFakultasLevel) {
        payload.nip = values.nip;
        payload.jabatan = values.jabatan;
        payload.noHp = values.noHp;
        // departemen & prodi auto-set by backend to FSM/FAKULTAS
      }

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Pengguna Baru" : "Edit Pengguna"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Masukkan nama lengkap"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="email@undip.ac.id"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select
              value={watchedRole}
              onValueChange={(val) => {
                form.setValue("role", val, { shouldValidate: true });
                // Reset dependent fields when role changes
                form.setValue("departemenId", "");
                form.setValue("programStudiId", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {ROLE_LABELS[r.name] || r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          {/* === CONDITIONAL FIELDS === */}

          {/* NIM (Mahasiswa only) */}
          {showNim && (
            <div className="space-y-1.5">
              <Label htmlFor="nim">NIM * (14 digit)</Label>
              <Input
                id="nim"
                {...form.register("nim")}
                placeholder="24060121130001"
                maxLength={14}
              />
              {form.formState.errors.nim && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nim.message}
                </p>
              )}
            </div>
          )}

          {/* Tahun Masuk (Mahasiswa) */}
          {isMahasiswa && (
            <div className="space-y-1.5">
              <Label htmlFor="tahunMasuk">Tahun Masuk</Label>
              <Input
                id="tahunMasuk"
                {...form.register("tahunMasuk")}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
          )}

          {/* NIP (Pegawai roles) */}
          {showNip && (
            <div className="space-y-1.5">
              <Label htmlFor="nip">NIP * (18 digit)</Label>
              <Input
                id="nip"
                {...form.register("nip")}
                placeholder="198501152010121001"
                maxLength={18}
              />
              {form.formState.errors.nip && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nip.message}
                </p>
              )}
            </div>
          )}

          {/* Jabatan (Pegawai) */}
          {showNip && (
            <div className="space-y-1.5">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input
                id="jabatan"
                {...form.register("jabatan")}
                placeholder="Dosen / Staf / ..."
              />
            </div>
          )}

          {/* No HP */}
          {watchedRole && watchedRole !== "SUPERADMIN" && (
            <div className="space-y-1.5">
              <Label htmlFor="noHp">No. HP</Label>
              <Input
                id="noHp"
                {...form.register("noHp")}
                placeholder="08123456789"
              />
            </div>
          )}

          {/* Departemen (Departemen-level roles only) */}
          {showDepartemen && (
            <div className="space-y-1.5">
              <Label>Departemen *</Label>
              <Select
                value={form.watch("departemenId") || ""}
                onValueChange={(val) => {
                  form.setValue("departemenId", val, { shouldValidate: true });
                  form.setValue("programStudiId", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departemenList.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departemenId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.departemenId.message}
                </p>
              )}
            </div>
          )}

          {/* Program Studi (filtered by department) */}
          {showProdi && (
            <div className="space-y-1.5">
              <Label>
                Program Studi *
                {watchedRole === "KAPRODI" && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (hanya prodi yang memiliki slot Kaprodi)
                  </span>
                )}
              </Label>
              <Select
                value={form.watch("programStudiId") || ""}
                onValueChange={(val) =>
                  form.setValue("programStudiId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {availableProdi.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {watchedDeptId
                        ? "Tidak ada prodi tersedia"
                        : "Pilih departemen terlebih dahulu"}
                    </div>
                  ) : (
                    availableProdi.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.programStudiId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.programStudiId.message}
                </p>
              )}
            </div>
          )}

          {/* Fakultas-level info */}
          {isFakultasLevel && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Unit kerja otomatis ditetapkan ke <strong>Fakultas Sains dan Matematika</strong>.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                ? "Tambah Pengguna"
                : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
