"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export type LetterCategory = "AKADEMIK" | "SUMBER_DAYA" | "UMUM";

type DispositionMode = "forward" | "disposition";

interface DispositionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (category: LetterCategory, targetRole: string, notes?: string) => Promise<void>;
    loading: boolean;
    /** Mode: 'forward' untuk Admin Fakultas, 'disposition' untuk Pejabat */
    mode?: DispositionMode;
    /** Current user role (untuk filter hierarchy di mode disposition) */
    currentUserRole?: string;
    /** Letter category (jika sudah di-set sebelumnya - hanya untuk mode disposition) */
    letterCategory?: LetterCategory | null;
}

// ============================================================================
// HIERARCHY CONSTANTS
// ============================================================================

const ROLE_HIERARCHY: Record<string, number> = {
    DEKAN: 100,
    WADEK_1: 90,
    WADEK_2: 90,
    MANAJER_TU: 80,
    SUPERVISOR_AKADEMIK: 70,
    SUPERVISOR_SUMBER_DAYA: 70,
    STAF_AKADEMIK: 60,
    STAF_SUMBER_DAYA: 60,
};

// Full options per category for Admin Fakultas (forward mode)
const FORWARD_OPTIONS: Record<LetterCategory, string[]> = {
    UMUM: [
        "DEKAN",
        "WADEK_1",
        "WADEK_2",
        "MANAJER_TU",
        "SUPERVISOR_AKADEMIK",
        "SUPERVISOR_SUMBER_DAYA",
        "STAF_AKADEMIK",
        "STAF_SUMBER_DAYA"
    ],
    AKADEMIK: [
        "DEKAN",
        "WADEK_1",
        "MANAJER_TU",
        "SUPERVISOR_AKADEMIK",
        "STAF_AKADEMIK"
    ],
    SUMBER_DAYA: [
        "DEKAN",
        "WADEK_2",
        "MANAJER_TU",
        "SUPERVISOR_SUMBER_DAYA",
        "STAF_SUMBER_DAYA"
    ]
};

// Disposition options per category for Pejabat (filtered by hierarchy)
const DISPOSITION_OPTIONS: Record<LetterCategory, string[]> = {
    UMUM: [
        "DEKAN",
        "WADEK_1",
        "WADEK_2",
        "MANAJER_TU",
        "SUPERVISOR_AKADEMIK",
        "SUPERVISOR_SUMBER_DAYA",
        "STAF_AKADEMIK",
        "STAF_SUMBER_DAYA"
    ],
    AKADEMIK: [
        "DEKAN",
        "WADEK_1",
        "MANAJER_TU",
        "SUPERVISOR_AKADEMIK",
        "STAF_AKADEMIK"
    ],
    SUMBER_DAYA: [
        "DEKAN",
        "WADEK_2",
        "MANAJER_TU",
        "SUPERVISOR_SUMBER_DAYA",
        "STAF_SUMBER_DAYA"
    ]
};

// ============================================================================
// DISPOSITION TARGETS BY ROLE AND CATEGORY
// ============================================================================
// Disposisi harus mempertimbangkan:
// 1. Jabatan (role hierarchy) - hanya bisa ke role lebih rendah
// 2. Jenis surat (kategori) - AKADEMIK, SUMBER_DAYA, UMUM
//
// Contoh:
// - Wadek 1 + surat UMUM → MTU, Semua SPV, Semua Staff
// - Wadek 1 + surat AKADEMIK → MTU, SPV Akademik, Staff Akademik
// - Wadek 2 + surat SUMBER_DAYA → MTU, SPV Sumber Daya, Staff Sumber Daya

type RoleDispositionTargets = Record<LetterCategory, string[]>;

