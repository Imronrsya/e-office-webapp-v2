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
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface CompleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (notes: string) => Promise<void>;
    loading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompleteDialog({
    open,
    onOpenChange,
    onSubmit,
    loading
}: CompleteDialogProps) {
    const [notes, setNotes] = useState<string>("");
    const [touched, setTouched] = useState(false);

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setNotes("");
            setTouched(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        setTouched(true);

        if (!notes.trim()) {
            toast.error("Catatan wajib diisi");
            return;
        }

        await onSubmit(notes.trim());
    };

    const isError = touched && !notes.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
                <DialogHeader>
                    <DialogTitle>Selesaikan Surat</DialogTitle>
                    <DialogDescription>
                        Tandai surat sebagai selesai diproses di tingkat Anda.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-2.5 rounded-lg border border-[#E1DFE0] bg-neutral-50 px-4 py-3">
                        <Info className="h-4 w-4 text-[#6D6D6D] mt-0.5 shrink-0" />
                        <p className="text-sm text-[#6D6D6D]">
                            Surat akan dinyatakan selesai dan tidak dapat diproses lagi.
                        </p>
                    </div>

                    {/* Catatan */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-1">
                            Catatan <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Jelaskan mengapa surat cukup diproses sampai tahap ini..."
                            rows={4}
                            className={isError ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {isError && (
                            <p className="text-sm text-destructive">
                                Catatan wajib diisi
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Catatan ini akan tercatat dalam riwayat surat.
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
                        disabled={loading || !notes.trim()}
                        className="bg-success text-success-foreground hover:bg-success/90"
                    >
                        {loading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
