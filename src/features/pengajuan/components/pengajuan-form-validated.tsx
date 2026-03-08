"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText, Calendar as CalendarIcon, ClipboardList, User, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  submissionService,
  type SubmissionFormData,
  type CreateSubmissionJSON,
  type LetterType,
} from "@/services/submission.service";
import {
  type MahasiswaProfile,
  type PegawaiProfile,
} from "@/services/auth.service";
import { FileUpload } from "./file-upload";
import BottomNav from "@/components/layout/bottom-nav";
import { ProdiSelect } from "@/components/forms/ProdiSelect";
import {
  getProdiDetail,
  type ProgramStudi,
} from "@/services/masterData.service";
import {
  useDepartemenList,
  useProdiListByDepartemen,
} from "@/hooks/useMasterData";

// Shadcn UI Components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Zod Schema - Single Source of Truth
import {
  createLetterSchema,
  type LetterFormData,
  VALIDATION_CONFIG,
} from "@/lib/validators/letter-schema";

// ============================================================================
// TYPE GUARDS
// ============================================================================

function isMahasiswaProfile(profile: unknown): profile is MahasiswaProfile {
  return profile !== null && typeof profile === "object" && "nim" in profile;
}

function isPegawaiProfile(profile: unknown): profile is PegawaiProfile {
  return profile !== null && typeof profile === "object" && "nip" in profile;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PengajuanFormValidated() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [selectedProdiDetail, setSelectedProdiDetail] =
    useState<ProgramStudi | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<LetterFormData | null>(null);

  // Leave Confirmation State
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Determine user role
  const userRole =
    user?.role?.toUpperCase() === "MAHASISWA" ? "MAHASISWA" : "DOSEN";

  // Initialize React Hook Form with Zod validation
  const form = useForm<LetterFormData>({
    resolver: zodResolver(createLetterSchema(userRole)),
    mode: "onChange", // Validasi real-time saat user mengetik
    defaultValues: {
      jenisSurat: undefined,
      judulSurat: "",
      keperluan: "",
      namaLengkap: "",
      nimNip: "",
      departemen: "",
      programStudi: "",
      tanggalAcara: undefined,
      durasiAcara: "", // String default value
      lokasiAcara: "",
      attachments: [],
    },
  });

  // Derived dirty state
  const watchedJenisSurat = form.watch("jenisSurat");
  const watchedJudulSurat = form.watch("judulSurat");
  const watchedKeperluan = form.watch("keperluan");
  const watchedTanggal = form.watch("tanggalAcara");
  const watchedLokasi = form.watch("lokasiAcara");

  const isDirty = useMemo(() => {
    if (watchedJenisSurat) return true;
    if (watchedJudulSurat?.trim() !== "") return true;
    if (watchedKeperluan?.trim() !== "") return true;
    if (watchedTanggal) return true;
    if (watchedLokasi?.trim() !== "") return true;
    if (files.length > 0) return true;
    return false;
  }, [watchedJenisSurat, watchedJudulSurat, watchedKeperluan, watchedTanggal, watchedLokasi, files]);

  // Handle client-side navigation clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest("a");
      if (target && target.href && !target.hasAttribute("download") && target.target !== "_blank") {
        try {
          const url = new URL(target.href);
          if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
            if (isDirty && !isSubmitting) {
              e.preventDefault();
              setPendingUrl(target.href);
              setShowLeaveConfirm(true);
            }
          }
        } catch (err) {
          // Ignore
        }
      }
    };
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [isDirty, isSubmitting]);

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    if (pendingUrl === "BACK") {
      router.back();
    } else if (pendingUrl) {
      window.location.href = pendingUrl;
    }
  };

  // Fetch master data
  const { data: departemenList, isLoading: isDeptLoading } =
    useDepartemenList();
  const departemenValue = form.watch("departemen");
  const { data: prodiList, isLoading: isProdiLoading } =
    useProdiListByDepartemen(departemenValue);

  // 1. Fetch Letter Types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await submissionService.getLetterTypes();
        console.log("[PengajuanForm] Letter types loaded:", types);
        setLetterTypes(types);
      } catch (error) {
        console.error("[PengajuanForm] Failed to load letter types:", error);
        toast.error("Error", {
          description: "Gagal memuat tipe surat.",
        });
      }
    };
    fetchTypes();
  }, [toast]);

  // 2. Auto-fill data from user profile (stage 1: basic info + departemen)
  // PENTING: Set departemen dulu, programStudi di-set di effect terpisah setelah prodiList loaded
  const userProgramStudiId = (() => {
    if (!user?.profile) return "";
    if (isMahasiswaProfile(user.profile)) return user.profile.programStudiId || "";
    if (isPegawaiProfile(user.profile)) return user.profile.programStudiId || "";
    return "";
  })();

  useEffect(() => {
    // Hanya jalankan jika user ada DAN departemenList sudah loaded
    if (!user || isDeptLoading || !departemenList || departemenList.length === 0) {
      return;
    }

    let nimNip = "";
    let departemenId = "";

    if (user.profile) {
      if (isMahasiswaProfile(user.profile)) {
        nimNip = user.profile.nim || "";
        departemenId = user.profile.departemenId || "";
      } else if (isPegawaiProfile(user.profile)) {
        nimNip = user.profile.nip || "";
        departemenId = user.profile.departemenId || "";
      }
    }

    // Verifikasi departemenId ada di list sebelum set
    const deptExists = departemenList.some(dept => dept.id === departemenId);

    form.reset({
      ...form.getValues(),
      namaLengkap: user.name || "",
      nimNip: nimNip,
      departemen: deptExists ? departemenId : "",
      // programStudi TIDAK di-set di sini, akan di-set setelah prodiList loaded
    });

    console.log("[PengajuanForm] Auto-filled form data (stage 1):", {
      namaLengkap: user.name,
      nimNip,
      departemenId,
      deptExists,
    });
  }, [user, isDeptLoading, departemenList, form]);

  // 2b. Auto-fill programStudi SETELAH prodiList loaded
  // Ini memastikan Select sudah punya items sebelum value di-set
  useEffect(() => {
    if (
      !userProgramStudiId ||
      isProdiLoading ||
      !prodiList ||
      prodiList.length === 0
    ) {
      return;
    }

    const prodiExists = prodiList.some((p) => p.id === userProgramStudiId);
    if (prodiExists && form.getValues("programStudi") !== userProgramStudiId) {
      form.setValue("programStudi", userProgramStudiId, {
        shouldValidate: true,
      });
      console.log("[PengajuanForm] Auto-filled programStudi (stage 2):", userProgramStudiId);
    }
  }, [userProgramStudiId, isProdiLoading, prodiList, form]);

  // 3. Fetch prodi details
  const programStudiValue = form.watch("programStudi");
  useEffect(() => {
    if (programStudiValue) {
      getProdiDetail(programStudiValue)
        .then(setSelectedProdiDetail)
        .catch((err) => {
          console.error("Failed to fetch prodi details:", err);
          setSelectedProdiDetail(null);
        });
    } else {
      setSelectedProdiDetail(null);
    }
  }, [programStudiValue]);

  // 4. Handle file changes
  useEffect(() => {
    form.setValue("attachments", files);
  }, [files, form]);

  // 5. Handle form submission
  const onSubmit = (data: LetterFormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (!pendingData) return;

    setShowConfirmDialog(false);
    setIsSubmitting(true);
    const data = pendingData;

    try {
      const isMahasiswa = userRole === "MAHASISWA";

      // Find letter type
      const targetCode = data.jenisSurat === "SURAT_TUGAS" ? "ST" : "SK";
      const selectedType = letterTypes.find((t) => t.code === targetCode);

      if (!selectedType) {
        toast.error("Error", {
          description: `Tipe surat dengan kode '${targetCode}' tidak ditemukan di sistem.`,
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare payload
      // Get departemen name from departemenList using ID stored in form
      const selectedDepartemen = departemenList?.find(
        (dept) => dept.id === data.departemen
      );
      const departemenName = selectedDepartemen?.name || "Departemen";

      // Get programStudi name from selectedProdiDetail or pass the ID (backend will resolve it)
      const programStudiName = selectedProdiDetail?.name || data.programStudi;

      const formDataPayload: SubmissionFormData = {
        nama: data.namaLengkap,
        nim: isMahasiswa ? data.nimNip : undefined,
        nip: !isMahasiswa ? data.nimNip : undefined,
        departemen: departemenName, // Use actual departemen name from list
        programStudi: programStudiName, // Use actual prodi name or pass ID (backend handles conversion)
        jenisSurat: data.jenisSurat as "SURAT_TUGAS" | "SURAT_KEPUTUSAN",
        keperluan: data.keperluan,
        judulAcara: data.judulSurat,
        tanggalAcara: data.tanggalAcara.toISOString(),
        durasiAcara: data.durasiAcara, // Already string, no need to format
        lokasiAcara: data.lokasiAcara,
        butuhTtdKadep: false,
      };

      const payload: CreateSubmissionJSON = {
        letterTypeId: selectedType.id,
        formData: formDataPayload,
        signatureConfig: {
          targetSigner: "DEKAN",
          requestKadepSign: false,
        },
      };

      // Submit
      let result;
      if (files.length > 0) {
        result = await submissionService.createSubmissionWithFiles(
          payload,
          files
        );
      } else {
        result = await submissionService.createSubmission(payload);
      }

      if (result.success) {
        toast.success("Berhasil", {
          description: "Surat berhasil diajukan!",
        });
        if (result.data?.id) {
          router.push(`/detail/${result.data.id}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error("Error", {
          description: result.message || "Gagal mengajukan surat",
        });
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      const msg =
        error.response?.data?.message ||
        "Terjadi kesalahan saat mengajukan surat";
      toast.error("Error", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk validasi error - tidak menampilkan toast
  const onError = (errors: any) => {
    // Error sudah ditampilkan inline melalui FormMessage
    // Tidak perlu toast
    console.log("Validation errors:", errors);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex flex-col"
      >
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-base-black rounded-full" />
            <h1 className="text-2xl font-bold text-gray-900">Pengajuan</h1>
          </div>

          <div className="space-y-6">
            <Card className="bg-neutral-50 border-zinc-400">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Detail Surat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Tipe Surat */}
                <FormField
                  control={form.control}
                  name="jenisSurat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipe Surat <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-4">
                        {/* SK Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => field.onChange("SURAT_KEPUTUSAN")}
                          className={cn(
                            "h-auto p-3 rounded-xl border transition-all justify-start min-w-[200px]",
                            field.value === "SURAT_KEPUTUSAN"
                              ? "bg-base-black border-base-black text-white hover:bg-base-black/90 hover:text-white"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-full font-medium text-xs shrink-0 transition-colors",
                                field.value === "SURAT_KEPUTUSAN"
                                  ? "bg-white text-[#2B2B2B]"
                                  : "bg-base-black text-white"
                              )}
                            >
                              SK
                            </div>
                            <span className="font-normal text-sm">
                              Surat Keputusan
                            </span>
                          </div>
                        </Button>

                        {/* ST Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => field.onChange("SURAT_TUGAS")}
                          className={cn(
                            "h-auto p-3 rounded-xl border transition-all justify-start min-w-[200px]",
                            field.value === "SURAT_TUGAS"
                              ? "bg-base-black border-base-black text-white hover:bg-base-black/90 hover:text-white"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-full font-medium text-xs shrink-0 transition-colors",
                                field.value === "SURAT_TUGAS"
                                  ? "bg-white text-[#2B2B2B]"
                                  : "bg-base-black text-white"
                              )}
                            >
                              ST
                            </div>
                            <span className="font-normal text-sm">
                              Surat Tugas
                            </span>
                          </div>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Judul Kegiatan */}
                <FormField
                  control={form.control}
                  name="judulSurat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Judul Kegiatan / Acara <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Lomba Competitive Programming Nasional"
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Keperluan */}
                <FormField
                  control={form.control}
                  name="keperluan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Keperluan <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan keperluan pembuatan surat secara detail"
                          className="bg-white min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Data Diri Section */}
            <Card className="bg-neutral-50 border-zinc-400">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Data Diri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nama Lengkap */}
                <FormField
                  control={form.control}
                  name="namaLengkap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Lengkap <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukan Nama Lengkap"
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NIM/NIP */}
                <FormField
                  control={form.control}
                  name="nimNip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {userRole === "MAHASISWA" ? "NIM" : "NIP"}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            userRole === "MAHASISWA"
                              ? "14 digit angka"
                              : "18 digit angka"
                          }
                          className="bg-white"
                          maxLength={userRole === "MAHASISWA" ? 14 : 18}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Departemen */}
                <FormField
                  control={form.control}
                  name="departemen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Departemen <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 cursor-not-allowed">
                            <SelectValue
                              placeholder={
                                isDeptLoading ? "Memuat..." : "Pilih Departemen"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departemenList?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Departemen diambil otomatis dari akun Anda dan tidak
                        dapat diubah.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Program Studi */}
                <FormField
                  control={form.control}
                  name="programStudi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Program Studi <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 cursor-not-allowed">
                            <SelectValue
                              placeholder={
                                isProdiLoading ? "Memuat..." : "Pilih Program Studi"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {prodiList?.map((prodi) => (
                            <SelectItem key={prodi.id} value={prodi.id}>
                              {prodi.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Program Studi diambil otomatis dari akun Anda dan tidak
                        dapat diubah.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Detail Pelaksanaan */}
            <Card className="bg-neutral-50 border-zinc-400">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Detail Pelaksanaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tanggal Mulai */}
                  <FormField
                    control={form.control}
                    name="tanggalAcara"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tanggal Mulai <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih tanggal mulai"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Durasi */}
                  <FormField
                    control={form.control}
                    name="durasiAcara"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Durasi <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: 3 hari, 1 minggu, dll"
                            className="bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Lokasi Kegiatan */}
                <FormField
                  control={form.control}
                  name="lokasiAcara"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Lokasi Kegiatan <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tempat pelaksanaan"
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Lampiran */}
            <Card className="bg-neutral-50 border-zinc-400">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Lampiran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="attachments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lampiran Dokumen</FormLabel>
                      <FormControl>
                        <FileUpload
                          files={files}
                          onFilesChange={setFiles}
                          maxFiles={VALIDATION_CONFIG.MAX_FILES}
                          maxSizeKB={VALIDATION_CONFIG.MAX_FILE_SIZE / 1024}
                          acceptedTypes={VALIDATION_CONFIG.ALLOWED_FILE_TYPES}
                        />
                      </FormControl>
                      <FormDescription>
                        Format: PDF, JPG, PNG. Maksimal{" "}
                        {VALIDATION_CONFIG.MAX_FILES} file, masing-masing maksimal{" "}
                        {VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          leftContent={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isDirty && !isSubmitting) {
                  setPendingUrl("BACK");
                  setShowLeaveConfirm(true);
                } else {
                  router.back();
                }
              }}
              className="bg-white hover:bg-gray-50 text-base-black font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          }
          rightContent={
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              {isSubmitting ? "Mengajukan..." : "Ajukan Surat"}
            </Button>
          }
        />

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Pengajuan</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah data yang dimasukkan sudah benar dan sesuai? Pengajuan akan diproses ke dalam sistem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Batalkan
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmSubmit();
                }}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Ya, Konfirmasi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Leave Confirmation Dialog */}
        <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Meninggalkan Halaman</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin meninggalkan halaman ini? Data yang telah Anda isi akan hilang dan Anda harus mengisi ulang dari awal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batalkan</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmLeave} className="bg-base-black hover:bg-base-black/90 text-white">
                Ya, Tinggalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}
