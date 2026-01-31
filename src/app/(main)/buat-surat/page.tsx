"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Suspense } from "react";

// ============================================================================
// TYPES
// ============================================================================

type SuratType = "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN";
type Category = "AKADEMIK" | "SUMBER_DAYA" | "UMUM";

interface SignerItem {
    id: string;
    role: string;
    order: number;
    isRequired: boolean;
    name?: string;
    nip?: string;
    prefix?: string;
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

// Form data types
interface SuratTugasForm {
    jenisSuratText: string;
    namaLengkap: string;
    nimNip: string;
    programStudi: string;
    keperluan: string;
    judulSurat: string;
}

interface SuratTugasTabelForm {
    jenisSuratText: string;
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

const ALL_SIGNER_ROLES = [
    { value: "KAPRODI", label: "Ketua Prodi" },
    { value: "KADEP", label: "Ketua Departemen" },
    { value: "DEKAN", label: "Dekan" },
    { value: "WADEK_1", label: "Wakil Dekan I" },
    { value: "WADEK_2", label: "Wakil Dekan II" },
];

const SURAT_TYPE_LABELS: Record<SuratType, string> = {
    SURAT_TUGAS: "Surat Tugas",
    SURAT_TUGAS_TABEL: "Surat Tugas (Tabel)",
    SURAT_KEPUTUSAN: "Surat Keputusan",
};

const CATEGORY_LABELS: Record<Category, string> = {
    AKADEMIK: "Akademik",
    SUMBER_DAYA: "Sumber Daya",
    UMUM: "Umum",
};

// Map URL params to internal types
const TYPE_MAP: Record<string, SuratType> = {
    'surat-tugas': 'SURAT_TUGAS',
    'surat-tugas-table': 'SURAT_TUGAS_TABEL',
    'surat-keputusan': 'SURAT_KEPUTUSAN',
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function BuatSuratContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get params from URL
    const categoryParam = searchParams.get("category") as Category | null;
    const typeParam = searchParams.get("type");
    const suratType = typeParam ? TYPE_MAP[typeParam] : null;
    
    // State
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>("form");
    
    // Form states
    const [suratTugasForm, setSuratTugasForm] = useState<SuratTugasForm>({
        jenisSuratText: "SURAT TUGAS",
        namaLengkap: "",
        nimNip: "",
        programStudi: "",
        keperluan: "",
        judulSurat: "",
    });

    const [suratTugasTabelForm, setSuratTugasTabelForm] = useState<SuratTugasTabelForm>({
        jenisSuratText: "SURAT TUGAS",
        keperluan: "",
        judulSurat: "",
        pelaksana: [{ key: "1", nama: "", nimNip: "", jabatan: "" }],
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
    
    // Signature state
    const [signers, setSigners] = useState<SignerItem[]>([
        { 
            id: "1", 
            role: "DEKAN", 
            order: 1, 
            isRequired: true,
            name: "",
            nip: "",
        }
    ]);
    
    // Tembusan state
    const [tembusan, setTembusan] = useState<TembusanItem[]>([]);
    const [newTembusanText, setNewTembusanText] = useState("");

    // Redirect if no valid params
    useEffect(() => {
        if (!categoryParam || !suratType || (categoryParam !== 'AKADEMIK' && categoryParam !== 'SUMBER_DAYA' && categoryParam !== 'UMUM')) {
            toast.error("Parameter tidak valid");
            router.push("/dashboard");
        }
    }, [categoryParam, suratType, router]);

    // ========================================================================
    // FORM HANDLERS
    // ========================================================================

    const updateSuratTugas = (field: keyof SuratTugasForm, value: string) => {
        setSuratTugasForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratTugasTabel = (field: keyof SuratTugasTabelForm, value: string | PelaksanaItem[]) => {
        setSuratTugasTabelForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratKeputusan = (field: keyof SuratKeputusanForm, value: string | string[] | KeputusanItem[]) => {
        setSuratKeputusanForm(prev => ({ ...prev, [field]: value }));
    };

    // Pelaksana handlers
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

    // Menimbang/Mengingat handlers
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

    // Keputusan handlers
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
        if (suratType === "SURAT_TUGAS") {
            const required = ["namaLengkap", "nimNip", "keperluan"] as const;
            const missing = required.filter(field => !suratTugasForm[field].trim());
            if (missing.length > 0) {
                toast.error("Lengkapi semua field yang wajib diisi");
                return false;
            }
        } else if (suratType === "SURAT_TUGAS_TABEL") {
            if (!suratTugasTabelForm.keperluan) {
                toast.error("Lengkapi keperluan surat");
                return false;
            }
            if (suratTugasTabelForm.pelaksana.length === 0) {
                toast.error("Tambahkan minimal 1 pelaksana");
                return false;
            }
            const emptyPelaksana = suratTugasTabelForm.pelaksana.some(p => !p.nama.trim() || !p.nimNip.trim());
            if (emptyPelaksana) {
                toast.error("Lengkapi data semua pelaksana");
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
            setCurrentStep("tembusan");
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
            setCurrentStep("tembusan");
        }
    };

    // ========================================================================
    // SUBMIT
    // ========================================================================

    const handleSubmit = async () => {
        if (!suratType || !categoryParam || (categoryParam !== 'AKADEMIK' && categoryParam !== 'SUMBER_DAYA')) {
            toast.error("Kategori tidak valid");
            return;
        }
        
        setSubmitting(true);
        try {
            let content: Record<string, unknown> = {};
            
            if (suratType === "SURAT_TUGAS") {
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

            // Build signatories
            const SIGNER_HIERARCHY: Record<string, number> = {
                'WADEK_2': 1,
                'WADEK_1': 2,
                'DEKAN': 3,
            };

            const signatories = signers
                .map(s => ({
                    signerRole: s.role,
                    signerName: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                    signerNip: s.nip || "",
                    prefix: s.prefix || "",
                    hierarchyOrder: SIGNER_HIERARCHY[s.role] ?? 99,
                }))
                .sort((a, b) => a.hierarchyOrder - b.hierarchyOrder)
                .map((s, idx) => ({
                    ...s,
                    order: idx + 1
                }));

            // Build tembusan
            const tembusanList: string[] = [];
            tembusan.forEach(t => {
                tembusanList.push(t.value);
            });

            // Create the surat using staff API - cast to ensure valid category
            const response = await suratService.createStaffSurat({
                category: categoryParam as 'AKADEMIK' | 'SUMBER_DAYA',
                documentType: suratType,
                signatories,
                tembusan: tembusanList,
                content,
            });

            if (response.success) {
                toast.success("Surat berhasil dibuat");
                router.push(`/detail/${response.data?.id || ''}`);
            } else {
                toast.error(response.message || "Gagal membuat surat");
            }
        } catch (error) {
            console.error("Submit failed:", error);
            toast.error("Gagal membuat surat");
        } finally {
            setSubmitting(false);
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    if (!suratType || !categoryParam) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const steps = [
        { key: "form", label: "Formulir", icon: ClipboardList },
        { key: "signature", label: "Tanda Tangan", icon: PenTool },
        { key: "tembusan", label: "Tembusan", icon: Users },
        { key: "review", label: "Review", icon: CheckCircle },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <>
            {/* Page Title */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
                <div>
                    <h1 className="text-2xl font-bold text-black">
                        Buat {SURAT_TYPE_LABELS[suratType]}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kategori: {CATEGORY_LABELS[categoryParam]}
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = step.key === currentStep;
                        const isCompleted = index < currentStepIndex;
                        
                        return (
                            <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
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
                                            "text-sm font-medium",
                                            isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-zinc-500"
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "h-0.5 flex-1 mx-2 mb-6",
                                            index < currentStepIndex ? "bg-emerald-600" : "bg-zinc-200"
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="pb-24">
                {/* Step 1: Form */}
                {currentStep === "form" && (
                    <div className="space-y-6">
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
                                            <Label htmlFor="nimNip">NIM/NIP <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nimNip"
                                                value={suratTugasForm.nimNip}
                                                onChange={(e) => updateSuratTugas("nimNip", e.target.value)}
                                                placeholder="NIM atau NIP"
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
                                                {suratTugasTabelForm.pelaksana.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removePelaksana(p.key)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
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
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Surat akan diverifikasi secara berurutan sebelum ditandatangani.
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
                                                    {ALL_SIGNER_ROLES.map((role) => (
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

                                {signers.length < ALL_SIGNER_ROLES.length && (
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

                        {/* Template Preview with Signatures */}
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
                                    suratType={suratType}
                                    signers={signers.map(s => ({
                                        id: s.id,
                                        role: s.role,
                                        name: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                                        nip: s.nip,
                                        prefix: s.prefix
                                    }))}
                                    formData={
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
                            {tembusan.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tembusan</Label>
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
                                    Ringkasan Surat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Jenis Surat</Label>
                                        <p className="font-medium">{SURAT_TYPE_LABELS[suratType]}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Kategori</Label>
                                        <p className="font-medium">{CATEGORY_LABELS[categoryParam]}</p>
                                    </div>
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
                                        Tembusan ({tembusan.length})
                                    </Label>
                                    <div className="space-y-2">
                                        {tembusan.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                                            >
                                                <Users className="w-5 h-5 text-zinc-400" />
                                                <span>{item.value}</span>
                                            </div>
                                        ))}
                                        {tembusan.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">
                                                Tidak ada tembusan
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Template Preview */}
                                <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                        Preview Surat
                                    </Label>
                                    <TemplatePreview
                                        suratType={suratType}
                                        signers={signers.map(s => ({
                                            id: s.id,
                                            role: s.role,
                                            name: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                                            nip: s.nip,
                                            prefix: s.prefix
                                        }))}
                                        formData={
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
                                Setelah surat dibuat, surat akan melalui alur verifikasi sebelum ditandatangani.
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
                        onClick={currentStep === "form" ? () => router.push("/dashboard") : goToPrevStep}
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
                            Buat Surat
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

export default function BuatSuratPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <BuatSuratContent />
        </Suspense>
    );
}
