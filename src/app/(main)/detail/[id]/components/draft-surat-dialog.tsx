"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Loader2, ArrowRight, FileCheck, Mail, ClipboardList } from "lucide-react";
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
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DraftSuratDialog({
    open,
    onOpenChange,
    onSubmit,
    loading = false,
    userRole = ""
}: DraftSuratDialogProps) {
    const [selectedType, setSelectedType] = useState<SuratType | "">("");

    // Determine available surat types based on role
    const isAdminProdi = userRole === "ADMIN_PRODI";
    const isStafOrSupervisor = [
        "STAF_AKADEMIK", 
        "STAF_SUMBER_DAYA", 
        "SUPERVISOR_AKADEMIK", 
        "SUPERVISOR_SUMBER_DAYA"
    ].includes(userRole);

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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Buat Draft Surat</DialogTitle>
                    <DialogDescription>
                        Pilih jenis surat yang akan dibuat berdasarkan pengajuan ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <Label className="text-sm font-medium mb-4 block">
                        Jenis Surat <span className="text-destructive">*</span>
                    </Label>
                    
                    <RadioGroup
                        value={selectedType}
                        onValueChange={(value) => setSelectedType(value as SuratType)}
                        className="grid grid-cols-1 gap-4"
                    >
                        {/* Surat Pengantar Option - Only for Admin Prodi */}
                        {isAdminProdi && (
                            <Label
                                htmlFor="sp"
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    selectedType === "SURAT_PENGANTAR"
                                        ? "border-purple-600 bg-purple-50"
                                        : "border-border hover:border-purple-300 hover:bg-muted/50"
                                )}
                            >
                                <RadioGroupItem value="SURAT_PENGANTAR" id="sp" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="w-5 h-5 text-purple-600" />
                                        <span className="font-semibold">Surat Pengantar</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Surat resmi untuk mengantar/memperkenalkan mahasiswa ke instansi tujuan.
                                    </p>
                                </div>
                            </Label>
                        )}

                        {/* Surat Tugas Option - For Staf/Supervisor */}
                        {isStafOrSupervisor && (
                            <Label
                                htmlFor="st"
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    selectedType === "SURAT_TUGAS"
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-border hover:border-blue-300 hover:bg-muted/50"
                                )}
                            >
                                <RadioGroupItem value="SURAT_TUGAS" id="st" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="font-semibold">Surat Tugas (ST)</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Surat yang berisi penugasan kepada seseorang untuk melaksanakan tugas tertentu.
                                    </p>
                                </div>
                            </Label>
                        )}

                        {/* Surat Tugas Tabel Option - For Staf/Supervisor */}
                        {isStafOrSupervisor && (
                            <Label
                                htmlFor="stt"
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    selectedType === "SURAT_TUGAS_TABEL"
                                        ? "border-cyan-600 bg-cyan-50"
                                        : "border-border hover:border-cyan-300 hover:bg-muted/50"
                                )}
                            >
                                <RadioGroupItem value="SURAT_TUGAS_TABEL" id="stt" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ClipboardList className="w-5 h-5 text-cyan-600" />
                                        <span className="font-semibold">Surat Tugas (Tabel)</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Surat tugas dengan format tabel untuk menugaskan beberapa orang sekaligus.
                                    </p>
                                </div>
                            </Label>
                        )}

                        {/* Surat Keputusan Option - For Staf/Supervisor */}
                        {isStafOrSupervisor && (
                            <Label
                                htmlFor="sk"
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    selectedType === "SURAT_KEPUTUSAN"
                                        ? "border-emerald-600 bg-emerald-50"
                                        : "border-border hover:border-emerald-300 hover:bg-muted/50"
                                )}
                            >
                                <RadioGroupItem value="SURAT_KEPUTUSAN" id="sk" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                        <span className="font-semibold">Surat Keputusan (SK)</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Surat yang berisi penetapan keputusan resmi dari pejabat berwenang.
                                    </p>
                                </div>
                            </Label>
                        )}
                    </RadioGroup>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || !selectedType}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        Lanjutkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
