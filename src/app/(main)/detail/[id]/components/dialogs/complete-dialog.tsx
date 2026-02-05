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
import { CheckCircle, Loader2 } from "lucide-react";
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {/* Success Icon */}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-4">
                        <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <DialogTitle className="text-center">Selesaikan Surat</DialogTitle>
                    <DialogDescription className="text-center">
                        Tandai surat sebagai selesai diproses di tingkat Anda.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="default" className="border-success/50 bg-success/10">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <AlertDescription className="text-success">
                            Surat akan dinyatakan selesai dan tidak dapat diproses lagi.
                        </AlertDescription>
                    </Alert>
                    
                    {/* Catatan */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-1">
                            Catatan <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                if (!touched) setTouched(true);
                            }}
                            onBlur={() => setTouched(true)}
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
