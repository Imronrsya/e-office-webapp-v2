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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Plus,
    Trash2,
    PenTool,
    Users,
    User,
    Info,
    FileText,
    CheckCircle,
    ClipboardList,
    Search,
    Paperclip,
    Upload,
    X,
    Image,
    File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BottomNav from "@/components/layout/bottom-nav";
import { Checkbox } from "@/components/ui/checkbox";
import { suratService } from "@/services/surat.service";
// Universal Preview - Single Source of Truth
import { TemplatePreview } from "@/components/universal-preview";
import { Suspense } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getPostDraftRedirectPath } from "@/lib/role-mapper";

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
    tanggalMulai: string;
    tanggalSelesai: string;
    keperluan: string;
    judulSurat: string;
    pelaksana: PelaksanaItem[];
    customColumns: CustomColumn[];
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
const getFilteredRolesByCategory = (category: Category | null) => {
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
    const { user } = useAuth();
    
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
        tanggalMulai: "",
        tanggalSelesai: "",
        keperluan: "",
        judulSurat: "",
        pelaksana: [{ key: "1", nama: "", nim: "", prodi: "" }],
        customColumns: [],
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
            id: String(Date.now()), 
            role: "", // Empty - user MUST select manually
            order: 1, 
            isRequired: true,
            name: "",
            nip: "",
        }
    ]);
    
    // Tembusan state - Separated system
    const [tembusanUsers, setTembusanUsers] = useState<TembusanUser[]>([]);
    const [tembusanTexts, setTembusanTexts] = useState<TembusanText[]>([]);
    const [includePengaju, setIncludePengaju] = useState(true);
    const [newTembusanTextInput, setNewTembusanTextInput] = useState("");
    
    // User search for tembusan
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<import('@/services/user.service').TembusanUser[]>([]);
    const [showUserResults, setShowUserResults] = useState(false);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    
    // Attachment state - untuk file PDF/JPG/PNG yang diupload
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    // Pejabat list for autofill nama dan NIP
    const [pejabatList, setPejabatList] = useState<Array<{ role: string; name: string; nip?: string }>>([]);

    // Redirect if no valid params
    useEffect(() => {
        if (!categoryParam || !suratType || (categoryParam !== 'AKADEMIK' && categoryParam !== 'SUMBER_DAYA' && categoryParam !== 'UMUM')) {
            toast.error("Parameter tidak valid");
            router.push("/dashboard");
        }
    }, [categoryParam, suratType, router]);

    // Fetch pejabat list for autofill
    useEffect(() => {
        async function loadPejabatList() {
            try {
                console.log('📡 Fetching pejabat list...');
                const result = await suratService.getPejabatList();
                console.log('📦 Pejabat List Response:', result);
                if (result.success && result.data) {
                    setPejabatList(result.data);
                    console.log('✅ Pejabat list loaded:', result.data);
                } else {
                    console.error('❌ Failed to load pejabat list:', result);
                }
            } catch (error) {
                console.error('❌ Error loading pejabat list:', error);
            }
        }
        loadPejabatList();
    }, []);


    // ========================================================================
    // FORM HANDLERS
    // ========================================================================

    const updateSuratTugas = (field: keyof SuratTugasForm, value: string) => {
        setSuratTugasForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratTugasTabel = (field: keyof SuratTugasTabelForm, value: string | PelaksanaItem[] | CustomColumn[]) => {
        setSuratTugasTabelForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSuratKeputusan = (field: keyof SuratKeputusanForm, value: string | string[] | KeputusanItem[]) => {
        setSuratKeputusanForm(prev => ({ ...prev, [field]: value }));
    };

    // Pelaksana handlers
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
        
        console.log('🔍 Autofill Debug:', {
            selectedRole: role,
            pejabatList: pejabatList,
            foundPejabat: pejabat,
            willFillName: pejabat?.name || roleLabel,
            willFillNip: pejabat?.nip || ""
        });
        
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

    // Add text tembusan (for PDF)
    const addTembusanText = () => {
        if (!newTembusanTextInput.trim()) {
            toast.error("Masukkan text tembusan");
            return;
        }
        const newId = String(Date.now());
        setTembusanTexts([...tembusanTexts, { 
            id: newId, 
            text: newTembusanTextInput.trim() 
        }]);
        setNewTembusanTextInput("");
    };

    const removeTembusanText = (id: string) => {
        setTembusanTexts(tembusanTexts.filter(t => t.id !== id));
    };

    // Remove user tembusan (for system access)
    const removeTembusanUser = (userId: string) => {
        setTembusanUsers(tembusanUsers.filter(u => u.userId !== userId));
    };

    // User search effect
    useEffect(() => {
        const searchUsers = async () => {
            if (userSearchQuery.length < 2) {
                setUserSearchResults([]);
                return;
            }
            
            setIsSearchingUsers(true);
            try {
                const { userService } = await import('@/services/user.service');
                const response = await userService.searchUsers(userSearchQuery);
                const results = response.data || [];
                // Filter out already selected users
                const selectedUserIds = new Set(tembusanUsers.map(u => u.userId));
                setUserSearchResults(results.filter(u => !selectedUserIds.has(u.id)));
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setIsSearchingUsers(false);
            }
        };
        
        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [userSearchQuery, tembusanUsers]);

    const handleSelectUser = (user: import('@/services/user.service').TembusanUser) => {
        const newUser: TembusanUser = {
            userId: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            description: user.type === 'mahasiswa' 
                ? `${user.identifier} • ${user.programStudi || 'Mahasiswa'}`
                : `NIP: ${user.identifier} • ${user.jabatan || 'Pegawai'}`
        };
        setTembusanUsers([...tembusanUsers, newUser]);
        setUserSearchQuery("");
        setShowUserResults(false);
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
            if (!suratTugasTabelForm.tanggalMulai || !suratTugasTabelForm.tanggalSelesai) {
                toast.error("Lengkapi tanggal mulai dan selesai tugas");
                return false;
            }
            if (suratTugasTabelForm.pelaksana.length === 0) {
                toast.error("Tambahkan minimal 1 pelaksana");
                return false;
            }
            const emptyPelaksana = suratTugasTabelForm.pelaksana.some(p => !p.nama.trim() || !p.nim.trim() || !p.prodi.trim());
            if (emptyPelaksana) {
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
            setCurrentStep("tembusan");
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
            setCurrentStep("tembusan");
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

            if (file.type.startsWith('image/')) {
                newItem.previewUrl = URL.createObjectURL(file);
            }

            newAttachments.push(newItem);
        });

        setAttachments(prev => [...prev, ...newAttachments]);
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

    // Submit handler - untuk semua kategori termasuk UMUM
    // Supervisor selection untuk UMUM dilakukan saat "Ajukan Verifikasi" di halaman detail
    const handleSubmit = async () => {
        if (!suratType || !categoryParam || (categoryParam !== 'AKADEMIK' && categoryParam !== 'SUMBER_DAYA' && categoryParam !== 'UMUM')) {
            toast.error("Kategori tidak valid");
            return;
        }
        
        // Langsung submit untuk semua kategori (termasuk UMUM)
        await doSubmit();
    };
    
    // Fungsi submit yang sebenarnya
    const doSubmit = async () => {
        if (!suratType || !categoryParam) return;
        
        setSubmitting(true);
        try {
            let content: Record<string, unknown> = {};
            
            if (suratType === "SURAT_TUGAS") {
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

            // Build tembusan texts (for PDF) - NOT including pengaju
            const tembusanTextsList: string[] = [];
            tembusanTexts.forEach(t => {
                tembusanTextsList.push(t.text);
            });

            // Build tembusan users (for system access)
            const tembusanUsersList = tembusanUsers.map(u => ({
                userId: u.userId,
                name: u.name,
                email: u.email,
            }));

            // Extract perihal/judul from form
            let perihal = '';
            if (suratType === "SURAT_TUGAS") {
                perihal = suratTugasForm.judulSurat || suratTugasForm.keperluan || 'Surat Tugas';
            } else if (suratType === "SURAT_TUGAS_TABEL") {
                perihal = suratTugasTabelForm.judulSurat || suratTugasTabelForm.keperluan || 'Surat Tugas';
            } else if (suratType === "SURAT_KEPUTUSAN") {
                perihal = suratKeputusanForm.tentang || 'Surat Keputusan';
            }

            // Create the surat using staff API - cast to ensure valid category
            const response = await suratService.createStaffSurat({
                category: categoryParam as 'AKADEMIK' | 'SUMBER_DAYA' | 'UMUM',
                documentType: suratType,
                signatories,
                tembusan: tembusanTextsList,
                tembusanUsers: tembusanUsersList,
                includePengaju,
                content,
                perihal,
            });

            if (response.success) {
                // Upload attachments jika ada
                const documentId = (response.data as any)?.documentId;
                if (attachments.length > 0 && documentId) {
                    try {
                        setIsUploadingAttachment(true);
                        const filesToUpload = attachments.map(a => a.file);
                        await suratService.uploadAttachments(documentId, filesToUpload);
                        toast.success(`${filesToUpload.length} lampiran berhasil diupload`);
                    } catch (attachmentError) {
                        console.error("Failed to upload attachments:", attachmentError);
                        toast.error("Lampiran gagal diupload, tetapi surat berhasil dibuat");
                    } finally {
                        setIsUploadingAttachment(false);
                    }
                }
                
                toast.success("Surat berhasil dibuat");
                // Redirect berdasarkan role: Admin Prodi -> Dashboard, Staff -> Surat Keluar
                const redirectPath = user?.role ? getPostDraftRedirectPath(user.role) : '/dashboard';
                router.push(redirectPath);
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
        { key: "attachments", label: "Lampiran", icon: Paperclip },
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
                                                            {suratTugasTabelForm.pelaksana.length > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removePelaksana(p.key)}
                                                                    className="text-destructive hover:text-destructive h-8 w-8"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            {suratTugasTabelForm.pelaksana.length <= 1 && <div></div>}
                                                        </div>
                                                    </div>
                                                ))}
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
                                {categoryParam && (
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-900">
                                            <strong>Kategori Surat: {CATEGORY_LABELS[categoryParam]}</strong>
                                            <br />
                                            {categoryParam === "AKADEMIK" && "Pejabat yang dapat menandatangani: Wakil Dekan I dan Dekan"}
                                            {categoryParam === "SUMBER_DAYA" && "Pejabat yang dapat menandatangani: Wakil Dekan II dan Dekan"}
                                            {categoryParam === "UMUM" && "Pejabat yang dapat menandatangani: Wakil Dekan I, Wakil Dekan II, dan Dekan"}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Surat akan diverifikasi secara berurutan sebelum ditandatangani.
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
                                                    {/* Filter pejabat berdasarkan kategori surat */}
                                                    {getFilteredRolesByCategory(categoryParam).map((role) => (
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

                                {signers.length < SURAT_FAKULTAS_ROLES.length && (
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
                            {/* Pengaju Checkbox */}
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
                                    • <strong>Pengaju</strong>: Dapat akses download surat, tidak tertulis di PDF<br/>
                                    • <strong>Akun Sistem (Biru)</strong>: Dapat akses download surat, tidak tertulis di PDF<br/>
                                    • <strong>Text Tertulis (Hijau)</strong>: Tertulis di surat, tidak dapat akses sistem
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

                            {attachments.length === 0 && (
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
                                        Tembusan ({(includePengaju ? 1 : 0) + tembusanTexts.length + tembusanUsers.length} akses sistem)
                                    </Label>
                                    <div className="space-y-2">
                                        {includePengaju && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <User className="w-5 h-5 text-blue-600" />
                                                <span className="flex-1">Pengaju Surat</span>
                                                <Badge variant="secondary" className="text-xs">Akses Sistem</Badge>
                                            </div>
                                        )}
                                        {tembusanUsers.map((user) => (
                                            <div
                                                key={user.userId}
                                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                                            >
                                                <User className="w-5 h-5 text-blue-600" />
                                                <span className="flex-1">{user.name}</span>
                                                <Badge variant="secondary" className="text-xs">Akses Sistem</Badge>
                                            </div>
                                        ))}
                                        {tembusanTexts.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                                            >
                                                <FileText className="w-5 h-5 text-green-600" />
                                                <span className="flex-1">{item.text}</span>
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
                                        tembusan={tembusanTexts.map(t => ({ name: t.text }))}
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
                        onClick={currentStep === "form" ? () => {
                            const redirectPath = user?.role ? getPostDraftRedirectPath(user.role) : '/dashboard';
                            router.push(redirectPath);
                        } : goToPrevStep}
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