const ROLE_DISPOSITION_TARGETS: Record<string, RoleDispositionTargets> = {
    DEKAN: {
        UMUM: [
            "WADEK_1",
            "WADEK_2",
            "MANAJER_TU",
            "SUPERVISOR_AKADEMIK",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_AKADEMIK",
            "STAF_SUMBER_DAYA"
        ],
        AKADEMIK: [
            "WADEK_1",
            "MANAJER_TU",
            "SUPERVISOR_AKADEMIK",
            "STAF_AKADEMIK"
        ],
        SUMBER_DAYA: [
            "WADEK_2",
            "MANAJER_TU",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_SUMBER_DAYA"
        ]
    },
    WADEK_1: {
        UMUM: [
            "MANAJER_TU",
            "SUPERVISOR_AKADEMIK",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_AKADEMIK",
            "STAF_SUMBER_DAYA"
        ],
        AKADEMIK: [
            "MANAJER_TU",
            "SUPERVISOR_AKADEMIK",
            "STAF_AKADEMIK"
        ],
        SUMBER_DAYA: [
            "MANAJER_TU",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_SUMBER_DAYA"
        ]
    },
    WADEK_2: {
        UMUM: [
            "MANAJER_TU",
            "SUPERVISOR_AKADEMIK",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_AKADEMIK",
            "STAF_SUMBER_DAYA"
        ],
        AKADEMIK: [
            "MANAJER_TU",
            "SUPERVISOR_AKADEMIK",
            "STAF_AKADEMIK"
        ],
        SUMBER_DAYA: [
            "MANAJER_TU",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_SUMBER_DAYA"
        ]
    },
    MANAJER_TU: {
        UMUM: [
            "SUPERVISOR_AKADEMIK",
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_AKADEMIK",
            "STAF_SUMBER_DAYA"
        ],
        AKADEMIK: [
            "SUPERVISOR_AKADEMIK",
            "STAF_AKADEMIK"
        ],
        SUMBER_DAYA: [
            "SUPERVISOR_SUMBER_DAYA",
            "STAF_SUMBER_DAYA"
        ]
    },
    SUPERVISOR_AKADEMIK: {
        UMUM: ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"], // Untuk kategori UMUM, bisa pilih semua staf
        AKADEMIK: ["STAF_AKADEMIK"],
        SUMBER_DAYA: [] // Tidak bisa disposisi ke SD dari SPV Akademik
    },
    SUPERVISOR_SUMBER_DAYA: {
        UMUM: ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"], // Untuk kategori UMUM, bisa pilih semua staf
        AKADEMIK: [], // Tidak bisa disposisi ke Akademik dari SPV SD
        SUMBER_DAYA: ["STAF_SUMBER_DAYA"]
    },
};

/**
 * Get disposition targets based on role AND category
 */
function getDispositionTargets(role: string, category: LetterCategory): string[] {
    const roleTargets = ROLE_DISPOSITION_TARGETS[role];
    if (!roleTargets) return [];
    return roleTargets[category] || [];
}

const ROLE_LABELS: Record<string, string> = {
    DEKAN: "Dekan",
    WADEK_1: "Wakil Dekan I",
    WADEK_2: "Wakil Dekan II",
    MANAJER_TU: "Manajer Tata Usaha",
    SUPERVISOR_AKADEMIK: "Supervisor Akademik",
    SUPERVISOR_SUMBER_DAYA: "Supervisor Sumber Daya",
    STAF_AKADEMIK: "Staf Akademik",
    STAF_SUMBER_DAYA: "Staf Sumber Daya"
};

