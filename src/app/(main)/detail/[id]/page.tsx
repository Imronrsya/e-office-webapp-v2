"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/bottom-nav";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { suratService, SubmissionDetail } from "@/services/surat.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    XCircle,
    CheckCircle,
    Clock,
    FileText,
    Download,
    FilePlus,
    Send,
    PenTool,
    Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DispositionDialog, LetterCategory } from "./components/disposition-dialog";
import { CompleteDialog } from "./components/complete-dialog";
import { ReturnDialog } from "./components/return-dialog";
import { DraftSuratDialog } from "./components/draft-surat-dialog";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDateTime(dateString: string | null | undefined) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatFileSize(bytes: number | null | undefined) {
    if (!bytes) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
        'KAPRODI': 'Ketua Prodi',
        'ADMIN_PRODI': 'Admin Prodi',
        'KADEP': 'Ketua Departemen',
        'ADMIN_FAKULTAS': 'Admin Fakultas',
        'DEKAN': 'Dekan',
        'WADEK_1': 'Wakil Dekan 1',
        'WADEK_2': 'Wakil Dekan 2',
        'UPA': 'UPA',
    };
    return roleLabels[role] || role;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface InfoRowProps {
    label: string;
    value: string;
    showSeparator?: boolean;
}

function InfoRow({ label, value, showSeparator = true }: InfoRowProps) {
    return (
        <>
            <div className="py-3">
                <p className="text-sm text-zinc-400 leading-6">{label}</p>
                <p className="text-sm text-black leading-6">{value || "-"}</p>
            </div>
            {showSeparator && <Separator className="bg-zinc-400" />}
        </>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [detail, setDetail] = useState<SubmissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    
    // Dialog states
    const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [draftSuratDialogOpen, setDraftSuratDialogOpen] = useState(false);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [returnSuratDialogOpen, setReturnSuratDialogOpen] = useState(false);
    const [verifyNotes, setVerifyNotes] = useState("");
    const [returnSuratReason, setReturnSuratReason] = useState("");

    // User's current role
    const currentUserRole = user?.role?.toUpperCase() || "";
    
    // Check if user is Admin Fakultas (for forward mode) or Pejabat/Supervisor/Staf (for disposition mode)
    const isAdminFakultas = currentUserRole === "ADMIN_FAKULTAS";
    const isPejabat = ["DEKAN", "WADEK_1", "WADEK_2", "MANAJER_TU", "SUPERVISOR_AKADEMIK", "SUPERVISOR_SUMBER_DAYA", "STAF_AKADEMIK", "STAF_SUMBER_DAYA"].includes(currentUserRole);
    
    // Supervisor and Manajer TU for verification
    const isSupervisor = ["SUPERVISOR_AKADEMIK", "SUPERVISOR_SUMBER_DAYA"].includes(currentUserRole);
    const isManajerTU = currentUserRole === "MANAJER_TU";
    const isDekanWadek = ["DEKAN", "WADEK_1", "WADEK_2"].includes(currentUserRole);

    // Staf cannot dispose (they're at bottom of hierarchy)
    const isStaf = ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"].includes(currentUserRole);

    // Fetch detail data
    const fetchDetail = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await suratService.getDetail(resolvedParams.id);
            if (data) {
                setDetail(data);
            } else {
                setError("Data pengajuan tidak ditemukan");
            }
        } catch (err) {
            console.error("Failed to fetch detail:", err);
            setError("Gagal memuat data pengajuan");
        } finally {
            setLoading(false);
        }
    }, [resolvedParams.id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // Download attachment handler
    const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
        if (!detail) return;
        try {
            const blob = await suratService.downloadAttachment(detail.id, attachmentId);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Gagal mengunduh file");
        }
    };

    // ========================================================================
    // ACTION HANDLERS
    // ========================================================================

    const handleApprove = async () => {
        if (!detail) return;
        
        setActionLoading(true);
        try {
            const response = await suratService.approve(detail.id);
            if (response.success) {
                toast.success("Pengajuan berhasil disetujui");
                // Refresh data
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal menyetujui pengajuan");
            }
        } catch (err) {
            console.error("Approve failed:", err);
            toast.error("Terjadi kesalahan saat menyetujui pengajuan");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!detail || !rejectReason.trim()) {
            toast.error("Alasan penolakan harus diisi");
            return;
        }
        
        setActionLoading(true);
        try {
            const response = await suratService.reject(detail.id, rejectReason.trim());
            if (response.success) {
                toast.success("Pengajuan berhasil ditolak");
                setRejectDialogOpen(false);
                setRejectReason("");
                // Refresh data
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal menolak pengajuan");
            }
        } catch (err) {
            console.error("Reject failed:", err);
            toast.error("Terjadi kesalahan saat menolak pengajuan");
        } finally {
            setActionLoading(false);
        }
    };

    // Create Draft Handler (Admin Prodi)
    const handleCreateDraft = async () => {
        if (!detail || actionLoading) return; // Prevent double-click
        
        setActionLoading(true);
        try {
            const response = await suratService.createDraft(detail.id);
            if (response.success) {
                toast.success("Surat pengantar berhasil dibuat");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal membuat surat pengantar");
            }
        } catch (err) {
            console.error("Create draft failed:", err);
            toast.error("Terjadi kesalahan saat membuat surat pengantar");
        } finally {
            setActionLoading(false);
        }
    };

    // Submit Draft for Signature (Admin Prodi)
    const handleSubmitDraft = async () => {
        if (!detail || actionLoading) return; // Prevent double-click
        
        setActionLoading(true);
        try {
            const response = await suratService.submitDraft(detail.id);
            if (response.success) {
                toast.success("Surat pengantar berhasil diajukan untuk ditandatangani");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal mengajukan surat pengantar");
            }
        } catch (err) {
            console.error("Submit draft failed:", err);
            toast.error("Terjadi kesalahan saat mengajukan surat pengantar");
        } finally {
            setActionLoading(false);
        }
    };

    // Sign Document Handler (Kaprodi/Kadep)
    const handleSign = async () => {
        if (!detail || actionLoading) return; // Prevent double-click
        
        setActionLoading(true);
        try {
            // Temporary: Use placeholder signature data until signature modal is ready
            const response = await suratService.sign(detail.id, {
                signatureUrl: "https://via.placeholder.com/150x50?text=TTD+Placeholder",
                signerName: "Penandatangan",
                signerNip: ""
            });
            
            if (response.success) {
                toast.success("Dokumen berhasil ditandatangani");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal menandatangani dokumen");
            }
        } catch (err) {
            console.error("Sign failed:", err);
            toast.error("Terjadi kesalahan saat menandatangani dokumen");
        } finally {
            setActionLoading(false);
        }
    };

    // Forward Letter Handler (Admin Fakultas)
    // This handles both "receive" (categorize) and "forward" in one action
    const handleForward = async (category: LetterCategory, targetRole: string, notes?: string) => {
        if (!detail || actionLoading) return; // Prevent double-click
        
        setActionLoading(true);
        try {
            // Step 1: If status is SURAT_PENGANTAR_SIGNED, categorize first
            if (detail.status === 'SURAT_PENGANTAR_SIGNED') {
                const categorizeResponse = await suratService.categorize(detail.id, category);
                if (!categorizeResponse.success) {
                    toast.error(categorizeResponse.message || "Gagal menerima surat");
                    return;
                }
            }

            // Step 2: Forward to target role
            const response = await suratService.forward(detail.id, targetRole, notes);
            
            if (response.success) {
                toast.success("Surat berhasil diteruskan");
                setDispositionDialogOpen(false);
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal meneruskan surat");
            }
        } catch (err) {
            console.error("Forward failed:", err);
            toast.error("Terjadi kesalahan saat meneruskan surat");
        } finally {
            setActionLoading(false);
        }
    };

    // Dispose Letter Handler (Pejabat - to lower hierarchy)
    const handleDispose = async (category: LetterCategory, targetRole: string, notes?: string) => {
        if (!detail || actionLoading) return;
        
        setActionLoading(true);
        try {
            const response = await suratService.dispose(detail.id, targetRole, notes);
            
            if (response.success) {
                toast.success("Surat berhasil didisposisikan");
                setDispositionDialogOpen(false);
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal mendisposisikan surat");
            }
        } catch (err) {
            console.error("Dispose failed:", err);
            toast.error("Terjadi kesalahan saat mendisposisikan surat");
        } finally {
            setActionLoading(false);
        }
    };

    // Complete Letter Handler (Pejabat - finish processing at their level)
    const handleComplete = async (notes: string) => {
        if (!detail || actionLoading) return;
        
        setActionLoading(true);
        try {
            const response = await suratService.complete(detail.id, notes);
            
            if (response.success) {
                toast.success("Surat berhasil diselesaikan");
                setCompleteDialogOpen(false);
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal menyelesaikan surat");
            }
        } catch (err) {
            console.error("Complete failed:", err);
            toast.error("Terjadi kesalahan saat menyelesaikan surat");
        } finally {
            setActionLoading(false);
        }
    };

    // Return Letter Handler (Pejabat - return to previous handler)
    const handleReturn = async (targetRole: string, reason: string) => {
        if (!detail || actionLoading) return;
        
        setActionLoading(true);
        try {
            const response = await suratService.returnLetter(detail.id, targetRole, reason);
            
            if (response.success) {
                toast.success("Surat berhasil dikembalikan");
                setReturnDialogOpen(false);
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal mengembalikan surat");
            }
        } catch (err) {
            console.error("Return failed:", err);
            toast.error("Terjadi kesalahan saat mengembalikan surat");
        } finally {
            setActionLoading(false);
        }
    };

    // Draft Surat Hasil Handler (Staf - buat SK/ST)
    const handleDraftSurat = (type: "SURAT_TUGAS" | "SURAT_KEPUTUSAN") => {
        if (!detail) return;
        setDraftSuratDialogOpen(false);
        router.push(`/draft-surat/${detail.id}?type=${type}`);
    };

    // Staf submit draft for verification
    const handleSubmitForVerification = async () => {
        if (!detail || actionLoading) return;
        
        // Check if SK/ST document exists
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!hasSkst) {
            toast.error("Draft SK/ST belum dibuat");
            return;
        }
        
        setActionLoading(true);
        try {
            // Use letterId, not documentId
            const response = await suratService.submitDraftForVerification(detail.id);
            
            if (response.success) {
                toast.success("Draft berhasil diajukan untuk verifikasi");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal mengajukan draft");
            }
        } catch (err) {
            console.error("Submit for verification failed:", err);
            toast.error("Terjadi kesalahan saat mengajukan draft");
        } finally {
            setActionLoading(false);
        }
    };

    // Supervisor/Manajer TU verifies surat hasil
    const handleVerifySuratHasil = async () => {
        if (!detail || actionLoading) return;
        
        // Just check if SK/ST document exists
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!hasSkst) {
            toast.error("Dokumen SK/ST tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            // Use letterId, not documentId
            const response = await suratService.approveSuratHasil(detail.id, verifyNotes.trim() || undefined);
            
            if (response.success) {
                toast.success("Surat berhasil diverifikasi");
                setVerifyDialogOpen(false);
                setVerifyNotes("");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal memverifikasi surat");
            }
        } catch (err) {
            console.error("Verify failed:", err);
            toast.error("Terjadi kesalahan saat memverifikasi");
        } finally {
            setActionLoading(false);
        }
    };

    // Supervisor/Manajer TU returns surat hasil for revision
    const handleReturnSuratHasil = async () => {
        if (!detail || actionLoading) return;
        
        if (!returnSuratReason.trim()) {
            toast.error("Alasan pengembalian wajib diisi");
            return;
        }
        
        // Just check if SK/ST document exists
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!hasSkst) {
            toast.error("Dokumen SK/ST tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            // Use letterId, not documentId
            const response = await suratService.returnSuratHasil(detail.id, returnSuratReason.trim());
            
            if (response.success) {
                toast.success("Surat dikembalikan untuk revisi");
                setReturnSuratDialogOpen(false);
                setReturnSuratReason("");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal mengembalikan surat");
            }
        } catch (err) {
            console.error("Return surat hasil failed:", err);
            toast.error("Terjadi kesalahan");
        } finally {
            setActionLoading(false);
        }
    };

    // Dekan/Wadek signs surat hasil
    const handleSignSuratHasil = async () => {
        if (!detail || actionLoading) return;
        
        // Just check if SK/ST document exists
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!hasSkst) {
            toast.error("Dokumen SK/ST tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            // TODO: Integrate with signature pad/modal
            // Use letterId, not documentId
            const response = await suratService.signSuratHasil(detail.id, {
                signatureUrl: "https://via.placeholder.com/150x50?text=TTD+Placeholder",
                signerName: user?.name || "Penandatangan",
                signerNip: ""
            });
            
            if (response.success) {
                toast.success("Dokumen berhasil ditandatangani");
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal menandatangani dokumen");
            }
        } catch (err) {
            console.error("Sign surat hasil failed:", err);
            toast.error("Terjadi kesalahan saat menandatangani");
        } finally {
            setActionLoading(false);
        }
    };

    // ========================================================================
    // LOADING STATE
    // ========================================================================

    if (loading) {
        return (
            <>
                {/* Page Title Skeleton */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
                    <div className="h-8 w-24 bg-zinc-200 rounded animate-pulse" />
                </div>

                {/* Cards Skeleton */}
                <div className="space-y-6">
                    {/* Riwayat Proses Skeleton */}
                    <div className="bg-neutral-50 border border-zinc-400 rounded-xl p-6">
                        <div className="h-5 w-32 bg-zinc-200 rounded mb-6 animate-pulse" />
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-zinc-200 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 bg-zinc-200 rounded animate-pulse" />
                                    <div className="h-4 w-64 bg-zinc-200 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-zinc-200 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 bg-zinc-200 rounded animate-pulse" />
                                    <div className="h-4 w-64 bg-zinc-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detail Surat Skeleton */}
                    <div className="bg-neutral-50 border border-zinc-400 rounded-xl p-6">
                        <div className="h-5 w-28 bg-zinc-200 rounded mb-4 animate-pulse" />
                        <div className="space-y-4">
                            <div className="h-4 w-full bg-zinc-200 rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-zinc-200 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-zinc-200 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Identitas Pemohon Skeleton */}
                    <div className="bg-neutral-50 border border-zinc-400 rounded-xl p-6">
                        <div className="h-5 w-36 bg-zinc-200 rounded mb-4 animate-pulse" />
                        <div className="space-y-4">
                            <div className="h-4 w-full bg-zinc-200 rounded animate-pulse" />
                            <div className="h-4 w-2/3 bg-zinc-200 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-zinc-200 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Lampiran Skeleton */}
                    <div className="bg-neutral-50 border border-zinc-400 rounded-xl p-6">
                        <div className="h-5 w-24 bg-zinc-200 rounded mb-4 animate-pulse" />
                        <div className="flex items-center gap-3 p-3.5 bg-white rounded-lg border border-zinc-400">
                            <div className="w-10 h-10 bg-red-100 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 bg-zinc-200 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
                            </div>
                            <div className="w-6 h-6 bg-zinc-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ========================================================================
    // ERROR STATE
    // ========================================================================

    if (error || !detail) {
        return (
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                    <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h2 className="text-lg font-semibold mb-2">Tidak Ditemukan</h2>
                    <p className="text-muted-foreground mb-4">{error || "Data pengajuan tidak ditemukan"}</p>
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const { permissions, submissionValues, logs, attachments } = detail;
    
    // Reverse logs for display (newest action = waiting, oldest = first submitted)
    const displayLogs = [...logs].reverse();
    
    // Check if status is waiting
    const isWaiting = !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(detail.status);

    // Check if surat pengantar document exists
    const suratPengantarDoc = detail.documents?.find(d => d.type === 'SURAT_PENGANTAR');
    const hasSuratPengantar = !!suratPengantarDoc;

    // ========================================================================
    // RENDER
    // ========================================================================

    // ========================================================================
    // CONTENT CARDS SECTION (used in both layouts)
    // ========================================================================
    const ContentCards = () => (
        <div className="space-y-6">
            {/* Riwayat Proses */}
            <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-black mb-6">Riwayat Proses</h3>
                        
                        <div className="flex gap-4">
                            {/* Timeline Icons Column */}
                            <div className="flex flex-col items-center">
                                {/* Current waiting status */}
                                {isWaiting && detail.currentActiveRole && (
                                    <>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 bg-white border-zinc-400">
                                            <Clock className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        {displayLogs.length > 0 && <div className="w-0.5 h-6 bg-zinc-400" />}
                                    </>
                                )}
                                
                                {/* Completed logs */}
                                {displayLogs.map((log, idx) => (
                                    <div key={log.id} className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                        {idx < displayLogs.length - 1 && <div className="w-0.5 h-6 bg-zinc-400" />}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Timeline Content Column */}
                            <div className="flex flex-col">
                                {/* Current waiting status content */}
                                {isWaiting && detail.currentActiveRole && (
                                    <div className="h-10 flex items-center mb-6">
                                        <div>
                                            <p className="text-sm font-bold text-black leading-5">
                                                {detail.currentActiveRole === 'KAPRODI' && 'Verifikasi Oleh Ketua Prodi'}
                                                {detail.currentActiveRole === 'ADMIN_PRODI' && 'Pembuatan Surat Pengantar'}
                                                {detail.currentActiveRole === 'KADEP' && 'Tanda Tangan Ketua Departemen'}
                                                {!['KAPRODI', 'ADMIN_PRODI', 'KADEP'].includes(detail.currentActiveRole) && 
                                                    `Menunggu ${getRoleLabel(detail.currentActiveRole)}`}
                                            </p>
                                            <p className="text-sm text-zinc-500 leading-5">Menunggu proses...</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Completed logs content */}
                                {displayLogs.map((log, idx) => (
                                    <div 
                                        key={log.id} 
                                        className={cn(
                                            "h-10 flex items-center",
                                            idx < displayLogs.length - 1 && "mb-6"
                                        )}
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-black leading-5">{log.action}</p>
                                            <p className="text-sm text-black leading-5">
                                                Oleh: {log.actorName} • {formatDateTime(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detail Surat */}
                <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold text-black mb-4">Detail Surat</h3>
                        
                        <InfoRow 
                            label="Jenis Surat" 
                            value={submissionValues.jenisSurat === 'SURAT_TUGAS' ? 'Surat Tugas' : 'Surat Keputusan'} 
                        />
                        <InfoRow 
                            label="Judul Surat" 
                            value={submissionValues.judulAcara} 
                        />
                        <InfoRow 
                            label="Keperluan" 
                            value={submissionValues.keperluan} 
                            showSeparator={false}
                        />
                    </CardContent>
                </Card>

                {/* Identitas Pemohon */}
                <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold text-black mb-4">Identitas Pemohon</h3>
                        
                        <InfoRow 
                            label="Nama Lengkap" 
                            value={submissionValues.nama} 
                        />
                        <InfoRow 
                            label={submissionValues.nim ? "NIM" : "NIP/NIK"} 
                            value={submissionValues.nim || submissionValues.nip || "-"} 
                        />
                        <InfoRow 
                            label="Program Studi" 
                            value={submissionValues.programStudi} 
                            showSeparator={false}
                        />
                    </CardContent>
                </Card>

                {/* Lampiran */}
                {attachments.length > 0 && (
                    <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-bold text-black mb-4">Lampiran</h3>
                            
                            <div className="space-y-3">
                                {attachments.map((att) => (
                                    <div 
                                        key={att.id}
                                        className="flex items-center justify-between p-3.5 bg-white rounded-lg border border-zinc-400"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-black">{att.fileName}</p>
                                                <p className="text-sm text-zinc-400">{formatFileSize(att.fileSize)}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDownloadAttachment(att.id, att.fileName)}
                                        >
                                            <Download className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
        </div>
    );

    return (
        <>
            {/* Page Title */}
            <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
                <h1 className="text-2xl font-bold text-black">Detail</h1>
            </div>

            {/* Main Content - Conditional 2-column layout when document exists */}
            {hasSuratPengantar ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
                    {/* Left Column - PDF Preview */}
                    <div className="bg-zinc-800 rounded-xl min-h-[600px] flex items-center justify-center">
                        {suratPengantarDoc?.fileUrl ? (
                            <iframe
                                src={suratPengantarDoc.fileUrl}
                                className="w-full h-full min-h-[600px] rounded-xl"
                                title="Surat Pengantar Preview"
                            />
                        ) : (
                            <div className="text-center text-white p-8">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Preview Surat Pengantar</p>
                                <p className="text-sm text-zinc-400 mt-2">
                                    Dokumen akan ditampilkan setelah surat ditandatangani
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Right Column - Detail Cards */}
                    <ContentCards />
                </div>
            ) : (
                <div className="pb-24">
                    <ContentCards />
                </div>
            )}

            {/* Bottom Navigation */}
            <BottomNav
                leftContent={
                    <Button 
                        variant="outline" 
                        onClick={() => router.back()}
                        className="border-zinc-800 text-zinc-800 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                }
                rightContent={
                    <div className="flex items-center gap-3">
                        {/* Buat Surat Pengantar Button - Admin Prodi (only when no document exists) */}
                        {permissions.canDraft && !hasSuratPengantar && (
                            <Button 
                                onClick={handleCreateDraft}
                                disabled={actionLoading}
                                className="bg-zinc-800 hover:bg-zinc-900 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FilePlus className="w-4 h-4" />
                                )}
                                Buat Surat Pengantar
                            </Button>
                        )}

                        {/* Ajukan untuk TTD Button - Admin Prodi (after draft created) */}
                        {permissions.canSubmitDraft && hasSuratPengantar && (
                            <Button 
                                onClick={handleSubmitDraft}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Ajukan untuk TTD
                            </Button>
                        )}

                        {/* Tanda Tangan Button - Kaprodi/Kadep */}
                        {permissions.canSign && (
                            <Button 
                                onClick={handleSign}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <PenTool className="w-4 h-4" />
                                )}
                                Tanda Tangan
                            </Button>
                        )}

                        {/* Meneruskan Button (Admin Fakultas) - shows when canReceive or canForward */}
                        {(permissions.canReceive || permissions.canForward) && isAdminFakultas && (
                            <Button 
                                onClick={() => setDispositionDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Meneruskan
                            </Button>
                        )}

                        {/* === STAF FAKULTAS BUTTONS === */}
                        
                        {/* Draft Surat Button (Staf) - buat SK/ST */}
                        {permissions.canDraftSuratHasil && isStaf && (
                            <Button 
                                onClick={() => setDraftSuratDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                <FilePlus className="w-4 h-4" />
                                Draft Surat
                            </Button>
                        )}

                        {/* Submit for Verification Button (Staf) - after draft created */}
                        {permissions.canSubmitVerification && isStaf && (
                            <Button 
                                onClick={handleSubmitForVerification}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Ajukan Verifikasi
                            </Button>
                        )}

                        {/* === SUPERVISOR/MANAJER TU VERIFICATION BUTTONS === */}
                        
                        {/* Verifikasi Button (Supervisor/Manajer TU) */}
                        {permissions.canVerifySuratHasil && (isSupervisor || isManajerTU) && (
                            <Button 
                                onClick={() => setVerifyDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Verifikasi
                            </Button>
                        )}

                        {/* Kembalikan untuk Revisi Button (Supervisor/Manajer TU) */}
                        {permissions.canVerifySuratHasil && (isSupervisor || isManajerTU) && (
                            <Button 
                                onClick={() => setReturnSuratDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-amber-600 hover:bg-amber-700 gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                Revisi
                            </Button>
                        )}

                        {/* === DEKAN/WADEK SIGNING BUTTONS === */}
                        
                        {/* Tanda Tangan SK/ST Button (Dekan/Wadek) */}
                        {permissions.canSignSuratHasil && isDekanWadek && (
                            <Button 
                                onClick={handleSignSuratHasil}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <PenTool className="w-4 h-4" />
                                )}
                                Tanda Tangan
                            </Button>
                        )}

                        {/* === PEJABAT FAKULTAS BUTTONS === */}
                        
                        {/* Selesai Button (Pejabat) - finish processing at their level */}
                        {permissions.canComplete && isPejabat && (
                            <Button 
                                onClick={() => setCompleteDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Selesai
                            </Button>
                        )}

                        {/* Disposisi Button (Pejabat) - forward to lower hierarchy */}
                        {permissions.canDispose && isPejabat && (
                            <Button 
                                onClick={() => setDispositionDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Disposisi
                            </Button>
                        )}

                        {/* Kembalikan Button (Pejabat) - return to previous handler */}
                        {permissions.canReturn && isPejabat && (
                            <Button 
                                onClick={() => setReturnDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-amber-600 hover:bg-amber-700 gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                Kembalikan
                            </Button>
                        )}

                        {/* Setujui Button */}
                        {permissions.canApprove && (
                            <Button 
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Setujui
                            </Button>
                        )}
                        
                        {/* Tolak Button */}
                        {permissions.canReject && (
                            <Button 
                                onClick={() => setRejectDialogOpen(true)}
                                disabled={actionLoading}
                                variant="destructive"
                                className="gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Tolak
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Pengajuan</DialogTitle>
                        <DialogDescription>
                            Masukkan alasan penolakan pengajuan ini. Alasan akan dikirimkan ke pemohon.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan Penolakan</Label>
                            <Textarea
                                id="reason"
                                placeholder="Masukkan alasan penolakan..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject}
                            disabled={actionLoading || !rejectReason.trim()}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tolak Pengajuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disposition Dialog - for Admin Fakultas (forward) and Pejabat (disposition) */}
            <DispositionDialog
                open={dispositionDialogOpen}
                onOpenChange={setDispositionDialogOpen}
                onSubmit={isAdminFakultas ? handleForward : handleDispose}
                loading={actionLoading}
                mode={isAdminFakultas ? "forward" : "disposition"}
                currentUserRole={currentUserRole}
                letterCategory={detail?.letterType?.category as "AKADEMIK" | "SUMBER_DAYA" | "UMUM" | null}
            />

            {/* Complete Dialog - for Pejabat to finish processing */}
            <CompleteDialog
                open={completeDialogOpen}
                onOpenChange={setCompleteDialogOpen}
                onSubmit={handleComplete}
                loading={actionLoading}
            />

            {/* Return Dialog - for Pejabat to return letter */}
            <ReturnDialog
                open={returnDialogOpen}
                onOpenChange={setReturnDialogOpen}
                onSubmit={handleReturn}
                loading={actionLoading}
            />

            {/* Draft Surat Dialog - for Staf to select surat type */}
            <DraftSuratDialog
                open={draftSuratDialogOpen}
                onOpenChange={setDraftSuratDialogOpen}
                onSubmit={handleDraftSurat}
            />

            {/* Verify Surat Hasil Dialog - for Supervisor/Manajer TU */}
            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verifikasi Draft Surat</DialogTitle>
                        <DialogDescription>
                            Verifikasi draft surat untuk diteruskan ke tahap berikutnya.
                            {isSupervisor && " Draft akan diteruskan ke Manajer TU."}
                            {isManajerTU && " Draft akan diteruskan untuk ditandatangani."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="verify-notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="verify-notes"
                                placeholder="Tambahkan catatan verifikasi jika diperlukan..."
                                value={verifyNotes}
                                onChange={(e) => setVerifyNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setVerifyDialogOpen(false);
                                setVerifyNotes("");
                            }}
                            disabled={actionLoading}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleVerifySuratHasil}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Verifikasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Surat Hasil Dialog - for Supervisor/Manajer TU to return for revision */}
            <Dialog open={returnSuratDialogOpen} onOpenChange={setReturnSuratDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kembalikan untuk Revisi</DialogTitle>
                        <DialogDescription>
                            Kembalikan draft surat ke staf untuk diperbaiki.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="return-reason">Alasan Pengembalian <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="return-reason"
                                placeholder="Jelaskan apa yang perlu diperbaiki..."
                                value={returnSuratReason}
                                onChange={(e) => setReturnSuratReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setReturnSuratDialogOpen(false);
                                setReturnSuratReason("");
                            }}
                            disabled={actionLoading}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleReturnSuratHasil}
                            disabled={actionLoading || !returnSuratReason.trim()}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Kembalikan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
