"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BottomNav from "@/components/layout/bottom-nav";
import { suratService } from "@/services/surat.service";

// ============================================================================
// TYPES
// ============================================================================

type SuratHasilType = "SURAT_TUGAS" | "SURAT_KEPUTUSAN";

interface SignerItem {
    id: string;
    role: string;
    order: number;
    isRequired: boolean;
}

interface TembusanItem {
    id: string;
    type: "TEXT" | "USER";
    value: string;
    label?: string;
}

type Step = "signature" | "tembusan" | "review";

// ============================================================================
// CONSTANTS
// ============================================================================

const SIGNER_ROLES = [
    { value: "DEKAN", label: "Dekan" },
    { value: "WADEK_1", label: "Wakil Dekan I" },
    { value: "WADEK_2", label: "Wakil Dekan II" },
];

const VERIFICATION_FLOW = {
    AKADEMIK: ["STAF_AKADEMIK", "SUPERVISOR_AKADEMIK", "MANAJER_TU", "WADEK_1", "DEKAN"],
    SUMBER_DAYA: ["STAF_SUMBER_DAYA", "SUPERVISOR_SUMBER_DAYA", "MANAJER_TU", "WADEK_2", "DEKAN"],
    UMUM: ["STAF_AKADEMIK", "SUPERVISOR_AKADEMIK", "MANAJER_TU", "WADEK_1", "WADEK_2", "DEKAN"],
};

const ROLE_LABELS: Record<string, string> = {
    DEKAN: "Dekan",
    WADEK_1: "Wakil Dekan I",
    WADEK_2: "Wakil Dekan II",
    MANAJER_TU: "Manajer Tata Usaha",
    SUPERVISOR_AKADEMIK: "Supervisor Akademik",
    SUPERVISOR_SUMBER_DAYA: "Supervisor Sumber Daya",
    STAF_AKADEMIK: "Staf Akademik",
    STAF_SUMBER_DAYA: "Staf Sumber Daya",
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DraftSuratPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get type from query params
    const suratType = searchParams.get("type") as SuratHasilType | null;
    
    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>("signature");
    
    // Signature state
    const [signers, setSigners] = useState<SignerItem[]>([
        { id: "1", role: "DEKAN", order: 1, isRequired: true }
    ]);
    
    // Tembusan state
    const [tembusan, setTembusan] = useState<TembusanItem[]>([]);
    const [newTembusanText, setNewTembusanText] = useState("");
    const [includePengaju, setIncludePengaju] = useState(true);

    // Redirect if no type specified
    useEffect(() => {
        if (!suratType) {
            toast.error("Jenis surat tidak ditemukan");
            router.back();
        }
    }, [suratType, router]);

    // ========================================================================
    // SIGNATURE HANDLERS
    // ========================================================================

    const addSigner = () => {
        const newId = String(signers.length + 1);
        const newOrder = signers.length + 1;
        setSigners([...signers, { id: newId, role: "", order: newOrder, isRequired: true }]);
    };

    const removeSigner = (id: string) => {
        if (signers.length <= 1) {
            toast.error("Minimal harus ada 1 penanda tangan");
            return;
        }
        const filtered = signers.filter(s => s.id !== id);
        // Re-order
        const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
        setSigners(reordered);
    };

    const updateSignerRole = (id: string, role: string) => {
        setSigners(signers.map(s => s.id === id ? { ...s, role } : s));
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
    // NAVIGATION
    // ========================================================================

    const goToNextStep = () => {
        if (currentStep === "signature") {
            // Validate signers
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
        if (currentStep === "tembusan") {
            setCurrentStep("signature");
        } else if (currentStep === "review") {
            setCurrentStep("tembusan");
        }
    };

    // ========================================================================
    // SUBMIT
    // ========================================================================

    const handleSubmit = async () => {
        if (!suratType) return;
        
        setSubmitting(true);
        try {
            // Build signatories array for API
            const signatories = signers.map(s => ({
                signerRole: s.role,
                signerName: SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                signerNip: "", // Will be filled by backend based on user data
                order: s.order
            }));

            // Build tembusan array
            const tembusanList: string[] = [];
            if (includePengaju) {
                tembusanList.push("Pengaju");
            }
            tembusan.forEach(t => {
                tembusanList.push(t.value);
            });

            const response = await suratService.createDraftSuratHasil(
                resolvedParams.id,
                {
                    documentType: suratType,
                    signatories,
                    tembusan: tembusanList,
                    content: {}, // Empty for now, can be enhanced later
                }
            );

            if (response.success) {
                toast.success("Draft surat berhasil dibuat");
                router.push(`/detail/${resolvedParams.id}`);
            } else {
                toast.error(response.message || "Gagal membuat draft surat");
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

    const steps = [
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
                <h1 className="text-2xl font-bold text-black">
                    Draft {suratType === "SURAT_TUGAS" ? "Surat Tugas" : "Surat Keputusan"}
                </h1>
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
                {/* Step 1: Signature Configuration */}
                {currentStep === "signature" && (
                    <Card className="bg-neutral-50 border-zinc-400">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <PenTool className="w-5 h-5" />
                                Konfigurasi Tanda Tangan
                            </CardTitle>
                            <CardDescription>
                                Pilih pejabat yang akan menandatangani surat ini. Urutan menentukan alur tanda tangan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Surat akan diverifikasi secara berurutan dari Staf → Supervisor → Manajer TU → Wakil Dekan → Dekan sebelum ditandatangani.
                                </AlertDescription>
                            </Alert>

                            {signers.map((signer, index) => (
                                <div key={signer.id} className="flex items-center gap-3">
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
                                            {SIGNER_ROLES.map((role) => (
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
                            ))}

                            {signers.length < SIGNER_ROLES.length && (
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
                )}

                {/* Step 2: Tembusan Configuration */}
                {currentStep === "tembusan" && (
                    <Card className="bg-neutral-50 border-zinc-400">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Konfigurasi Tembusan
                            </CardTitle>
                            <CardDescription>
                                Tentukan siapa saja yang akan menerima tembusan surat ini. Tembusan bersifat opsional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Default: Pengaju */}
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

                            {/* Added Tembusan List */}
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

                            {/* Add Tembusan */}
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

                {/* Step 3: Review */}
                {currentStep === "review" && (
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <Card className="bg-neutral-50 border-zinc-400">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Ringkasan Draft Surat
                                </CardTitle>
                                <CardDescription>
                                    Periksa kembali konfigurasi sebelum membuat draft surat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Jenis Surat */}
                                <div>
                                    <Label className="text-sm text-muted-foreground">Jenis Surat</Label>
                                    <p className="font-medium">
                                        {suratType === "SURAT_TUGAS" ? "Surat Tugas (ST)" : "Surat Keputusan (SK)"}
                                    </p>
                                </div>

                                <Separator />

                                {/* Penanda Tangan */}
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
                                                        {SIGNER_ROLES.find(r => r.value === signer.role)?.label || signer.role}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Urutan tanda tangan ke-{signer.order}
                                                    </p>
                                                </div>
                                                <Badge>Wajib TTD</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Tembusan */}
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
                            </CardContent>
                        </Card>

                        {/* Verification Flow Info */}
                        <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <strong>Alur Verifikasi:</strong> Setelah draft dibuat, surat akan diverifikasi secara berurutan dari Staf → Supervisor → Manajer TU → Wakil Dekan → Dekan sebelum ditandatangani oleh pejabat yang dipilih.
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
                        onClick={currentStep === "signature" ? () => router.back() : goToPrevStep}
                        className="border-zinc-800 text-zinc-800 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {currentStep === "signature" ? "Batal" : "Kembali"}
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
