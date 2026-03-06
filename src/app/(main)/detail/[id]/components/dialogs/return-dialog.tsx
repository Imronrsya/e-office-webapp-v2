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
import { Undo2, Loader2 } from "lucide-react";
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

interface ReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (targetRole: string, reason: string, targetUserId?: string) => Promise<void>;
    loading: boolean;
    /** Available return targets based on disposition history */
    returnTargets?: string[];
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

/**
 * Default return target jika backend tidak memberikan
 * PENTING: Return FLEKSIBEL - bisa ke role manapun di bawah posisi user
 */
const DEFAULT_RETURN_TARGETS = ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"];

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
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [loadingUsers, setLoadingUsers] = useState(false);

    const isStaffRole = targetRole === "STAF_AKADEMIK" || targetRole === "STAF_SUMBER_DAYA";

    // Reset when dialog closes, auto-select ADMIN_PRODI as default
    useEffect(() => {
        if (!open) {
            setTargetRole("");
            setReason("");
            setStaffUsers([]);
            setSelectedUserId("");
        } else if (returnTargets.length > 0) {
            // Auto-select first target (ADMIN_PRODI is always first from backend)
            setTargetRole(returnTargets[0]);
        }
    }, [open, returnTargets]);

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
            toast.error("Pilih tujuan pengembalian terlebih dahulu");
            return;
        }
        if (!reason.trim()) {
            toast.error("Alasan pengembalian wajib diisi");
            return;
        }
        if (isStaffRole && !selectedUserId) {
            toast.error("Pilih staf tujuan terlebih dahulu");
            return;
        }

        await onSubmit(targetRole, reason.trim(), isStaffRole ? selectedUserId : undefined);
    };

    // Use returnTargets directly from backend (already includes ADMIN_PRODI as first)
    // Fallback to default if empty
    const availableTargets = returnTargets.length > 0
        ? returnTargets
        : DEFAULT_RETURN_TARGETS;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
                <DialogHeader>
                    <DialogTitle>Kembalikan Surat</DialogTitle>
                    <DialogDescription>
                        Kembalikan surat ke role sebelumnya untuk revisi atau perbaikan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Pilih Tujuan */}
                    <div className="space-y-2">
                        <Label htmlFor="target-role">
                            Kembalikan Ke <span className="text-destructive">*</span>
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
                        <p className="text-xs text-muted-foreground">
                            Pilih role tujuan dari daftar yang tersedia.
                        </p>
                    </div>

                    {/* Pilih Staf (hanya muncul jika target role adalah staf) */}
                    {isStaffRole && (
                        <div className="space-y-2">
                            <Label htmlFor="target-user">
                                Staf Tujuan <span className="text-destructive">*</span>
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
                        disabled={loading || !targetRole || !reason.trim() || (isStaffRole && !selectedUserId)}
                        className="bg-base-black text-white hover:bg-base-black/90"
                    >
                        {loading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Kembalikan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