const CATEGORY_LABELS: Record<LetterCategory, string> = {
    AKADEMIK: "Akademik",
    SUMBER_DAYA: "Sumber Daya",
    UMUM: "Umum"
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DispositionDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    mode = "forward",
    currentUserRole,
    letterCategory
}: DispositionDialogProps) {
    const [category, setCategory] = useState<LetterCategory | "">("");
    const [targetRole, setTargetRole] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    const isForwardMode = mode === "forward";

    // Reset when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setCategory("");
            setTargetRole("");
            setNotes("");
        } else if (!isForwardMode && letterCategory) {
            // Pre-set category only for disposition mode (Pejabat)
            setCategory(letterCategory);
        }
    }, [open, letterCategory, isForwardMode]);

    // Reset target role when category changes
    useEffect(() => {
        setTargetRole("");
    }, [category]);

    // Get available roles based on mode and hierarchy
    const availableRoles = useMemo(() => {
        if (!category) return [];

        if (isForwardMode) {
            // Admin Fakultas - can forward to anyone in category
            return FORWARD_OPTIONS[category];
        } else {
            // Pejabat - use specific disposition targets based on role AND category
            // getDispositionTargets sudah return hasil yang tepat berdasarkan:
            // 1. Role hierarchy (hanya ke bawah)
            // 2. Category surat (UMUM/AKADEMIK/SUMBER_DAYA)
            // Jadi TIDAK perlu filter tambahan lagi
            return currentUserRole
                ? getDispositionTargets(currentUserRole, category)
                : [];
        }
    }, [category, isForwardMode, currentUserRole]);

    const handleSubmit = async () => {
        if (!category) {
            toast.error("Pilih jenis surat terlebih dahulu");
            return;
        }
        if (!targetRole) {
            toast.error("Pilih pejabat tujuan terlebih dahulu");
            return;
        }

        await onSubmit(category, targetRole, notes || undefined);
    };

    // Title and button text based on mode
    const dialogTitle = isForwardMode ? "Meneruskan Surat" : "Disposisi Surat";
    const dialogDescription = isForwardMode
        ? "Teruskan surat ke pejabat fakultas untuk diproses lebih lanjut."
        : "Disposisikan surat ke pejabat dengan tingkatan lebih rendah.";
    const submitButtonText = isForwardMode ? "Meneruskan" : "Disposisi";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Pilih Jenis Surat - Always show for Admin Fakultas */}
                    {/* For Pejabat: show as info if letterCategory exists, otherwise show dropdown */}
                    {isForwardMode ? (
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Jenis Surat <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={category}
                                onValueChange={(val) => setCategory(val as LetterCategory)}
                            >
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Pilih Jenis Surat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AKADEMIK">Akademik</SelectItem>
                                    <SelectItem value="SUMBER_DAYA">Sumber Daya</SelectItem>
                                    <SelectItem value="UMUM">Umum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : letterCategory ? (
                        // Disposition mode with existing category - show as read-only info
                        <div className="rounded-md border border-muted bg-muted/50 px-3 py-2">
                            <span className="text-sm text-muted-foreground">Kategori surat: </span>
                            <span className="text-sm font-medium">{CATEGORY_LABELS[letterCategory]}</span>
                        </div>
                    ) : (
                        // Disposition mode without category - allow selection (fallback)
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Jenis Surat <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={category}
                                onValueChange={(val) => setCategory(val as LetterCategory)}
                            >
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Pilih Jenis Surat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AKADEMIK">Akademik</SelectItem>
                                    <SelectItem value="SUMBER_DAYA">Sumber Daya</SelectItem>
                                    <SelectItem value="UMUM">Umum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Info Box for disposition mode */}
                    {!isForwardMode && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-[#E1DFE0] bg-neutral-50 px-4 py-3">
                            <Info className="h-4 w-4 text-[#6D6D6D] mt-0.5 shrink-0" />
                            <p className="text-sm text-[#6D6D6D]">
                                Disposisi hanya dapat dilakukan ke pejabat dengan tingkatan lebih rendah.
                            </p>
                        </div>
                    )}

                    {/* Pilih Pejabat */}
                    <div className="space-y-2">
                        <Label htmlFor="target-role">
                            Pejabat Tujuan <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={targetRole}
                            onValueChange={setTargetRole}
                            disabled={!category}
                        >
                            <SelectTrigger id="target-role" className="w-full">
                                <SelectValue placeholder={category ? "Pilih Pejabat" : "Pilih jenis surat terlebih dahulu"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.length > 0 ? (
                                    availableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {ROLE_LABELS[role]}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                        {category
                                            ? "Tidak ada pejabat yang tersedia"
                                            : "Pilih jenis surat terlebih dahulu"
                                        }
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Catatan (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            placeholder="Tambahkan catatan (opsional)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || !category || !targetRole}
                        variant="default"
                        className="bg-base-black text-white hover:bg-base-black/90"
                    >
                        {loading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {submitButtonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
