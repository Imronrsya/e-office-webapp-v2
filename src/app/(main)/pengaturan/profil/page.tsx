"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { profileService, type ProfileData } from "@/services/profile.service";
import { useDepartemenList, useProdiList } from "@/hooks/useMasterData";
import { getRoleLabel } from "@/lib/role-mapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera, Trash2, Upload, Loader2, User, Lock, ChevronLeft, ZoomIn, ZoomOut,
} from "lucide-react";

// ============================================================================
// Schemas
// ============================================================================

const profileFormSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  noHp: z.string().optional(),
  nim: z.string().optional(),
  tahunMasuk: z.string().optional(),
  nip: z.string().optional(),
  jabatan: z.string().optional(),
  departemenId: z.string().optional(),
  programStudiId: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter").max(32, "Maksimal 32 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak sesuai",
  path: ["confirmPassword"],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const SELF_EDIT_DEPT_PRODI_ROLES = ["MAHASISWA", "DOSEN"];

// ============================================================================
// Avatar Crop Dialog
// ============================================================================

function AvatarCropDialog({
  open, onOpenChange, imageFile, onCropComplete, isUploading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  isUploading: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const baseScaleRef = useRef(1);
  const CROP_SIZE = 240;
  const OUTPUT_SIZE = 480; // Higher resolution output

  // Load image and calculate base scale (cover)
  useEffect(() => {
    if (!imageFile) { setImageSrc(null); imgRef.current = null; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      const img = new window.Image();
      img.onload = () => {
        imgRef.current = img;
        // Base scale: make shortest side fill the circle (cover behavior)
        baseScaleRef.current = CROP_SIZE / Math.min(img.width, img.height);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      img.src = src;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Draw preview on canvas whenever zoom/offset changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageSrc) return;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill background
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Draw image: scaled and offset
    const s = baseScaleRef.current * zoom;
    const dw = img.width * s;
    const dh = img.height * s;
    const dx = (CROP_SIZE - dw) / 2 + offset.x;
    const dy = (CROP_SIZE - dh) / 2 + offset.y;
    ctx.drawImage(img, dx, dy, dw, dh);

    ctx.restore();
  }, [imageSrc, zoom, offset]);

  // Drag handlers
  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragOffset(offset);
  }, [offset]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({
      x: dragOffset.x + (clientX - dragStart.x),
      y: dragOffset.y + (clientY - dragStart.y),
    });
  }, [isDragging, dragStart, dragOffset]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // Crop and export
  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Render at higher resolution for quality
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Circular clip
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Scale offset and image size to output resolution
    const ratio = OUTPUT_SIZE / CROP_SIZE;
    const s = baseScaleRef.current * zoom * ratio;
    const dw = img.width * s;
    const dh = img.height * s;
    const dx = (OUTPUT_SIZE - dw) / 2 + offset.x * ratio;
    const dy = (OUTPUT_SIZE - dh) / 2 + offset.y * ratio;
    ctx.drawImage(img, dx, dy, dw, dh);

    canvas.toBlob((blob) => { if (blob) onCropComplete(blob); }, "image/png", 1);
  }, [zoom, offset, onCropComplete]);

  // Zoom with constraints
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(1, Math.min(3, newZoom)));
  }, []);

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-4" /> Atur Foto Profil
          </DialogTitle>
          <DialogDescription>
            Geser gambar dan atur zoom untuk mengatur area foto.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {/* Preview canvas with drag handlers */}
          <div
            className="cursor-move select-none touch-none"
            onMouseDown={(e) => { e.preventDefault(); handlePointerDown(e.clientX, e.clientY); }}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; handlePointerDown(t.clientX, t.clientY); }}
            onTouchMove={(e) => { const t = e.touches[0]; handlePointerMove(t.clientX, t.clientY); }}
            onTouchEnd={handlePointerUp}
          >
            <canvas
              ref={previewCanvasRef}
              width={CROP_SIZE}
              height={CROP_SIZE}
              className="rounded-full border-2 border-dashed border-zinc-300"
              style={{ width: CROP_SIZE, height: CROP_SIZE }}
            />
          </div>
          {/* Zoom controls */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleZoomChange(zoom - 0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <input type="range" min="1" max="3" step="0.05" value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))} className="w-36 accent-zinc-800" />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleZoomChange(zoom + 0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Hidden canvas for final crop output */}
        <canvas ref={canvasRef} className="hidden" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Batal</Button>
          <Button onClick={handleCrop} disabled={isUploading}>
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengunggah...</> : "Simpan Foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function ProfileSettingsPage() {
  const { user, checkSession, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: departemenList } = useDepartemenList();
  const { data: prodiList } = useProdiList();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", email: "", noHp: "", nim: "", tahunMasuk: "", nip: "", jabatan: "", departemenId: "", programStudiId: "" },
  });
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const watchedDeptId = profileForm.watch("departemenId");

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const data = await profileService.getMyProfile();
      setProfileData(data);
      profileForm.reset({
        name: data.name || "", email: data.email || "",
        noHp: data.profile?.noHp || "",
        nim: data.profile?.type === "mahasiswa" ? data.profile.nim || "" : "",
        tahunMasuk: data.profile?.type === "mahasiswa" ? data.profile.tahunMasuk || "" : "",
        nip: data.profile?.type === "pegawai" ? data.profile.nip || "" : "",
        jabatan: data.profile?.type === "pegawai" ? data.profile.jabatan || "" : "",
        departemenId: data.profile?.departemenId || "",
        programStudiId: data.profile?.programStudiId || "",
      });
    } catch { toast.error("Gagal memuat data profil"); }
    finally { setIsLoadingProfile(false); }
  };

  const role = profileData?.role || user?.role || "";
  const isMahasiswa = role === "MAHASISWA";
  const canEditDeptProdi = SELF_EDIT_DEPT_PRODI_ROLES.includes(role);
  const filteredProdi = watchedDeptId ? prodiList.filter((p) => p.departemenId === watchedDeptId) : prodiList;

  // ---- Handlers ----

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    setIsSavingProfile(true);
    try {
      const payload: Record<string, unknown> = { name: values.name, email: values.email.toLowerCase().trim(), noHp: values.noHp };
      if (isMahasiswa) {
        if (values.nim && !/^\d{14}$/.test(values.nim)) { toast.error("NIM harus 14 digit angka"); setIsSavingProfile(false); return; }
        payload.nim = values.nim; payload.tahunMasuk = values.tahunMasuk;
      } else if (role !== "SUPERADMIN") {
        if (values.nip && values.nip.length > 0 && !/^\d{18}$/.test(values.nip)) { toast.error("NIP harus 18 digit angka"); setIsSavingProfile(false); return; }
        payload.nip = values.nip; payload.jabatan = values.jabatan;
      }
      if (canEditDeptProdi) { payload.departemenId = values.departemenId; payload.programStudiId = values.programStudiId; }
      await profileService.updateMyProfile(payload as any);
      toast.success("Profil berhasil diperbarui");
      await checkSession(); await loadProfile();
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || "Gagal memperbarui profil"); }
    finally { setIsSavingProfile(false); }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setIsSavingPassword(true);
    try {
      await profileService.changePassword(values);
      toast.success("Password berhasil diubah");
      setShowPasswordDialog(false); passwordForm.reset();
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || "Gagal mengubah password"); }
    finally { setIsSavingPassword(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) { toast.error("Format file tidak didukung. Gunakan PNG atau JPG."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5MB"); return; }
    setSelectedFile(file); setShowCropDialog(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true);
    try {
      const croppedFile = new File([croppedBlob], "avatar.png", { type: "image/png" });
      const result = await profileService.uploadAvatar(croppedFile);
      toast.success(result.message);
      setShowCropDialog(false); setSelectedFile(null);
      // Immediately update top-nav avatar
      updateUser({ image: result.image });
      // Refresh profile data
      await loadProfile();
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || "Gagal mengunggah foto"); }
    finally { setIsUploadingAvatar(false); }
  };

  const handleAvatarDelete = async () => {
    setIsDeletingAvatar(true);
    try {
      await profileService.deleteAvatar();
      toast.success("Foto profil berhasil dihapus");
      // Immediately update top-nav avatar
      updateUser({ image: null });
      await loadProfile();
    } catch { toast.error("Gagal menghapus foto profil"); }
    finally { setIsDeletingAvatar(false); }
  };

  // ---- Loading ----

  if (isLoadingProfile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[500px] rounded-lg lg:col-span-2" />
        </div>
      </div>
    );
  }

  // ---- Render ----

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-base-black">Pengaturan Profil</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi profil dan keamanan akun Anda</p>
        </div>
      </div>

      {/* 2-column desktop / stack mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Avatar + Password */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Camera className="size-4" /> Foto Profil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-28 w-28 border-2 border-gray-200">
                <AvatarImage
                  src={profileData?.image || `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/default-avatar.svg`}
                  alt={profileData?.name || "User"} className="object-cover"
                />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl">{profileData?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                  <Upload className="mr-2 h-4 w-4" /> Unggah
                </Button>
                {profileData?.image && (
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteAvatarDialog(true)} disabled={isDeletingAvatar}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">PNG atau JPG, maks 5MB</p>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFileSelect} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Lock className="size-4" /> Keamanan</CardTitle>
              <CardDescription>Ubah password untuk menjaga keamanan akun.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => setShowPasswordDialog(true)}>
                <Lock className="mr-2 h-4 w-4" /> Ubah Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="size-4" /> Informasi Profil</CardTitle>
            <CardDescription>Role: <span className="font-medium text-base-black">{getRoleLabel(role)}</span></CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input id="name" {...profileForm.register("name")} placeholder="Masukkan nama lengkap" />
                  {profileForm.formState.errors.name && <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" {...profileForm.register("email")} placeholder="email@undip.ac.id" />
                  {profileForm.formState.errors.email && <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>}
                </div>
              </div>

              {isMahasiswa && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nim">NIM <span className="text-red-500">*</span> (14 digit)</Label>
                    <Input id="nim" {...profileForm.register("nim")} placeholder="24060121130001" maxLength={14} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tahunMasuk">Tahun Masuk</Label>
                    <Input id="tahunMasuk" {...profileForm.register("tahunMasuk")} placeholder={new Date().getFullYear().toString()} />
                  </div>
                </div>
              )}

              {!isMahasiswa && role !== "SUPERADMIN" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nip">NIP (18 digit, opsional)</Label>
                    <Input id="nip" {...profileForm.register("nip")} placeholder="198501152010121001" maxLength={18} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jabatan">Jabatan (opsional)</Label>
                    <Input id="jabatan" {...profileForm.register("jabatan")} placeholder="Dosen / Staf / ..." />
                  </div>
                </div>
              )}

              {role !== "SUPERADMIN" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="noHp">No. HP</Label>
                    <Input id="noHp" {...profileForm.register("noHp")} placeholder="08123456789" />
                  </div>
                </div>
              )}

              {canEditDeptProdi && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Departemen <span className="text-red-500">*</span></Label>
                    <Select value={profileForm.watch("departemenId") || ""} onValueChange={(val) => { profileForm.setValue("departemenId", val, { shouldValidate: true }); profileForm.setValue("programStudiId", ""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                      <SelectContent side="bottom" avoidCollisions={false}>
                        {departemenList.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Program Studi <span className="text-red-500">*</span></Label>
                    <Select value={profileForm.watch("programStudiId") || ""} onValueChange={(val) => profileForm.setValue("programStudiId", val, { shouldValidate: true })} disabled={!watchedDeptId}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={watchedDeptId ? "Pilih program studi" : "Pilih departemen dahulu"} /></SelectTrigger>
                      <SelectContent side="top" avoidCollisions={false}>
                        {filteredProdi.length === 0
                          ? <div className="p-2 text-sm text-muted-foreground">Tidak ada prodi tersedia</div>
                          : filteredProdi.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {!canEditDeptProdi && role !== "SUPERADMIN" && profileData?.departemen && (
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-1">
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-base-black">Departemen:</span> {profileData.departemen.name}</p>
                  {profileData.programStudi && <p className="text-sm text-muted-foreground"><span className="font-medium text-base-black">Program Studi:</span> {profileData.programStudi.name}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Hanya dapat diubah oleh Super Admin.</p>
                </div>
              )}

              <Separator />
              <div className="flex justify-end">
                <Button type="submit" form="profile-form" disabled={isSavingProfile}>
                  {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Crop Dialog */}
      <AvatarCropDialog open={showCropDialog} onOpenChange={(open) => { setShowCropDialog(open); if (!open) setSelectedFile(null); }}
        imageFile={selectedFile} onCropComplete={handleCropComplete} isUploading={isUploadingAvatar} />

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="size-4" /> Ubah Password</DialogTitle>
            <DialogDescription>Masukkan password lama Anda, lalu masukkan password baru.</DialogDescription>
          </DialogHeader>
          <form id="password-form" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="oldPassword">Password Lama</Label>
              <PasswordInput id="oldPassword" {...passwordForm.register("oldPassword")} placeholder="Masukkan password lama" className="bg-white" />
              {passwordForm.formState.errors.oldPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.oldPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Password Baru</Label>
              <PasswordInput id="newPassword" {...passwordForm.register("newPassword")} placeholder="Masukkan password baru" className="bg-white" />
              {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <PasswordInput id="confirmPassword" {...passwordForm.register("confirmPassword")} placeholder="Masukkan ulang password baru" className="bg-white" />
              {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowPasswordDialog(false); passwordForm.reset(); }} disabled={isSavingPassword}>Batal</Button>
            <Button type="submit" form="password-form" disabled={isSavingPassword}>
              {isSavingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Ubah Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Avatar Confirmation Dialog */}
      <Dialog open={showDeleteAvatarDialog} onOpenChange={setShowDeleteAvatarDialog}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
          <DialogHeader>
            <DialogTitle>Hapus Foto Profil?</DialogTitle>
            <DialogDescription>
              Foto profil Anda akan dihapus dan diganti dengan avatar default. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAvatarDialog(false)} disabled={isDeletingAvatar}>Batal</Button>
            <Button variant="destructive" onClick={async () => { await handleAvatarDelete(); setShowDeleteAvatarDialog(false); }} disabled={isDeletingAvatar}>
              {isDeletingAvatar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
