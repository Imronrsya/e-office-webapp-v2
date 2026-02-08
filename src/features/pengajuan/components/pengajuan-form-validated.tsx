"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText, Calendar as CalendarIcon } from "lucide-react";
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

  // 2. Auto-fill data from user profile
  // PENTING: Harus menunggu departemenList loaded agar Select bisa menampilkan value dengan benar
  useEffect(() => {
    // Hanya jalankan jika user ada DAN departemenList sudah loaded
    if (!user || isDeptLoading || !departemenList || departemenList.length === 0) {
      return;
    }

    let nimNip = "";
    let departemenId = "";
    let programStudiId = "";

    if (user.profile) {
      if (isMahasiswaProfile(user.profile)) {
        nimNip = user.profile.nim || "";
        departemenId = user.profile.departemenId || "";
        programStudiId = user.profile.programStudiId || "";
      } else if (isPegawaiProfile(user.profile)) {
        nimNip = user.profile.nip || "";
        departemenId = user.profile.departemenId || "";
        programStudiId = user.profile.programStudiId || "";
      }
    }

    // Verifikasi departemenId ada di list sebelum set
    const deptExists = departemenList.some(dept => dept.id === departemenId);

    form.reset({
      ...form.getValues(),
      namaLengkap: user.name || "",
      nimNip: nimNip,
      departemen: deptExists ? departemenId : "",
      programStudi: programStudiId,
    });

    console.log("[PengajuanForm] Auto-filled form data:", {
      namaLengkap: user.name,
      nimNip,
      departemenId,
      programStudiId,
      deptExists,
    });
  }, [user, isDeptLoading, departemenList, form]);

  // 3. Fetch prodi details
  useEffect(() => {
    const prodiId = form.watch("programStudi");
    if (prodiId) {
      getProdiDetail(prodiId)
        .then(setSelectedProdiDetail)
        .catch((err) => {
          console.error("Failed to fetch prodi details:", err);
          setSelectedProdiDetail(null);
        });
    } else {
      setSelectedProdiDetail(null);
    }
  }, [form.watch("programStudi")]);

  // 4. Handle file changes
  useEffect(() => {
    form.setValue("attachments", files);
  }, [files, form]);

  // 5. Handle form submission
  const onSubmit = async (data: LetterFormData) => {
    setIsSubmitting(true);

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
        router.push("/dashboard");
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
        className="min-h-screen flex flex-col"
      >
        <div className="flex-1 w-full pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-base-black rounded-full" />
            <h1 className="text-2xl font-bold text-gray-900">Pengajuan</h1>
          </div>

          <div className="space-y-8">
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

            <hr className="border-gray-200" />

            {/* Data Diri Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Data Diri
              </h2>

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
                    <FormControl>
                      <ProdiSelect
                        value={field.value}
                        onChange={field.onChange}
                        filterDepartemen={form.watch("departemen")}
                        disabled={true}
                        placeholder="Program Studi"
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormDescription>
                      Program Studi diambil otomatis dari akun Anda dan tidak
                      dapat diubah.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <hr className="border-gray-200" />

            {/* Detail Pelaksanaan */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Detail Pelaksanaan
              </h2>

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
            </div>

            <hr className="border-gray-200" />

            {/* Lampiran */}
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

            <div className="h-6" />
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          leftContent={
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          }
          rightContent={
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="bg-base-black hover:bg-base-black/90 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              {isSubmitting ? "Mengajukan..." : "Ajukan Surat"}
            </Button>
          }
        />
      </form>
    </Form>
  );
}
