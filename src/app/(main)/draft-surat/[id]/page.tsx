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
    Info,
    FileText,
    CheckCircle,
    ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BottomNav from "@/components/layout/bottom-nav";
import { suratService } from "@/services/surat.service";
import { TemplatePreview } from "@/components/surat-preview";

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

interface TembusanItem {
    id: string;
    type: "TEXT" | "USER";
    value: string;
    label?: string;
}

interface PelaksanaItem {
    key: string;
    nama: string;
    nimNip: string;
    jabatan?: string;
}

interface KeputusanItem {
    key: string;
    label: string;
    content: string;
}

type Step = "form" | "signature" | "tembusan" | "review";

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
    keperluan: string;
    judulSurat: string;
    pelaksana: PelaksanaItem[];
}

interface SuratKeputusanForm {
    nomorSurat: string;
    tentang: string;
    menimbang: string[];
    mengingat: string[];
    menetapkan: string;
    keputusan: KeputusanItem[];
    tanggalDitetapkan: string;
    namaPejabat: string;
    nipPejabat: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// All available signer roles
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
    
    // Get type from query params
    const suratType = searchParams.get("type") as SuratType | null;
    
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
        keperluan: "",
        judulSurat: "",
        pelaksana: [],
    });

    const [suratKeputusanForm, setSuratKeputusanForm] = useState<SuratKeputusanForm>({
        nomorSurat: "",
        tentang: "",
        menimbang: [""],
        mengingat: [""],
        menetapkan: "",
        keputusan: [{ key: "1", label: "KESATU", content: "" }],
        tanggalDitetapkan: "",
        namaPejabat: "",
        nipPejabat: "",
    });
    
    // Signature state - position data no longer needed with template-based positioning
    const [signers, setSigners] = useState<SignerItem[]>([
        { 
            id: "1", 
            role: suratType === "SURAT_PENGANTAR" ? "KADEP" : "DEKAN", 
            order: 1, 
            isRequired: true,
            name: "",
            nip: "",
        }
    ]);
    
    // Tembusan state
    const [tembusan, setTembusan] = useState<TembusanItem[]>([]);
    const [newTembusanText, setNewTembusanText] = useState("");
    const [includePengaju, setIncludePengaju] = useState(true);
    
    // Loading state for fetching existing data
    const [loading, setLoading] = useState(true);
    
    // State untuk menentukan apakah pengaju adalah Mahasiswa atau Dosen
    // True = Mahasiswa (punya NIM), False = Dosen (punya NIP)
    const [isPengajuMahasiswa, setIsPengajuMahasiswa] = useState(true);
    
    // Edit mode tracking - true if draft already exists and we're editing
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingDocumentId, setExistingDocumentId] = useState<string | null>(null);
    
    // Verification mode - true if supervisor/manajer TU is editing during verification
    const [isVerificationMode, setIsVerificationMode] = useState(false);

    // Redirect if no type specified
    useEffect(() => {
        if (!suratType) {
            toast.error("Jenis surat tidak ditemukan");
            router.back();
        }
    }, [suratType, router]);

    // Fetch existing data and populate forms
    useEffect(() => {
        async function fetchExistingData() {
            if (!resolvedParams.id) {
                setLoading(false);
                return;
            }

            try {
                const detail = await suratService.getDetail(resolvedParams.id);
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
                    setIsEditMode(true);
                    setExistingDocumentId(existingDoc.id);
                }

                // Check if in verification mode (supervisor/manajer editing during verification)
                if (detail.status === 'FAKULTAS_VERIFICATION' && existingDoc) {
                    setIsVerificationMode(true);
                }

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
                    const existingPelaksana = (content.pelaksana as Array<{ nama: string; nimNip: string; jabatan?: string }>) || [];
                    setSuratTugasTabelForm(prev => ({
                        ...prev,
                        jenisSuratText: (content.jenisSuratText as string) || "SURAT TUGAS",
                        tanggalSurat: (content.tanggalSurat as string) || "",
                        keperluan: (content.keperluan as string) || detail.submissionValues.keperluan || "",
                        judulSurat: (content.judulSurat as string) || detail.submissionValues.judulAcara || "",
                        pelaksana: existingPelaksana.map((p, index) => ({
                            key: String(index + 1),
                            nama: p.nama || "",
                            nimNip: p.nimNip || "",
                            jabatan: p.jabatan || ""
                        }))
                    }));
                } else if (suratType === "SURAT_TUGAS_TABEL" && !existingDoc && detail.submissionValues) {
                    // No existing document, populate from submission values with one initial row
                    setSuratTugasTabelForm(prev => ({
                        ...prev,
                        keperluan: detail.submissionValues.keperluan || "",
                        judulSurat: detail.submissionValues.judulAcara || "",
                        pelaksana: [{
                            key: "1",
                            nama: detail.submissionValues.nama || "",
                            nimNip: detail.submissionValues.nim || detail.submissionValues.nip || "",
                            jabatan: ""
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
                        id: String(index + 1),
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
                    const initialSigners: SignerItem[] = [
                        {
                            id: "1",
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
                            id: "2",
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
                        id: "1",
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
                if (existingDoc?.content) {
                    const content = existingDoc.content as Record<string, unknown>;
                    const existingTembusan = (content.tembusan as string[]) || [];
                    
                    // Check if "Pengaju" is in the list
                    const hasPengaju = existingTembusan.some(t => t.toLowerCase() === "pengaju");
                    setIncludePengaju(hasPengaju);
                    
                    // Set tembusan excluding "Pengaju" (it's handled separately)
                    const tembusanItems: TembusanItem[] = existingTembusan
                        .filter(t => t.toLowerCase() !== "pengaju")
                        .map((t, index) => ({
                            id: String(index + 1),
                            type: "TEXT" as const,
                            value: t
                        }));
                    setTembusan(tembusanItems);
                }

            } catch (error) {
                console.error("Error fetching existing data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchExistingData();
    }, [resolvedParams.id, suratType]);

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
        setSuratTugasTabelForm(prev => ({
            ...prev,
            pelaksana: [...prev.pelaksana, { key: newKey, nama: "", nimNip: "", jabatan: "" }]
        }));
    };

    const removePelaksana = (key: string) => {
        setSuratTugasTabelForm(prev => ({
            ...prev,
            pelaksana: prev.pelaksana.filter(p => p.key !== key)
        }));
    };

    const updatePelaksana = (key: string, field: keyof PelaksanaItem, value: string) => {
        setSuratTugasTabelForm(prev => ({
            ...prev,
            pelaksana: prev.pelaksana.map(p => p.key === key ? { ...p, [field]: value } : p)
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
        const newId = String(signers.length + 1);
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
        const filtered = signers.filter(s => s.id !== id);
        const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
        setSigners(reordered);
    };

    const updateSignerRole = (id: string, role: string) => {
        const roleLabel = ALL_SIGNER_ROLES.find(r => r.value === role)?.label || role;
        setSigners(signers.map(s => s.id === id ? { ...s, role, name: roleLabel } : s));
    };

    const updateSignerPrefix = (id: string, prefix: string) => {
        setSigners(signers.map(s => s.id === id ? { ...s, prefix } : s));
    };

    // ========================================================================
    // TEMBUSAN HANDLERS
    // ========================================================================

    const addTembusan = () => {
        if (!newTembusanText.trim()) {
            toast.error("Masukkan nama/jabatan tembusan");
            return;
        }
        const newId = String(Date.now());
        setTembusan([...tembusan, { 
            id: newId, 
            type: "TEXT", 
            value: newTembusanText.trim() 
        }]);
        setNewTembusanText("");
    };

    const removeTembusan = (id: string) => {
        setTembusan(tembusan.filter(t => t.id !== id));
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
            // Removed tanggalSurat from required - will be assigned by UPA
            if (!suratTugasTabelForm.keperluan) {
                toast.error("Lengkapi semua field yang wajib diisi");
                return false;
            }
            if (suratTugasTabelForm.pelaksana.length === 0) {
                toast.error("Tambahkan minimal 1 pelaksana");
                return false;
            }
        } else if (suratType === "SURAT_KEPUTUSAN") {
            if (!suratKeputusanForm.nomorSurat || !suratKeputusanForm.tentang || !suratKeputusanForm.tanggalDitetapkan) {
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
                setCurrentStep("review");
            } else {
                setCurrentStep("tembusan");
            }
        } else if (currentStep === "tembusan") {
            setCurrentStep("review");
        }
    };

    const goToPrevStep = () => {
        if (currentStep === "signature") {
            setCurrentStep("form");
        } else if (currentStep === "tembusan") {
            setCurrentStep("signature");
        } else if (currentStep === "review") {
            // Skip tembusan for Surat Pengantar
            if (suratType === "SURAT_PENGANTAR") {
                setCurrentStep("signature");
            } else {
                setCurrentStep("tembusan");
            }
        }
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
                content = { 
                    ...suratTugasTabelForm,
                    pelaksana: suratTugasTabelForm.pelaksana.map(({ key, ...rest }) => rest)
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

            // Build tembusan array
            const tembusanList: string[] = [];
            if (includePengaju) {
                tembusanList.push("Pengaju");
            }
            tembusan.forEach(t => {
                tembusanList.push(t.value);
            });

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
                    response = await suratService.updateDraftAsSupervisor(
                        resolvedParams.id,
                        {
                            content,
                            tembusan: tembusanList,
                        }
                    );
                } else if (isEditMode && existingDocumentId) {
                    // Staff editing existing draft (after return)
                    response = await suratService.updateDraftSuratHasil(
                        existingDocumentId,
                        {
                            content,
                            tembusan: tembusanList,
                        }
                    );
                } else {
                    // Create new draft
                    response = await suratService.createDraftSuratHasil(
                        resolvedParams.id,
                        {
                            documentType: suratType === "SURAT_TUGAS_TABEL" ? "SURAT_TUGAS_TABEL" : suratType,
                            signatories,
                            tembusan: tembusanList,
                            content,
                        }
                    );
                }
            }

            if (response.success) {
                toast.success(isEditMode ? "Draft surat berhasil diperbarui" : "Draft surat berhasil dibuat");
                router.push(`/detail/${resolvedParams.id}`);
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
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Data Pelaksana</CardTitle>
                                        <CardDescription>Tambahkan daftar orang yang akan ditugaskan</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {suratTugasTabelForm.pelaksana.map((p, index) => (
                                            <div key={p.key} className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input
                                                            value={p.nama}
                                                            onChange={(e) => updatePelaksana(p.key, "nama", e.target.value)}
                                                            placeholder="Nama"
                                                        />
                                                        <Input
                                                            value={p.nimNip}
                                                            onChange={(e) => updatePelaksana(p.key, "nimNip", e.target.value)}
                                                            placeholder="NIM/NIP"
                                                        />
                                                    </div>
                                                    <Input
                                                        value={p.jabatan || ""}
                                                        onChange={(e) => updatePelaksana(p.key, "jabatan", e.target.value)}
                                                        placeholder="Jabatan (opsional)"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removePelaksana(p.key)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
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
                                            <Label htmlFor="nomorSurat">Nomor Surat <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nomorSurat"
                                                value={suratKeputusanForm.nomorSurat}
                                                onChange={(e) => updateSuratKeputusan("nomorSurat", e.target.value)}
                                                placeholder="363/UN7.F8/HK/IX/2025"
                                            />
                                        </div>
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

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Penandatangan</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="namaPejabat">Nama Pejabat</Label>
                                            <Input
                                                id="namaPejabat"
                                                value={suratKeputusanForm.namaPejabat}
                                                onChange={(e) => updateSuratKeputusan("namaPejabat", e.target.value)}
                                                placeholder="Nama pejabat penandatangan"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nipPejabat">NIP Pejabat</Label>
                                            <Input
                                                id="nipPejabat"
                                                value={suratKeputusanForm.nipPejabat}
                                                onChange={(e) => updateSuratKeputusan("nipPejabat", e.target.value)}
                                                placeholder="NIP. 197403171998021001"
                                            />
                                        </div>
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
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        {suratType === "SURAT_PENGANTAR" 
                                            ? "Penanda tangan default berdasarkan pilihan pengaju. Anda dapat mengubah konfigurasi jika diperlukan."
                                            : "Surat akan diverifikasi secara berurutan sebelum ditandatangani."}
                                    </AlertDescription>
                                </Alert>

                                {signers.map((signer, index) => (
                                    <div key={signer.id} className="space-y-2 p-3 bg-white rounded-lg border">
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
                                                    {(suratType === "SURAT_PENGANTAR" ? SURAT_PENGANTAR_ROLES : ALL_SIGNER_ROLES).map((role) => (
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
                                        {/* Input Awalan/Prefix */}
                                        <div className="ml-11">
                                            <Input
                                                placeholder="Awalan (opsional), contoh: Mengetahui,"
                                                value={signer.prefix || ""}
                                                onChange={(e) => updateSignerPrefix(signer.id, e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {signers.length < (suratType === "SURAT_PENGANTAR" ? SURAT_PENGANTAR_ROLES : ALL_SIGNER_ROLES).length && (
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
                                        Pengaju akan mendapat salinan surat yang sudah jadi
                                    </p>
                                </div>
                                <Badge variant="secondary">Disarankan</Badge>
                            </div>

                            <Separator />

                            {tembusan.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tembusan Tambahan</Label>
                                    {tembusan.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs">
                                                {index + 1}
                                            </div>
                                            <span className="flex-1 text-sm">{item.value}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeTembusan(item.id)}
                                                className="text-destructive hover:text-destructive h-8 w-8"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="new-tembusan" className="text-sm font-medium">
                                    Tambah Tembusan
                                </Label>
                                <div className="flex gap-2">
                                    <Textarea
                                        id="new-tembusan"
                                        placeholder="Masukkan nama/jabatan tembusan..."
                                        value={newTembusanText}
                                        onChange={(e) => setNewTembusanText(e.target.value)}
                                        rows={2}
                                        className="flex-1"
                                    />
                                    <Button onClick={addTembusan} className="self-end">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tambah
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Review */}
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
                                        Tembusan ({(includePengaju ? 1 : 0) + tembusan.length})
                                    </Label>
                                    <div className="space-y-2">
                                        {includePengaju && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <Users className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium">Pengaju Surat</span>
                                            </div>
                                        )}
                                        {tembusan.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                                            >
                                                <Users className="w-5 h-5 text-zinc-400" />
                                                <span>{item.value}</span>
                                            </div>
                                        ))}
                                        {!includePengaju && tembusan.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">
                                                Tidak ada tembusan
                                            </p>
                                        )}
                                    </div>
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
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                Setelah draft dibuat, surat akan melalui alur verifikasi sebelum ditandatangani.
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
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Buat Draft Surat
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
