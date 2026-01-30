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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Undo2, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface ReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (targetRole: string, reason: string) => Promise<void>;
    loading: boolean;
    /** Available return targets based on disposition history */
    returnTargets?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

// Default return target is ADMIN_PRODI (dead end - letter goes back to prodi)
const DEFAULT_RETURN_TARGETS = ["ADMIN_PRODI"];

// ============================================================================
// COMPONENT
// ============================================================================

export function ReturnDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    returnTargets = DEFAULT_RETURN_TARGETS
}: ReturnDialogProps) {
    const [targetRole, setTargetRole] = useState<string>("");
    const [reason, setReason] = useState<string>("");

    // Reset when dialog closes, auto-select ADMIN_PRODI as default
    useEffect(() => {
        if (!open) {
            setTargetRole("");
            setReason("");
        } else if (returnTargets.length > 0) {
            // Auto-select first target (ADMIN_PRODI is always first from backend)
            setTargetRole(returnTargets[0]);
        }
    }, [open, returnTargets]);

    const handleSubmit = async () => {
        if (!targetRole) {
            toast.error("Pilih tujuan pengembalian terlebih dahulu");
            return;
        }
        if (!reason.trim()) {
            toast.error("Alasan pengembalian wajib diisi");
            return;
        }

        await onSubmit(targetRole, reason.trim());
    };

    // Use returnTargets directly from backend (already includes ADMIN_PRODI as first)
    // Fallback to default if empty
    const availableTargets = returnTargets.length > 0 
        ? returnTargets
        : DEFAULT_RETURN_TARGETS;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Kembalikan Surat</DialogTitle>
                    <DialogDescription>
                        Kembalikan surat ke pejabat sebelumnya untuk ditinjau ulang.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="default" className="border-amber-200 bg-amber-50">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            Default pengembalian adalah ke Admin Prodi. Anda juga dapat mengembalikan ke role lain yang sudah pernah memproses surat ini.
                        </AlertDescription>
                    </Alert>

                    {/* Pilih Tujuan */}
                    <div className="space-y-2">
                        <Label htmlFor="target-role">
                            Kembalikan Ke <span className="text-destructive">*</span>
                        </Label>
                        <Select value={targetRole} onValueChange={setTargetRole}>
                            <SelectTrigger id="target-role">
                                <SelectValue placeholder="Pilih Tujuan" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTargets.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {ROLE_LABELS[role] || role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Alasan */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Alasan Pengembalian <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Jelaskan alasan pengembalian surat..."
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            Alasan ini akan ditampilkan kepada penerima surat.
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
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Undo2 className="w-4 h-4 mr-2" />
                        )}
                        Kembalikan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
