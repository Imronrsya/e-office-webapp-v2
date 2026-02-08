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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Undo2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface RevisionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (targetRole: string, reason: string) => Promise<void>;
    loading: boolean;
    /** Available revision targets (staff/supervisors) */
    revisionTargets?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Label display untuk setiap role
 */
const ROLE_LABELS: Record<string, string> = {
    ADMIN_PRODI: "Admin Prodi",
    ADMIN_FAKULTAS: "Admin Surat Fakultas",
    DEKAN: "Dekan",
    WADEK_1: "Wakil Dekan I",
    WADEK_2: "Wakil Dekan II",
    MANAJER_TU: "Manajer Tata Usaha",
    SUPERVISOR_AKADEMIK: "Supervisor Akademik",
    SUPERVISOR_SUMBER_DAYA: "Supervisor Sumber Daya",
    STAF_AKADEMIK: "Staf Akademik",
    STAF_SUMBER_DAYA: "Staf Sumber Daya"
};

// Default revision target is staff (for surat keluar)
const DEFAULT_REVISION_TARGETS = ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"];

// ============================================================================
// COMPONENT
// ============================================================================

export function RevisionDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    revisionTargets = DEFAULT_REVISION_TARGETS
}: RevisionDialogProps) {
    const [targetRole, setTargetRole] = useState<string>("");
    const [reason, setReason] = useState<string>("");

    // Reset when dialog closes, auto-select first target
    useEffect(() => {
        if (!open) {
            setTargetRole("");
            setReason("");
        } else if (revisionTargets.length > 0) {
            // Auto-select first target from backend
            setTargetRole(revisionTargets[0]);
        }
    }, [open, revisionTargets]);

    const handleSubmit = async () => {
        if (!targetRole) {
            toast.error("Pilih tujuan revisi terlebih dahulu");
            return;
        }
        if (!reason.trim()) {
            toast.error("Catatan revisi wajib diisi");
            return;
        }

        await onSubmit(targetRole, reason.trim());
    };

    // Use revisionTargets directly from backend
    // Fallback to default if empty
    const availableTargets = revisionTargets.length > 0 
        ? revisionTargets
        : DEFAULT_REVISION_TARGETS;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Undo2 className="h-5 w-5 text-warning" />
                        Kembalikan untuk Direvisi
                    </DialogTitle>
                    <DialogDescription>
                        Kembalikan surat keluar untuk direvisi oleh staf atau supervisor.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Pilih Tujuan Kembalikan untuk Revisi */}
                    <div className="space-y-2">
                        <Label htmlFor="target-role">
                            Kembalikan Ke <span className="text-destructive">*</span>
                        </Label>
                        <Select value={targetRole} onValueChange={setTargetRole}>
                            <SelectTrigger id="target-role" className="w-full">
                                <SelectValue placeholder="Pilih Tujuan Pengembalian" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTargets.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {ROLE_LABELS[role] || role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Pilih staf atau supervisor yang akan melakukan revisi.
                        </p>
                    </div>
                    
                    {/* Catatan Revisi */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Catatan Revisi <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Jelaskan apa yang perlu diperbaiki/direvisi..."
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            Catatan ini akan ditampilkan kepada staf/supervisor yang melakukan revisi.
                        </p>
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
                        disabled={loading || !targetRole || !reason.trim()}
                        className="bg-base-black text-white hover:bg-base-black/90"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Undo2 className="w-4 h-4 mr-2" />
                        )}
                        Kembalikan untuk Direvisi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
