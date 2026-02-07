"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    Eye,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getRoleScope } from "@/lib/role-mapper";
import { DispositionDialog, LetterCategory } from "./components/dialogs/disposition-dialog";
import { CompleteDialog } from "./components/dialogs/complete-dialog";
import { ReturnDialog } from "./components/dialogs/return-dialog";
import { RevisionDialog } from "./components/dialogs/revision-dialog";
import { DraftSuratDialog } from "./components/dialogs/draft-surat-dialog";
import { ApproveDialog } from "./components/dialogs/approve-dialog";
import { RejectDialog } from "./components/dialogs/reject-dialog";
// Universal Preview - Single Source of Truth
import { 
    PDFPreview, 
    SuratPreview 
} from "@/components/universal-preview";
import { ProcessHistory } from "./components/process-history";
import { DetailSuratInfo } from "./components/detail-surat-info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureModal, type SignatureModalResult } from "@/components/signature";
import { NumberingModal } from "@/components/numbering";
import { legalisasiService } from "@/services/legalisasi.service";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Label display untuk setiap role (untuk dropdown return targets)
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
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [detail, setDetail] = useState<SubmissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Query parameter untuk tipe surat (dari filter dashboard fakultas)
    // type=masuk -> tampilkan Surat Pengantar
    // type=keluar -> tampilkan Surat Tugas/Keputusan
    const filterType = searchParams?.get('type') as 'masuk' | 'keluar' | null;
    
    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    
    // Refresh key for PDF preview - increment to force refresh after actions
    const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
    
    // Dialog states
    const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [draftSuratDialogOpen, setDraftSuratDialogOpen] = useState(false);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [numberingModalOpen, setNumberingModalOpen] = useState(false);
    const [verifyNotes, setVerifyNotes] = useState("");
    const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<{id: string, fileName: string, fileUrl: string, mimeType: string | null} | null>(null);
    
    // Document attachment preview modal (for staff uploaded attachments in surat hasil)
    const [docAttachmentPreviewOpen, setDocAttachmentPreviewOpen] = useState(false);
    const [previewDocAttachment, setPreviewDocAttachment] = useState<{ name: string; url: string; isPdf: boolean } | null>(null);
    
    // Supervisor selection modal state - untuk kategori UMUM saat Ajukan Verifikasi
    const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState<'SUPERVISOR_AKADEMIK' | 'SUPERVISOR_SUMBER_DAYA' | null>(null);
    
    // Active document tab state - untuk mengontrol lampiran yang ditampilkan
    const [activeDocTab, setActiveDocTab] = useState<'surat-pengantar' | 'surat-hasil'>('surat-pengantar');

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
    
    // Set default active tab berdasarkan dokumen yang tersedia
    useEffect(() => {
        if (detail) {
            const hasPengantar = detail.documents?.some(d => d.type === 'SURAT_PENGANTAR');
            setActiveDocTab(hasPengantar ? 'surat-pengantar' : 'surat-hasil');
        }
    }, [detail]);

    // Download attachment handler - force download without opening in browser
    const handleDownloadAttachment = async (fileName: string, fileUrl: string) => {
        if (!detail) return;
        try {
            // Fetch file as blob to force download
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            
            toast.success(`Berhasil mengunduh ${fileName}`);
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Gagal mengunduh file");
        }
    };

    // Preview attachment handler - use fileUrl from attachment data directly
    const handlePreviewAttachment = (attachmentId: string, fileName: string, mimeType: string | null, fileUrl: string) => {
        if (!detail) return;
        setPreviewAttachment({
            id: attachmentId,
            fileName,
            fileUrl,
            mimeType
        });
        setAttachmentPreviewOpen(true);
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
                setApproveDialogOpen(false);
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

    const handleReject = async (reason: string) => {
        if (!detail) return;
        
        setActionLoading(true);
        try {
            const response = await suratService.reject(detail.id, reason);
            if (response.success) {
                toast.success("Pengajuan berhasil ditolak");
                setRejectDialogOpen(false);
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
        
        // Check if supervisor is creating new draft for surat masuk (has submission)
        // Supervisor should get clean form with overwrite mode
        const isSupervisor = currentUserRole === "SUPERVISOR_AKADEMIK" || currentUserRole === "SUPERVISOR_SUMBER_DAYA" || currentUserRole === "MANAJER_TU";
        const hasSuratMasukSubmission = detail.submissionValues !== null;
        const shouldResetForSupervisor = isSupervisor && hasSuratMasukSubmission;
        
        // Add reset=true query param for supervisor to trigger overwrite mode
        const resetParam = shouldResetForSupervisor ? '&reset=true' : '';
        router.push(`/draft-surat/${detail.id}?type=${type}${resetParam}`);
    };

    // Edit Draft Handler - navigates to draft page with existing document type
    const handleEditDraft = () => {
        if (!detail) return;
        
        // Find existing SK/ST document to determine type
        const existingDoc = detail.documents?.find(d => 
            d.type === 'SURAT_TUGAS' || 
            d.type === 'SURAT_TUGAS_TABEL' || 
            d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (existingDoc) {
            router.push(`/draft-surat/${detail.id}?type=${existingDoc.type}`);
        } else {
            toast.error("Dokumen tidak ditemukan");
        }
    };

    // Check if user can draft surat (Admin Prodi, Staf, Supervisor)
    const isAdminProdi = currentUserRole === "ADMIN_PRODI";
    const canShowDraftButton = isAdminProdi || isSupervisor || isStaf;

    // Staf submit draft for verification
    const handleSubmitForVerification = async () => {
        if (!detail || actionLoading) return;
        
        // Check if SK/ST document exists (including table version)
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!hasSkst) {
            toast.error("Draft SK/ST belum dibuat");
            return;
        }
        
        // Untuk kategori UMUM, tampilkan modal untuk memilih supervisor
        if (detail.category === 'UMUM') {
            setSupervisorModalOpen(true);
            return;
        }
        
        // Langsung submit untuk kategori non-UMUM
        await doSubmitForVerification();
    };
    
    // Fungsi submit untuk verifikasi yang sebenarnya
    const doSubmitForVerification = async (targetSupervisor?: 'SUPERVISOR_AKADEMIK' | 'SUPERVISOR_SUMBER_DAYA') => {
        if (!detail) return;
        
        setActionLoading(true);
        try {
            // Use letterId, not documentId
            const response = await suratService.submitDraftForVerification(detail.id, targetSupervisor);
            
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

    // Supervisor/Manajer TU/Pejabat verifies surat hasil
    const handleVerifySuratHasil = async () => {
        if (!detail || actionLoading) return;
        
        // Just check if SK/ST document exists (including table version)
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
        );
        
        if (!hasSkst) {
            toast.error("Dokumen SK/ST tidak ditemukan");
            return;
        }
        
        setActionLoading(true);
        try {
            let response;
            
            // PENTING: Gunakan endpoint berbeda berdasarkan role
            // Pejabat (Wadek/Dekan) yang bukan penandatangan → pejabatVerifySuratHasil
            // Supervisor/Manajer TU → approveSuratHasil
            if (isDekanWadek) {
                // Pejabat yang BUKAN penandatangan
                response = await suratService.pejabatVerifySuratHasil(detail.id, verifyNotes.trim() || undefined);
            } else {
                // Supervisor/Manajer TU
                response = await suratService.approveSuratHasil(detail.id, verifyNotes.trim() || undefined);
            }
            
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

    // Dekan/Wadek signs surat hasil
    const handleSignSuratHasil = async () => {
        if (!detail || actionLoading) return;
        
        // Just check if SK/ST document exists (including table version)
        const hasSkst = detail.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
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

                {/* Sub-header Skeleton */}
                <div className="h-6 w-64 bg-zinc-200 rounded animate-pulse mb-4" />

                {/* Tab Buttons Skeleton */}
                <div className="flex gap-2 mb-6">
                    <div className="h-9 w-32 bg-zinc-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-28 bg-zinc-200 rounded-lg animate-pulse" />
                </div>

                {/* 2-Column Layout Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
                    {/* Left Column - PDF Preview Skeleton */}
                    <div className="bg-neutral-50 border border-zinc-400 rounded-xl p-4">
                        <div className="aspect-[3/4] bg-zinc-200 rounded animate-pulse" />
                    </div>

                    {/* Right Column - Info Cards Skeleton */}
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
                                {/* Jenis Surat Row */}
                                <div className="py-3 border-b border-zinc-300">
                                    <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                                </div>
                                {/* Judul Surat Row */}
                                <div className="py-3 border-b border-zinc-300">
                                    <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                                </div>
                                {/* Keperluan Row */}
                                <div className="py-3">
                                    <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-40 bg-zinc-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Identitas Pemohon Skeleton */}
                        <div className="bg-neutral-50 border border-zinc-400 rounded-xl p-6">
                            <div className="h-5 w-36 bg-zinc-200 rounded mb-4 animate-pulse" />
                            <div className="space-y-4">
                                {/* Nama Lengkap Row */}
                                <div className="py-3 border-b border-zinc-300">
                                    <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-40 bg-zinc-200 rounded animate-pulse" />
                                </div>
                                {/* NIM/NIP Row */}
                                <div className="py-3 border-b border-zinc-300">
                                    <div className="h-3 w-12 bg-zinc-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                                </div>
                                {/* Program Studi Row */}
                                <div className="py-3">
                                    <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-28 bg-zinc-200 rounded animate-pulse" />
                                </div>
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
                    <Button onClick={() => router.push('/dashboard')} variant="outline">
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
    const hasSuratHasil = !!suratHasilDoc;

    // Get the primary document to display (SK/ST first, then Surat Pengantar)
    const primaryDocument = suratHasilDoc || suratPengantarDoc;
    const hasDocument = !!primaryDocument;

    // User role check for mahasiswa view
    const isMahasiswa = currentUserRole === "MAHASISWA" || !currentUserRole;
    
    // Determine user's scope (DEPARTEMEN, FAKULTAS, or UPA)
    const userScope = getRoleScope(currentUserRole);
    
    // Check if UPA has completed processing (for departemen scope - show SK/ST option)
    const isUpaCompleted = detail.status === 'COMPLETED';
    
    // Check permission flags from backend
    const { isVerificationMode, isPreDraftMode, showSuratPengantar, showSuratHasil } = permissions;
    
    // Determine what document to show based on scope and filter type
    // FAKULTAS: show based on filter type (masuk = pengantar, keluar = hasil)
    // DEPARTEMEN/MAHASISWA: show pengantar when available, show hasil when available, show both if both available
    // UPA: show hasil
    // SPECIAL: If in verification mode or pre-draft mode, show form-focused view
    const getDocumentViewMode = (): 'pengantar' | 'hasil' | 'both' | 'form-only' => {
        // Jika dalam verification mode atau pre-draft mode (dan bukan mahasiswa/dosen), fokus ke form
        // Mahasiswa/Dosen selalu bisa lihat dokumen jika ada
        const isMahasiswaOrDosen = currentUserRole === 'MAHASISWA' || currentUserRole === 'DOSEN' || !currentUserRole;
        
        if ((isVerificationMode || isPreDraftMode) && !isMahasiswaOrDosen) {
            return 'form-only';
        }
        
        // Jika showSuratPengantar false dari backend DAN bukan mahasiswa, tidak tampilkan pengantar
        if (!showSuratPengantar && userScope === 'DEPARTEMEN' && !isMahasiswaOrDosen) {
            return 'form-only';
        }
        
        if (userScope === 'FAKULTAS') {
            // Lingkup Fakultas: berdasarkan filter dari dashboard
            if (filterType === 'keluar') {
                return 'hasil';
            }
            if (filterType === 'masuk') {
                return 'pengantar';
            }
            // Fallback jika tidak ada filter (akses langsung)
            return 'pengantar';
        }
        
        if (userScope === 'UPA') {
            // UPA: selalu lihat surat hasil
            return 'hasil';
        }
        
        // Lingkup Departemen / Mahasiswa / Dosen:
        // PERBAIKAN: Tampilkan 'both' jika KEDUA dokumen ada (tidak perlu menunggu UPA selesai)
        // Tampilkan 'pengantar' jika hanya surat pengantar ada
        // Tampilkan 'hasil' jika hanya surat hasil ada
        // Tampilkan 'form-only' jika belum ada dokumen sama sekali
        const hasPengantarDoc = showSuratPengantar && hasSuratPengantar;
        const hasHasilDoc = showSuratHasil && hasSuratHasil;
        
        if (hasPengantarDoc && hasHasilDoc) {
            return 'both';
        }
        if (hasHasilDoc) {
            return 'hasil';
        }
        if (hasPengantarDoc) {
            return 'pengantar';
        }
        
        return 'form-only';
    };
    
    const documentViewMode = getDocumentViewMode();

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
                    label={submissionValues.nim ? "NIM" : "NIP"} 
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
    // LAMPIRAN CARD (Lampiran Submission dari Pengaju + Lampiran Admin Prodi)
    // Aturan tampilan:
    // - UPA scope: SEMBUNYIKAN (UPA hanya perlu lihat Lampiran Surat final)
    // - Tab surat-hasil aktif DAN ada dokumen surat-hasil: SEMBUNYIKAN untuk SEMUA user
    // - FAKULTAS scope + surat keluar (filterType=keluar): SEMBUNYIKAN (kecuali pengaju sendiri)
    // - Selain itu: TAMPILKAN jika ada attachments
    // ========================================================================
    const LampiranCard = () => {
        // Get Admin Prodi attachments from SURAT_PENGANTAR document
        const pengantarDoc = detail?.documents?.find(d => d.type === 'SURAT_PENGANTAR');
        const rawPengantarAttachments = pengantarDoc?.attachmentUrls || [];
        const adminProdiAttachments: Array<{ url: string; name: string }> = Array.isArray(rawPengantarAttachments) 
            ? rawPengantarAttachments.map((item: any) => {
                if (typeof item === 'string') {
                    const urlWithoutParams = item.split('?')[0];
                    const parts = urlWithoutParams.split('/');
                    const fullName = parts[parts.length - 1] || 'Lampiran';
                    const cleanName = fullName.replace(/^\d+-/, '');
                    return { url: item, name: decodeURIComponent(cleanName) };
                }
                return { url: item.url || '', name: item.name || 'Lampiran' };
            }).filter((item) => item.url && item.url.length > 0)
            : [];
        
        // Total attachments count
        const totalAttachments = attachments.length + adminProdiAttachments.length;
        
        // Jika tidak ada attachments sama sekali, jangan tampilkan
        if (totalAttachments === 0) {
            return null;
        }
        
        // ATURAN 0: UPA tidak perlu melihat lampiran pengaju (hanya lihat lampiran surat final)
        if (isUPA) {
            return null;
        }
        
        // ATURAN 1: Tab surat-hasil aktif DAN benar-benar ada dokumen surat-hasil
        // -> SEMBUNYIKAN untuk SEMUA user (termasuk mahasiswa/dosen)
        // PENTING: Hanya sembunyikan jika MEMANG ADA dokumen surat-hasil (bukan default fallback)
        // Logika: Saat lihat Surat Tugas/Keputusan yang sudah ada, fokus HANYA ke lampiran surat final
        const hasSuratHasilDoc = detail?.documents?.some(d => 
            d.type === 'SURAT_TUGAS' || d.type === 'SURAT_TUGAS_TABEL' || d.type === 'SURAT_KEPUTUSAN'
        );
        if (activeDocTab === 'surat-hasil' && hasSuratHasilDoc) {
            return null;
        }
        
        // Check if current user is the original submitter (pengaju)
        const isPengaju = isMahasiswa || currentUserRole === 'DOSEN';
        
        // ATURAN 2: Lingkup FAKULTAS dengan filter surat keluar -> SEMBUNYIKAN
        // KECUALI jika user adalah pengaju (mereka harus bisa lihat lampiran sendiri)
        if (!isPengaju && userScope === 'FAKULTAS' && filterType === 'keluar') {
            return null;
        }
        
        // Handler for admin prodi attachment preview
        const handleAdminAttachmentPreview = (url: string, name: string) => {
            const isPdf = url.toLowerCase().includes('.pdf');
            setPreviewDocAttachment({ url, name, isPdf });
            setDocAttachmentPreviewOpen(true);
        };
        
        // Handler for admin prodi attachment download
        const handleAdminAttachmentDownload = async (url: string, fileName: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                toast.success(`Berhasil mengunduh ${fileName}`);
            } catch (error) {
                console.error('Download failed:', error);
                toast.error('Gagal mengunduh file');
            }
        };

        
        return (
            <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-black mb-4">Lampiran Pengaju</h3>
                    
                    <div className="space-y-3">
                        {/* Lampiran dari Pengaju (Mahasiswa/Dosen) */}
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
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handlePreviewAttachment(att.id, att.fileName, att.mimeType, att.fileUrl)}
                                        title="Preview"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownloadAttachment(att.fileName, att.fileUrl)}
                                        title="Download"
                                    >
                                        <Download className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        
                        {/* Lampiran dari Admin Prodi (dari SURAT_PENGANTAR document) */}
                        {adminProdiAttachments.map((att, index) => {
                            const isPdf = att.url.toLowerCase().includes('.pdf');
                            const isImage = /\.(jpg|jpeg|png|gif)/i.test(att.url);
                            
                            return (
                                <div 
                                    key={`admin-${index}`}
                                    className="flex items-center justify-between p-3.5 bg-amber-50 rounded-lg border border-amber-300"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            isPdf ? "bg-red-100" : isImage ? "bg-green-100" : "bg-blue-100"
                                        )}>
                                            <FileText className={cn(
                                                "w-5 h-5",
                                                isPdf ? "text-red-600" : isImage ? "text-green-600" : "text-blue-600"
                                            )} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-black truncate max-w-[180px]" title={att.name}>
                                                {att.name}
                                            </p>
                                            <p className="text-xs text-amber-600">Dari Admin Prodi</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleAdminAttachmentPreview(att.url, att.name)}
                                            title="Preview"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleAdminAttachmentDownload(att.url, att.name)}
                                            title="Download"
                                        >
                                            <Download className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // ========================================================================
    // LAMPIRAN DOKUMEN CARD (Lampiran dari Staf/Supervisor - PDF/JPG/PNG)
    // Hanya tampil di surat keluar atau saat tab surat-hasil aktif
    // KHUSUS UPA: Selalu tampilkan (tidak ada filter)
    // NOTE: SURAT_PENGANTAR attachments are shown in LampiranCard, not here
    // ========================================================================
    const LampiranDokumenCard = () => {
        // KHUSUS UPA: Selalu tampilkan lampiran surat, skip semua kondisi lain
        if (isUPA) {
            // Langsung lompat ke logic render lampiran
        } else {
            // Hanya tampilkan di surat keluar (filterType !== 'masuk')
            // atau ketika tab aktif adalah 'surat-hasil' (surat tugas/keputusan)
            if (filterType === 'masuk') return null;
            
            // Untuk DEPARTEMEN scope, hanya tampilkan jika tab surat-hasil aktif
            if (userScope === 'DEPARTEMEN' && activeDocTab !== 'surat-hasil') return null;
        }
        
        // Ambil lampiran dari dokumen (attachmentUrls dari LetterDocument)
        // NOTE: SURAT_PENGANTAR is NOT included here - it's shown in LampiranCard instead
        const suratHasilDoc = detail?.documents?.find(d => 
            d.type === 'SURAT_TUGAS' || 
            d.type === 'SURAT_TUGAS_TABEL' || 
            d.type === 'SURAT_KEPUTUSAN'
        );
        
        // Support new format: array of { url, name } or old format: array of strings
        const rawAttachments = suratHasilDoc?.attachmentUrls || [];
        const docAttachments: Array<{ url: string; name: string }> = Array.isArray(rawAttachments) 
            ? rawAttachments.map((item: any) => {
                if (typeof item === 'string') {
                    // Old format: just URL - extract filename from path
                    const urlWithoutParams = item.split('?')[0];
                    const parts = urlWithoutParams.split('/');
                    const fullName = parts[parts.length - 1] || 'Lampiran';
                    const cleanName = fullName.replace(/^\d+-/, ''); // Remove timestamp prefix
                    return { url: item, name: decodeURIComponent(cleanName) };
                }
                // New format: { url, name }
                return { url: item.url || '', name: item.name || 'Lampiran' };
            }).filter((item) => item.url && item.url.length > 0)
            : [];
        
        if (docAttachments.length === 0) return null;

        // Handle preview with modal
        const handlePreview = (url: string, name: string) => {
            const isPdf = url.toLowerCase().includes('.pdf');
            setPreviewDocAttachment({ url, name, isPdf });
            setDocAttachmentPreviewOpen(true);
        };

        // Handle download with proper filename
        const handleDownload = async (url: string, fileName: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                toast.success(`Berhasil mengunduh ${fileName}`);
            } catch (error) {
                console.error('Download failed:', error);
                toast.error('Gagal mengunduh file');
            }
        };
        
        return (
            <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-black mb-4">
                        Lampiran Surat Keluar ({docAttachments.length})
                    </h3>
                    
                    <div className="space-y-3">
                        {docAttachments.map((attachment, index) => {
                            const { url, name } = attachment;
                            const isPdf = url.toLowerCase().includes('.pdf');
                            const isImage = /\.(jpg|jpeg|png|gif)/i.test(url);
                            
                            return (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between p-3.5 bg-white rounded-lg border border-amber-300"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            isPdf ? "bg-red-100" : isImage ? "bg-green-100" : "bg-blue-100"
                                        )}>
                                            <FileText className={cn(
                                                "w-5 h-5",
                                                isPdf ? "text-red-600" : isImage ? "text-green-600" : "text-blue-600"
                                            )} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-black truncate max-w-[180px]" title={name}>
                                                {name}
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                {isPdf ? 'PDF Document' : isImage ? 'Image' : 'Attachment'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Preview button - opens modal */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePreview(url, name)}
                                            title="Preview"
                                            className="h-8 w-8"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        {/* Download button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDownload(url, name)}
                                            title="Download"
                                            className="h-8 w-8"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };

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
                currentStatus={detail.status}
                userScope={userScope}
                filterType={filterType}
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
            
            {/* Lampiran Dokumen dari Staf/Supervisor */}
            <LampiranDokumenCard />
        </div>
    );

    // ========================================================================
    // MAHASISWA VIEW LAYOUT (dengan preview PDF dan sidebar)
    // ========================================================================
    const MahasiswaViewLayout = () => {
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
            content: suratPengantarDoc.content, // Include content data from draft
            contentHtml: null, // Gunakan template
            isSigned: suratPengantarDoc.isSigned,
            tembusan: suratPengantarDoc.tembusan, // Include tembusan data from draft
            signatures: suratPengantarDoc.signatures?.map(s => ({
                signerRole: s.signerRole,
                signerName: s.signerName,
                signerNip: s.signerNip || "",
                signatureUrl: s.signatureUrl || undefined,
                prefix: s.prefix || undefined, // Awalan seperti "Mengetahui,"
                // Include position data from positioner
                positionX: s.positionX,
                positionY: s.positionY,
                positionPage: s.positionPage,
            })),
        } : undefined;
        
        // Render Surat Pengantar Preview
        const renderSuratPengantarPreview = () => (
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
        );
        
        // Render Surat Hasil Preview
        const renderSuratHasilPreview = () => {
            if (!suratHasilDoc) {
                return (
                    <Card className="bg-neutral-50 border-zinc-400 rounded-xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
                        <p className="text-zinc-600 text-sm">
                            Surat Tugas/Keputusan belum tersedia.
                        </p>
                        {userScope === 'DEPARTEMEN' && (
                            <p className="text-zinc-400 text-xs mt-2">
                                Surat akan tersedia setelah diproses oleh UPA.
                            </p>
                        )}
                    </Card>
                );
            }
            
            // Debug logging untuk stempel
            console.log('[Detail Page] suratHasilDoc.sealImageUrl:', suratHasilDoc.sealImageUrl);
            console.log('[Detail Page] suratHasilDoc.signatures:', suratHasilDoc.signatures);
            
            // Merge tembusan, stempel, qrCode, and nomorSurat into content for preview rendering
            const contentWithTembusan = suratHasilDoc.content 
                ? { 
                    ...suratHasilDoc.content, 
                    // Gunakan nomor surat dari database column saja, jangan dari content JSON
                    nomorSurat: suratHasilDoc.nomorSurat || '',
                    tembusan: suratHasilDoc.tembusan || [],
                    stempelUrl: suratHasilDoc.sealImageUrl || undefined,
                    qrCodeDataUrl: suratHasilDoc.qrCodeUrl || undefined,
                  }
                : suratHasilDoc.tembusan ? { 
                    nomorSurat: suratHasilDoc.nomorSurat,
                    tembusan: suratHasilDoc.tembusan,
                    stempelUrl: suratHasilDoc.sealImageUrl || undefined,
                    qrCodeDataUrl: suratHasilDoc.qrCodeUrl || undefined,
                  } : {
                    nomorSurat: suratHasilDoc.nomorSurat,
                    stempelUrl: suratHasilDoc.sealImageUrl || undefined,
                    qrCodeDataUrl: suratHasilDoc.qrCodeUrl || undefined,
                  };
            
            return (
                <PDFPreview 
                    key={`surat-hasil-${pdfRefreshKey}`}
                    fileUrl={null}  // Selalu gunakan HTML template untuk preview agar konsisten
                    fileName={suratHasilDoc.type === 'SURAT_TUGAS' || suratHasilDoc.type === 'SURAT_TUGAS_TABEL' ? 'Surat Tugas' : 'Surat Keputusan'}
                    isSigned={suratHasilDoc.isSigned || false}
                    content={contentWithTembusan}
                    documentType={suratHasilDoc.type as 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN'}
                    signatures={suratHasilDoc.signatures}
                    onDownload={suratHasilDoc.fileUrl ? () => {
                        const link = document.createElement('a');
                        link.href = suratHasilDoc.fileUrl!;
                        link.download = `${suratHasilDoc.type.toLowerCase().replace('_', '-')}.pdf`;
                        link.click();
                    } : undefined}
                />
            );
        };
        
        // Determine the default tab for 'both' mode
        const defaultTab = hasSuratPengantar ? "surat-pengantar" : "surat-hasil";
        
        return (
            <>
                {/* Sub-header dengan Judul Pengajuan */}
                <h2 className="text-lg font-bold text-black mb-4">
                    {documentViewMode === 'hasil' || filterType === 'keluar'
                        ? `${suratHasilDoc?.type === 'SURAT_KEPUTUSAN' ? 'SK' : 'ST'} - `
                        : `${submissionValues.jenisSurat === 'SURAT_TUGAS' ? 'ST' : 'SK'} - `
                    }
                    {(submissionValues.judulAcara || 'Surat').toUpperCase()}
                </h2>
                
                {/* Info label untuk lingkup fakultas */}
                {userScope === 'FAKULTAS' && filterType && (
                    <div className="mb-4 text-sm text-zinc-500">
                        {filterType === 'masuk' ? (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Surat Masuk (Surat Pengantar)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Surat Keluar ({suratHasilDoc?.type === 'SURAT_KEPUTUSAN' ? 'Surat Keputusan' : 'Surat Tugas'})
                            </span>
                        )}
                    </div>
                )}

                {/* Content based on documentViewMode */}
                {documentViewMode === 'form-only' ? (
                    /* Mode form-only: Verification mode atau Pre-draft mode - fokus ke data form, bukan dokumen */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Info Cards (prioritas utama) */}
                        <div className="space-y-6">
                            {/* Riwayat Proses */}
                            <ProcessHistory 
                                logs={logs}
                                isWaiting={isWaiting}
                                currentActiveRole={detail.currentActiveRole}
                                currentStatus={detail.status}
                                userScope={userScope}
                                filterType={filterType}
                            />

                            {/* Detail Surat */}
                            <DetailSuratInfo 
                                jenisSurat={submissionValues.jenisSurat}
                                judulSurat={submissionValues.judulAcara}
                                keperluan={submissionValues.keperluan}
                            />
                        </div>

                        {/* Right Column - Identitas dan Lampiran */}
                        <div className="space-y-6">
                            {/* Identitas Pemohon */}
                            <IdentitasPemohonCard />

                            {/* Lampiran */}
                            <LampiranCard />
                            
                            {/* Lampiran Dokumen dari Staf/Supervisor */}
                            <LampiranDokumenCard />
                            
                            {/* Info untuk user tentang mode ini */}
                            {isVerificationMode && (
                                <Card className="bg-blue-50 border-blue-200 rounded-xl">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">
                                                    Mode Verifikasi
                                                </p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Fokus pada data formulir dan lampiran untuk proses verifikasi.
                                                    Preview surat akan tersedia setelah proses drafting selesai.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {isPreDraftMode && !isVerificationMode && (
                                <Card className="bg-amber-50 border-amber-200 rounded-xl">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-amber-800">
                                                    Menunggu Proses
                                                </p>
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Surat pengantar belum digenerate. 
                                                    Dokumen akan tersedia setelah proses drafting oleh Admin Prodi.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                ) : documentViewMode === 'both' ? (
                    /* Lingkup Departemen dengan tabs (jika UPA sudah selesai) */
                    <Tabs 
                        defaultValue={defaultTab} 
                        className="w-full"
                        onValueChange={(value) => setActiveDocTab(value as 'surat-pengantar' | 'surat-hasil')}
                    >
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
                                    {renderSuratPengantarPreview()}
                                </TabsContent>
                                <TabsContent value="surat-hasil" className="mt-0">
                                    {renderSuratHasilPreview()}
                                </TabsContent>
                            </div>

                            {/* Right Column - Info Cards */}
                            <div className="space-y-6">
                                {/* Riwayat Proses */}
                                <ProcessHistory 
                                    logs={logs}
                                    isWaiting={isWaiting}
                                    currentActiveRole={detail.currentActiveRole}
                                    currentStatus={detail.status}
                                    userScope={userScope}
                                    filterType={filterType}
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
                                
                                {/* Lampiran Dokumen dari Staf/Supervisor */}
                                <LampiranDokumenCard />
                            </div>
                        </div>
                    </Tabs>
                ) : (
                    /* Mode pengantar-only atau hasil-only (tanpa tabs) */
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
                        {/* Left Column - Single Document Preview */}
                        <div className="relative">
                            {documentViewMode === 'pengantar' && renderSuratPengantarPreview()}
                            {documentViewMode === 'hasil' && renderSuratHasilPreview()}
                        </div>

                        {/* Right Column - Info Cards */}
                        <div className="space-y-6">
                            {/* Riwayat Proses */}
                            <ProcessHistory 
                                logs={logs}
                                isWaiting={isWaiting}
                                currentActiveRole={detail.currentActiveRole}
                                currentStatus={detail.status}
                                userScope={userScope}
                                filterType={filterType}
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
                            
                            {/* Lampiran Dokumen dari Staf/Supervisor */}
                            <LampiranDokumenCard />
                        </div>
                    </div>
                )}
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
                        onClick={() => router.push('/dashboard')}
                        className="border-zinc-800 text-zinc-800 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                }
                rightContent={
                    /* 
                     * Untuk lingkup Fakultas dengan filter surat masuk:
                     * Aksi disembunyikan HANYA jika surat keluar (SK/ST) sudah dibuat.
                     * Jika surat keluar belum dibuat, role masih dapat melakukan aksi.
                     */
                    (userScope === 'FAKULTAS' && filterType === 'masuk' && hasSuratHasil) ? (
                        null
                    ) : (
                    <div className="flex items-center gap-3">
                        {/* Buat Surat Pengantar Button - Admin Prodi (only when no document exists) */}
                        {/* {permissions.canDraft && !hasSuratPengantar && (
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
                        )} */}

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
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
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

                        {/* Edit Draft Button (Staf/Supervisor) - edit existing draft */}
                        {permissions.canEditDraft && (isStaf || isSupervisor) && (
                            <Button 
                                onClick={handleEditDraft}
                                disabled={actionLoading}
                                className="bg-warning text-warning-foreground hover:bg-warning/90 gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Edit Draft
                            </Button>
                        )}

                        {/* Submit for Verification Button (Staf) - after draft created */}
                        {permissions.canSubmitVerification && isStaf && (
                            <Button 
                                onClick={handleSubmitForVerification}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Ajukan Verifikasi
                            </Button>
                        )}

                        {/* Submit for Verification Button (Supervisor) - when in DRAFTING status after revision from Manajer TU */}
                        {permissions.canSubmitVerification && isSupervisor && detail.status === 'FAKULTAS_DRAFTING' && (
                            <Button 
                                onClick={handleSubmitForVerification}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
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
                        
                        {/* Edit Draft Button (Supervisor/Manajer TU) - during verification */}
                        {permissions.canEditDraftInVerification && (isSupervisor || isManajerTU) && (
                            <Button 
                                onClick={handleEditDraft}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Edit Draft
                            </Button>
                        )}

                        {/* Verifikasi Button (Supervisor/Manajer TU) */}
                        {permissions.canVerifySuratHasil && (isSupervisor || isManajerTU) && (
                            <Button 
                                onClick={() => setVerifyDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Verifikasi
                            </Button>
                        )}

                        {/* Kembalikan untuk Direvisi Button (Supervisor/Manajer TU) - untuk surat keluar */}
                        {permissions.canReturnForRevision && (isSupervisor || isManajerTU) && (
                            <Button 
                                onClick={() => setRevisionDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-warning text-warning-foreground hover:bg-warning/90 gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                Kembalikan untuk Direvisi
                            </Button>
                        )}

                        {/* === UPA LEGALISASI BUTTONS === */}
                        
                        {/* Beri Nomor Surat Button (UPA) - when status is UPA_NUMBERING */}
                        {permissions.canAssignNumber && isUPA && detail.status === 'UPA_NUMBERING' && (
                            <Button 
                                onClick={() => setNumberingModalOpen(true)}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
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
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
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
                        
                        {/* Tanda Tangan SK/ST Button (Dekan/Wadek) - HANYA jika user di daftar penandatangan */}
                        {permissions.canSignSuratHasil && isDekanWadek && (
                            <Button 
                                onClick={handleSignSuratHasil}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <PenTool className="w-4 h-4" />
                                )}
                                Tanda Tangan
                            </Button>
                        )}

                        {/* Verifikasi SK/ST Button (Dekan/Wadek) - HANYA jika user BUKAN penandatangan */}
                        {permissions.canVerifySuratHasil && isDekanWadek && (
                            <Button 
                                onClick={() => setVerifyDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Verifikasi
                            </Button>
                        )}

                        {/* Kembalikan untuk Direvisi Button (Dekan/Wadek) - baik yang signing maupun verifying, untuk surat keluar */}
                        {permissions.canReturnForRevision && isDekanWadek && (
                            <Button 
                                onClick={() => setRevisionDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-warning text-warning-foreground hover:bg-warning/90 gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                Kembalikan untuk Direvisi
                            </Button>
                        )}

                        {/* === PEJABAT FAKULTAS BUTTONS === */}
                        
                        {/* Selesai Button (Pejabat) - finish processing at their level */}
                        {permissions.canComplete && isPejabat && (
                            <Button 
                                onClick={() => setCompleteDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
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
                                className="bg-warning text-warning-foreground hover:bg-warning/90 gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                Kembalikan
                            </Button>
                        )}

                        {/* Setujui Button */}
                        {permissions.canApprove && (
                            <Button 
                                onClick={() => setApproveDialogOpen(true)}
                                disabled={actionLoading}
                                className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
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
                    )
                }
            />

            {/* Approve Dialog - Konfirmasi Setujui dengan Alert Dialog */}
            <ApproveDialog
                open={approveDialogOpen}
                onOpenChange={setApproveDialogOpen}
                onConfirm={handleApprove}
                loading={actionLoading}
            />

            {/* Reject Dialog - Formulir Penolakan */}
            <RejectDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                onSubmit={handleReject}
                loading={actionLoading}
            />

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
                returnTargets={detail?.returnTargets}
            />

            {/* Draft Surat Dialog - for Admin Prodi, Staf, Supervisor to select surat type */}
            <DraftSuratDialog
                open={draftSuratDialogOpen}
                onOpenChange={setDraftSuratDialogOpen}
                onSubmit={handleDraftSurat}
                userRole={currentUserRole}
                letterTypeCode={detail?.letterType?.code}
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
                            className="bg-success text-success-foreground hover:bg-success/90"
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Verifikasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog - for Supervisor/Manajer TU/Dekan/Wadek to return surat keluar for revision */}
            <RevisionDialog
                open={revisionDialogOpen}
                onOpenChange={setRevisionDialogOpen}
                onSubmit={async (targetRole, reason) => {
                    // Re-use handleReturnSuratHasil logic but with parameters
                    if (!detail || actionLoading) return;
                    
                    setActionLoading(true);
                    try {
                        const response = await suratService.returnSuratHasil(detail.id, reason, targetRole);
                        
                        if (response.success) {
                            toast.success("Surat berhasil dikembalikan untuk revisi");
                            setRevisionDialogOpen(false);
                            await fetchDetail();
                        } else {
                            toast.error(response.message || "Gagal mengembalikan surat untuk revisi");
                        }
                    } catch (err) {
                        console.error("Return surat hasil failed:", err);
                        toast.error("Terjadi kesalahan");
                    } finally {
                        setActionLoading(false);
                    }
                }}
                loading={actionLoading}
                revisionTargets={detail?.returnTargets}
            />

            {/* Signature Modal - for Dekan/Wadek to sign documents */}
            <SignatureModal
                open={signatureModalOpen}
                onOpenChange={setSignatureModalOpen}
                onConfirm={handleSignatureConfirm}
                title="Tanda Tangan Digital"
                description="Pilih metode untuk menandatangani dokumen SK/ST"
                isLoading={actionLoading}
            />

            {/* Numbering Modal - for UPA to assign nomor surat */}
            {suratHasilDoc && (
                <NumberingModal
                    open={numberingModalOpen}
                    onOpenChange={setNumberingModalOpen}
                    documentId={suratHasilDoc.id}
                    documentType={suratHasilDoc.type}
                    onSuccess={handleNumberingSuccess}
                />
            )}

            {/* Attachment Preview Modal */}
            <Dialog open={attachmentPreviewOpen} onOpenChange={setAttachmentPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview: {previewAttachment?.fileName}</DialogTitle>
                        <DialogDescription>
                            Preview file lampiran dari pengajuan surat
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {previewAttachment && (
                            <>
                                {previewAttachment.mimeType?.startsWith('image/') ? (
                                    // Preview untuk image files
                                    <div className="w-full flex justify-center">
                                        <img 
                                            src={previewAttachment.fileUrl} 
                                            alt={previewAttachment.fileName}
                                            className="max-w-full max-h-[500px]"
                                        />
                                    </div>
                                ) : previewAttachment.mimeType === 'application/pdf' ? (
                                    // Preview untuk PDF
                                    <div className="w-full">
                                        <iframe
                                            src={`${previewAttachment.fileUrl}#toolbar=0`}
                                            className="w-full h-[600px] border border-zinc-400 rounded"
                                            title={previewAttachment.fileName}
                                        />
                                    </div>
                                ) : previewAttachment.mimeType?.startsWith('text/') ? (
                                    // Preview untuk text files
                                    <div className="w-full">
                                        <iframe
                                            src={previewAttachment.fileUrl}
                                            className="w-full h-[600px] border border-zinc-400 rounded"
                                            title={previewAttachment.fileName}
                                        />
                                    </div>
                                ) : (
                                    // File type tidak bisa di-preview, tampilkan link download
                                    <div className="py-8 text-center">
                                        <FileText className="w-16 h-16 mx-auto text-zinc-400 mb-4" />
                                        <p className="text-sm text-zinc-600 mb-4">
                                            File jenis {previewAttachment.mimeType || 'unknown'} tidak bisa di-preview di browser
                                        </p>
                                        <Button
                                            onClick={() => handleDownloadAttachment(previewAttachment.fileName, previewAttachment.fileUrl)}
                                            className="bg-zinc-800 hover:bg-zinc-900"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download File
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline"
                            onClick={() => setAttachmentPreviewOpen(false)}
                        >
                            Tutup
                        </Button>
                        {previewAttachment && (
                            <Button
                                onClick={() => {
                                    if (previewAttachment) {
                                        handleDownloadAttachment(previewAttachment.fileName, previewAttachment.fileUrl);
                                    }
                                }}
                                className="bg-zinc-800 hover:bg-zinc-900"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Supervisor Selection Modal - untuk kategori UMUM saat ajukan verifikasi */}
            <Dialog open={supervisorModalOpen} onOpenChange={setSupervisorModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pilih Supervisor Tujuan</DialogTitle>
                        <DialogDescription>
                            Surat dengan kategori UMUM harus ditujukan ke salah satu supervisor untuk verifikasi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <RadioGroup
                            value={selectedSupervisor || ''}
                            onValueChange={(value) => setSelectedSupervisor(value as 'SUPERVISOR_AKADEMIK' | 'SUPERVISOR_SUMBER_DAYA')}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-3 border border-zinc-300 rounded-lg p-4 hover:bg-zinc-50 cursor-pointer">
                                <RadioGroupItem value="SUPERVISOR_AKADEMIK" id="supervisor_akademik" />
                                <Label htmlFor="supervisor_akademik" className="flex-1 cursor-pointer">
                                    <span className="font-medium">Supervisor Akademik</span>
                                    <p className="text-sm text-zinc-500">Untuk surat terkait akademik, mahasiswa, dan pendidikan</p>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 border border-zinc-300 rounded-lg p-4 hover:bg-zinc-50 cursor-pointer">
                                <RadioGroupItem value="SUPERVISOR_SUMBER_DAYA" id="supervisor_sumber_daya" />
                                <Label htmlFor="supervisor_sumber_daya" className="flex-1 cursor-pointer">
                                    <span className="font-medium">Supervisor Sumber Daya</span>
                                    <p className="text-sm text-zinc-500">Untuk surat terkait SDM, keuangan, dan fasilitas</p>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setSupervisorModalOpen(false);
                                setSelectedSupervisor(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedSupervisor) {
                                    setSupervisorModalOpen(false);
                                    doSubmitForVerification(selectedSupervisor);
                                    setSelectedSupervisor(null);
                                }
                            }}
                            disabled={!selectedSupervisor || actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading ? "Memproses..." : "Ajukan Verifikasi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Modal untuk Lampiran Dokumen (Surat Keluar) */}
            <Dialog open={docAttachmentPreviewOpen} onOpenChange={setDocAttachmentPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {previewDocAttachment?.name || 'Preview Lampiran'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto min-h-[500px]">
                        {previewDocAttachment?.isPdf ? (
                            <iframe
                                src={previewDocAttachment.url}
                                className="w-full h-full min-h-[500px] border-0"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="flex items-center justify-center p-4">
                                <img
                                    src={previewDocAttachment?.url}
                                    alt={previewDocAttachment?.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
