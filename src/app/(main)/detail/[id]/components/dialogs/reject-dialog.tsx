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
import { XCircle, AlertTriangle, Loader2 } from "lucide-react";
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {/* Destructive Icon */}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-center text-destructive">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Pengajuan yang ditolak akan dikembalikan ke pemohon dan harus diajukan ulang jika diperlukan.
                        </AlertDescription>
                    </Alert>
                    
                    {/* Alasan Penolakan */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="flex items-center gap-1">
                            Alasan Penolakan <span className="text-destructive">*</span>
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
                            className={isError ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {isError && (
                            <p className="text-sm text-destructive">
                                Alasan penolakan wajib diisi
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Alasan ini akan ditampilkan kepada pemohon.
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
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Tolak Pengajuan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
