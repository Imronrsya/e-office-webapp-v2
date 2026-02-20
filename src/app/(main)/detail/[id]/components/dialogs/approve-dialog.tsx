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
import { Loader2 } from "lucide-react";

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
            <AlertDialogContent className="sm:max-w-md rounded-2xl">
                <AlertDialogHeader className="space-y-1">
                    <AlertDialogTitle className="text-xl font-semibold text-[#2B2B2B]">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-[#6D6D6D]">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 pt-2">
                    <AlertDialogCancel
                        disabled={loading}
                        className="border-[#E1DFE0] text-[#2B2B2B]"
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Setujui
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
