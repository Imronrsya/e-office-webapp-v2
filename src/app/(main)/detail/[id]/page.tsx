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
    Hash,
    Stamp,
    QrCode,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DispositionDialog, LetterCategory } from "./components/disposition-dialog";
import { CompleteDialog } from "./components/complete-dialog";
import { ReturnDialog } from "./components/return-dialog";
import { DraftSuratDialog } from "./components/draft-surat-dialog";
import { PDFPreview } from "./components/pdf-preview";
import { SuratPreview } from "./components/surat-preview";
import { ProcessHistory } from "./components/process-history";
import { DetailSuratInfo } from "./components/detail-surat-info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureModal, type SignatureModalResult } from "@/components/signature";
import { NumberingModal } from "@/components/numbering";
import { legalisasiService } from "@/services/legalisasi.service";

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
    
    // Refresh key for PDF preview - increment to force refresh after actions
    const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
    
    // Dialog states
    const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [draftSuratDialogOpen, setDraftSuratDialogOpen] = useState(false);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [returnSuratDialogOpen, setReturnSuratDialogOpen] = useState(false);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [numberingModalOpen, setNumberingModalOpen] = useState(false);
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

    // UPA role check
    const isUPA = currentUserRole === "UPA";

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
        
        // Open signature modal for Kaprodi/Kadep (same as pejabat)
        setSignatureModalOpen(true);
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

    // Draft Surat Handler (Admin Prodi, Staf, Supervisor - buat SP/SK/ST)
    const handleDraftSurat = (type: "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN") => {
        if (!detail) return;
        setDraftSuratDialogOpen(false);
        router.push(`/draft-surat/${detail.id}?type=${type}`);
    };

    // Check if user can draft surat (Admin Prodi, Staf, Supervisor)
    const isAdminProdi = currentUserRole === "ADMIN_PRODI";
    const canShowDraftButton = isAdminProdi || isSupervisor || isStaf;

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
        
        // Open signature modal instead of using placeholder
        setSignatureModalOpen(true);
    };

    // Handle signature confirmation from modal (for both Surat Pengantar and SK/ST)
    const handleSignatureConfirm = async (result: SignatureModalResult) => {
        if (!detail) return;
        
        setActionLoading(true);
        try {
            // Determine which endpoint to use based on role and document type
            const isKaprodiOrKadep = ["KAPRODI", "KADEP"].includes(currentUserRole);
            const isDekanOrWadek = isDekanWadek;
            
            let response;
            
            if (isKaprodiOrKadep) {
                // KAPRODI/KADEP signing Surat Pengantar
                response = await suratService.sign(detail.id, {
                    signatureData: result.signatureData,
                    signatureUrl: result.signatureUrl,
                    saveSignature: result.saveSignature,
                });
            } else if (isDekanOrWadek) {
                // DEKAN/WADEK signing SK/ST
                response = await suratService.signSuratHasil(detail.id, {
                    signatureData: result.signatureData,
                    signatureUrl: result.signatureUrl,
                    saveSignature: result.saveSignature,
                });
            } else {
                throw new Error('Unauthorized to sign documents');
            }
            
            if (response.success) {
                toast.success("Dokumen berhasil ditandatangani");
                setSignatureModalOpen(false);
                await fetchDetail();
            } else {
                toast.error(response.message || "Gagal menandatangani dokumen");
            }
        } catch (err) {
            console.error("Sign failed:", err);
            toast.error("Terjadi kesalahan saat menandatangani");
        } finally {
            setActionLoading(false);
        }
    };

    // ========================================================================
    // UPA HANDLERS
    // ========================================================================

    // Handle numbering success
    const handleNumberingSuccess = async () => {
        toast.success("Nomor surat berhasil diberikan");
        await fetchDetail();
        // Increment refresh key to force PDF preview to reload
        setPdfRefreshKey(prev => prev + 1);
    };

    // Handle stamp (UPA)
    const handleStamp = async () => {
        if (!detail || actionLoading) return;
        
        const suratHasilDoc = detail.documents?.find(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!suratHasilDoc) {
            toast.error("Dokumen tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            const response = await legalisasiService.applyStamp(suratHasilDoc.id);
            
            if (response.success) {
                toast.success("Stempel berhasil dibubuhkan");
                await fetchDetail();
                setPdfRefreshKey(prev => prev + 1);
            } else {
                toast.error(response.error || "Gagal membubuhkan stempel");
            }
        } catch (err) {
            console.error("Apply stamp failed:", err);
            toast.error("Terjadi kesalahan saat membubuhkan stempel");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle QR Code generation (UPA)
    const handleGenerateQR = async () => {
        if (!detail || actionLoading) return;
        
        const suratHasilDoc = detail.documents?.find(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!suratHasilDoc) {
            toast.error("Dokumen tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            const response = await legalisasiService.generateQRCode(suratHasilDoc.id);
            
            if (response.success) {
                toast.success("QR Code berhasil di-generate");
                await fetchDetail();
                setPdfRefreshKey(prev => prev + 1);
            } else {
                toast.error(response.error || "Gagal generate QR Code");
            }
        } catch (err) {
            console.error("Generate QR failed:", err);
            toast.error("Terjadi kesalahan saat generate QR Code");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle finalize (UPA)
    const handleFinalize = async () => {
        if (!detail || actionLoading) return;
        
        const suratHasilDoc = detail.documents?.find(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!suratHasilDoc || !suratHasilDoc.fileUrl) {
            toast.error("Dokumen atau file tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            const response = await legalisasiService.finalize(suratHasilDoc.id, {
                fileUrl: suratHasilDoc.fileUrl,
                notes: "Surat telah selesai diproses"
            });
            
            if (response.success) {
                toast.success("Surat berhasil diselesaikan");
                await fetchDetail();
                setPdfRefreshKey(prev => prev + 1);
            } else {
                toast.error(response.error || "Gagal menyelesaikan surat");
            }
        } catch (err) {
            console.error("Finalize failed:", err);
            toast.error("Terjadi kesalahan saat menyelesaikan surat");
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
    
    // Check if status is waiting
    const isWaiting = !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(detail.status);

    // Check if surat pengantar document exists
    const suratPengantarDoc = detail.documents?.find(d => d.type === 'SURAT_PENGANTAR');
    const hasSuratPengantar = !!suratPengantarDoc;

    // Check if SK/ST document exists (including SURAT_TUGAS_TABEL)
    const suratHasilDoc = detail.documents?.find(d => 
        d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
    );

    // Get the primary document to display (SK/ST first, then Surat Pengantar)
    const primaryDocument = suratHasilDoc || suratPengantarDoc;
    const hasDocument = !!primaryDocument;

    // User role check for mahasiswa view
    const isMahasiswa = currentUserRole === "MAHASISWA" || !currentUserRole;

    // ========================================================================
    // RENDER
    // ========================================================================

    // ========================================================================
    // IDENTITAS PEMOHON CARD
    // ========================================================================
    const IdentitasPemohonCard = () => (
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
    );

    // ========================================================================
    // LAMPIRAN CARD
    // ========================================================================
    const LampiranCard = () => (
        attachments.length > 0 ? (
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
        ) : null
    );

    // ========================================================================
    // CONTENT CARDS FOR OLD LAYOUT (NO DOCUMENT)
    // ========================================================================
    const ContentCards = () => (
        <div className="space-y-6">
            {/* Riwayat Proses */}
            <ProcessHistory 
                logs={logs}
                isWaiting={isWaiting}
                currentActiveRole={detail.currentActiveRole}
            />

            {/* Detail Surat */}
            <DetailSuratInfo 
                jenisSurat={submissionValues.jenisSurat}
                judulSurat={submissionValues.judulAcara}
                keperluan={submissionValues.keperluan}
            />

            {/* Identitas Pemohon */}
            <IdentitasPemohonCard />

            {/* Lampiran */}
            <LampiranCard />
        </div>
    );

    // ========================================================================
    // MAHASISWA VIEW LAYOUT (dengan preview PDF dan sidebar)
    // ========================================================================
    const MahasiswaViewLayout = () => {
        // Determine the default tab based on available documents
        const defaultTab = hasSuratPengantar ? "surat-pengantar" : "surat-hasil";
        
        // Prepare submission data for template
        const submissionDataForTemplate = {
            nama: submissionValues.nama,
            nim: submissionValues.nim,
            nip: submissionValues.nip,
            programStudi: submissionValues.programStudi,
            departemen: "Informatika", // Default departemen
            keperluan: submissionValues.keperluan,
            judulAcara: submissionValues.judulAcara,
            tanggalAcara: submissionValues.tanggalAcara,
            lokasiAcara: submissionValues.lokasiAcara,
            durasiAcara: submissionValues.durasiAcara,
        };

        // Prepare document data for surat pengantar
        const suratPengantarDocData = suratPengantarDoc ? {
            nomorSurat: suratPengantarDoc.nomorSurat,
            tanggalSurat: suratPengantarDoc.tanggalSurat,
            perihal: suratPengantarDoc.perihal,
            contentHtml: null, // Gunakan template
            isSigned: suratPengantarDoc.isSigned,
            signatures: suratPengantarDoc.signatures?.map(s => ({
                signerRole: s.signerRole,
                signerName: s.signerName,
                signerNip: s.signerNip || "",
                signatureUrl: s.signatureUrl || undefined,
            })),
        } : undefined;
        
        return (
            <>
                {/* Sub-header dengan Judul Pengajuan */}
                <h2 className="text-lg font-bold text-black mb-4">
                    {submissionValues.jenisSurat === 'SURAT_TUGAS' ? 'ST' : 'SK'} - {submissionValues.judulAcara.toUpperCase()}
                </h2>

                {/* Document Tabs with Content */}
                <Tabs defaultValue={defaultTab} className="w-full">
                    {/* Tab Buttons */}
                    <div className="mb-6">
                        <TabsList className="bg-transparent gap-2 p-0 h-auto">
                            <TabsTrigger 
                                value="surat-pengantar"
                                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=inactive]:bg-zinc-200 data-[state=inactive]:text-zinc-800 px-4 py-2 rounded-lg"
                            >
                                Surat Pengantar
                            </TabsTrigger>
                            {suratHasilDoc && (
                                <TabsTrigger 
                                    value="surat-hasil"
                                    className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=inactive]:bg-zinc-200 data-[state=inactive]:text-zinc-800 px-4 py-2 rounded-lg"
                                >
                                    {suratHasilDoc.type === 'SURAT_TUGAS' || suratHasilDoc.type === 'SURAT_TUGAS_TABEL' ? 'Surat Tugas' : 'Surat Keputusan'}
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {/* Main Content - 2 Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
                        {/* Left Column - Surat Preview with Tabs Content */}
                        <div className="relative">
                            <TabsContent value="surat-pengantar" className="mt-0">
                                <SuratPreview 
                                    submissionData={submissionDataForTemplate}
                                    documentData={suratPengantarDocData}
                                    fileUrl={suratPengantarDoc?.fileUrl}
                                    fileName="Surat Pengantar"
                                    onDownload={suratPengantarDoc?.fileUrl ? () => {
                                        const link = document.createElement('a');
                                        link.href = suratPengantarDoc.fileUrl!;
                                        link.download = 'surat-pengantar.pdf';
                                        link.click();
                                    } : undefined}
                                />
                            </TabsContent>
                            {suratHasilDoc && (
                                <TabsContent value="surat-hasil" className="mt-0">
                                    <PDFPreview 
                                        key={`surat-hasil-${pdfRefreshKey}`}
                                        fileUrl={suratHasilDoc?.fileUrl || null}
                                        fileName={suratHasilDoc.type === 'SURAT_TUGAS' || suratHasilDoc.type === 'SURAT_TUGAS_TABEL' ? 'Surat Tugas' : 'Surat Keputusan'}
                                        isSigned={suratHasilDoc?.isSigned || false}
                                        content={suratHasilDoc?.content}
                                        documentType={suratHasilDoc?.type as 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN'}
                                        signatures={suratHasilDoc?.signatures}
                                        onDownload={suratHasilDoc?.fileUrl ? () => {
                                            const link = document.createElement('a');
                                            link.href = suratHasilDoc.fileUrl!;
                                            link.download = `${suratHasilDoc.type.toLowerCase().replace('_', '-')}.pdf`;
                                            link.click();
                                        } : undefined}
                                    />
                                </TabsContent>
                            )}
                        </div>

                        {/* Right Column - Info Cards */}
                        <div className="space-y-6">
                            {/* Riwayat Proses */}
                            <ProcessHistory 
                                logs={logs}
                                isWaiting={isWaiting}
                                currentActiveRole={detail.currentActiveRole}
                            />

                            {/* Detail Surat */}
                            <DetailSuratInfo 
                                jenisSurat={submissionValues.jenisSurat}
                                judulSurat={submissionValues.judulAcara}
                                keperluan={submissionValues.keperluan}
                            />
                        </div>
                    </div>
                </Tabs>
            </>
        );
    };

    return (
        <>
            {/* Page Title */}
            <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
                <h1 className="text-2xl font-bold text-black">Detail</h1>
            </div>

            {/* Main Content - Always use MahasiswaViewLayout with template preview */}
            <div className="pb-24">
                <MahasiswaViewLayout />
            </div>

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

                        {/* === DRAFT SURAT BUTTONS === */}
                        
                        {/* Draft Surat Button - Admin Prodi (buat Surat Pengantar) */}
                        {permissions.canDraft && isAdminProdi && (
                            <Button 
                                onClick={() => setDraftSuratDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-purple-600 hover:bg-purple-700 gap-2"
                            >
                                <FilePlus className="w-4 h-4" />
                                Draft Surat
                            </Button>
                        )}

                        {/* Draft Surat Button - Supervisor (buat SK/ST) */}
                        {(permissions.canDraftSuratHasil || permissions.canVerifySuratHasil) && isSupervisor && (
                            <Button 
                                onClick={() => setDraftSuratDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                <FilePlus className="w-4 h-4" />
                                Draft Surat
                            </Button>
                        )}

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

                        {/* === UPA LEGALISASI BUTTONS === */}
                        
                        {/* Beri Nomor Surat Button (UPA) - when status is UPA_NUMBERING */}
                        {permissions.canAssignNumber && isUPA && detail.status === 'UPA_NUMBERING' && (
                            <Button 
                                onClick={() => setNumberingModalOpen(true)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                <Hash className="w-4 h-4" />
                                Beri Nomor Surat
                            </Button>
                        )}

                        {/* Bubuhkan Stempel Button (UPA) - when status is UPA_STAMPING */}
                        {permissions.canStamp && isUPA && detail.status === 'UPA_STAMPING' && (
                            <Button 
                                onClick={handleStamp}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Stamp className="w-4 h-4" />
                                )}
                                Bubuhkan Stempel
                            </Button>
                        )}

                        {/* Generate QR Code Button (UPA) - when status is UPA_FINALIZING */}
                        {isUPA && detail.status === 'UPA_FINALIZING' && (
                            <Button 
                                onClick={handleGenerateQR}
                                disabled={actionLoading}
                                className="bg-purple-600 hover:bg-purple-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <QrCode className="w-4 h-4" />
                                )}
                                Generate QR Code
                            </Button>
                        )}

                        {/* Selesaikan Button (UPA) - finalize after QR */}
                        {isUPA && detail.status === 'UPA_FINALIZING' && (
                            <Button 
                                onClick={handleFinalize}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                Selesaikan
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
                letterCategory={(detail?.category || detail?.letterType?.category) as "AKADEMIK" | "SUMBER_DAYA" | "UMUM" | null}
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

            {/* Draft Surat Dialog - for Admin Prodi, Staf, Supervisor to select surat type */}
            <DraftSuratDialog
                open={draftSuratDialogOpen}
                onOpenChange={setDraftSuratDialogOpen}
                onSubmit={handleDraftSurat}
                userRole={currentUserRole}
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

            {/* Signature Modal - for Dekan/Wadek to sign documents */}
            <SignatureModal
                open={signatureModalOpen}
                onOpenChange={setSignatureModalOpen}
                onConfirm={handleSignatureConfirm}
                title="Tanda Tangan Digital"
                description="Pilih metode untuk menandatangani dokumen SK/ST"
                isLoading={actionLoading}
            />

            {/* Numbering Modal - for UPA to assign nomor surat with drag-and-drop positioning */}
            {suratHasilDoc && (
                <NumberingModal
                    open={numberingModalOpen}
                    onOpenChange={setNumberingModalOpen}
                    documentId={suratHasilDoc.id}
                    documentType={suratHasilDoc.type}
                    pdfUrl={suratHasilDoc.fileUrl || undefined}
                    content={suratHasilDoc.content}
                    signatures={suratHasilDoc.signatures}
                    onSuccess={handleNumberingSuccess}
                />
            )}
        </>
    );
}
