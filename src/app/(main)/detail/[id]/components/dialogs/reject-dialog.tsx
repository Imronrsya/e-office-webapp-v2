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
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (reason: string) => Promise<void>;
    loading: boolean;
    title?: string;
    description?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RejectDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    title = "Tolak Pengajuan",
    description = "Masukkan alasan penolakan pengajuan ini. Alasan akan dikirimkan ke pemohon."
}: RejectDialogProps) {
    const [reason, setReason] = useState<string>("");
    const [touched, setTouched] = useState(false);

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setReason("");
            setTouched(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        setTouched(true);

        if (!reason.trim()) {
            toast.error("Alasan penolakan wajib diisi");
            return;
        }

        await onSubmit(reason.trim());
    };

    const isError = touched && !reason.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl" hideCloseButton>
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-semibold text-[#2B2B2B]">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#6D6D6D]">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                    {/* Alasan Penolakan */}
                    <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-sm font-medium text-[#2B2B2B] flex items-center gap-1">
                            Alasan Penolakan <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (!touched) setTouched(true);
                            }}
                            onBlur={() => setTouched(true)}
                            placeholder="Jelaskan alasan penolakan pengajuan ini..."
                            rows={4}
                            className={isError ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {isError && (
                            <p className="text-sm text-red-500">
                                Alasan penolakan wajib diisi
                            </p>
                        )}
                        <p className="text-xs text-[#6D6D6D]">
                            Alasan ini akan ditampilkan kepada pemohon.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="border-[#E1DFE0] text-[#2B2B2B]"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Tolak Pengajuan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
