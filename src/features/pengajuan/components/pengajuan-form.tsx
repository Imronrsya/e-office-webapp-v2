"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
    submissionService,
    type SubmissionFormData,
} from "@/services/submission.service";
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

// ============================================================================
// TYPES
// ============================================================================

type JenisSurat = "SURAT_TUGAS" | "SURAT_KEPUTUSAN";
type TTDLevel = "kaprodi" | "kadep" | "";

interface FormState {
    jenisSurat: JenisSurat | "";
    judulSurat: string;
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
// COMPONENT
// ============================================================================

export function PengajuanForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
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

    // Prefill user data
    useEffect(() => {
        if (user) {
            setFormState((prev) => ({
                ...prev,
                namaLengkap: user.name || "",
            }));
        }
    }, [user]);

    const handleInputChange = (
        field: keyof FormState,
        value: string
    ) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Determine if user is mahasiswa or dosen based on role
            const isMahasiswa = user?.role?.toUpperCase() === "MAHASISWA";

            const submissionData: SubmissionFormData = {
                letterTypeId: formState.jenisSurat === "SURAT_TUGAS" ? "ST" : "SK",
                nama: formState.namaLengkap,
                nim: isMahasiswa ? formState.nimNip : undefined,
                nip: !isMahasiswa ? formState.nimNip : undefined,
                email: user?.email || "",
                noHp: "",
                departemen: "",
                programStudi: formState.programStudi,
                jenisSurat: formState.jenisSurat as JenisSurat,
                keperluan: formState.keperluan,
                judulAcara: formState.namaAcara,
                tanggalAcara: formState.tanggalAcara,
                durasiAcara: formState.durasiAcara,
                lokasiAcara: formState.lokasiAcara,
                targetSigner: "DEKAN",
                requestKadepSign: formState.ttdLevel === "kadep",
                butuhTtdKadep: formState.ttdLevel === "kadep",
            };

            const result = await submissionService.createSubmission(
                submissionData,
                files
            );

            if (result.success) {
                router.push("/dashboard");
            } else {
                alert(result.message || "Gagal mengajukan surat");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Terjadi kesalahan saat mengajukan surat");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        formState.jenisSurat &&
        formState.judulSurat &&
        formState.keperluan &&
        formState.namaLengkap &&
        formState.nimNip &&
        formState.programStudi &&
        formState.namaAcara &&
        formState.tanggalAcara &&
        formState.lokasiAcara;

    return (
        <form onSubmit={handleSubmit} className="min-h-screen flex flex-col">
            {/* Content */}
            <div className="flex-1 w-full pb-24">
                {/* Title */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 bg-[#2B2B2B] rounded-full" />
                    <h1 className="text-2xl font-bold text-gray-900">Pengajuan</h1>
                </div>

                <div className="space-y-8">
                    {/* Tipe Surat */}
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

                    {/* Judul Surat */}
                    <div className="space-y-2">
                        <Label htmlFor="judulSurat" className="text-sm font-medium text-gray-700">
                            Judul Surat <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="judulSurat"
                            placeholder="Masukan Judul Surat"
                            value={formState.judulSurat}
                            onChange={(e) => handleInputChange("judulSurat", e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    {/* Keperluan */}
                    <div className="space-y-2">
                        <Label htmlFor="keperluan" className="text-sm font-medium text-gray-700">
                            Keperluan <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="keperluan"
                            placeholder="Masukan Keperluan Surat"
                            value={formState.keperluan}
                            onChange={(e) => handleInputChange("keperluan", e.target.value)}
                            className="bg-white min-h-[100px]"
                        />
                    </div>

                    {/* Divider */}
                    <hr className="border-gray-200" />

                    {/* Data Diri Section */}
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
                                onChange={(e) =>
                                    handleInputChange("namaLengkap", e.target.value)
                                }
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nimNip" className="text-sm font-medium text-gray-700">
                                NIM/NIP <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nimNip"
                                placeholder="Masukan NIM/NIP"
                                value={formState.nimNip}
                                onChange={(e) => handleInputChange("nimNip", e.target.value)}
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="programStudi" className="text-sm font-medium text-gray-700">
                                Program Studi <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formState.programStudi}
                                onValueChange={(value) =>
                                    handleInputChange("programStudi", value)
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Pilih Program Studi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="matematika">Matematika</SelectItem>
                                    <SelectItem value="fisika">Fisika</SelectItem>
                                    <SelectItem value="kimia">Kimia</SelectItem>
                                    <SelectItem value="biologi">Biologi</SelectItem>
                                    <SelectItem value="statistika">Statistika</SelectItem>
                                    <SelectItem value="informatika">Informatika</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-gray-200" />

                    {/* Detail Acara Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Detail Acara</h2>

                        <div className="space-y-2">
                            <Label htmlFor="namaAcara" className="text-sm font-medium text-gray-700">
                                Nama Acara <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="namaAcara"
                                placeholder="Masukan Nama Acara"
                                value={formState.namaAcara}
                                onChange={(e) => handleInputChange("namaAcara", e.target.value)}
                                className="bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggalAcara" className="text-sm font-medium text-gray-700">
                                    Tanggal Acara <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="tanggalAcara"
                                        type="date"
                                        value={formState.tanggalAcara}
                                        onChange={(e) =>
                                            handleInputChange("tanggalAcara", e.target.value)
                                        }
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="durasiAcara" className="text-sm font-medium text-gray-700">
                                    Durasi Acara
                                </Label>
                                <Input
                                    id="durasiAcara"
                                    placeholder="Contoh: 3 hari"
                                    value={formState.durasiAcara}
                                    onChange={(e) =>
                                        handleInputChange("durasiAcara", e.target.value)
                                    }
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lokasiAcara" className="text-sm font-medium text-gray-700">
                                Lokasi Acara <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="lokasiAcara"
                                placeholder="Masukan Lokasi Acara"
                                value={formState.lokasiAcara}
                                onChange={(e) =>
                                    handleInputChange("lokasiAcara", e.target.value)
                                }
                                className="bg-white"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-gray-200" />

                    {/* TTD Level */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Tanda Tangan yang Dibutuhkan
                        </Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={formState.ttdLevel}
                                onValueChange={(value) =>
                                    handleInputChange("ttdLevel", value as TTDLevel)
                                }
                            >
                                <SelectTrigger className="bg-white flex-1">
                                    <SelectValue placeholder="Pilih Level Tanda Tangan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kaprodi">Sampai Kaprodi</SelectItem>
                                    <SelectItem value="kadep">Sampai Kadep</SelectItem>
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
                    </div>

                    {/* Divider */}
                    <hr className="border-gray-200" />

                    {/* Lampiran */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Lampiran Tambahan
                        </Label>
                        <FileUpload files={files} onFilesChange={setFiles} />
                    </div>

                    {/* Bottom spacing for fixed footer */}
                    <div className="h-24" />
                </div>
            </div>

            {/* Fixed Bottom Nav */}
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
