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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info, Loader2 } from "lucide-react";
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

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setNotes("");
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!notes.trim()) {
            toast.error("Catatan wajib diisi");
            return;
        }

        await onSubmit(notes.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Selesaikan Surat</DialogTitle>
                    <DialogDescription>
                        Tandai surat sebagai selesai diproses di tingkat Anda.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="default" className="border-emerald-200 bg-emerald-50">
                        <Info className="h-4 w-4 text-emerald-600" />
                        <AlertDescription className="text-emerald-800">
                            Surat akan dinyatakan selesai dan tidak dapat diproses lagi.
                        </AlertDescription>
                    </Alert>
                    
                    {/* Catatan */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            Catatan <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Jelaskan mengapa surat cukup diproses sampai tahap ini..."
                            rows={4}
                        />
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
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
