"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ApproveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    loading: boolean;
    title?: string;
    description?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApproveDialog({
    open,
    onOpenChange,
    onConfirm,
    loading,
    title = "Setujui Pengajuan?",
    description = "Apakah Anda yakin ingin menyetujui pengajuan ini? Tindakan ini akan meneruskan pengajuan ke tahap berikutnya."
}: ApproveDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    {/* Success Icon */}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-4">
                        <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <AlertDialogTitle className="text-center">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-2">
                    <AlertDialogCancel disabled={loading}>
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-success text-success-foreground hover:bg-success/90"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Setujui
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
