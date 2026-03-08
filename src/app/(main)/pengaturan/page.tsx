"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ShieldAlert, Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type {
  DepartmentItem,
  ProdiItem,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  CreateProdiPayload,
  UpdateProdiPayload,
} from "@/services/departmentSettings.service";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addProdi,
  updateProdi,
  deleteProdi,
} from "@/services/departmentSettings.service";

// ============================================================================
// Main Page
// ============================================================================

export default function PengaturanPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PengaturanSkeleton />;
  }

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

  return <PengaturanContent />;
}

// ============================================================================
// Content (separated so hooks only run for SUPERADMIN)
// ============================================================================

function PengaturanContent() {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Department dialogs
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [deptDialogMode, setDeptDialogMode] = useState<"create" | "edit">("create");
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deleteDeptOpen, setDeleteDeptOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);

  // Prodi dialogs
  const [prodiDialogOpen, setProdiDialogOpen] = useState(false);
  const [prodiDialogMode, setProdiDialogMode] = useState<"create" | "edit">("create");
  const [prodiParentDeptId, setProdiParentDeptId] = useState<string>("");
  const [editingProdi, setEditingProdi] = useState<ProdiItem | null>(null);
  const [deleteProdiOpen, setDeleteProdiOpen] = useState(false);
  const [deletingProdi, setDeletingProdi] = useState<ProdiItem | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listDepartments();
      setDepartments(data);
    } catch {
      toast.error("Gagal memuat data departemen");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ── Department CRUD ──
  const handleDeptSubmit = async (payload: CreateDepartmentPayload | UpdateDepartmentPayload) => {
    try {
      if (deptDialogMode === "create") {
        await createDepartment(payload as CreateDepartmentPayload);
        toast.success("Departemen berhasil ditambahkan");
      } else if (editingDept) {
        await updateDepartment(editingDept.id, payload as UpdateDepartmentPayload);
        toast.success("Departemen berhasil diperbarui");
      }
      setDeptDialogOpen(false);
      fetchDepartments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  const handleDeptDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteDepartment(deletingDept.id);
      toast.success("Departemen berhasil dihapus");
      setDeleteDeptOpen(false);
      fetchDepartments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Gagal menghapus departemen";
      toast.error(msg);
    }
  };

  // ── Prodi CRUD ──
  const handleProdiSubmit = async (payload: CreateProdiPayload | UpdateProdiPayload) => {
    try {
      if (prodiDialogMode === "create") {
        await addProdi(prodiParentDeptId, payload as CreateProdiPayload);
        toast.success("Program Studi berhasil ditambahkan");
      } else if (editingProdi) {
        await updateProdi(editingProdi.id, payload as UpdateProdiPayload);
        toast.success("Program Studi berhasil diperbarui");
      }
      setProdiDialogOpen(false);
      fetchDepartments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  const handleProdiDelete = async () => {
    if (!deletingProdi) return;
    try {
      await deleteProdi(deletingProdi.id);
      toast.success("Program Studi berhasil dihapus");
      setDeleteProdiOpen(false);
      fetchDepartments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Gagal menghapus program studi";
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="space-y-6 pb-6">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
            <h1 className="text-2xl font-bold text-black">Pengaturan Departemen</h1>
          </div>
          <Button
            onClick={() => {
              setDeptDialogMode("create");
              setEditingDept(null);
              setDeptDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Tambah Departemen
          </Button>
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && departments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Belum ada departemen.</p>
            </CardContent>
          </Card>
        )}

        {/* ── Department cards ── */}
        {!isLoading &&
          departments.map((dept) => {
            const isFSM = dept.code === "FSM";

            return (
              <Card key={dept.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Kode: <span className="font-mono">{dept.code}</span>
                      {" · "}
                      {dept._count.mahasiswa} Mahasiswa
                      {" · "}
                      {dept._count.pegawai} Pegawai
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeptDialogMode("edit");
                        setEditingDept(dept);
                        setDeptDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {!isFSM && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingDept(dept);
                          setDeleteDeptOpen(true);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {!isFSM && (
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Program Studi
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProdiDialogMode("create");
                          setProdiParentDeptId(dept.id);
                          setEditingProdi(null);
                          setProdiDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1 size-3" />
                        Tambah Prodi
                      </Button>
                    </div>

                    {dept.programStudi.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Belum ada program studi.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dept.programStudi.map((prodi) => (
                          <div
                            key={prodi.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <GraduationCap className="size-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{prodi.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {prodi.jenjang}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {prodi.code}
                              </span>
                              {prodi.hasKaprodi && (
                                <Badge variant="secondary" className="text-xs">
                                  Kaprodi
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => {
                                  setProdiDialogMode("edit");
                                  setProdiParentDeptId(dept.id);
                                  setEditingProdi(prodi);
                                  setProdiDialogOpen(true);
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => {
                                  setDeletingProdi(prodi);
                                  setDeleteProdiOpen(true);
                                }}
                              >
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

        {/* ── Department Dialog ── */}
        <DepartmentDialog
          open={deptDialogOpen}
          onOpenChange={setDeptDialogOpen}
          mode={deptDialogMode}
          editData={editingDept}
          onSubmit={handleDeptSubmit}
        />

        {/* ── Delete Department Dialog ── */}
        {deletingDept && (
          <AlertDialog open={deleteDeptOpen} onOpenChange={setDeleteDeptOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Departemen</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus departemen{" "}
                  <strong>{deletingDept.name}</strong>? Departemen dengan pengguna
                  aktif tidak dapat dihapus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeptDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ── Prodi Dialog ── */}
        <ProdiDialog
          open={prodiDialogOpen}
          onOpenChange={setProdiDialogOpen}
          mode={prodiDialogMode}
          editData={editingProdi}
          onSubmit={handleProdiSubmit}
        />

        {/* ── Delete Prodi Dialog ── */}
        {deletingProdi && (
          <AlertDialog open={deleteProdiOpen} onOpenChange={setDeleteProdiOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Program Studi</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus prodi{" "}
                  <strong>{deletingProdi.name}</strong>? Prodi dengan pengguna
                  aktif tidak dapat dihapus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleProdiDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </div>
    </>
  );
}
// Department Form Dialog
// ============================================================================

function DepartmentDialog({
  open,
  onOpenChange,
  mode,
  editData,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editData: DepartmentItem | null;
  onSubmit: (payload: CreateDepartmentPayload | UpdateDepartmentPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && editData) {
      setName(editData.name);
      setCode(editData.code);
    } else {
      setName("");
      setCode("");
    }
  }, [mode, editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Nama dan kode wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), code: code.trim().toUpperCase() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Departemen" : "Edit Departemen"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name">Nama Departemen <span className="text-red-500">*</span></Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Informatika"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dept-code">Kode <span className="text-red-500">*</span></Label>
            <Input
              id="dept-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="IF"
              className="font-mono uppercase"
            />
          </div>
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
                  ? "Tambah"
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Prodi Form Dialog
// ============================================================================

const JENJANG_OPTIONS = ["D3", "S1", "S2", "S3", "PROFESI"] as const;

function ProdiDialog({
  open,
  onOpenChange,
  mode,
  editData,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editData: ProdiItem | null;
  onSubmit: (payload: CreateProdiPayload | UpdateProdiPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [jenjang, setJenjang] = useState<string>("S1");
  const [hasKaprodi, setHasKaprodi] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && editData) {
      setName(editData.name);
      setCode(editData.code);
      setJenjang(editData.jenjang);
      setHasKaprodi(editData.hasKaprodi);
    } else {
      setName("");
      setCode("");
      setJenjang("S1");
      setHasKaprodi(true);
    }
  }, [mode, editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Nama dan kode wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        jenjang: jenjang as "D3" | "S1" | "S2" | "S3" | "PROFESI",
        hasKaprodi,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Program Studi" : "Edit Program Studi"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prodi-name">Nama Program Studi <span className="text-red-500">*</span></Label>
            <Input
              id="prodi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Informatika"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prodi-code">Kode <span className="text-red-500">*</span></Label>
            <Input
              id="prodi-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="S1IF"
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Jenjang <span className="text-red-500">*</span></Label>
            <Select value={jenjang} onValueChange={setJenjang}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenjang" />
              </SelectTrigger>
              <SelectContent>
                {JENJANG_OPTIONS.map((j) => (
                  <SelectItem key={j} value={j}>
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="has-kaprodi"
              checked={hasKaprodi}
              onCheckedChange={setHasKaprodi}
            />
            <Label htmlFor="has-kaprodi" className="cursor-pointer">
              Memiliki slot Ketua Program Studi (Kaprodi)
            </Label>
          </div>
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
                  ? "Tambah"
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function PengaturanSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
          <h1 className="text-2xl font-bold text-black">Pengaturan Departemen</h1>
        </div>
        <Skeleton className="h-10 w-44 bg-zinc-200" />
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Skeleton className="h-6 w-48 mb-2 bg-zinc-200" />
                <Skeleton className="h-4 w-72 bg-zinc-200" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md bg-zinc-200" />
                <Skeleton className="h-8 w-8 rounded-md bg-zinc-200" />
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-5 w-32 bg-zinc-200" />
              <Skeleton className="h-8 w-32 bg-zinc-200" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full bg-zinc-100 rounded-md" />
              <Skeleton className="h-12 w-full bg-zinc-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
