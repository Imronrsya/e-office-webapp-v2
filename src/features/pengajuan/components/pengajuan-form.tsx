"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
    submissionService,
    type SubmissionFormData,
    type CreateSubmissionJSON,
    type LetterType
} from "@/services/submission.service";
import { 
    type MahasiswaProfile, 
    type PegawaiProfile 
} from "@/services/auth.service";
import { FileUpload } from "./file-upload";
import BottomNav from "@/components/layout/bottom-nav";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Type guards for profile types
function isMahasiswaProfile(profile: unknown): profile is MahasiswaProfile {
    return profile !== null && typeof profile === 'object' && 'nim' in profile;
}

function isPegawaiProfile(profile: unknown): profile is PegawaiProfile {
    return profile !== null && typeof profile === 'object' && 'nip' in profile;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type JenisSurat = "SURAT_TUGAS" | "SURAT_KEPUTUSAN";
type TTDLevel = "kaprodi" | "kadep" | "";

interface FormState {
    jenisSurat: JenisSurat | "";
    judulSurat: string; // Di-mapping ke 'judulAcara' di backend
    keperluan: string;
    namaLengkap: string;
    nimNip: string;
    programStudi: string;
    namaAcara: string;
    tanggalAcara: string;
    durasiAcara: string;
    lokasiAcara: string;
    ttdLevel: TTDLevel;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PengajuanForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);

    // Initial State
    const [formState, setFormState] = useState<FormState>({
        jenisSurat: "",
        judulSurat: "",
        keperluan: "",
        namaLengkap: "",
        nimNip: "",
        programStudi: "",
        namaAcara: "",
        tanggalAcara: "",
        durasiAcara: "",
        lokasiAcara: "",
        ttdLevel: "",
    });

    // 1. Fetch Letter Types dari Backend saat component dimuat
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const types = await submissionService.getLetterTypes();
                console.log('[PengajuanForm] Letter types loaded:', types);
                setLetterTypes(types);
            } catch (error) {
                console.error('[PengajuanForm] Failed to load letter types:', error);
            }
        };
        fetchTypes();
    }, []);

    // 2. Auto-fill data diri user jika sudah login
    useEffect(() => {
        if (user) {
            // Extract NIM/NIP and Program Studi from user profile
            let nimNip = "";
            let programStudiName = "";

            // Get NIM/NIP from profile
            if (user.profile) {
                if (isMahasiswaProfile(user.profile)) {
                    nimNip = user.profile.nim || "";
                    programStudiName = user.profile.programStudi?.name || "";
                } else if (isPegawaiProfile(user.profile)) {
                    nimNip = user.profile.nip || "";
                    programStudiName = user.profile.programStudi?.name || "";
                }
            }

            // Fallback to top-level programStudi if profile doesn't have it
            if (!programStudiName && user.programStudi) {
                programStudiName = user.programStudi;
            }

            setFormState((prev) => ({
                ...prev,
                namaLengkap: user.name || "",
                nimNip: nimNip,
                programStudi: programStudiName,
            }));
        }
    }, [user]);

    // Handle perubahan input form
    const handleInputChange = (field: keyof FormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    // Handle Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi dasar tipe surat
        if (!formState.jenisSurat) {
            alert("Mohon pilih tipe surat terlebih dahulu.");
            return;
        }

        setIsSubmitting(true);

        try {
            const isMahasiswa = user?.role?.toUpperCase() === "MAHASISWA";

            // 3. MAPPING FRONTEND -> BACKEND
            // Kita cari UUID dari letterType berdasarkan kode "ST" atau "SK"
            const targetCode = formState.jenisSurat === "SURAT_TUGAS" ? "ST" : "SK";
            const selectedType = letterTypes.find(t => t.code === targetCode);

            if (!selectedType) {
                alert(`Tipe surat dengan kode '${targetCode}' tidak ditemukan di sistem.`);
                setIsSubmitting(false);
                return;
            }

            // 4. SUSUN PAYLOAD
            // Backend meminta struktur Nested Object: { letterTypeId, formData: {}, signatureConfig: {} }
            const formDataPayload: SubmissionFormData = {
                // Data Diri
                nama: formState.namaLengkap,
                nim: isMahasiswa ? formState.nimNip : undefined,
                nip: !isMahasiswa ? formState.nimNip : undefined,
                departemen: "Informatika",   // Hardcoded sementara (idealnya dari profile)
                programStudi: formState.programStudi,

                // Detail Surat
                jenisSurat: formState.jenisSurat as JenisSurat,
                keperluan: formState.keperluan,

                // PENTING: Backend pakai 'judulAcara', Frontend pakai 'judulSurat'
                judulAcara: formState.judulSurat,

                // PENTING: Backend butuh ISO Date String
                tanggalAcara: formState.tanggalAcara ? new Date(formState.tanggalAcara).toISOString() : new Date().toISOString(),

                durasiAcara: formState.durasiAcara,
                lokasiAcara: formState.lokasiAcara,

                // Config
                butuhTtdKadep: formState.ttdLevel === "kadep",
            };

            const payload: CreateSubmissionJSON = {
                letterTypeId: selectedType.id, // Menggunakan UUID asli
                formData: formDataPayload,
                signatureConfig: {
                    targetSigner: "DEKAN", // Default signer sesuai docs
                    requestKadepSign: formState.ttdLevel === "kadep",
                }
            };

            // 5. EKSEKUSI REQUEST
            // Jika ada file -> Multipart Endpoint
            // Jika tidak ada -> JSON Endpoint
            let result;
            if (files.length > 0) {
                result = await submissionService.createSubmissionWithFiles(payload, files);
            } else {
                result = await submissionService.createSubmission(payload);
            }

            // Handle Response
            if (result.success) {
                router.push("/dashboard");
            } else {
                alert(result.message || "Gagal mengajukan surat");
            }

        } catch (error: any) {
            console.error("Submission error:", error);
            // Ambil pesan error spesifik dari backend jika ada
            const msg = error.response?.data?.message || "Terjadi kesalahan saat mengajukan surat";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validasi tombol submit (Client-side validation)
    const isFormValid =
        formState.jenisSurat &&
        formState.judulSurat &&
        formState.keperluan &&
        formState.namaLengkap &&
        formState.nimNip &&
        formState.programStudi &&
        formState.tanggalAcara &&
        formState.lokasiAcara;

    return (
        <form onSubmit={handleSubmit} className="min-h-screen flex flex-col">
            {/* --- HEADER --- */}
            <div className="flex-1 w-full pb-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 bg-[#2B2B2B] rounded-full" />
                    <h1 className="text-2xl font-bold text-gray-900">Pengajuan</h1>
                </div>

                <div className="space-y-8">

                    {/* --- TIPE SURAT --- */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Tipe Surat <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-4">
                            {/* Tombol SK */}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleInputChange("jenisSurat", "SURAT_KEPUTUSAN")}
                                className={cn(
                                    "h-auto p-3 rounded-xl border transition-all justify-start min-w-[200px]",
                                    formState.jenisSurat === "SURAT_KEPUTUSAN"
                                        ? "bg-[#2B2B2B] border-[#2B2B2B] text-white hover:bg-[#2B2B2B]/90 hover:text-white"
                                        : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex items-center justify-center w-9 h-9 rounded-full font-medium text-xs shrink-0 transition-colors",
                                        formState.jenisSurat === "SURAT_KEPUTUSAN"
                                            ? "bg-white text-[#2B2B2B]"
                                            : "bg-[#2B2B2B] text-white"
                                    )}>
                                        SK
                                    </div>
                                    <span className="font-normal text-sm">Surat Keputusan</span>
                                </div>
                            </Button>

                            {/* Tombol ST */}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleInputChange("jenisSurat", "SURAT_TUGAS")}
                                className={cn(
                                    "h-auto p-3 rounded-xl border transition-all justify-start min-w-[200px]",
                                    formState.jenisSurat === "SURAT_TUGAS"
                                        ? "bg-[#2B2B2B] border-[#2B2B2B] text-white hover:bg-[#2B2B2B]/90 hover:text-white"
                                        : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex items-center justify-center w-9 h-9 rounded-full font-medium text-xs shrink-0 transition-colors",
                                        formState.jenisSurat === "SURAT_TUGAS"
                                            ? "bg-white text-[#2B2B2B]"
                                            : "bg-[#2B2B2B] text-white"
                                    )}>
                                        ST
                                    </div>
                                    <span className="font-normal text-sm">Surat Tugas</span>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* --- JUDUL & KEPERLUAN --- */}
                    <div className="space-y-2">
                        <Label htmlFor="judulSurat" className="text-sm font-medium text-gray-700">
                            Judul Kegiatan / Acara <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="judulSurat"
                            placeholder="Contoh: Lomba Competitive Programming Nasional"
                            value={formState.judulSurat}
                            onChange={(e) => handleInputChange("judulSurat", e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="keperluan" className="text-sm font-medium text-gray-700">
                            Keperluan <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="keperluan"
                            placeholder="Jelaskan keperluan pembuatan surat secara detail"
                            value={formState.keperluan}
                            onChange={(e) => handleInputChange("keperluan", e.target.value)}
                            className="bg-white min-h-[100px]"
                        />
                    </div>

                    <hr className="border-gray-200" />

                    {/* --- DATA DIRI --- */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Data Diri</h2>

                        <div className="space-y-2">
                            <Label htmlFor="namaLengkap" className="text-sm font-medium text-gray-700">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="namaLengkap"
                                placeholder="Masukan Nama Lengkap"
                                value={formState.namaLengkap}
                                onChange={(e) => handleInputChange("namaLengkap", e.target.value)}
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nimNip" className="text-sm font-medium text-gray-700">
                                    {user?.role?.toUpperCase() === "MAHASISWA" ? "NIM" : "NIP"} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="nimNip"
                                    placeholder="Nomor Induk"
                                    value={formState.nimNip}
                                    onChange={(e) => handleInputChange("nimNip", e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="programStudi" className="text-sm font-medium text-gray-700">
                                Program Studi <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formState.programStudi}
                                onValueChange={(value) => handleInputChange("programStudi", value)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Pilih Program Studi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="S1 Informatika">S1 Informatika</SelectItem>
                                    <SelectItem value="S1 Matematika">S1 Matematika</SelectItem>
                                    <SelectItem value="S1 Statistika">S1 Statistika</SelectItem>
                                    <SelectItem value="S1 Biologi">S1 Biologi</SelectItem>
                                    <SelectItem value="S1 Kimia">S1 Kimia</SelectItem>
                                    <SelectItem value="S1 Fisika">S1 Fisika</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* --- DETAIL ACARA --- */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Detail Pelaksanaan</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggalAcara" className="text-sm font-medium text-gray-700">
                                    Tanggal Mulai <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="tanggalAcara"
                                        type="date"
                                        value={formState.tanggalAcara}
                                        onChange={(e) => handleInputChange("tanggalAcara", e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="durasiAcara" className="text-sm font-medium text-gray-700">
                                    Durasi / Tanggal Selesai
                                </Label>
                                <Input
                                    id="durasiAcara"
                                    placeholder="Contoh: 3 hari / 25 Januari 2026"
                                    value={formState.durasiAcara}
                                    onChange={(e) => handleInputChange("durasiAcara", e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lokasiAcara" className="text-sm font-medium text-gray-700">
                                Lokasi Kegiatan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="lokasiAcara"
                                placeholder="Tempat pelaksanaan"
                                value={formState.lokasiAcara}
                                onChange={(e) => handleInputChange("lokasiAcara", e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* --- LEVEL TTD --- */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Tanda Tangan Tambahan (Opsional)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={formState.ttdLevel}
                                onValueChange={(value) => handleInputChange("ttdLevel", value as TTDLevel)}
                            >
                                <SelectTrigger className="bg-white flex-1">
                                    <SelectValue placeholder="Pilih jika perlu TTD Departemen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kaprodi">Hanya Kaprodi</SelectItem>
                                    <SelectItem value="kadep">Sampai Ketua Departemen</SelectItem>
                                </SelectContent>
                            </Select>
                            {formState.ttdLevel && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleInputChange("ttdLevel", "")}
                                    className="h-10 w-10 text-gray-400 hover:text-red-500"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Secara default surat akan ditandatangani oleh Ketua Departemen. Pilih opsi di atas jika surat memerlukan verifikasi berjenjang hingga Ketua Departemen.
                        </p>
                    </div>

                    <hr className="border-gray-200" />

                    {/* --- LAMPIRAN --- */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Lampiran Dokumen
                        </Label>
                        <FileUpload files={files} onFilesChange={setFiles} />
                        <p className="text-xs text-gray-500">
                            Format: PDF, JPG, PNG. Maks 5MB per file.
                        </p>
                    </div>

                    {/* Spacer footer */}
                    <div className="h-24" />
                </div>
            </div>

            {/* --- BOTTOM NAV (ACTION BUTTONS) --- */}
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
                        disabled={!isFormValid || isSubmitting}
                        className="bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Mengajukan..." : "Ajukan Surat"}
                    </Button>
                }
            />
        </form>
    );
}