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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

interface StaffUser {
    id: string;
    name: string;
    email: string;
    pegawai?: { nip: string; jabatan: string } | null;
}

interface RevisionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (targetRole: string, reason: string, targetUserId?: string) => Promise<void>;
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
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [loadingUsers, setLoadingUsers] = useState(false);

    const isStaffRole = targetRole === "STAF_AKADEMIK" || targetRole === "STAF_SUMBER_DAYA";

    // Reset when dialog closes, auto-select first target
    useEffect(() => {
        if (!open) {
            setTargetRole("");
            setReason("");
            setStaffUsers([]);
            setSelectedUserId("");
        } else if (revisionTargets.length > 0) {
            // Auto-select first target from backend
            setTargetRole(revisionTargets[0]);
        }
    }, [open, revisionTargets]);

    // Fetch staff users when a staff role is selected
    useEffect(() => {
        if (!isStaffRole) {
            setStaffUsers([]);
            setSelectedUserId("");
            return;
        }

        const fetchStaffUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await api.get<{ data: StaffUser[] }>(`/api/faculty-disposition/users/${targetRole}`);
                setStaffUsers(res.data.data || []);
            } catch (err) {
                console.error("Failed to fetch staff users:", err);
                toast.error("Gagal mengambil data staf");
                setStaffUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchStaffUsers();
        setSelectedUserId("");
    }, [targetRole]);

    const handleSubmit = async () => {
        if (!targetRole) {
            toast.error("Pilih tujuan revisi terlebih dahulu");
            return;
        }
        if (!reason.trim()) {
            toast.error("Catatan revisi wajib diisi");
            return;
        }
        if (isStaffRole && !selectedUserId) {
            toast.error("Pilih staf tujuan terlebih dahulu");
            return;
        }

        await onSubmit(targetRole, reason.trim(), isStaffRole ? selectedUserId : undefined);
    };

    // Use revisionTargets directly from backend
    // Fallback to default if empty
    const availableTargets = revisionTargets.length > 0
        ? revisionTargets
        : DEFAULT_REVISION_TARGETS;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl" hideCloseButton>
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-semibold text-[#2B2B2B]">
                        Kembalikan untuk Direvisi
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#6D6D6D]">
                        Kembalikan surat keluar untuk direvisi oleh staf atau supervisor.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Pilih Tujuan Kembalikan untuk Revisi */}
                    <div className="space-y-1.5">
                        <Label htmlFor="target-role" className="text-sm font-medium text-[#2B2B2B]">
                            Kembalikan Ke <span className="text-red-500">*</span>
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
                        <p className="text-xs text-[#6D6D6D]">
                            Pilih staf atau supervisor yang akan melakukan revisi.
                        </p>
                    </div>

                    {/* Pilih Staf (hanya muncul jika target role adalah staf) */}
                    {isStaffRole && (
                        <div className="space-y-1.5">
                            <Label htmlFor="target-user" className="text-sm font-medium text-[#2B2B2B]">
                                Staf Tujuan <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                                disabled={loadingUsers}
                            >
                                <SelectTrigger id="target-user" className="w-full">
                                    <SelectValue placeholder={loadingUsers ? "Memuat data staf..." : "Pilih Staf"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingUsers ? (
                                        <div className="flex items-center justify-center px-2 py-3 text-sm text-muted-foreground">
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Memuat...
                                        </div>
                                    ) : staffUsers.length > 0 ? (
                                        staffUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                            Tidak ada staf yang tersedia
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Catatan Revisi */}
                    <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-sm font-medium text-[#2B2B2B]">
                            Catatan Revisi <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Jelaskan apa yang perlu diperbaiki/direvisi..."
                            rows={4}
                        />
                        <p className="text-xs text-[#6D6D6D]">
                            Catatan ini akan ditampilkan kepada staf/supervisor yang melakukan revisi.
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
                        disabled={loading || !targetRole || !reason.trim() || (isStaffRole && !selectedUserId)}
                        className="bg-base-black text-white hover:bg-base-black/90"
                    >
                        {loading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Kembalikan untuk Direvisi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
