"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Plus,
    Trash2,
    PenTool,
    Users,
    User,
    Search,
    Info,
    FileText,
    CheckCircle,
    ClipboardList,
    Paperclip,
    Upload,
    X,
    Image,
    File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BottomNav from "@/components/layout/bottom-nav";
import { suratService } from "@/services/surat.service";
import { userService } from "@/services/user.service";
// Universal Preview - Single Source of Truth
import { TemplatePreview } from "@/components/universal-preview";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getPostDraftRedirectPath } from "@/lib/role-mapper";

// ============================================================================
// TYPES
// ============================================================================

type SuratType = "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN";


interface SignerItem {
    id: string;
    role: string;
    order: number;
    isRequired: boolean;
    // Position data for PDF signature placement
    name?: string;
    nip?: string;
    prefix?: string; // Awalan/keterangan seperti "Mengetahui,"
    x?: number;
    y?: number;
    page?: number;
}

// Tembusan Sistem - untuk akses download (tidak tertulis di surat)
interface TembusanUser {
    userId: string;
    name: string;
    email: string;
    type: 'mahasiswa' | 'pegawai';
    description: string; // NIM/NIP + Prodi/Jabatan
}

// Tembusan Tertulis - untuk ditulis di PDF surat (tidak terkait akun)
interface TembusanText {
    id: string;
    text: string;
}

interface PelaksanaItem {
    key: string;
    nama: string;
    nim: string;
    prodi: string;
    [key: string]: string; // Support dynamic columns
}

// Custom column definition for table
interface CustomColumn {
    key: string;
    label: string;
}

interface KeputusanItem {
    key: string;
    label: string;
    content: string;
}

// Attachment item untuk file yang diupload
interface AttachmentItem {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
}

type Step = "form" | "signature" | "tembusan" | "attachments" | "review";

// Form data for each surat type
interface SuratPengantarForm {
    nomorSurat: string;
    tanggalSurat: string;
    perihal: string;
    namaTujuan: string;
    jabatanTujuan: string;
    alamatTujuan: string;
    namaMahasiswa: string;
    nimMahasiswa: string;
    programStudi: string;
    departemen: string;
    keperluan: string;
    judulAcara: string;
    tanggalMulai: string;
    lokasiAcara: string;
    durasiAcara: string;
    tembusan: string;
}

interface SuratTugasForm {
    jenisSuratText: string;
    tanggalSurat: string;
    namaLengkap: string;
    nimNip: string;
    programStudi: string;
    keperluan: string;
    judulSurat: string;
}

interface SuratTugasTabelForm {
    jenisSuratText: string;
    tanggalSurat: string;
    tanggalMulai: string;    // Tanggal mulai tugas
    tanggalSelesai: string;  // Tanggal selesai tugas
    keperluan: string;
    judulSurat: string;
    pelaksana: PelaksanaItem[];
    customColumns: CustomColumn[];  // Custom columns for table
}

interface SuratKeputusanForm {
    nomorSurat?: string; // Optional - diisi oleh UPA nanti
    tentang: string;
    menimbang: string[];
    mengingat: string[];
    menetapkan: string;
    keputusan: KeputusanItem[];
    tanggalDitetapkan: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// All available signer roles (for reference)
const ALL_SIGNER_ROLES = [
    { value: "KAPRODI", label: "Ketua Prodi" },
    { value: "KADEP", label: "Ketua Departemen" },
    { value: "DEKAN", label: "Dekan" },
    { value: "WADEK_1", label: "Wakil Dekan I" },
    { value: "WADEK_2", label: "Wakil Dekan II" },
];

// Signer roles for surat pengantar - Admin Prodi can always choose KAPRODI and/or KADEP
const SURAT_PENGANTAR_ROLES = [
    { value: "KAPRODI", label: "Ketua Prodi" },
    { value: "KADEP", label: "Ketua Departemen" },
];

// Signer roles untuk surat di tingkat fakultas (Surat Tugas, Surat Keputusan)
// Hanya pejabat fakultas, tidak termasuk Ketua Prodi dan Ketua Departemen
const SURAT_FAKULTAS_ROLES = [
    { value: "DEKAN", label: "Dekan" },
    { value: "WADEK_1", label: "Wakil Dekan I" },
    { value: "WADEK_2", label: "Wakil Dekan II" },
];

// Filter pejabat berdasarkan kategori surat
// - AKADEMIK: Wadek 1 + Dekan
// - SUMBER_DAYA: Wadek 2 + Dekan  
// - UMUM: Wadek 1 + Wadek 2 + Dekan
// - null/undefined: Semua pejabat (backward compatibility)
const getFilteredRolesByCategory = (category: "AKADEMIK" | "SUMBER_DAYA" | "UMUM" | null) => {
    if (!category) {
        // Backward compatibility - tampilkan semua
        return SURAT_FAKULTAS_ROLES;
    }
    
    if (category === "AKADEMIK") {
        return [
            { value: "WADEK_1", label: "Wakil Dekan I" },
            { value: "DEKAN", label: "Dekan" },
        ];
    }
    
    if (category === "SUMBER_DAYA") {
        return [
            { value: "WADEK_2", label: "Wakil Dekan II" },
            { value: "DEKAN", label: "Dekan" },
        ];
    }
    
    if (category === "UMUM") {
        return SURAT_FAKULTAS_ROLES; // Semua pejabat
    }
    
    return SURAT_FAKULTAS_ROLES;
};

const ROLE_LABELS: Record<string, string> = {
    KAPRODI: "Ketua Prodi",
    KADEP: "Ketua Departemen",
    DEKAN: "Dekan",
    WADEK_1: "Wakil Dekan I",
    WADEK_2: "Wakil Dekan II",
    MANAJER_TU: "Manajer Tata Usaha",
    SUPERVISOR_AKADEMIK: "Supervisor Akademik",
    SUPERVISOR_SUMBER_DAYA: "Supervisor Sumber Daya",
    STAF_AKADEMIK: "Staf Akademik",
    STAF_SUMBER_DAYA: "Staf Sumber Daya",
};

const SURAT_TYPE_LABELS: Record<SuratType, string> = {
    SURAT_PENGANTAR: "Surat Pengantar",
    SURAT_TUGAS: "Surat Tugas",
    SURAT_TUGAS_TABEL: "Surat Tugas (Tabel)",
    SURAT_KEPUTUSAN: "Surat Keputusan",
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DraftSuratPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    // Get type from query params
    const suratType = searchParams.get("type") as SuratType | null;
    
    // Get reset parameter for supervisor overwrite mode
    const shouldResetDraft = searchParams.get("reset") === "true";
    
    // State
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>("form");
    
    // Form states for each surat type
    const [suratPengantarForm, setSuratPengantarForm] = useState<SuratPengantarForm>({
        nomorSurat: "",
        tanggalSurat: "",
        perihal: "",
        namaTujuan: "",
        jabatanTujuan: "",
        alamatTujuan: "",
        namaMahasiswa: "",
        nimMahasiswa: "",
        programStudi: "",
        departemen: "",
        keperluan: "",
        judulAcara: "",
        tanggalMulai: "",
        lokasiAcara: "",
        durasiAcara: "",
        tembusan: "",
    });

    const [suratTugasForm, setSuratTugasForm] = useState<SuratTugasForm>({
        jenisSuratText: "SURAT TUGAS",
        tanggalSurat: "",
        namaLengkap: "",
        nimNip: "",
        programStudi: "",
        keperluan: "",
        judulSurat: "",
    });

    const [suratTugasTabelForm, setSuratTugasTabelForm] = useState<SuratTugasTabelForm>({
        jenisSuratText: "SURAT TUGAS",
        tanggalSurat: "",
        tanggalMulai: "",
        tanggalSelesai: "",
        keperluan: "",
        judulSurat: "",
        pelaksana: [],
        customColumns: [],
    });

    const [suratKeputusanForm, setSuratKeputusanForm] = useState<SuratKeputusanForm>({
        tentang: "",
        menimbang: [""],
        mengingat: [""],
        menetapkan: "",
        keputusan: [{ key: "1", label: "KESATU", content: "" }],
        tanggalDitetapkan: "",
    });
    
    // Signature state - position data no longer needed with template-based positioning
    const [signers, setSigners] = useState<SignerItem[]>([
        { 
            id: String(Date.now()), 
            role: suratType === "SURAT_PENGANTAR" ? "KADEP" : "DEKAN", 
            order: 1, 
            isRequired: true,
            name: "",
            nip: "",
        }
    ]);
    
    // Tembusan state - DIPISAH menjadi 2:
    // 1. Akun user (untuk akses sistem, TIDAK tertulis di surat)
    const [tembusanUsers, setTembusanUsers] = useState<TembusanUser[]>([]);
    
    // 2. Text manual (untuk tertulis di surat, TIDAK terkait akun)
    const [tembusanTexts, setTembusanTexts] = useState<TembusanText[]>([]);
    const [newTembusanTextInput, setNewTembusanTextInput] = useState("");
    
    // Checkbox pengaju - default false, akan di-set true jika ada marker __PENGAJU__ saat load
    const [includePengaju, setIncludePengaju] = useState(false);
    
    // User search for tembusan akun
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<import('@/services/user.service').TembusanUser[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showUserResults, setShowUserResults] = useState(false);
    
    // Attachment state - untuk file PDF/JPG/PNG yang diupload
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    
    // Existing attachments from server (already uploaded before)
    const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
    
    // Loading state for fetching existing data
    const [loading, setLoading] = useState(true);
    
    // State untuk menentukan apakah pengaju adalah Mahasiswa atau Dosen
    // True = Mahasiswa (punya NIM), False = Dosen (punya NIP)
    const [isPengajuMahasiswa, setIsPengajuMahasiswa] = useState(true);
    
    // Edit mode tracking - true if draft already exists and we're editing
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingDocumentId, setExistingDocumentId] = useState<string | null>(null);
    
    // Track if this is surat masuk (from submission) or surat keluar (staff-created)
    const [isSuratMasuk, setIsSuratMasuk] = useState(false);
    
