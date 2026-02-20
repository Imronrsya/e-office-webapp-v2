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
import { Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface VerifyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (notes: string) => Promise<void>;
    loading: boolean;
    isSupervisor: boolean;
    isManajerTU: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VerifyDialog({
    open,
    onOpenChange,
    onConfirm,
    loading,
    isSupervisor,
    isManajerTU
}: VerifyDialogProps) {
    const [notes, setNotes] = useState("");

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setNotes("");
        }
    }, [open]);

    const handleConfirm = async () => {
        await onConfirm(notes);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl" hideCloseButton>
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-semibold text-[#2B2B2B]">
                        Verifikasi Draft Surat
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#6D6D6D]">
                        Verifikasi draft surat untuk diteruskan ke tahap berikutnya.
                        {isSupervisor && " Draft akan diteruskan ke Manajer TU."}
                        {isManajerTU && " Draft akan diteruskan untuk ditandatangani."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="verify-notes" className="text-sm font-medium text-[#2B2B2B]">
                            Catatan (Opsional)
                        </Label>
                        <Textarea
                            id="verify-notes"
                            placeholder="Tambahkan catatan verifikasi jika diperlukan..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="border-[#E1DFE0] text-[#2B2B2B]"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {loading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Verifikasi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
