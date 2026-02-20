"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Loader2, FileCheck, Mail, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type SuratType = "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN";

interface DraftSuratDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (type: SuratType) => void;
    loading?: boolean;
    /** User role to determine which surat types are available */
    userRole?: string;
    /** Letter type code from submission (e.g., "ST", "SK") to filter surat types */
    letterTypeCode?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DraftSuratDialog({
    open,
    onOpenChange,
    onSubmit,
    loading = false,
    userRole = "",
    letterTypeCode = ""
}: DraftSuratDialogProps) {
    const [selectedType, setSelectedType] = useState<SuratType | "">("");
    const [isInitializing, setIsInitializing] = useState(true);

    // Determine available surat types based on role
    const isAdminProdi = userRole === "ADMIN_PRODI";
    const isStafOrSupervisor = [
        "STAF_AKADEMIK",
        "STAF_SUMBER_DAYA",
    ].includes(userRole);

    // Determine surat hasil type based on letterTypeCode
    // SK (Surat Keputusan) pengajuan → hanya Surat Keputusan
    // ST (Surat Tugas) pengajuan → Surat Tugas atau Surat Tugas Tabel
    const isSuratKeputusanType = letterTypeCode?.toUpperCase().includes("SK");
    const isSuratTugasType = letterTypeCode?.toUpperCase().includes("ST");

    // Simulate brief loading for skeleton effect
    useEffect(() => {
        if (open) {
            setIsInitializing(true);
            const timer = setTimeout(() => {
                setIsInitializing(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleSubmit = () => {
        if (!selectedType) return;
        onSubmit(selectedType);
    };

    // Reset when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedType("");
        }
        onOpenChange(isOpen);
    };

    // Skeleton loading component for radio options
    const OptionSkeleton = () => (
        <div className="flex items-start gap-4 p-4 rounded-lg border-2 border-border">
            <Skeleton className="w-4 h-4 rounded-full mt-1" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-2xl" hideCloseButton>
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-semibold text-[#2B2B2B]">Buat Draft Surat</DialogTitle>
                    <DialogDescription className="text-sm text-[#6D6D6D]">
                        Pilih jenis surat yang akan dibuat berdasarkan pengajuan ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <Label className="text-sm font-medium mb-4 block">
                        Jenis Surat <span className="text-destructive">*</span>
                    </Label>

                    {isInitializing ? (
                        // Skeleton loading state
                        <div className="grid grid-cols-1 gap-4">
                            {isAdminProdi && <OptionSkeleton />}
                            {isStafOrSupervisor && (
                                <>
                                    {/* Show skeleton based on letter type */}
                                    {isSuratTugasType && (
                                        <>
                                            <OptionSkeleton />
                                            <OptionSkeleton />
                                        </>
                                    )}
                                    {isSuratKeputusanType && <OptionSkeleton />}
                                    {/* Fallback if no type determined yet */}
                                    {!isSuratTugasType && !isSuratKeputusanType && (
                                        <>
                                            <OptionSkeleton />
                                            <OptionSkeleton />
                                            <OptionSkeleton />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {/* Surat Pengantar Option - Only for Admin Prodi */}
                            {isAdminProdi && (
                                <div
                                    onClick={() => setSelectedType("SURAT_PENGANTAR")}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                        selectedType === "SURAT_PENGANTAR"
                                            ? "border-[#2B2B2B] bg-[#2B2B2B]/5"
                                            : "border-border hover:border-[#2B2B2B]/40 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Mail className="w-5 h-5 text-[#2B2B2B]" />
                                            <span className="font-semibold">Surat Pengantar</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Surat resmi untuk mengantar/memperkenalkan mahasiswa ke instansi tujuan.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Surat Tugas Option - For Staf/Supervisor, only if letterType is ST */}
                            {isStafOrSupervisor && isSuratTugasType && (
                                <div
                                    onClick={() => setSelectedType("SURAT_TUGAS")}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                        selectedType === "SURAT_TUGAS"
                                            ? "border-[#2B2B2B] bg-[#2B2B2B]/5"
                                            : "border-border hover:border-[#2B2B2B]/40 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="w-5 h-5 text-[#2B2B2B]" />
                                            <span className="font-semibold">Surat Tugas (ST)</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Surat yang berisi penugasan kepada seseorang untuk melaksanakan tugas tertentu.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Surat Tugas Tabel Option - For Staf/Supervisor, only if letterType is ST */}
                            {isStafOrSupervisor && isSuratTugasType && (
                                <div
                                    onClick={() => setSelectedType("SURAT_TUGAS_TABEL")}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                        selectedType === "SURAT_TUGAS_TABEL"
                                            ? "border-[#2B2B2B] bg-[#2B2B2B]/5"
                                            : "border-border hover:border-[#2B2B2B]/40 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ClipboardList className="w-5 h-5 text-[#2B2B2B]" />
                                            <span className="font-semibold">Surat Tugas (Tabel)</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Surat tugas dengan format tabel untuk menugaskan beberapa orang sekaligus.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Surat Keputusan Option - For Staf/Supervisor, only if letterType is SK */}
                            {isStafOrSupervisor && isSuratKeputusanType && (
                                <div
                                    onClick={() => setSelectedType("SURAT_KEPUTUSAN")}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                        selectedType === "SURAT_KEPUTUSAN"
                                            ? "border-[#2B2B2B] bg-[#2B2B2B]/5"
                                            : "border-border hover:border-[#2B2B2B]/40 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileCheck className="w-5 h-5 text-[#2B2B2B]" />
                                            <span className="font-semibold">Surat Keputusan (SK)</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Surat yang berisi penetapan keputusan resmi dari pejabat berwenang.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                        className="border-[#E1DFE0] text-[#2B2B2B]"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || !selectedType || isInitializing}
                        className="bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Lanjutkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