    // Verification mode - true if supervisor/manajer TU is editing during verification
    const [isVerificationMode, setIsVerificationMode] = useState(false);
    
    // Kategori surat - untuk filter pejabat penandatangan
    const [suratCategory, setSuratCategory] = useState<"AKADEMIK" | "SUMBER_DAYA" | "UMUM" | null>(null);
    
    // Save mode - "patch" for normal edit, "overwrite" for full reset
    // Default to 'overwrite' if reset parameter is set (supervisor creating new draft)
    const [saveMode, setSaveMode] = useState<'patch' | 'overwrite'>(shouldResetDraft ? 'overwrite' : 'patch');

    // Pejabat list for autofill nama dan NIP
    const [pejabatList, setPejabatList] = useState<Array<{ role: string; name: string; nip?: string }>>([]);

    // Redirect if no type specified
    useEffect(() => {
        if (!suratType) {
            toast.error("Jenis surat tidak ditemukan");
            router.back();
        }
    }, [suratType, router]);

    // Fetch pejabat list for autofill
    useEffect(() => {
        async function loadPejabatList() {
            const result = await suratService.getPejabatList();
            if (result.success && result.data) {
                setPejabatList(result.data);
            }
        }
        loadPejabatList();
    }, []);

    // Fetch existing data and populate forms
    useEffect(() => {
        async function fetchExistingData() {
            if (!resolvedParams.id) {
                setLoading(false);
                return;
            }
            
            // If reset mode, skip loading existing data - supervisor wants clean form
            if (shouldResetDraft) {
                setLoading(false);
                setIsEditMode(false);
                setExistingDocumentId(null);
                return;
            }

            try {
                const detail = await suratService.getDetail(resolvedParams.id);
                console.log('🔍 Fetched detail for editing:', {
                    id: resolvedParams.id,
                    suratType,
                    hasDetail: !!detail,
                    documentsCount: detail?.documents?.length
                });
                
                if (!detail) {
                    setLoading(false);
                    return;
                }

                // Find existing document based on type
                let existingDoc;
                if (suratType === "SURAT_PENGANTAR") {
                    existingDoc = detail.documents.find(d => d.type === "SURAT_PENGANTAR");
                } else if (suratType === "SURAT_TUGAS") {
                    existingDoc = detail.documents.find(d => d.type === "SURAT_TUGAS");
                } else if (suratType === "SURAT_TUGAS_TABEL") {
                    // SURAT_TUGAS_TABEL may be stored as SURAT_TUGAS with table data
                    existingDoc = detail.documents.find(d => d.type === "SURAT_TUGAS_TABEL" || d.type === "SURAT_TUGAS");
                } else if (suratType === "SURAT_KEPUTUSAN") {
                    existingDoc = detail.documents.find(d => d.type === "SURAT_KEPUTUSAN");
                }

                // Set edit mode if existing document found
                if (existingDoc) {
                    console.log('✏️ Edit mode enabled. Document found:', {
                        id: existingDoc.id,
                        type: existingDoc.type,
                        hasContent: !!existingDoc.content,
                        hasTembusan: !!existingDoc.tembusan,
                        hasAttachments: !!existingDoc.attachmentUrls,
                        attachmentCount: existingDoc.attachmentUrls?.length || 0,
                        signatureCount: existingDoc.signatures?.length || 0
                    });
                    setIsEditMode(true);
                    setExistingDocumentId(existingDoc.id);
                } else {
                    console.log('📝 Create mode - no existing document found');
                }

                // Check if in verification mode (supervisor/manajer editing during verification)
                if (detail.status === 'FAKULTAS_VERIFICATION' && existingDoc) {
                    setIsVerificationMode(true);
                }
                
                // Set surat category for filtering pejabat penandatangan
                // HANYA untuk surat fakultas (bukan surat pengantar)
                if (suratType !== "SURAT_PENGANTAR" && detail.category) {
                    setSuratCategory(detail.category);
                    console.log('📋 Surat category:', detail.category);
                }
                
                // Determine if this is surat masuk (from submission) or surat keluar (staff-created)
                const hasSuratMasukSubmission = detail.submissionValues !== null && detail.submissionValues !== undefined;
                setIsSuratMasuk(hasSuratMasukSubmission);

                // Determine if pengaju is Mahasiswa or Dosen based on submissionValues
                // Mahasiswa memiliki NIM, Dosen memiliki NIP
                const pengajuIsMahasiswa = !!detail.submissionValues?.nim;
                setIsPengajuMahasiswa(pengajuIsMahasiswa);

                // Populate surat pengantar form from existing content
                if (suratType === "SURAT_PENGANTAR" && existingDoc?.content) {
                    const content = existingDoc.content as Record<string, unknown>;
                    setSuratPengantarForm(prev => ({
                        ...prev,
                        nomorSurat: (content.nomorSurat as string) || "",
                        tanggalSurat: (content.tanggalSurat as string) || "",
                        perihal: (content.perihal as string) || detail.submissionValues.keperluan || "",
                        namaTujuan: (content.namaTujuan as string) || "",
                        jabatanTujuan: (content.jabatanTujuan as string) || "",
                        alamatTujuan: (content.alamatTujuan as string) || "",
                        namaMahasiswa: (content.namaMahasiswa as string) || detail.submissionValues.nama || "",
                        nimMahasiswa: (content.nimMahasiswa as string) || detail.submissionValues.nim || "",
                        programStudi: (content.programStudi as string) || detail.submissionValues.programStudi || "",
                        departemen: (content.departemen as string) || detail.submissionValues.departemen || "",
                        keperluan: (content.keperluan as string) || detail.submissionValues.keperluan || "",
                        judulAcara: (content.judulAcara as string) || detail.submissionValues.judulAcara || "",
                        tanggalMulai: (content.tanggalMulai as string) || detail.submissionValues.tanggalAcara || "",
                        lokasiAcara: (content.lokasiAcara as string) || detail.submissionValues.lokasiAcara || "",
                        durasiAcara: (content.durasiAcara as string) || "",
                    }));
                } else if (suratType === "SURAT_PENGANTAR" && detail.submissionValues) {
                    // No existing document, populate from submission values
                    setSuratPengantarForm(prev => ({
                        ...prev,
                        perihal: detail.submissionValues.keperluan || "",
                        namaMahasiswa: detail.submissionValues.nama || "",
                        nimMahasiswa: detail.submissionValues.nim || "",
                        programStudi: detail.submissionValues.programStudi || "",
                        departemen: detail.submissionValues.departemen || "",
                        keperluan: detail.submissionValues.keperluan || "",
                        judulAcara: detail.submissionValues.judulAcara || "",
                        tanggalMulai: detail.submissionValues.tanggalAcara || "",
                        lokasiAcara: detail.submissionValues.lokasiAcara || "",
                    }));
                }

                // Populate SURAT_TUGAS form from existing content
                if (suratType === "SURAT_TUGAS" && existingDoc?.content) {
                    const content = existingDoc.content as Record<string, unknown>;
                    setSuratTugasForm(prev => ({
                        ...prev,
                        jenisSuratText: (content.jenisSuratText as string) || "SURAT TUGAS",
                        tanggalSurat: (content.tanggalSurat as string) || "",
                        namaLengkap: (content.namaLengkap as string) || detail.submissionValues.nama || "",
                        nimNip: (content.nimNip as string) || detail.submissionValues.nim || detail.submissionValues.nip || "",
                        programStudi: (content.programStudi as string) || detail.submissionValues.programStudi || "",
                        keperluan: (content.keperluan as string) || detail.submissionValues.keperluan || "",
                        judulSurat: (content.judulSurat as string) || detail.submissionValues.judulAcara || "",
                    }));
                } else if (suratType === "SURAT_TUGAS" && !existingDoc && detail.submissionValues) {
                    // No existing document, populate from submission values
                    setSuratTugasForm(prev => ({
                        ...prev,
                        namaLengkap: detail.submissionValues.nama || "",
                        nimNip: detail.submissionValues.nim || detail.submissionValues.nip || "",
                        programStudi: detail.submissionValues.programStudi || "",
                        keperluan: detail.submissionValues.keperluan || "",
                        judulSurat: detail.submissionValues.judulAcara || "",
                    }));
                }

                // Populate SURAT_TUGAS_TABEL form from existing content
                if (suratType === "SURAT_TUGAS_TABEL" && existingDoc?.content) {
                    const content = existingDoc.content as Record<string, unknown>;
                    const existingPelaksana = (content.pelaksana as Array<Record<string, string>>) || [];
                    const existingCustomColumns = (content.customColumns as Array<{ key: string; label: string }>) || [];
                    setSuratTugasTabelForm(prev => ({
                        ...prev,
                        jenisSuratText: (content.jenisSuratText as string) || "SURAT TUGAS",
                        tanggalSurat: (content.tanggalSurat as string) || "",
                        tanggalMulai: (content.tanggalMulai as string) || "",
                        tanggalSelesai: (content.tanggalSelesai as string) || "",
                        keperluan: (content.keperluan as string) || detail.submissionValues.keperluan || "",
                        judulSurat: (content.judulSurat as string) || detail.submissionValues.judulAcara || "",
                        customColumns: existingCustomColumns,
                        pelaksana: existingPelaksana.map((p, index) => ({
                            key: String(index + 1),
                            nama: p.nama || "",
                            nim: p.nim || p.nimNip || "",
                            prodi: p.prodi || "",
                            ...existingCustomColumns.reduce((acc, col) => ({ ...acc, [col.key]: p[col.key] || "" }), {})
                        }))
                    }));
                } else if (suratType === "SURAT_TUGAS_TABEL" && !existingDoc && detail.submissionValues) {
                    // No existing document, populate from submission values with one initial row
                    setSuratTugasTabelForm(prev => ({
                        ...prev,
                        keperluan: detail.submissionValues.keperluan || "",
                        judulSurat: detail.submissionValues.judulAcara || "",
                        customColumns: [],
                        pelaksana: [{
                            key: "1",
                            nama: detail.submissionValues.nama || "",
                            nim: detail.submissionValues.nim || detail.submissionValues.nip || "",
                            prodi: detail.submissionValues.programStudi || "",
                        }]
                    }));
                }

                // Populate SURAT_KEPUTUSAN form from existing content
                if (suratType === "SURAT_KEPUTUSAN" && existingDoc?.content) {
                    const content = existingDoc.content as Record<string, unknown>;
                    const existingKeputusan = (content.keputusan as Array<{ label: string; content: string }>) || [];
                    setSuratKeputusanForm(prev => ({
                        ...prev,
                        nomorSurat: (content.nomorSurat as string) || "",
                        tentang: (content.tentang as string) || detail.submissionValues.keperluan || "",
                        menimbang: (content.menimbang as string[]) || [""],
                        mengingat: (content.mengingat as string[]) || [""],
                        menetapkan: (content.menetapkan as string) || "",
                        keputusan: existingKeputusan.length > 0 
                            ? existingKeputusan.map((k, index) => ({ key: String(index + 1), label: k.label, content: k.content }))
                            : [{ key: "1", label: "KESATU", content: "" }],
                        tanggalDitetapkan: (content.tanggalDitetapkan as string) || "",
                        namaPejabat: (content.namaPejabat as string) || "",
                        nipPejabat: (content.nipPejabat as string) || "",
                    }));
                } else if (suratType === "SURAT_KEPUTUSAN" && !existingDoc && detail.submissionValues) {
                    // No existing document, populate from submission values
                    setSuratKeputusanForm(prev => ({
                        ...prev,
                        tentang: detail.submissionValues.keperluan || "",
                    }));
                }

                // Populate signers from existing signatures
                if (existingDoc?.signatures && existingDoc.signatures.length > 0) {
                    const existingSigners: SignerItem[] = existingDoc.signatures.map((sig, index) => ({
                        // Use signature ID if available, otherwise use timestamp + index for uniqueness
                        id: sig.id || String(Date.now() + index),
                        role: sig.signerRole,
                        order: sig.order || index + 1,
                        isRequired: true,
                        name: sig.signerName || "",
                        nip: sig.signerNip || "",
                        x: sig.positionX || 0,
                        y: sig.positionY || 0,
                        page: sig.positionPage || 1
                    }));
                    setSigners(existingSigners);
                } else if (suratType === "SURAT_PENGANTAR" && detail.signatureConfig) {
                    // No existing signatures, initialize based on signatureConfig
                    const needsKadep = detail.signatureConfig.requestKadepSign || false;
                    const baseTimestamp = Date.now();
                    const initialSigners: SignerItem[] = [
                        {
                            id: String(baseTimestamp),
                            role: "KAPRODI",
                            order: 1,
                            isRequired: true,
                            name: "",
                            nip: "",
                            x: needsKadep ? 100 : 350,
                            y: 500,
                            page: 1
                        }
                    ];
                    if (needsKadep) {
                        initialSigners.push({
                            id: String(baseTimestamp + 1),
                            role: "KADEP",
                            order: 2,
                            isRequired: true,
                            name: "",
                            nip: "",
                            x: 350,
                            y: 500,
                            page: 1
                        });
                    }
                    setSigners(initialSigners);
                } else if (!existingDoc && suratType !== "SURAT_PENGANTAR") {
                    // For SK/ST without existing doc, initialize with DEKAN as default signer
                    setSigners([{
                        id: String(Date.now()),
                        role: "DEKAN",
                        order: 1,
                        isRequired: true,
                        name: "",
                        nip: "",
                        x: 350,
                        y: 500,
                        page: 1
                    }]);
                }

                // Load tembusan from existing document
                // Try to get from document.tembusan first (new format), fallback to content.tembusan (old format)
                const existingTembusan = existingDoc?.tembusan || (existingDoc?.content as Record<string, unknown>)?.tembusan;
                
                if (Array.isArray(existingTembusan) && existingTembusan.length > 0) {
                    const users: TembusanUser[] = [];
                    const texts: TembusanText[] = [];
                    let hasPengaju = false;
                    
                    existingTembusan.forEach((item: any, index: number) => {
                        if (typeof item === 'string') {
                            // Old format: string[]
                            const itemLower = item.toLowerCase();
                            if (itemLower === 'pengaju' || itemLower === 'pengaju surat') {
                                hasPengaju = true;
                            } else {
                                texts.push({
                                    id: String(texts.length + 1),
                                    text: item
                                });
                            }
                        } else if (item && typeof item === 'object' && 'userId' in item) {
                            // New format: TembusanRecipient[]
                            // Check if this is the special "__PENGAJU__" marker
                            if (item.userId === '__PENGAJU__') {
                                hasPengaju = true;
                                console.log('✅ Found __PENGAJU__ marker, setting includePengaju = true');
                                // Don't add to users list - this is just a checkbox state flag
                            } else if (item.userId) {
                                // This is a regular user account
                                users.push({
                                    userId: item.userId,
                                    name: item.name || '',
                                    email: item.description || item.email || '',
                                });
                            } else {
                                // This is a text-only tembusan
                                const textValue = item.name || item.description || '';
                                // Filter out any text entries that might be "Pengaju Surat"
                                if (textValue.toLowerCase() !== 'pengaju surat' && textValue.toLowerCase() !== 'pengaju') {
                                    texts.push({
                                        id: String(texts.length + 1),
                                        text: textValue
                                    });
                                }
                            }
                        }
                    });
                    
                    console.log('📦 Loaded tembusan:', { users: users.length, texts: texts.length, hasPengaju });
                    console.log('🔍 Setting includePengaju to:', hasPengaju);
                    setIncludePengaju(hasPengaju);
                    setTembusanUsers(users);
                    setTembusanTexts(texts);
                } else {
                    console.log('ℹ️ No existing tembusan found, setting includePengaju to false');
                    setIncludePengaju(false);
                    setTembusanUsers([]);
                    setTembusanTexts([]);
                }

                // Load existing attachments from document
                if (existingDoc?.attachmentUrls && Array.isArray(existingDoc.attachmentUrls)) {
                    const validUrls = existingDoc.attachmentUrls.filter(
                        (url): url is string => typeof url === 'string' && url.length > 0
                    );
                    console.log('📎 Loaded existing attachments:', validUrls.length, 'files');
                    setExistingAttachments(validUrls);
                } else {
                    console.log('ℹ️ No existing attachments found');
                }

            } catch (error) {
                console.error("Error fetching existing data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchExistingData();
    }, [resolvedParams.id, suratType, shouldResetDraft]);

    // ========================================================================
    // FORM HANDLERS
    // ========================================================================

    const updateSuratPengantar = (field: keyof SuratPengantarForm, value: string) => {
        setSuratPengantarForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratTugas = (field: keyof SuratTugasForm, value: string) => {
        setSuratTugasForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratTugasTabel = (field: keyof SuratTugasTabelForm, value: string | PelaksanaItem[]) => {
        setSuratTugasTabelForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratKeputusan = (field: keyof SuratKeputusanForm, value: string | string[] | KeputusanItem[]) => {
        setSuratKeputusanForm(prev => ({ ...prev, [field]: value }));
    };

    // Pelaksana handlers for Surat Tugas Tabel
    const addPelaksana = () => {
        const newKey = String(Date.now());
        // Create new pelaksana with default columns + custom columns
        const newPelaksana: PelaksanaItem = { 
            key: newKey, 
            nama: "", 
            nim: "", 
            prodi: "",
        };
        // Add empty values for custom columns
        suratTugasTabelForm.customColumns.forEach(col => {
            newPelaksana[col.key] = "";
        });
        setSuratTugasTabelForm(prev => ({
            ...prev,
            pelaksana: [...prev.pelaksana, newPelaksana]
        }));
    };

    const removePelaksana = (key: string) => {
        setSuratTugasTabelForm(prev => ({
            ...prev,
            pelaksana: prev.pelaksana.filter(p => p.key !== key)
        }));
    };

    const updatePelaksana = (key: string, field: string, value: string) => {
        setSuratTugasTabelForm(prev => ({
            ...prev,
            pelaksana: prev.pelaksana.map(p => p.key === key ? { ...p, [field]: value } : p)
        }));
    };

    // Custom Column handlers for Surat Tugas Tabel
    const addCustomColumn = () => {
        const newKey = `col_${Date.now()}`;
        setSuratTugasTabelForm(prev => ({
            ...prev,
            customColumns: [...prev.customColumns, { key: newKey, label: "" }],
            // Add empty value for this column to all existing pelaksana
            pelaksana: prev.pelaksana.map(p => ({ ...p, [newKey]: "" }))
        }));
    };

    const removeCustomColumn = (colKey: string) => {
        setSuratTugasTabelForm(prev => ({
            ...prev,
            customColumns: prev.customColumns.filter(c => c.key !== colKey),
            // Remove this column from all pelaksana
            pelaksana: prev.pelaksana.map(p => {
                const { [colKey]: _, ...rest } = p;
                return rest as PelaksanaItem;
            })
        }));
    };

    const updateCustomColumnLabel = (colKey: string, label: string) => {
        setSuratTugasTabelForm(prev => ({
            ...prev,
            customColumns: prev.customColumns.map(c => c.key === colKey ? { ...c, label } : c)
        }));
    };

    // Menimbang/Mengingat handlers for SK
    const addMenimbang = () => {
        setSuratKeputusanForm(prev => ({ ...prev, menimbang: [...prev.menimbang, ""] }));
    };

    const updateMenimbang = (index: number, value: string) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            menimbang: prev.menimbang.map((item, i) => i === index ? value : item)
        }));
    };

    const removeMenimbang = (index: number) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            menimbang: prev.menimbang.filter((_, i) => i !== index)
        }));
    };

    const addMengingat = () => {
        setSuratKeputusanForm(prev => ({ ...prev, mengingat: [...prev.mengingat, ""] }));
    };

    const updateMengingat = (index: number, value: string) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            mengingat: prev.mengingat.map((item, i) => i === index ? value : item)
        }));
    };

    const removeMengingat = (index: number) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            mengingat: prev.mengingat.filter((_, i) => i !== index)
        }));
    };

    // Keputusan handlers for SK
    const addKeputusan = () => {
        const labels = ["KESATU", "KEDUA", "KETIGA", "KEEMPAT", "KELIMA", "KEENAM", "KETUJUH", "KEDELAPAN", "KESEMBILAN", "KESEPULUH"];
        const newIndex = suratKeputusanForm.keputusan.length;
        setSuratKeputusanForm(prev => ({
            ...prev,
            keputusan: [...prev.keputusan, { key: String(Date.now()), label: labels[newIndex] || `KE-${newIndex + 1}`, content: "" }]
        }));
    };

    const updateKeputusan = (key: string, field: "label" | "content", value: string) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            keputusan: prev.keputusan.map(k => k.key === key ? { ...k, [field]: value } : k)
        }));
    };

    const removeKeputusan = (key: string) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            keputusan: prev.keputusan.filter(k => k.key !== key)
        }));
    };

    // ========================================================================
    // SIGNATURE HANDLERS
    // ========================================================================

    const addSigner = () => {
        // Use Date.now() for unique ID to prevent duplication
        const newId = String(Date.now());
        const newOrder = signers.length + 1;
        setSigners([...signers, { 
            id: newId, 
            role: "", 
            order: newOrder, 
            isRequired: true,
            name: "",
            nip: "",
            x: 0,
            y: 0,
            page: 1
        }]);
    };

    const removeSigner = (id: string) => {
        if (signers.length <= 1) {
            toast.error("Minimal harus ada 1 penanda tangan");
            return;
        }
        // Filter out the signer and reorder
        const filtered = signers.filter(s => s.id !== id);
        const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
        setSigners(reordered);
    };

    const updateSignerRole = (id: string, role: string) => {
        const roleLabel = ALL_SIGNER_ROLES.find(r => r.value === role)?.label || role;
        // Autofill nama dan NIP dari database
        const pejabat = pejabatList.find(p => p.role === role);
        setSigners(signers.map(s => s.id === id ? { 
            ...s, 
            role, 
            name: pejabat?.name || roleLabel,
            nip: pejabat?.nip || ""
        } : s));
    };

    const updateSignerPrefix = (id: string, prefix: string) => {
        setSigners(signers.map(s => s.id === id ? { ...s, prefix } : s));
    };

    const updateSignerName = (id: string, name: string) => {
        setSigners(signers.map(s => s.id === id ? { ...s, name } : s));
    };

    const updateSignerNip = (id: string, nip: string) => {
        setSigners(signers.map(s => s.id === id ? { ...s, nip } : s));
    };

    // ========================================================================
    // TEMBUSAN HANDLERS
    // ========================================================================

    const addTembusanText = () => {
        if (!newTembusanTextInput.trim()) return;
        
        const newItem: TembusanText = {
            id: String(Date.now()),
            text: newTembusanTextInput.trim()
        };
        setTembusanTexts([...tembusanTexts, newItem]);
        setNewTembusanTextInput("");
    };

    const removeTembusanText = (id: string) => {
        setTembusanTexts(tembusanTexts.filter(t => t.id !== id));
    };

    const removeTembusanUser = (userId: string) => {
        setTembusanUsers(tembusanUsers.filter(u => u.userId !== userId));
    };

    // ========================================================================
    // USER SEARCH FOR TEMBUSAN
    // ========================================================================
    
    // Debounced user search
    useEffect(() => {
        if (userSearchQuery.length < 2) {
            setUserSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearchingUsers(true);
            const result = await userService.searchUsers(userSearchQuery);
            if (result.success && result.data) {
                // Filter out already selected users
                const selectedUserIds = new Set(tembusanUsers.map(u => u.userId));
                const filtered = result.data.filter(user => !selectedUserIds.has(user.id));
                setUserSearchResults(filtered);
            }
            setIsSearchingUsers(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [userSearchQuery, tembusanUsers]);

    const handleSelectUser = (user: import('@/services/user.service').TembusanUser) => {
        const newUser: TembusanUser = {
            userId: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            description: user.type === 'mahasiswa' 
                ? `${user.identifier} • ${user.programStudi || 'Mahasiswa'}`
                : `${user.jabatan || 'Pegawai'} • NIP: ${user.identifier}`
        };
        setTembusanUsers([...tembusanUsers, newUser]);
        setUserSearchQuery('');
        setUserSearchResults([]);
        setShowUserResults(false);
    };

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const validateFormStep = (): boolean => {
        if (suratType === "SURAT_PENGANTAR") {
            const required = ["nomorSurat", "tanggalSurat", "perihal", "namaTujuan", "namaMahasiswa", "nimMahasiswa", "keperluan"] as const;
            const missing = required.filter(field => !suratPengantarForm[field].trim());
            if (missing.length > 0) {
                toast.error("Lengkapi semua field yang wajib diisi");
                return false;
            }
        } else if (suratType === "SURAT_TUGAS") {
            // Removed tanggalSurat from required - will be assigned by UPA
            const required = ["namaLengkap", "nimNip", "keperluan"] as const;
            const missing = required.filter(field => !suratTugasForm[field].trim());
            if (missing.length > 0) {
                toast.error("Lengkapi semua field yang wajib diisi");
                return false;
            }
        } else if (suratType === "SURAT_TUGAS_TABEL") {
            // Validate required fields
            if (!suratTugasTabelForm.keperluan) {
                toast.error("Lengkapi keperluan surat");
                return false;
            }
            if (!suratTugasTabelForm.tanggalMulai || !suratTugasTabelForm.tanggalSelesai) {
                toast.error("Lengkapi tanggal mulai dan selesai tugas");
                return false;
            }
            if (suratTugasTabelForm.pelaksana.length === 0) {
                toast.error("Tambahkan minimal 1 pelaksana");
                return false;
            }
            // Validate each pelaksana has required fields (nama, nim, prodi)
            const invalidPelaksana = suratTugasTabelForm.pelaksana.find(p => !p.nama || !p.nim || !p.prodi);
            if (invalidPelaksana) {
                toast.error("Lengkapi data nama, NIM, dan prodi untuk setiap pelaksana");
                return false;
            }
        } else if (suratType === "SURAT_KEPUTUSAN") {
            if (!suratKeputusanForm.tentang || !suratKeputusanForm.tanggalDitetapkan) {
                toast.error("Lengkapi semua field yang wajib diisi");
                return false;
            }
            if (suratKeputusanForm.menimbang.filter(m => m.trim()).length === 0) {
                toast.error("Tambahkan minimal 1 item menimbang");
                return false;
            }
            if (suratKeputusanForm.keputusan.filter(k => k.content.trim()).length === 0) {
                toast.error("Tambahkan minimal 1 keputusan");
                return false;
            }
        }
        return true;
    };

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    const goToNextStep = async () => {
        if (currentStep === "form") {
            if (!validateFormStep()) return;
            setCurrentStep("signature");
        } else if (currentStep === "signature") {
            const hasEmptyRole = signers.some(s => !s.role);
            if (hasEmptyRole) {
                toast.error("Semua penanda tangan harus dipilih");
                return;
            }
            // Skip tembusan for Surat Pengantar
            if (suratType === "SURAT_PENGANTAR") {
                setCurrentStep("attachments");
            } else {
                setCurrentStep("tembusan");
            }
        } else if (currentStep === "tembusan") {
            setCurrentStep("attachments");
        } else if (currentStep === "attachments") {
            setCurrentStep("review");
        }
    };

    const goToPrevStep = () => {
        if (currentStep === "signature") {
            setCurrentStep("form");
        } else if (currentStep === "tembusan") {
            setCurrentStep("signature");
        } else if (currentStep === "attachments") {
            // Skip tembusan for Surat Pengantar
            if (suratType === "SURAT_PENGANTAR") {
                setCurrentStep("signature");
            } else {
                setCurrentStep("tembusan");
            }
        } else if (currentStep === "review") {
            setCurrentStep("attachments");
        }
    };

    // ========================================================================
    // ATTACHMENT HANDLERS
    // ========================================================================

    const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        const newAttachments: AttachmentItem[] = [];

        Array.from(files).forEach((file) => {
            if (!validTypes.includes(file.type)) {
                toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, JPG, atau PNG`);
                return;
            }
            if (file.size > maxSize) {
                toast.error(`File ${file.name} terlalu besar. Maksimal 10MB`);
                return;
            }

            const newItem: AttachmentItem = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                type: file.type,
            };

            // Create preview URL for images
            if (file.type.startsWith('image/')) {
                newItem.previewUrl = URL.createObjectURL(file);
            }

            newAttachments.push(newItem);
        });

        setAttachments(prev => [...prev, ...newAttachments]);
        // Reset input
        event.target.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => {
            const item = prev.find(a => a.id === id);
            if (item?.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
            return prev.filter(a => a.id !== id);
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // ========================================================================
    // SUBMIT
    // ========================================================================

    const handleSubmit = async () => {
        if (!suratType) return;
        
        setSubmitting(true);
        try {
            // Build form content based on surat type
            let content: Record<string, unknown> = {};
            
            if (suratType === "SURAT_PENGANTAR") {
                content = { ...suratPengantarForm };
            } else if (suratType === "SURAT_TUGAS") {
                content = { ...suratTugasForm };
            } else if (suratType === "SURAT_TUGAS_TABEL") {
                // Convert pelaksana to dataMahasiswa for template compatibility
                const dataMahasiswa = suratTugasTabelForm.pelaksana.map(({ key, ...rest }) => rest);
                content = { 
                    ...suratTugasTabelForm,
                    // Keep pelaksana for backward compatibility
                    pelaksana: dataMahasiswa,
                    // Add dataMahasiswa for template rendering
                    dataMahasiswa: dataMahasiswa,
                    // Map form fields to template fields
                    nomorSurat: suratTugasTabelForm.judulSurat || '',
                    keterangan: suratTugasTabelForm.keperluan || '',
                };
            } else if (suratType === "SURAT_KEPUTUSAN") {
                content = {
                    ...suratKeputusanForm,
                    menimbang: suratKeputusanForm.menimbang.filter(m => m.trim()),
                    mengingat: suratKeputusanForm.mengingat.filter(m => m.trim()),
                    keputusan: suratKeputusanForm.keputusan.filter(k => k.content.trim()).map(({ key, ...rest }) => rest),
                };
            }

            // Build signatories array for API with position data
            // Sort by hierarchy for signing order:
            // For Surat Pengantar: KAPRODI (1) -> KADEP (2)
            // For Surat Hasil: WADEK_2 (1) -> WADEK_1 (2) -> DEKAN (3)
            const SIGNER_HIERARCHY: Record<string, number> = {
                // Surat Pengantar hierarchy
                'KAPRODI': 1,
                'KADEP': 2,
                // Surat Hasil hierarchy (Wadek signs before Dekan)
                'WADEK_2': 1,
                'WADEK_1': 2,
                'DEKAN': 3,
            };

            const signatories = signers
                .map(s => ({
                    signerRole: s.role,
                    signerName: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                    signerNip: s.nip || "",
                    prefix: s.prefix || "", // Include prefix/awalan
                    hierarchyOrder: SIGNER_HIERARCHY[s.role] ?? 99,
                    // Include position data if available
                    x: s.x || 0,
                    y: s.y || 0,
                    page: s.page || 1
                }))
                // Sort by hierarchy
                .sort((a, b) => a.hierarchyOrder - b.hierarchyOrder)
                // Assign correct order based on hierarchy
                .map((s, idx) => ({
                    ...s,
                    order: idx + 1
                }));

            // Build tembusan array - text yang ditulis di PDF
            const tembusanList: string[] = [];
            // Tambahkan semua text tembusan
            tembusanTexts.forEach(item => {
                tembusanList.push(item.text);
            });
            
            // Build tembusan users - untuk akses sistem
            const tembusanUsersList = tembusanUsers.map(u => ({
                userId: u.userId,
                name: u.name,
                email: u.email,
            }));
            
            // Add special "__PENGAJU__" marker if checkbox is checked
            // This marker will be detected when loading to restore checkbox state
            if (includePengaju) {
                tembusanUsersList.push({
                    userId: '__PENGAJU__', // Special marker (not a real userId)
                    name: 'Pengaju Surat',
                    email: '',
                });
            }
            
            console.log('💾 Saving tembusan with includePengaju:', includePengaju, 'usersList:', tembusanUsersList.length);

            let response;
            
            if (suratType === "SURAT_PENGANTAR") {
                // Admin Prodi - use department-approval API
                response = await suratService.savePengantarDraft(
                    resolvedParams.id,
                    {
                        content,
                        tembusan: tembusanList,
                        signatories,
                    }
                );
            } else {
                // Staff/Supervisor - use surat-hasil API
                // Check if supervisor is editing during verification
                if (isVerificationMode) {
                    // Supervisor/Manajer TU editing during verification
                    // Combine text tembusan and user tembusan
                    const combinedTembusan = [
                        ...tembusanUsersList,
                        ...tembusanList.map(text => ({ userId: '', name: text, description: text }))
                    ];
                    
                    response = await suratService.updateDraftAsSupervisor(
                        resolvedParams.id,
                        {
                            content,
                            tembusan: combinedTembusan,
                        }
                    );
                } else if (isEditMode && existingDocumentId) {
                    // Staff editing existing draft (after return)
                    // Combine text tembusan and user tembusan
                    const combinedTembusan = [
                        ...tembusanUsersList,
                        ...tembusanList.map(text => ({ userId: '', name: text, description: text }))
                    ];
                    
                    response = await suratService.updateDraftSuratHasil(
                        existingDocumentId,
                        {
                            content,
                            tembusan: combinedTembusan,
                            mode: saveMode,
                            signatories, // Include signatories for update
                        }
                    );
                } else {
                    // Create new draft
                    // Combine text tembusan and user tembusan
                    const combinedTembusan = [
                        ...tembusanUsersList,
                        ...tembusanList.map(text => ({ userId: '', name: text, description: text }))
                    ];
                    
                    response = await suratService.createDraftSuratHasil(
                        resolvedParams.id,
                        {
                            documentType: suratType === "SURAT_TUGAS_TABEL" ? "SURAT_TUGAS_TABEL" : suratType,
                            signatories,
                            tembusan: combinedTembusan,
                            content,
                        }
                    );
                }
            }

            if (response.success) {
                // Upload attachments jika ada
                const documentId = (response.data as any)?.documentId || (response.data as any)?.id || existingDocumentId;
                if (attachments.length > 0 && documentId) {
                    try {
                        setIsUploadingAttachment(true);
                        const filesToUpload = attachments.map(a => a.file);
                        await suratService.uploadAttachments(documentId, filesToUpload);
                        toast.success(`${filesToUpload.length} lampiran berhasil diupload`);
                    } catch (attachmentError) {
                        console.error("Failed to upload attachments:", attachmentError);
                        toast.error("Lampiran gagal diupload, tetapi draft berhasil disimpan");
                    } finally {
                        setIsUploadingAttachment(false);
                    }
                }
                
                // Show success toast
                const successMessage = saveMode === 'overwrite' 
                    ? "Draft surat berhasil dibuat ulang"
                    : isEditMode 
                        ? "Draft surat berhasil diperbarui" 
                        : "Draft surat berhasil dibuat";
                toast.success(successMessage);
                
                // Redirect ke halaman detail untuk melihat tombol "Ajukan Verifikasi"
                const filterType = isSuratMasuk ? 'masuk' : 'keluar';
                router.push(`/detail/${resolvedParams.id}?filterType=${filterType}`);
                router.refresh();
            } else {
                toast.error(response.message || "Gagal menyimpan draft surat");
            }
        } catch (error) {
            console.error("Submit failed:", error);
            toast.error("Gagal membuat draft surat");
        } finally {
            setSubmitting(false);
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    if (!suratType) {
        return null;
    }

    // Surat Pengantar tidak memiliki tembusan, skip step tembusan
    const isSuratPengantar = suratType === "SURAT_PENGANTAR";
    
    const steps = [
        { key: "form", label: "Formulir", icon: ClipboardList, disabled: false },
        { key: "signature", label: "Tanda Tangan", icon: PenTool, disabled: false },
        { key: "tembusan", label: "Tembusan", icon: Users, disabled: isSuratPengantar },
        { key: "attachments", label: "Lampiran", icon: Paperclip, disabled: false },
        { key: "review", label: "Review", icon: CheckCircle, disabled: false },
    ];

    // Filter out disabled steps for navigation
    const activeSteps = steps.filter(s => !s.disabled);
    const currentStepIndex = activeSteps.findIndex(s => s.key === currentStep);

    // Show loading state while fetching existing data
    if (loading) {
        // Calculate steps to show in skeleton (3 for Surat Pengantar, 4 for others)
        const skeletonStepCount = isSuratPengantar ? 3 : 4;
        
        return (
            <>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
                    <h1 className="text-2xl font-bold text-black">
                        Draft {SURAT_TYPE_LABELS[suratType]}
                    </h1>
                </div>
                
                {/* Skeleton Stepper */}
                <div className="mb-8">
                    <div className="flex justify-center">
                        <div className="flex items-start w-full max-w-2xl">
                            {Array.from({ length: skeletonStepCount }).map((_, index) => {
                                const isLast = index === skeletonStepCount - 1;
                                return (
                                    <div key={index} className={cn("flex items-start", isLast ? "flex-none" : "flex-1")}>
                                        {/* Skeleton Step Circle and Label */}
                                        <div className="flex flex-col items-center">
                                            <Skeleton className="w-10 h-10 rounded-full" />
                                            <Skeleton className="h-4 w-16 mt-2" />
                                        </div>
                                        {/* Skeleton Connector Line */}
                                        {!isLast && (
                                            <div className="flex-1 flex items-center px-3 mt-5">
                                                <Skeleton className="h-0.5 w-full" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* Skeleton Content */}
                <div className="space-y-6 pb-24">
                    <Card className="bg-neutral-50 border-zinc-400">
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-neutral-50 border-zinc-400">
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <BottomNav />
            </>
        );
    }

    return (
        <>
            {/* Page Title */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
                <h1 className="text-2xl font-bold text-black">
                    Draft {SURAT_TYPE_LABELS[suratType]}
                </h1>
            </div>

            {/* Step Indicator - Only show active steps */}
            <div className="mb-8">
                <div className="flex justify-center">
                    <div className="flex items-start w-full max-w-2xl">
                        {activeSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = step.key === currentStep;
                            const isCompleted = index < currentStepIndex;
                            const isLast = index === activeSteps.length - 1;
                            
                            return (
                                <div key={step.key} className={cn("flex items-start", isLast ? "flex-none" : "flex-1")}>
                                    {/* Step Circle and Label */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                                isActive
                                                    ? "bg-blue-600 text-white"
                                                    : isCompleted
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-zinc-200 text-zinc-500"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-sm font-medium text-center mt-2 whitespace-nowrap",
                                                isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-zinc-500"
                                            )}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {/* Connector Line */}
                                    {!isLast && (
                                        <div className="flex-1 flex items-center px-3 mt-5">
                                            <div
                                                className={cn(
                                                    "h-0.5 w-full",
                                                    index < currentStepIndex ? "bg-emerald-600" : "bg-zinc-200"
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pb-24">
                {/* Step 1: Form */}
                {currentStep === "form" && (
                    <div className="space-y-6">
                        {/* Surat Pengantar Form */}
                        {suratType === "SURAT_PENGANTAR" && (
                            <>
                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Informasi Surat</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="nomorSurat">Nomor Surat <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="nomorSurat"
                                                    value={suratPengantarForm.nomorSurat}
                                                    onChange={(e) => updateSuratPengantar("nomorSurat", e.target.value)}
                                                    placeholder="963/UN7.F8.1/AK/2025"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalSurat">Tanggal Surat <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="tanggalSurat"
                                                    value={suratPengantarForm.tanggalSurat}
                                                    onChange={(e) => updateSuratPengantar("tanggalSurat", e.target.value)}
                                                    placeholder="28 Januari 2026"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="perihal">Perihal <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="perihal"
                                                value={suratPengantarForm.perihal}
                                                onChange={(e) => updateSuratPengantar("perihal", e.target.value)}
                                                placeholder="Permohonan Izin Magang Mandiri"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Tujuan Surat</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="namaTujuan">Nama Tujuan <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="namaTujuan"
                                                value={suratPengantarForm.namaTujuan}
                                                onChange={(e) => updateSuratPengantar("namaTujuan", e.target.value)}
                                                placeholder="Nama penerima surat"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="jabatanTujuan">Jabatan Tujuan</Label>
                                            <Input
                                                id="jabatanTujuan"
                                                value={suratPengantarForm.jabatanTujuan}
                                                onChange={(e) => updateSuratPengantar("jabatanTujuan", e.target.value)}
                                                placeholder="Jabatan penerima surat"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="alamatTujuan">Alamat Tujuan</Label>
                                            <Textarea
                                                id="alamatTujuan"
                                                value={suratPengantarForm.alamatTujuan}
                                                onChange={(e) => updateSuratPengantar("alamatTujuan", e.target.value)}
                                                placeholder="Alamat lengkap instansi tujuan"
                                                rows={2}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{isPengajuMahasiswa ? "Data Mahasiswa" : "Data Dosen"}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="namaMahasiswa">{isPengajuMahasiswa ? "Nama Mahasiswa" : "Nama Dosen"} <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="namaMahasiswa"
                                                    value={suratPengantarForm.namaMahasiswa}
                                                    onChange={(e) => updateSuratPengantar("namaMahasiswa", e.target.value)}
                                                    placeholder={isPengajuMahasiswa ? "Nama lengkap mahasiswa" : "Nama lengkap dosen"}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nimMahasiswa">{isPengajuMahasiswa ? "NIM" : "NIP"} <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="nimMahasiswa"
                                                    value={suratPengantarForm.nimMahasiswa}
                                                    onChange={(e) => updateSuratPengantar("nimMahasiswa", e.target.value)}
                                                    placeholder={isPengajuMahasiswa ? "24060122xxxxxx" : "198501152010121001"}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="programStudi">Program Studi</Label>
                                                <Input
                                                    id="programStudi"
                                                    value={suratPengantarForm.programStudi}
                                                    onChange={(e) => updateSuratPengantar("programStudi", e.target.value)}
                                                    placeholder="S1 Informatika"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="departemen">Departemen</Label>
                                                <Input
                                                    id="departemen"
                                                    value={suratPengantarForm.departemen}
                                                    onChange={(e) => updateSuratPengantar("departemen", e.target.value)}
                                                    placeholder="Informatika"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="keperluan">Keperluan/Jenis Kegiatan <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="keperluan"
                                                value={suratPengantarForm.keperluan}
                                                onChange={(e) => updateSuratPengantar("keperluan", e.target.value)}
                                                placeholder="Magang Mandiri"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="judulAcara">Judul Kegiatan/Proposal</Label>
                                            <Textarea
                                                id="judulAcara"
                                                value={suratPengantarForm.judulAcara}
                                                onChange={(e) => updateSuratPengantar("judulAcara", e.target.value)}
                                                placeholder="Judul lengkap kegiatan atau proposal"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="lokasiAcara">Lokasi Kegiatan</Label>
                                                <Input
                                                    id="lokasiAcara"
                                                    value={suratPengantarForm.lokasiAcara}
                                                    onChange={(e) => updateSuratPengantar("lokasiAcara", e.target.value)}
                                                    placeholder="PT. XYZ, Jakarta"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                                                <Input
                                                    id="tanggalMulai"
                                                    value={suratPengantarForm.tanggalMulai}
                                                    onChange={(e) => updateSuratPengantar("tanggalMulai", e.target.value)}
                                                    placeholder="10 Januari 2026"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="durasiAcara">Durasi (opsional)</Label>
                                            <Input
                                                id="durasiAcara"
                                                value={suratPengantarForm.durasiAcara}
                                                onChange={(e) => updateSuratPengantar("durasiAcara", e.target.value)}
                                                placeholder="6 bulan"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Surat Tugas Form */}
                        {suratType === "SURAT_TUGAS" && (
                            <Card className="bg-neutral-50 border-zinc-400">
                                <CardHeader>
                                    <CardTitle className="text-lg">Form Surat Tugas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="jenisSuratText">Judul Surat</Label>
                                        <Input
                                            id="jenisSuratText"
                                            value={suratTugasForm.jenisSuratText}
                                            onChange={(e) => updateSuratTugas("jenisSuratText", e.target.value)}
                                            placeholder="SURAT TUGAS"
                                        />
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="namaLengkap"
                                                value={suratTugasForm.namaLengkap}
                                                onChange={(e) => updateSuratTugas("namaLengkap", e.target.value)}
                                                placeholder="Nama lengkap"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nimNip">{isPengajuMahasiswa ? "NIM" : "NIP"} <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nimNip"
                                                value={suratTugasForm.nimNip}
                                                onChange={(e) => updateSuratTugas("nimNip", e.target.value)}
                                                placeholder={isPengajuMahasiswa ? "24060122xxxxxx" : "198501152010121001"}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="programStudi">Program Studi</Label>
                                        <Input
                                            id="programStudi"
                                            value={suratTugasForm.programStudi}
                                            onChange={(e) => updateSuratTugas("programStudi", e.target.value)}
                                            placeholder="Informatika"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="keperluan">Keperluan <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="keperluan"
                                            value={suratTugasForm.keperluan}
                                            onChange={(e) => updateSuratTugas("keperluan", e.target.value)}
                                            placeholder="Jelaskan keperluan surat ini"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="judulSurat">Judul/Topik Kegiatan</Label>
                                        <Textarea
                                            id="judulSurat"
                                            value={suratTugasForm.judulSurat}
                                            onChange={(e) => updateSuratTugas("judulSurat", e.target.value)}
                                            placeholder="Jelaskan judul atau topik kegiatan"
                                            rows={2}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Surat Tugas Tabel Form */}
                        {suratType === "SURAT_TUGAS_TABEL" && (
                            <>
                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Informasi Surat Tugas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="jenisSuratText">Judul Surat</Label>
                                            <Input
                                                id="jenisSuratText"
                                                value={suratTugasTabelForm.jenisSuratText}
                                                onChange={(e) => updateSuratTugasTabel("jenisSuratText", e.target.value)}
                                                placeholder="SURAT TUGAS"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="keperluan">Keperluan <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id="keperluan"
                                                value={suratTugasTabelForm.keperluan}
                                                onChange={(e) => updateSuratTugasTabel("keperluan", e.target.value)}
                                                placeholder="Jelaskan keperluan surat ini"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="judulSurat">Judul/Topik Kegiatan</Label>
                                            <Textarea
                                                id="judulSurat"
                                                value={suratTugasTabelForm.judulSurat}
                                                onChange={(e) => updateSuratTugasTabel("judulSurat", e.target.value)}
                                                placeholder="Jelaskan judul atau topik kegiatan"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalMulai">Tanggal Mulai <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="tanggalMulai"
                                                    type="date"
                                                    value={suratTugasTabelForm.tanggalMulai}
                                                    onChange={(e) => updateSuratTugasTabel("tanggalMulai", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalSelesai">Tanggal Selesai <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="tanggalSelesai"
                                                    type="date"
                                                    value={suratTugasTabelForm.tanggalSelesai}
                                                    onChange={(e) => updateSuratTugasTabel("tanggalSelesai", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Data Pelaksana</CardTitle>
                                        <CardDescription>Tambahkan daftar orang yang akan ditugaskan dalam format tabel</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Custom Columns Management */}
                                        {suratTugasTabelForm.customColumns.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">Kolom Tambahan:</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {suratTugasTabelForm.customColumns.map((col) => (
                                                        <div key={col.key} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                                                            <Input
                                                                value={col.label}
                                                                onChange={(e) => updateCustomColumnLabel(col.key, e.target.value)}
                                                                placeholder="Nama Kolom"
                                                                className="h-7 w-32 text-sm border-0 bg-transparent focus-visible:ring-0"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeCustomColumn(col.key)}
                                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={addCustomColumn} 
                                            className="border-dashed"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Kolom
                                        </Button>

                                        {/* Table Header */}
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="bg-muted/50 p-3 border-b">
                                                <div className="grid gap-2" style={{ 
                                                    gridTemplateColumns: `40px repeat(${3 + suratTugasTabelForm.customColumns.length}, 1fr) 40px` 
                                                }}>
                                                    <div className="text-xs font-medium text-center">No</div>
                                                    <div className="text-xs font-medium">Nama <span className="text-red-500">*</span></div>
                                                    <div className="text-xs font-medium">NIM <span className="text-red-500">*</span></div>
                                                    <div className="text-xs font-medium">Prodi <span className="text-red-500">*</span></div>
                                                    {suratTugasTabelForm.customColumns.map((col) => (
                                                        <div key={col.key} className="text-xs font-medium">{col.label || "(Belum diberi nama)"}</div>
                                                    ))}
                                                    <div></div>
                                                </div>
                                            </div>
                                            
                                            {/* Table Body */}
                                            <div className="divide-y">
                                                {suratTugasTabelForm.pelaksana.map((p, index) => (
                                                    <div key={p.key} className="p-3 bg-white hover:bg-muted/30">
                                                        <div className="grid gap-2 items-center" style={{ 
                                                            gridTemplateColumns: `40px repeat(${3 + suratTugasTabelForm.customColumns.length}, 1fr) 40px` 
                                                        }}>
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm">
                                                                {index + 1}
                                                            </div>
                                                            <Input
                                                                value={p.nama}
                                                                onChange={(e) => updatePelaksana(p.key, "nama", e.target.value)}
                                                                placeholder="Nama"
                                                                className="h-9"
                                                            />
                                                            <Input
                                                                value={p.nim}
                                                                onChange={(e) => updatePelaksana(p.key, "nim", e.target.value)}
                                                                placeholder="NIM"
                                                                className="h-9"
                                                            />
                                                            <Input
                                                                value={p.prodi}
                                                                onChange={(e) => updatePelaksana(p.key, "prodi", e.target.value)}
                                                                placeholder="Prodi"
                                                                className="h-9"
                                                            />
                                                            {suratTugasTabelForm.customColumns.map((col) => (
                                                                <Input
                                                                    key={col.key}
                                                                    value={p[col.key] || ""}
                                                                    onChange={(e) => updatePelaksana(p.key, col.key, e.target.value)}
                                                                    placeholder={col.label || "..."}
                                                                    className="h-9"
                                                                />
                                                            ))}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removePelaksana(p.key)}
                                                                className="text-destructive hover:text-destructive h-8 w-8"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {suratTugasTabelForm.pelaksana.length === 0 && (
                                                    <div className="p-8 text-center text-muted-foreground">
                                                        <p className="text-sm">Belum ada data pelaksana</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <Button variant="outline" onClick={addPelaksana} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Pelaksana
                                        </Button>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Surat Keputusan Form */}
                        {suratType === "SURAT_KEPUTUSAN" && (
                            <>
                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="tentang">Tentang <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id="tentang"
                                                value={suratKeputusanForm.tentang}
                                                onChange={(e) => updateSuratKeputusan("tentang", e.target.value)}
                                                placeholder="Isi perihal/tentang keputusan"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tanggalDitetapkan">Tanggal Ditetapkan <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="tanggalDitetapkan"
                                                value={suratKeputusanForm.tanggalDitetapkan}
                                                onChange={(e) => updateSuratKeputusan("tanggalDitetapkan", e.target.value)}
                                                placeholder="26 September 2025"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Menimbang</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {suratKeputusanForm.menimbang.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateMenimbang(index, e.target.value)}
                                                    placeholder={`Item menimbang ${index + 1}`}
                                                    rows={2}
                                                    className="flex-1"
                                                />
                                                {suratKeputusanForm.menimbang.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeMenimbang(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button variant="outline" onClick={addMenimbang} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Item Menimbang
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Mengingat</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {suratKeputusanForm.mengingat.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateMengingat(index, e.target.value)}
                                                    placeholder={`Item mengingat ${index + 1}`}
                                                    rows={2}
                                                    className="flex-1"
                                                />
                                                {suratKeputusanForm.mengingat.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeMengingat(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button variant="outline" onClick={addMengingat} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Item Mengingat
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Menetapkan</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            value={suratKeputusanForm.menetapkan}
                                            onChange={(e) => updateSuratKeputusan("menetapkan", e.target.value)}
                                            placeholder="Isi bagian menetapkan"
                                            rows={3}
                                        />
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Keputusan</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {suratKeputusanForm.keputusan.map((k) => (
                                            <div key={k.key} className="p-4 bg-white rounded-lg border space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Input
                                                        value={k.label}
                                                        onChange={(e) => updateKeputusan(k.key, "label", e.target.value)}
                                                        placeholder="KESATU, KEDUA, dst."
                                                        className="w-40"
                                                    />
                                                    {suratKeputusanForm.keputusan.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeKeputusan(k.key)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <Textarea
                                                    value={k.content}
                                                    onChange={(e) => updateKeputusan(k.key, "content", e.target.value)}
                                                    placeholder="Isi keputusan"
                                                    rows={3}
                                                />
                                            </div>
                                        ))}
                                        <Button variant="outline" onClick={addKeputusan} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Keputusan
                                        </Button>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Signature Configuration */}
                {currentStep === "signature" && (
                    <div className="space-y-6">
                        <Card className="bg-neutral-50 border-zinc-400">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <PenTool className="w-5 h-5" />
                                    Konfigurasi Tanda Tangan
                                </CardTitle>
                                <CardDescription>
                                    Pilih pejabat yang akan menandatangani surat ini.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Info kategori surat dan filter pejabat */}
                                {suratType !== "SURAT_PENGANTAR" && suratCategory && (
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-900">
                                            <strong>Kategori Surat: {suratCategory}</strong>
                                            <br />
                                            {suratCategory === "AKADEMIK" && "Pejabat yang dapat menandatangani: Wakil Dekan I dan Dekan"}
                                            {suratCategory === "SUMBER_DAYA" && "Pejabat yang dapat menandatangani: Wakil Dekan II dan Dekan"}
                                            {suratCategory === "UMUM" && "Pejabat yang dapat menandatangani: Wakil Dekan I, Wakil Dekan II, dan Dekan"}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        {suratType === "SURAT_PENGANTAR" 
                                            ? "Penanda tangan default berdasarkan pilihan pengaju. Anda dapat mengubah konfigurasi jika diperlukan."
                                            : "Surat akan diverifikasi secara berurutan sebelum ditandatangani."}
                                    </AlertDescription>
                                </Alert>

                                {signers.map((signer, index) => (
                                    <div key={signer.id} className="space-y-3 p-4 bg-white rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <Select
                                                value={signer.role}
                                                onValueChange={(value) => updateSignerRole(signer.id, value)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Pilih Pejabat" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Surat Pengantar: hanya pejabat prodi (Kaprodi, Kadep) */}
                                                    {/* Surat Tugas/Keputusan: filter pejabat fakultas berdasarkan kategori */}
                                                    {(suratType === "SURAT_PENGANTAR" 
                                                        ? SURAT_PENGANTAR_ROLES 
                                                        : getFilteredRolesByCategory(suratCategory)
                                                    ).map((role) => (
                                                        <SelectItem 
                                                            key={role.value} 
                                                            value={role.value}
                                                            disabled={signers.some(s => s.role === role.value && s.id !== signer.id)}
                                                        >
                                                            {role.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {signers.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSigner(signer.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        {/* Input fields dalam grid */}
                                        <div className="ml-11 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label htmlFor={`nama-${signer.id}`} className="text-xs text-muted-foreground">Nama Pejabat</Label>
                                                    <Input
                                                        id={`nama-${signer.id}`}
                                                        placeholder="Nama lengkap"
                                                        value={signer.name || ""}
                                                        onChange={(e) => updateSignerName(signer.id, e.target.value)}
                                                        className="text-sm mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`nip-${signer.id}`} className="text-xs text-muted-foreground">NIP</Label>
                                                    <Input
                                                        id={`nip-${signer.id}`}
                                                        placeholder="NIP pejabat"
                                                        value={signer.nip || ""}
                                                        onChange={(e) => updateSignerNip(signer.id, e.target.value)}
                                                        className="text-sm mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor={`prefix-${signer.id}`} className="text-xs text-muted-foreground">Awalan (opsional)</Label>
                                                <Input
                                                    id={`prefix-${signer.id}`}
                                                    placeholder="Contoh: Mengetahui,"
                                                    value={signer.prefix || ""}
                                                    onChange={(e) => updateSignerPrefix(signer.id, e.target.value)}
                                                    className="text-sm mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {signers.length < (suratType === "SURAT_PENGANTAR" ? SURAT_PENGANTAR_ROLES : SURAT_FAKULTAS_ROLES).length && (
                                    <Button
                                        variant="outline"
                                        onClick={addSigner}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tambah Penanda Tangan
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* PDF Signature Positioner - Always shown */}
                        <Card className="bg-neutral-50 border-zinc-400">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Preview Dokumen dengan Tanda Tangan
                                </CardTitle>
                                <CardDescription>
                                    Posisi tanda tangan akan otomatis disesuaikan berdasarkan template surat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TemplatePreview
                                    suratType={suratType as "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN"}
                                    signers={signers.map(s => ({
                                        id: s.id,
                                        role: s.role,
                                        name: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                                        nip: s.nip,
                                        prefix: s.prefix
                                    }))}
                                    formData={
                                        suratType === "SURAT_PENGANTAR" ? suratPengantarForm :
                                        suratType === "SURAT_TUGAS" ? suratTugasForm :
                                        suratType === "SURAT_TUGAS_TABEL" ? suratTugasTabelForm :
                                        suratKeputusanForm
                                    }
                                    tembusan={tembusanTexts.map(t => ({ name: t.text }))}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Tembusan Configuration */}
                {currentStep === "tembusan" && (
                    <Card className="bg-neutral-50 border-zinc-400">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Konfigurasi Tembusan
                            </CardTitle>
                            <CardDescription>
                                Tentukan siapa saja yang akan menerima tembusan surat ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Checkbox
                                    id="pengaju"
                                    checked={includePengaju}
                                    onCheckedChange={(checked) => setIncludePengaju(checked === true)}
                                />
                                <div className="flex-1">
                                    <Label htmlFor="pengaju" className="font-medium cursor-pointer">
                                        Pengaju Surat
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Pengaju akan mendapat akses sistem.
                                    </p>
                                </div>
                                <Badge variant="secondary">Disarankan</Badge>
                            </div>

                            <Separator />

                            {/* Section 1: Akun Pengguna untuk Akses Sistem */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-blue-700">
                                        1. Pilih Akun Pengguna (Akses Sistem)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Akun yang dipilih akan dapat <strong>mengakses dan mendownload</strong> surat setelah selesai.<br/>
                                        <span className="text-amber-600 font-medium">Tidak akan tertulis di PDF surat.</span>
                                    </p>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Cari nama atau email pengguna..."
                                            value={userSearchQuery}
                                            onChange={(e) => {
                                                setUserSearchQuery(e.target.value);
                                                setShowUserResults(true);
                                            }}
                                            onFocus={() => setShowUserResults(true)}
                                            className="pl-9"
                                        />
                                        {isSearchingUsers && (
                                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* User Search Results */}
                                    {showUserResults && userSearchQuery.length >= 2 && (
                                        <Card className="shadow-lg border-2 max-h-64 overflow-y-auto">
                                            {userSearchResults.length === 0 ? (
                                                <div className="p-4 text-center text-muted-foreground text-sm">
                                                    {isSearchingUsers ? 'Mencari...' : 'Tidak ada hasil ditemukan'}
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {userSearchResults.map((user) => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left transition-colors"
                                                            onClick={() => handleSelectUser(user)}
                                                        >
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                                user.type === 'mahasiswa' ? 'bg-blue-100' : 'bg-purple-100'
                                                            )}>
                                                                <User className={cn(
                                                                    "h-5 w-5",
                                                                    user.type === 'mahasiswa' ? 'text-blue-700' : 'text-purple-700'
                                                                )} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {user.type === 'mahasiswa' 
                                                                        ? `${user.identifier} • ${user.programStudi || 'Mahasiswa'}`
                                                                        : `${user.jabatan || 'Pegawai'} • NIP: ${user.identifier}`
                                                                    }
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs shrink-0">
                                                                {user.type === 'mahasiswa' ? 'Mahasiswa' : 'Pegawai'}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    )}

                                    {userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
                                        <p className="text-sm text-muted-foreground">
                                            Ketik minimal 2 karakter untuk mencari...
                                        </p>
                                    )}
                                </div>

                                {/* List selected users */}
                                {tembusanUsers.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Akun Terpilih ({tembusanUsers.length})</Label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {tembusanUsers.map((user) => (
                                                <div
                                                    key={user.userId}
                                                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                        user.type === 'mahasiswa' ? 'bg-blue-100' : 'bg-purple-100'
                                                    )}>
                                                        <User className={cn(
                                                            "h-4 w-4",
                                                            user.type === 'mahasiswa' ? 'text-blue-700' : 'text-purple-700'
                                                        )} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.description}</p>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs shrink-0">
                                                        Akses Sistem
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeTembusanUser(user.userId)}
                                                        className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Section 2: Text Manual untuk Tertulis di Surat */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-tembusan-text" className="text-sm font-medium text-green-700">
                                        2. Tambah Text Tembusan (Tertulis di Surat)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Text yang diketik akan <strong>tertulis di bagian "Tembusan:"</strong> di PDF surat.<br/>
                                        <span className="text-amber-600 font-medium">Tidak terkait dengan akun sistem.</span><br/>
                                        Contoh: "Arsip", "Pertinggal", "Kepala Laboratorium"
                                    </p>
                                    <div className="flex gap-2">
                                        <Textarea
                                            id="new-tembusan-text"
                                            placeholder="Contoh: Arsip, Kepala Lab Fisika, Yth. Bapak/Ibu..."
                                            value={newTembusanTextInput}
                                            onChange={(e) => setNewTembusanTextInput(e.target.value)}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button onClick={addTembusanText} className="self-end" disabled={!newTembusanTextInput.trim()}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>

                                {/* List text tembusan */}
                                {tembusanTexts.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Text Terpilih ({tembusanTexts.length})</Label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {tembusanTexts.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700 shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <span className="flex-1 text-sm">{item.text}</span>
                                                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 shrink-0">
                                                        Tertulis di Surat
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeTembusanText(item.id)}
                                                        className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Alert className="mt-4 bg-amber-50 border-amber-200">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800 text-sm">
                                    <strong>Perbedaan:</strong><br/>
                                    • <strong>Akun Sistem (Biru)</strong>: Dapat akses download surat, tidak tertulis di PDF<br/>
                                    • <strong>Text Manual (Hijau)</strong>: Tertulis di PDF surat, tidak dapat akses sistem<br/>
                                    • <strong>Pengaju</strong>: Otomatis dapat akses DAN tertulis di surat
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Attachments (Lampiran) */}
                {currentStep === "attachments" && (
                    <Card className="bg-neutral-50 border-zinc-400">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Paperclip className="w-5 h-5" />
                                Lampiran (Opsional)
                            </CardTitle>
                            <CardDescription>
                                Upload file lampiran dalam format PDF, JPG, atau PNG. Maksimal 10MB per file.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    id="attachment-upload"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleAttachmentUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="attachment-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-blue-600">Klik untuk upload file</p>
                                        <p className="text-sm text-muted-foreground">
                                            atau drag & drop file ke sini
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Format: PDF, JPG, PNG • Maks. 10MB per file
                                    </p>
                                </label>
                            </div>

                            {/* Attachment List */}
                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        File Terupload ({attachments.length})
                                    </Label>
                                    <div className="space-y-2">
                                        {attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                                            >
                                                {/* Icon based on type */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                    attachment.type === 'application/pdf' 
                                                        ? "bg-red-100" 
                                                        : "bg-green-100"
                                                )}>
                                                    {attachment.type === 'application/pdf' ? (
                                                        <File className="w-5 h-5 text-red-600" />
                                                    ) : (
                                                        <Image className="w-5 h-5 text-green-600" />
                                                    )}
                                                </div>
                                                
                                                {/* File info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(attachment.size)}
                                                    </p>
                                                </div>

                                                {/* Preview for images */}
                                                {attachment.previewUrl && (
                                                    <div className="w-12 h-12 rounded overflow-hidden border shrink-0">
                                                        <img
                                                            src={attachment.previewUrl}
                                                            alt={attachment.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                {/* Remove button */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeAttachment(attachment.id)}
                                                    className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Existing Attachments (already uploaded) */}
                            {existingAttachments.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-amber-700">
                                        Lampiran Tersimpan ({existingAttachments.length})
                                    </Label>
                                    <div className="space-y-2">
                                        {existingAttachments.map((url, index) => {
                                            const fileName = url.split('/').pop() || `Lampiran ${index + 1}`;
                                            const isPdf = url.toLowerCase().endsWith('.pdf');
                                            
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                        isPdf ? "bg-red-100" : "bg-green-100"
                                                    )}>
                                                        {isPdf ? (
                                                            <File className="w-5 h-5 text-red-600" />
                                                        ) : (
                                                            <Image className="w-5 h-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{fileName}</p>
                                                        <p className="text-xs text-amber-600">Sudah tersimpan di server</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(url, '_blank')}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Preview"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-amber-600">
                                        File di atas sudah tersimpan. Upload file baru untuk menambah lampiran.
                                    </p>
                                </div>
                            )}

                            {attachments.length === 0 && existingAttachments.length === 0 && (
                                <Alert className="bg-blue-50 border-blue-200">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800 text-sm">
                                        Lampiran bersifat opsional. Anda dapat melanjutkan tanpa menambahkan lampiran.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Review */}
                {currentStep === "review" && (
                    <div className="space-y-4">
                        <Card className="bg-neutral-50 border-zinc-400">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Ringkasan Draft Surat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Jenis Surat</Label>
                                    <p className="font-medium">{SURAT_TYPE_LABELS[suratType]}</p>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                        Penanda Tangan ({signers.length})
                                    </Label>
                                    <div className="space-y-2">
                                        {signers.map((signer, index) => (
                                            <div
                                                key={signer.id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {ALL_SIGNER_ROLES.find(r => r.value === signer.role)?.label || signer.role}
                                                    </p>
                                                </div>
                                                <Badge>Wajib TTD</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                        Tembusan ({tembusanTexts.length + tembusanUsers.length + (includePengaju ? 1 : 0)} akses sistem)
                                    </Label>
                                    <div className="space-y-2">
                                        {includePengaju && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <Users className="w-5 h-5 text-blue-600" />
                                                <div className="flex-1">
                                                    <span className="font-medium">Pengaju Surat</span>
                                                    <p className="text-xs text-muted-foreground">Akses sistem saja</p>
                                                </div>
                                            </div>
                                        )}
                                        {tembusanUsers.map((user) => (
                                            <div
                                                key={user.userId}
                                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                                            >
                                                <User className="w-5 h-5 text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.description}</p>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">Akses Sistem</Badge>
                                            </div>
                                        ))}
                                        {tembusanTexts.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">
                                                    {index + 1}
                                                </div>
                                                <span className="flex-1 text-sm">{item.text}</span>
                                                <Badge variant="outline" className="text-xs border-green-300 text-green-700">Tertulis di Surat</Badge>
                                            </div>
                                        ))}
                                        {!includePengaju && tembusanTexts.length === 0 && tembusanUsers.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">
                                                Tidak ada tembusan
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Lampiran Review */}
                                <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                        Lampiran ({attachments.length})
                                    </Label>
                                    {attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {attachments.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded flex items-center justify-center shrink-0",
                                                        attachment.type === 'application/pdf' 
                                                            ? "bg-red-100" 
                                                            : "bg-green-100"
                                                    )}>
                                                        {attachment.type === 'application/pdf' ? (
                                                            <File className="w-4 h-4 text-red-600" />
                                                        ) : (
                                                            <Image className="w-4 h-4 text-green-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{attachment.name}</p>
                                                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Tidak ada lampiran
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Template Preview with Signatures */}
                                <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                        Preview Surat
                                    </Label>
                                    <TemplatePreview
                                        suratType={suratType as "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN"}
                                        signers={signers.map(s => ({
                                            id: s.id,
                                            role: s.role,
                                            name: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                                            nip: s.nip,
                                            prefix: s.prefix
                                        }))}
                                        formData={
                                            suratType === "SURAT_PENGANTAR" ? suratPengantarForm :
                                            suratType === "SURAT_TUGAS" ? suratTugasForm :
                                            suratType === "SURAT_TUGAS_TABEL" ? suratTugasTabelForm :
                                            suratKeputusanForm
                                        }
                                        tembusan={tembusanTexts.map(t => ({ name: t.text }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                {isEditMode 
                                    ? "Setelah menyimpan perubahan, Anda bisa tetap di halaman ini untuk review atau kembali ke dashboard."
                                    : "Setelah draft dibuat, surat akan melalui alur verifikasi sebelum ditandatangani."}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav
                leftContent={
                    <Button
                        variant="outline"
                        onClick={currentStep === "form" ? () => router.back() : goToPrevStep}
                        className="border-zinc-800 text-zinc-800 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {currentStep === "form" ? "Batal" : "Kembali"}
                    </Button>
                }
                rightContent={
                    currentStep === "review" ? (
                        <Button
                            onClick={() => {
                                setSaveMode('patch');
                                handleSubmit();
                            }}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                            {submitting && saveMode === 'patch' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            {isEditMode ? "Simpan Perubahan" : "Buat Draft Surat"}
                        </Button>
                    ) : (
                        <Button
                            onClick={goToNextStep}
                            className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                            Lanjutkan
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    )
                }
            />
        </>
    );
}
