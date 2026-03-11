"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    Image,
    CheckCircle,
    ClipboardList,
    Search,
    Paperclip,
    Upload,
    X,
    File,
    Scale,
    BookOpen,
    Eye,
    FileCheck,
    ListChecks,
    ChevronsUpDown,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BottomNav from "@/components/layout/bottom-nav";
import { Checkbox } from "@/components/ui/checkbox";
import { suratService } from "@/services/surat.service";
import { getProdiList } from "@/services/masterData.service";
import { DatePicker } from "@/components/ui/date-picker";
import { format as formatDate } from "date-fns";
import { id as idLocale } from "date-fns/locale";
// Universal Preview - Single Source of Truth
import { TemplatePreview } from "@/components/universal-preview";
import { Suspense } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getPostDraftRedirectPath, getRoleScope } from "@/lib/role-mapper";
import { FileUpload } from "@/features/pengajuan/components/file-upload";
import { Stepper } from "@/components/ui/stepper";

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
    // Editable column labels (defaults: Nama, NIM, PRODI)
    namaLabel: string;
    nimLabel: string;
    prodiLabel: string;
}

interface SuratKeputusanForm {
    nomorSurat: string;
    tentang: string;
    menimbang: string[];
    mengingat: string[];
    memperhatikan?: string[];
    keputusan: KeputusanItem[];
    tanggalDitetapkan: Date | undefined;
    namaPejabat: string;
    nipPejabat: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Program Studi list for FSM UNDIP (now fetched dynamically)

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
    const isFaculty = getRoleScope(user?.role || '') === 'FAKULTAS';

    // Get params from URL
    // Transform category from URL
    const categoryParam = searchParams?.get("category") as Category | null;
    const typeParam = searchParams?.get("type");
    const suratType = typeParam ? TYPE_MAP[typeParam] : null;

    // Leave Confirmation State
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    // Submit Confirmation State
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Form Navigation States
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
        namaLabel: "Nama",
        nimLabel: "NIM",
        prodiLabel: "Prodi",
    });

    const [suratKeputusanForm, setSuratKeputusanForm] = useState<SuratKeputusanForm>({
        nomorSurat: "",
        tentang: "",
        menimbang: [""],
        mengingat: [""],
        keputusan: [{ key: "1", label: "KESATU", content: "" }],
        tanggalDitetapkan: undefined,
        namaPejabat: "",
        nipPejabat: "",
    });

    // Perihal/Judul Surat input - separate from content fields
    // This maps to LetterDocument.perihal for dashboard/detail display
    const [perihalInput, setPerihalInput] = useState("");

    // Track which fields have been touched (for showing inline errors)
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    // Derived dirty state to detect if user has inputted anything
    const isDirty = useMemo(() => {
        if (perihalInput.trim() !== "") return true;
        if (suratType === "SURAT_TUGAS") {
            if (suratTugasForm.namaLengkap.trim() !== "" || suratTugasForm.keperluan.trim() !== "" || suratTugasForm.nimNip.trim() !== "") return true;
        }
        if (suratType === "SURAT_TUGAS_TABEL") {
            if (suratTugasTabelForm.keperluan.trim() !== "" || (suratTugasTabelForm.pelaksana[0]?.nama && suratTugasTabelForm.pelaksana[0].nama.trim() !== "")) return true;
        }
        if (suratType === "SURAT_KEPUTUSAN") {
            if (suratKeputusanForm.tentang.trim() !== "" || (suratKeputusanForm.menimbang[0] && suratKeputusanForm.menimbang[0].trim() !== "")) return true;
        }
        return false;
    }, [perihalInput, suratTugasForm, suratTugasTabelForm, suratKeputusanForm, suratType]);

    // Handle client-side navigation clicks (Sidebar menu, etc)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as Element).closest("a");
            if (target && target.href && !target.hasAttribute("download") && target.target !== "_blank") {
                try {
                    const url = new URL(target.href);
                    // intercept only internal routing differences
                    if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
                        if (isDirty && !submitting) {
                            e.preventDefault(); // Stop Next.js Link
                            setPendingUrl(target.href);
                            setShowLeaveConfirm(true);
                        }
                    }
                } catch (err) {
                    // Ignore invalid URLs
                }
            }
        };
        // Capture phase to catch it before React / Next Link router
        document.addEventListener("click", handleClick, { capture: true });
        return () => document.removeEventListener("click", handleClick, { capture: true });
    }, [isDirty, submitting]);

    const handleConfirmLeave = () => {
        setShowLeaveConfirm(false);
        if (pendingUrl) {
            window.location.href = pendingUrl; // Force normal navigation to safely clear state
        }
    };

    // Program Studi combobox state
    const [prodiOpen, setProdiOpen] = useState(false);
    const [prodiSearch, setProdiSearch] = useState('');
    const prodiSearchRef = useRef<HTMLInputElement>(null);

    // Pejabat list for autofill nama dan NIP
    const [pejabatList, setPejabatList] = useState<Array<{ role: string; name: string; nip?: string }>>([]);

    // Program Studi list
    const [programStudiList, setProgramStudiList] = useState<string[]>([]);

    const filteredProdiList = programStudiList.filter((p) =>
        p.toLowerCase().includes(prodiSearch.toLowerCase())
    );

    useEffect(() => {
        if (prodiOpen) {
            setTimeout(() => prodiSearchRef.current?.focus(), 100);
        } else {
            setProdiSearch('');
        }
    }, [prodiOpen]);
    const markTouched = (field: string) => {
        setTouchedFields(prev => ({ ...prev, [field]: true }));
    };
    const markAllTouched = () => {
        setTouchedFields({
            perihalInput: true,
            namaLengkap: true,
            nimNip: true,
            keperluan: true,
            programStudi: true,
            judulTopik: true,
        });
    };
    const markAllSKTouched = () => {
        setTouchedFields({
            skPerihal: true,
            skTentang: true,
            skTanggal: true,
            skMenimbang: true,
            skMengingat: true,
            skMemperhatikan: true,
            skKeputusan: true,
        });
    };

    // Date state for Surat Tugas Tabel DatePicker components
    const [tanggalMulaiDate, setTanggalMulaiDate] = useState<Date | undefined>(undefined);
    const [tanggalSelesaiDate, setTanggalSelesaiDate] = useState<Date | undefined>(undefined);

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

    // Attachment state - using FileUpload component from pengajuan (clean implementation)
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

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

    // Fetch Program Studi list
    useEffect(() => {
        async function loadProdiList() {
            try {
                const prodis = await getProdiList();
                // Exclude 'Fakultas' from the dropdown options
                const validProdis = prodis.filter(p => !p.name.toLowerCase().includes('fakultas'));
                const formattedProdis = validProdis.map(p => {
                    const isProfesi = p.jenjang === 'PROFESI';
                    const hasJenjangInName = p.name.toLowerCase().includes(p.jenjang.toLowerCase()) || (isProfesi && p.name.toLowerCase().includes('profesi'));
                    const formatPrefix = isProfesi ? 'Profesi ' : `${p.jenjang} `;
                    return hasJenjangInName ? p.name : `${formatPrefix}${p.name}`;
                });
                setProgramStudiList(formattedProdis);
            } catch (error) {
                console.error('❌ Error loading prodi list:', error);
            }
        }
        loadProdiList();
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

    const updateSuratKeputusan = (field: keyof SuratKeputusanForm, value: string | string[] | KeputusanItem[] | Date | undefined) => {
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

    const addMemperhatikan = () => {
        setSuratKeputusanForm(prev => ({ ...prev, memperhatikan: [...(prev.memperhatikan || []), ""] }));
    };

    const updateMemperhatikan = (index: number, value: string) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            memperhatikan: (prev.memperhatikan || []).map((item, i) => i === index ? value : item)
        }));
    };

    const removeMemperhatikan = (index: number) => {
        setSuratKeputusanForm(prev => ({
            ...prev,
            memperhatikan: (prev.memperhatikan || []).filter((_, i) => i !== index)
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

        // Auto-set prefix: faculty scope → DEKAN=empty, others='a.n Dekan'; departemen scope → always empty
        const defaultPrefix = isFaculty ? (role === 'DEKAN' ? '' : 'a.n Dekan') : '';

        setSigners(signers.map(s => s.id === id ? {
            ...s,
            role,
            name: pejabat?.name || roleLabel,
            nip: pejabat?.nip || "",
            prefix: defaultPrefix
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
    // VALIDASI SURAT TUGAS (Single)
    // ========================================================================

    // Validasi Judul Surat (perihalInput) untuk ST - Required
    const getJudulSuratError = (judul: string): string => {
        if (!judul || judul.trim() === '') {
            return 'Judul Surat wajib diisi.';
        }
        return '';
    };

    // Validasi Nama Lengkap - Required
    const getNamaLengkapError = (nama: string): string => {
        if (!nama || nama.trim() === '') {
            return 'Nama Lengkap wajib diisi.';
        }
        return '';
    };

    // Validasi NIM/NIP - Required, hanya angka, harus 14 digit (NIM) atau 18 digit (NIP)
    const getNimNipError = (nimNip: string): string => {
        if (!nimNip || nimNip.trim() === '') {
            return 'NIM/NIP wajib diisi.';
        }
        if (!/^\d+$/.test(nimNip.trim())) {
            return 'NIM/NIP harus berupa angka.';
        }
        const len = nimNip.trim().length;
        if (len !== 14 && len !== 18) {
            return 'NIM/NIP harus 14 digit (NIM) atau 18 digit (NIP).';
        }
        return '';
    };

    // Validasi Keperluan - Required
    const getKeperluanError = (keperluan: string): string => {
        if (!keperluan || keperluan.trim() === '') {
            return 'Keperluan wajib diisi.';
        }
        return '';
    };

    // Hitung error ST secara langsung dari state
    const judulSuratError = suratType === "SURAT_TUGAS" ? getJudulSuratError(perihalInput) : '';
    const namaLengkapError = suratType === "SURAT_TUGAS" ? getNamaLengkapError(suratTugasForm.namaLengkap) : '';
    const nimNipError = suratType === "SURAT_TUGAS" ? getNimNipError(suratTugasForm.nimNip) : '';
    const keperluanSTError = suratType === "SURAT_TUGAS" ? getKeperluanError(suratTugasForm.keperluan) : '';

    // Validasi Program Studi - Required
    const getProgramStudiSTError = (prodi: string): string => {
        if (!prodi || prodi.trim() === '') {
            return 'Program Studi wajib diisi.';
        }
        return '';
    };
    const programStudiSTError = suratType === "SURAT_TUGAS" ? getProgramStudiSTError(suratTugasForm.programStudi) : '';

    // Validasi Judul/Topik Kegiatan - Required
    const getJudulTopikError = (judul: string): string => {
        if (!judul || judul.trim() === '') {
            return 'Judul/Topik Kegiatan wajib diisi.';
        }
        return '';
    };
    const judulTopikError = suratType === "SURAT_TUGAS" ? getJudulTopikError(suratTugasForm.judulSurat) : '';

    // ========================================================================
    // VALIDASI SURAT KEPUTUSAN
    // ========================================================================

    const getSKPerihalError = (val: string): string => {
        if (!val || val.trim() === '') return 'Judul Surat wajib diisi.';
        return '';
    };
    const getSKTentangError = (val: string): string => {
        if (!val || val.trim() === '') return 'Tentang wajib diisi.';
        return '';
    };

    const getSKMenimbangError = (items: string[]): string => {
        if (items.filter(m => m.trim()).length === 0) return 'Menimbang wajib diisi (minimal 1 item).';
        const emptyIdx = items.findIndex(m => !m.trim());
        if (emptyIdx !== -1 && items.length > 1) return `Item menimbang ${emptyIdx + 1} kosong. Isi atau hapus item tersebut.`;
        return '';
    };
    const getSKMengingatError = (items: string[]): string => {
        if (items.filter(m => m.trim()).length === 0) return 'Mengingat wajib diisi (minimal 1 item).';
        const emptyIdx = items.findIndex(m => !m.trim());
        if (emptyIdx !== -1 && items.length > 1) return `Item mengingat ${emptyIdx + 1} kosong. Isi atau hapus item tersebut.`;
        return '';
    };
    const getSKKeputusanError = (items: KeputusanItem[]): string => {
        if (items.filter(k => k.content.trim()).length === 0) return 'Keputusan wajib diisi (minimal 1 item).';
        const emptyItem = items.find(k => !k.content.trim());
        if (emptyItem && items.length > 1) return `Keputusan ${emptyItem.label || 'item'} kosong. Isi atau hapus item tersebut.`;
        return '';
    };

    // Hitung error SK secara langsung dari state
    const skPerihalError = suratType === "SURAT_KEPUTUSAN" ? getSKPerihalError(perihalInput) : '';
    const skTentangError = suratType === "SURAT_KEPUTUSAN" ? getSKTentangError(suratKeputusanForm.tentang) : '';

    const skMenimbangError = suratType === "SURAT_KEPUTUSAN" ? getSKMenimbangError(suratKeputusanForm.menimbang) : '';
    const skMengingatError = suratType === "SURAT_KEPUTUSAN" ? getSKMengingatError(suratKeputusanForm.mengingat) : '';
    const skKeputusanError = suratType === "SURAT_KEPUTUSAN" ? getSKKeputusanError(suratKeputusanForm.keputusan) : '';

    // ========================================================================
    // VALIDASI SURAT TUGAS TABEL
    // ========================================================================

    // Fungsi validasi Judul Surat (perihalInput) untuk ST Tabel - Required, Min 10, Max 255, not only symbols
    const getJudulSuratTabelError = (judul: string): string => {
        if (!judul || judul.trim() === '') {
            return 'Judul Surat harus diisi!';
        }

        if (judul.trim().length < 5) {
            return `Judul Surat minimal 5 karakter (saat ini: ${judul.trim().length} karakter)`;
        }

        if (judul.length > 255) {
            return `Judul Surat maksimal 255 karakter (saat ini: ${judul.length} karakter)`;
        }

        // Tidak boleh hanya berisi simbol (harus ada huruf/angka)
        if (!/[a-zA-Z0-9]/.test(judul)) {
            return 'Judul Surat tidak boleh hanya berisi simbol!';
        }

        return '';
    };

    // Hitung error Judul Surat Tabel secara langsung dari state
    const judulSuratTabelError = suratType === "SURAT_TUGAS_TABEL" ? getJudulSuratTabelError(perihalInput) : '';

    // Fungsi validasi Keperluan untuk ST Tabel - Required, Min 5, Max 150, not only numbers
    const getKeperluanTabelError = (keperluan: string): string => {
        if (!keperluan || keperluan.trim() === '') {
            return 'Keperluan harus diisi!';
        }

        if (keperluan.trim().length < 5) {
            return `Keperluan minimal 5 karakter (saat ini: ${keperluan.trim().length} karakter)`;
        }

        if (keperluan.length > 150) {
            return `Keperluan maksimal 150 karakter (saat ini: ${keperluan.length} karakter)`;
        }

        // Tidak boleh hanya berisi angka
        if (/^\d+$/.test(keperluan.trim())) {
            return 'Keperluan tidak boleh hanya berisi angka!';
        }

        return '';
    };

    // Hitung error Keperluan Tabel secara langsung dari state
    const keperluanTabelError = suratType === "SURAT_TUGAS_TABEL" ? getKeperluanTabelError(suratTugasTabelForm.keperluan) : '';

    // Fungsi validasi Judul/Topik Kegiatan untuk ST Tabel - Required
    const getJudulTopikTabelError = (judul: string): string => {
        if (!judul || judul.trim() === '') {
            return 'Judul/Topik Kegiatan wajib diisi.';
        }
        return '';
    };

    // Hitung error Judul/Topik Kegiatan Tabel
    const judulTopikTabelError = suratType === "SURAT_TUGAS_TABEL" ? getJudulTopikTabelError(suratTugasTabelForm.judulSurat) : '';

    // Hitung error Tanggal untuk ST Tabel (menggunakan Date object)
    const tanggalMulaiTabelError = suratType === "SURAT_TUGAS_TABEL" && !tanggalMulaiDate ? 'Tanggal Mulai harus diisi!' : '';
    const tanggalSelesaiTabelError = suratType === "SURAT_TUGAS_TABEL" && !tanggalSelesaiDate
        ? 'Tanggal Selesai harus diisi!'
        : (suratType === "SURAT_TUGAS_TABEL" && tanggalMulaiDate && tanggalSelesaiDate && tanggalSelesaiDate < tanggalMulaiDate
            ? 'Tanggal Selesai tidak boleh sebelum Tanggal Mulai!'
            : '');

    // ========================================================================
    // VALIDASI DATA PELAKSANA (ST TABEL)
    // ========================================================================

    // Fungsi validasi Nama Pelaksana - Min 2, Max 100, tidak boleh ada angka
    const getNamaPelaksanaError = (nama: string, label?: string): string => {
        const fieldName = label || suratTugasTabelForm.namaLabel || 'Nama';
        if (!nama || nama.trim() === '') {
            return `${fieldName} harus diisi!`;
        }
        if (nama.trim().length < 2) {
            return `${fieldName} minimal 2 karakter`;
        }
        if (nama.length > 100) {
            return `${fieldName} maksimal 100 karakter`;
        }
        // Tidak boleh ada angka
        if (/\d/.test(nama)) {
            return `${fieldName} tidak boleh mengandung angka!`;
        }
        return '';
    };

    // Fungsi validasi NIM/NIP Pelaksana - wajib diisi; digit+panjang hanya untuk label NIM/NIP
    const getNimPelaksanaError = (nim: string, label?: string): string => {
        const fieldName = label || suratTugasTabelForm.nimLabel || 'NIM';
        const fieldNameUpper = fieldName.toUpperCase();
        const isNIM = fieldNameUpper === 'NIM';
        const isNIP = fieldNameUpper === 'NIP';
        const isNimNip = fieldNameUpper === 'NIM/NIP' || fieldNameUpper === 'NIP/NIM';

        if (!nim || nim.trim() === '') {
            return `${fieldName} harus diisi!`;
        }

        if (isNIM) {
            if (!/^\d+$/.test(nim.trim())) return `${fieldName} harus berupa angka!`;
            if (nim.trim().length !== 14) return `${fieldName} harus tepat 14 digit angka!`;
        } else if (isNIP) {
            if (!/^\d+$/.test(nim.trim())) return `${fieldName} harus berupa angka!`;
            if (nim.trim().length !== 18) return `${fieldName} harus tepat 18 digit angka!`;
        } else if (isNimNip) {
            if (!/^\d+$/.test(nim.trim())) return `${fieldName} harus berupa angka!`;
            if (nim.trim().length !== 14 && nim.trim().length !== 18) return `${fieldName} harus 14 digit (NIM) atau 18 digit (NIP)!`;
        }
        // Label lain (custom): hanya wajib tidak kosong (sudah dicek di atas)
        return '';
    };

    // Fungsi validasi Prodi Pelaksana - Min 5 karakter
    const getProdiPelaksanaError = (prodi: string, label?: string): string => {
        const fieldName = label || suratTugasTabelForm.prodiLabel || 'Prodi';
        if (!prodi || prodi.trim() === '') {
            return `${fieldName} harus diisi!`;
        }
        if (prodi.trim().length < 5) {
            return `${fieldName} minimal 5 karakter`;
        }
        return '';
    };

    // Fungsi untuk mendapatkan semua error pelaksana
    const getPelaksanaErrors = (pelaksana: typeof suratTugasTabelForm.pelaksana) => {
        return pelaksana.map(p => {
            // Validate custom columns
            const customErrors: Record<string, string> = {};
            suratTugasTabelForm.customColumns.forEach(col => {
                if (!p[col.key] || p[col.key].trim() === '') {
                    customErrors[col.key] = `${col.label || 'Kolom'} harus diisi!`;
                }
            });
            return {
                key: p.key,
                namaError: getNamaPelaksanaError(p.nama),
                nimError: getNimPelaksanaError(p.nim),
                prodiError: getProdiPelaksanaError(p.prodi),
                customErrors,
            };
        });
    };

    // Hitung error pelaksana
    const pelaksanaErrors = suratType === "SURAT_TUGAS_TABEL" ? getPelaksanaErrors(suratTugasTabelForm.pelaksana) : [];

    // Cek apakah ada error di pelaksana
    const hasPelaksanaError = pelaksanaErrors.some(e => e.namaError || e.nimError || e.prodiError || Object.keys(e.customErrors).length > 0);

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const validateFormStep = (): boolean => {
        if (suratType === "SURAT_TUGAS") {
            // Mark all fields as touched to show inline errors
            markAllTouched();
            // Validate judul surat
            if (judulSuratError) {
                toast.error(judulSuratError);
                return false;
            }
            // Validate nama lengkap
            if (namaLengkapError) {
                toast.error(namaLengkapError);
                return false;
            }
            // Validate NIM/NIP
            if (nimNipError) {
                toast.error(nimNipError);
                return false;
            }
            // Validate program studi
            if (programStudiSTError) {
                toast.error(programStudiSTError);
                return false;
            }
            // Validate keperluan
            if (keperluanSTError) {
                toast.error(keperluanSTError);
                return false;
            }
            // Validate judul/topik kegiatan
            if (judulTopikError) {
                toast.error(judulTopikError);
                return false;
            }
        } else if (suratType === "SURAT_TUGAS_TABEL") {
            // Validate judul surat
            if (judulSuratTabelError) {
                toast.error(judulSuratTabelError);
                return false;
            }
            // Validate keperluan
            if (keperluanTabelError) {
                toast.error(keperluanTabelError);
                return false;
            }
            // Validate judul/topik kegiatan
            if (judulTopikTabelError) {
                toast.error(judulTopikTabelError);
                return false;
            }
            // Validate tanggal
            if (tanggalMulaiTabelError) {
                toast.error(tanggalMulaiTabelError);
                return false;
            }
            if (tanggalSelesaiTabelError) {
                toast.error(tanggalSelesaiTabelError);
                return false;
            }
            if (suratTugasTabelForm.pelaksana.length === 0) {
                toast.error("Tambahkan minimal 1 pelaksana");
                return false;
            }
            // Validate each pelaksana dengan detail
            if (hasPelaksanaError) {
                // Cari error pertama untuk ditampilkan
                const firstError = pelaksanaErrors.find(e => e.namaError || e.nimError || e.prodiError || Object.keys(e.customErrors).length > 0);
                if (firstError) {
                    const errorMsg = firstError.namaError || firstError.nimError || firstError.prodiError || Object.values(firstError.customErrors)[0];
                    toast.error(`Data Pelaksana: ${errorMsg}`);
                }
                return false;
            }
        } else if (suratType === "SURAT_KEPUTUSAN") {
            markAllSKTouched();
            if (skPerihalError) { toast.error(skPerihalError); return false; }
            if (skTentangError) { toast.error(skTentangError); return false; }

            if (skMenimbangError) { toast.error(skMenimbangError); return false; }
            if (skMengingatError) { toast.error(skMengingatError); return false; }
            
            if (skKeputusanError) { toast.error(skKeputusanError); return false; }
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
                    nomorSurat: '',
                    keterangan: suratTugasTabelForm.keperluan || '',
                };


            } else if (suratType === "SURAT_KEPUTUSAN") {
                content = {
                    ...suratKeputusanForm,
                    menimbang: suratKeputusanForm.menimbang.filter(m => m.trim()),
                    mengingat: suratKeputusanForm.mengingat.filter(m => m.trim()),
                    memperhatikan: (suratKeputusanForm.memperhatikan || []).filter(m => m.trim()),
                    keputusan: suratKeputusanForm.keputusan.filter(k => k.content.trim()).map(({ key, ...rest }) => rest),
                };
            }

            // Build signatories - urutan sesuai inputan staff/supervisor (TANPA auto-sort hierarchy)
            const signatories = signers
                .map((s, idx) => ({
                    signerRole: s.role,
                    signerName: s.name || ALL_SIGNER_ROLES.find(r => r.value === s.role)?.label || s.role,
                    signerNip: s.nip || "",
                    prefix: s.prefix || "",
                    // Order sesuai urutan input user (index-based)
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
                description: u.description,
            }));

            // Combine all tembusan into single array for API:
            // 1. User accounts (akses sistem)
            // 2. Text entries (tertulis di PDF, converted to object format)
            // 3. __PENGAJU__ marker if checkbox checked (resolved to createdById in backend)
            const combinedTembusan: Array<{ userId: string; name: string; description?: string; email?: string }> = [
                ...tembusanUsersList.map(u => ({ userId: u.userId, name: u.name, email: u.email, description: u.description || '' })),
                ...tembusanTextsList.map(text => ({ userId: '', name: text, email: '', description: '' })),
            ];
            if (includePengaju) {
                combinedTembusan.push({
                    userId: '__PENGAJU__',
                    name: 'Pengaju Surat',
                    description: '',
                });
            }

            // Use perihalInput as single source for dashboard/detail "Judul Surat"
            // Falls back to relevant content fields if perihalInput is empty
            let perihal = perihalInput.trim();
            if (!perihal) {
                if (suratType === "SURAT_TUGAS") {
                    perihal = suratTugasForm.keperluan || 'Surat Tugas';
                } else if (suratType === "SURAT_TUGAS_TABEL") {
                    perihal = suratTugasTabelForm.keperluan || 'Surat Tugas';
                } else if (suratType === "SURAT_KEPUTUSAN") {
                    perihal = suratKeputusanForm.tentang || 'Surat Keputusan';
                }
            }

            // Create the surat using staff API - cast to ensure valid category
            const response = await suratService.createStaffSurat({
                category: categoryParam as 'AKADEMIK' | 'SUMBER_DAYA' | 'UMUM',
                documentType: suratType,
                signatories,
                tembusan: combinedTembusan,
                content,
                perihal,
            });

            if (response.success) {
                // Upload attachments jika ada
                const documentId = (response.data as any)?.documentId;
                if (attachmentFiles.length > 0 && documentId) {
                    try {
                        setIsUploadingAttachment(true);
                        await suratService.uploadAttachments(documentId, attachmentFiles);
                        toast.success(`${attachmentFiles.length} lampiran berhasil diupload`);
                    } catch (attachmentError) {
                        console.error("Failed to upload attachments:", attachmentError);
                        toast.error("Lampiran gagal diupload, tetapi surat berhasil dibuat");
                    } finally {
                        setIsUploadingAttachment(false);
                    }
                }

                toast.success("Surat berhasil dibuat");
                // Redirect ke detail surat keluar yang baru dibuat
                const submissionId = (response.data as any)?.id;
                if (submissionId) {
                    router.push(`/detail/${submissionId}?type=keluar`);
                } else {
                    // Fallback ke dashboard jika id tidak tersedia
                    const redirectPath = user?.role ? getPostDraftRedirectPath(user.role) : '/dashboard';
                    router.push(redirectPath);
                }
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
                <h1 className="text-2xl font-bold text-black">
                    Buat {SURAT_TYPE_LABELS[suratType]}
                </h1>
            </div>

            {/* Step Indicator */}
            <div className="mb-8">
                <Stepper
                    steps={steps}
                    activeStep={currentStepIndex}
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col mb-6">
                {/* Step 1: Form */}
                {currentStep === "form" && (
                    <div className="space-y-6">
                        {/* Surat Tugas Form */}
                        {suratType === "SURAT_TUGAS" && (
                            <Card className="bg-neutral-50 border-zinc-400">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5" />
                                        Form Surat Tugas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="perihalInput">Judul Surat <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="perihalInput"
                                            value={perihalInput}
                                            onChange={(e) => setPerihalInput(e.target.value)}
                                            onBlur={() => markTouched('perihalInput')}
                                            placeholder="Masukkan judul surat"
                                            className={judulSuratError && touchedFields.perihalInput ? 'border-red-500' : ''}
                                        />
                                        {judulSuratError && touchedFields.perihalInput && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {judulSuratError}
                                            </p>
                                        )}
                                        {!judulSuratError && perihalInput && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Judul Surat valid
                                            </p>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="namaLengkap"
                                                value={suratTugasForm.namaLengkap}
                                                onChange={(e) => updateSuratTugas("namaLengkap", e.target.value)}
                                                onBlur={() => markTouched('namaLengkap')}
                                                placeholder="Nama lengkap"
                                                className={namaLengkapError && touchedFields.namaLengkap ? 'border-red-500' : ''}
                                            />
                                            {namaLengkapError && touchedFields.namaLengkap && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {namaLengkapError}
                                                </p>
                                            )}
                                            {!namaLengkapError && suratTugasForm.namaLengkap && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> Nama Lengkap valid
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nimNip">NIM/NIP <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nimNip"
                                                value={suratTugasForm.nimNip}
                                                onChange={(e) => {
                                                    // Only allow digits
                                                    const filtered = e.target.value.replace(/\D/g, '');
                                                    updateSuratTugas("nimNip", filtered);
                                                }}
                                                onBlur={() => markTouched('nimNip')}
                                                placeholder="NIM (14 digit) atau NIP (18 digit)"
                                                maxLength={18}
                                                className={nimNipError && touchedFields.nimNip ? 'border-red-500' : ''}
                                            />
                                            {nimNipError && touchedFields.nimNip && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {nimNipError}
                                                </p>
                                            )}
                                            {!nimNipError && suratTugasForm.nimNip && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> {suratTugasForm.nimNip.trim().length === 18 ? 'NIP' : 'NIM'} valid
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="programStudi">Program Studi <span className="text-red-500">*</span></Label>
                                        <Popover open={prodiOpen} onOpenChange={setProdiOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={prodiOpen}
                                                    className={cn(
                                                        "w-full justify-between font-normal h-9",
                                                        !suratTugasForm.programStudi && "text-muted-foreground",
                                                        programStudiSTError && touchedFields.programStudi && "border-red-500"
                                                    )}
                                                >
                                                    {suratTugasForm.programStudi || "Pilih program studi..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom" avoidCollisions={false}>
                                                {/* Search Input */}
                                                <div className="flex items-center border-b px-3 py-2">
                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                    <input
                                                        ref={prodiSearchRef}
                                                        placeholder="Cari program studi..."
                                                        value={prodiSearch}
                                                        onChange={(e) => setProdiSearch(e.target.value)}
                                                        className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                                    />
                                                </div>
                                                {/* List */}
                                                <div className="max-h-[200px] overflow-y-auto p-1">
                                                    {filteredProdiList.length === 0 ? (
                                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                                            Program studi tidak ditemukan.
                                                        </p>
                                                    ) : (
                                                        filteredProdiList.map((prodi) => (
                                                            <button
                                                                key={prodi}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateSuratTugas("programStudi", prodi);
                                                                    markTouched('programStudi');
                                                                    setProdiOpen(false);
                                                                }}
                                                                className={cn(
                                                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                                                    suratTugasForm.programStudi === prodi && "bg-accent text-accent-foreground"
                                                                )}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        suratTugasForm.programStudi === prodi ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {prodi}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {programStudiSTError && touchedFields.programStudi && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {programStudiSTError}
                                            </p>
                                        )}
                                        {!programStudiSTError && suratTugasForm.programStudi && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Program Studi valid
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="keperluan">Keperluan <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="keperluan"
                                            value={suratTugasForm.keperluan}
                                            onChange={(e) => updateSuratTugas("keperluan", e.target.value)}
                                            onBlur={() => markTouched('keperluan')}
                                            placeholder="Jelaskan keperluan surat ini"
                                            rows={3}
                                            className={keperluanSTError && touchedFields.keperluan ? 'border-red-500' : ''}
                                        />
                                        {keperluanSTError && touchedFields.keperluan && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {keperluanSTError}
                                            </p>
                                        )}
                                        {!keperluanSTError && suratTugasForm.keperluan && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Keperluan valid
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="judulSurat">Judul/Topik Kegiatan <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="judulSurat"
                                            value={suratTugasForm.judulSurat}
                                            onChange={(e) => {
                                                // Filter out newlines
                                                const filtered = e.target.value.replace(/[\r\n]/g, '');
                                                updateSuratTugas("judulSurat", filtered);
                                            }}
                                            onBlur={() => markTouched('judulTopik')}
                                            placeholder="Jelaskan judul atau topik kegiatan"
                                            className={judulTopikError && touchedFields.judulTopik ? 'border-red-500' : ''}
                                        />
                                        {judulTopikError && touchedFields.judulTopik && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {judulTopikError}
                                            </p>
                                        )}
                                        {!judulTopikError && suratTugasForm.judulSurat && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Judul/Topik Kegiatan valid
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Surat Tugas Tabel Form */}
                        {suratType === "SURAT_TUGAS_TABEL" && (
                            <>
                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5" />
                                            Informasi Surat Tugas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="perihalInput">Judul Surat <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="perihalInput"
                                                value={perihalInput}
                                                onChange={(e) => setPerihalInput(e.target.value)}
                                                placeholder="Masukkan judul surat"
                                                className={judulSuratTabelError ? 'border-red-500' : ''}
                                            />
                                            {judulSuratTabelError && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {judulSuratTabelError}
                                                </p>
                                            )}
                                            {!judulSuratTabelError && perihalInput && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> Judul Surat valid
                                                </p>
                                            )}
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label htmlFor="keperluan">Keperluan <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id="keperluan"
                                                value={suratTugasTabelForm.keperluan}
                                                onChange={(e) => updateSuratTugasTabel("keperluan", e.target.value)}
                                                placeholder="Jelaskan keperluan surat ini"
                                                rows={3}
                                                className={keperluanTabelError ? 'border-red-500' : ''}
                                            />
                                            {keperluanTabelError && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {keperluanTabelError}
                                                </p>
                                            )}
                                            {!keperluanTabelError && suratTugasTabelForm.keperluan && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> Keperluan valid
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="judulSurat">Judul/Topik Kegiatan <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="judulSurat"
                                                value={suratTugasTabelForm.judulSurat}
                                                onChange={(e) => {
                                                    // Filter out newlines
                                                    const filtered = e.target.value.replace(/[\r\n]/g, '');
                                                    updateSuratTugasTabel("judulSurat", filtered);
                                                }}
                                                placeholder="Jelaskan judul atau topik kegiatan"
                                                className={judulTopikTabelError ? 'border-red-500' : ''}
                                            />
                                            {judulTopikTabelError && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {judulTopikTabelError}
                                                </p>
                                            )}
                                            {!judulTopikTabelError && suratTugasTabelForm.judulSurat && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> Judul/Topik Kegiatan valid
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalMulai">Tanggal Mulai <span className="text-red-500">*</span></Label>
                                                <DatePicker
                                                    value={tanggalMulaiDate}
                                                    onChange={(date) => {
                                                        setTanggalMulaiDate(date);
                                                        updateSuratTugasTabel("tanggalMulai", date ? formatDate(date, "dd MMMM yyyy", { locale: idLocale }) : "");
                                                        // Reset tanggal selesai if it's before the new tanggal mulai
                                                        if (date && tanggalSelesaiDate && tanggalSelesaiDate < date) {
                                                            setTanggalSelesaiDate(undefined);
                                                            updateSuratTugasTabel("tanggalSelesai", "");
                                                        }
                                                    }}
                                                    placeholder="Pilih tanggal mulai"
                                                />
                                                {tanggalMulaiTabelError && (
                                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                                        <span className="font-medium">⚠</span> {tanggalMulaiTabelError}
                                                    </p>
                                                )}
                                                {!tanggalMulaiTabelError && tanggalMulaiDate && (
                                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                                        <span>✓</span> Tanggal Mulai valid
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalSelesai">Tanggal Selesai <span className="text-red-500">*</span></Label>
                                                <DatePicker
                                                    value={tanggalSelesaiDate}
                                                    onChange={(date) => {
                                                        setTanggalSelesaiDate(date);
                                                        updateSuratTugasTabel("tanggalSelesai", date ? formatDate(date, "dd MMMM yyyy", { locale: idLocale }) : "");
                                                    }}
                                                    placeholder={tanggalMulaiDate ? "Pilih tanggal selesai" : "Isi tanggal mulai terlebih dahulu"}
                                                    fromDate={tanggalMulaiDate}
                                                    disabled={!tanggalMulaiDate}
                                                />
                                                {tanggalSelesaiTabelError && (
                                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                                        <span className="font-medium">⚠</span> {tanggalSelesaiTabelError}
                                                    </p>
                                                )}
                                                {!tanggalSelesaiTabelError && tanggalSelesaiDate && (
                                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                                        <span>✓</span> Tanggal Selesai valid
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5" />
                                            Data Pelaksana
                                        </CardTitle>
                                        <CardDescription>Tambahkan daftar orang yang akan ditugaskan dalam format tabel</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Kolom Wajib - Editable Labels */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">Kolom Wajib:</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <Input
                                                    value={suratTugasTabelForm.namaLabel}
                                                    onChange={(e) => updateSuratTugasTabel("namaLabel", e.target.value)}
                                                    placeholder="Nama"
                                                    className="h-9"
                                                />
                                                <Input
                                                    value={suratTugasTabelForm.nimLabel}
                                                    onChange={(e) => updateSuratTugasTabel("nimLabel", e.target.value)}
                                                    placeholder="NIM"
                                                    className="h-9"
                                                />
                                                <Input
                                                    value={suratTugasTabelForm.prodiLabel}
                                                    onChange={(e) => updateSuratTugasTabel("prodiLabel", e.target.value)}
                                                    placeholder="Prodi"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
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
                                                    <div className="text-xs font-medium">{suratTugasTabelForm.namaLabel || 'Nama'} <span className="text-red-500">*</span></div>
                                                    <div className="text-xs font-medium">{suratTugasTabelForm.nimLabel || 'NIM'} <span className="text-red-500">*</span></div>
                                                    <div className="text-xs font-medium">{suratTugasTabelForm.prodiLabel || 'Prodi'} <span className="text-red-500">*</span></div>
                                                    {suratTugasTabelForm.customColumns.map((col) => (
                                                        <div key={col.key} className="text-xs font-medium">{col.label || "(Belum diberi nama)"}</div>
                                                    ))}
                                                    <div></div>
                                                </div>
                                            </div>

                                            {/* Table Body */}
                                            <div className="divide-y">
                                                {suratTugasTabelForm.pelaksana.map((p, index) => {
                                                    const errors = pelaksanaErrors.find(e => e.key === p.key);
                                                    return (
                                                        <div key={p.key} className="p-3 bg-white hover:bg-muted/30">
                                                            <div className="grid gap-2 items-center" style={{
                                                                gridTemplateColumns: `40px repeat(${3 + suratTugasTabelForm.customColumns.length}, 1fr) 40px`
                                                            }}>
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm">
                                                                    {index + 1}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Input
                                                                        value={p.nama}
                                                                        onChange={(e) => updatePelaksana(p.key, "nama", e.target.value)}
                                                                        placeholder={suratTugasTabelForm.namaLabel || "Nama"}
                                                                        className={`h-9 ${errors?.namaError ? 'border-red-500' : ''}`}
                                                                    />
                                                                    {errors?.namaError && (
                                                                        <p className="text-xs text-red-500">{errors.namaError}</p>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Input
                                                                        value={p.nim}
                                                                        onChange={(e) => {
                                                                            const nimLabel = (suratTugasTabelForm.nimLabel || '').toUpperCase();
                                                                            const isNimOrNip = nimLabel === 'NIM' || nimLabel === 'NIP' || nimLabel === 'NIM/NIP' || nimLabel === 'NIP/NIM';
                                                                            const val = isNimOrNip ? e.target.value.replace(/\D/g, '') : e.target.value;
                                                                            updatePelaksana(p.key, "nim", val);
                                                                        }}
                                                                        placeholder={suratTugasTabelForm.nimLabel || "NIM"}
                                                                        maxLength={(() => {
                                                                            const nimLabel = (suratTugasTabelForm.nimLabel || '').toUpperCase();
                                                                            if (nimLabel === 'NIP') return 18;
                                                                            if (nimLabel === 'NIM') return 14;
                                                                            if (nimLabel === 'NIM/NIP' || nimLabel === 'NIP/NIM') return 18;
                                                                            return undefined;
                                                                        })()}
                                                                        className={`h-9 ${errors?.nimError ? 'border-red-500' : ''}`}
                                                                    />
                                                                    {errors?.nimError && (
                                                                        <p className="text-xs text-red-500">{errors.nimError}</p>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Input
                                                                        value={p.prodi}
                                                                        onChange={(e) => updatePelaksana(p.key, "prodi", e.target.value)}
                                                                        placeholder={suratTugasTabelForm.prodiLabel || "Prodi"}
                                                                        className={`h-9 ${errors?.prodiError ? 'border-red-500' : ''}`}
                                                                    />
                                                                    {errors?.prodiError && (
                                                                        <p className="text-xs text-red-500">{errors.prodiError}</p>
                                                                    )}
                                                                </div>
                                                                {suratTugasTabelForm.customColumns.map((col) => (
                                                                    <div key={col.key} className="space-y-1">
                                                                        <Input
                                                                            value={p[col.key] || ""}
                                                                            onChange={(e) => updatePelaksana(p.key, col.key, e.target.value)}
                                                                            placeholder={col.label || "..."}
                                                                            className={`h-9 ${errors?.customErrors[col.key] ? 'border-red-500' : ''}`}
                                                                        />
                                                                        {errors?.customErrors[col.key] && (
                                                                            <p className="text-xs text-red-500">{errors.customErrors[col.key]}</p>
                                                                        )}
                                                                    </div>
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
                                                    );
                                                })}
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
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5" />
                                            Informasi Dasar
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="perihalInput">Judul Surat <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="perihalInput"
                                                value={perihalInput}
                                                onChange={(e) => setPerihalInput(e.target.value)}
                                                onBlur={() => markTouched('skPerihal')}
                                                placeholder="Masukkan judul surat"
                                                className={touchedFields.skPerihal && skPerihalError ? 'border-red-500' : ''}
                                            />
                                            {touchedFields.skPerihal && skPerihalError && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {skPerihalError}
                                                </p>
                                            )}
                                            {!skPerihalError && perihalInput && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> Judul Surat valid
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tentang">Tentang <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id="tentang"
                                                value={suratKeputusanForm.tentang}
                                                onChange={(e) => updateSuratKeputusan("tentang", e.target.value)}
                                                onBlur={() => markTouched('skTentang')}
                                                placeholder="Isi perihal/tentang keputusan"
                                                rows={2}
                                                className={touchedFields.skTentang && skTentangError ? 'border-red-500' : ''}
                                            />
                                            {touchedFields.skTentang && skTentangError && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {skTentangError}
                                                </p>
                                            )}
                                            {!skTentangError && suratKeputusanForm.tentang && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <span>✓</span> Tentang valid
                                                </p>
                                            )}
                                        </div>

                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Scale className="w-5 h-5" />
                                            Menimbang <span className="text-red-500">*</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {suratKeputusanForm.menimbang.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateMenimbang(index, e.target.value)}
                                                    onBlur={() => markTouched('skMenimbang')}
                                                    placeholder={`Item menimbang ${index + 1}`}
                                                    rows={2}
                                                    className={`flex-1 ${touchedFields.skMenimbang && !item.trim() ? 'border-red-500' : ''}`}
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
                                        {touchedFields.skMenimbang && skMenimbangError && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {skMenimbangError}
                                            </p>
                                        )}
                                        {!skMenimbangError && suratKeputusanForm.menimbang.some(m => m.trim()) && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Menimbang valid
                                            </p>
                                        )}
                                        <Button variant="outline" onClick={addMenimbang} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Item Menimbang
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            Mengingat <span className="text-red-500">*</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {suratKeputusanForm.mengingat.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateMengingat(index, e.target.value)}
                                                    onBlur={() => markTouched('skMengingat')}
                                                    placeholder={`Item mengingat ${index + 1}`}
                                                    rows={2}
                                                    className={`flex-1 ${touchedFields.skMengingat && !item.trim() ? 'border-red-500' : ''}`}
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
                                        {touchedFields.skMengingat && skMengingatError && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {skMengingatError}
                                            </p>
                                        )}
                                        {!skMengingatError && suratKeputusanForm.mengingat.some(m => m.trim()) && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Mengingat valid
                                            </p>
                                        )}
                                        <Button variant="outline" onClick={addMengingat} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Item Mengingat
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                                <Eye className="w-5 h-5" />
                                                Memperhatikan <span className="text-gray-400 font-normal text-xs">(Opsional)</span>
                                            </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {(suratKeputusanForm.memperhatikan || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateMemperhatikan(index, e.target.value)}
                                                    placeholder={`Item memperhatikan ${index + 1}`}
                                                    rows={2}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeMemperhatikan(index)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="outline" onClick={addMemperhatikan} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Item Memperhatikan
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-neutral-50 border-zinc-400">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <ListChecks className="w-5 h-5" />
                                            Keputusan <span className="text-red-500">*</span>
                                        </CardTitle>
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
                                                    onBlur={() => markTouched('skKeputusan')}
                                                    placeholder="Isi keputusan"
                                                    rows={3}
                                                    className={touchedFields.skKeputusan && !k.content.trim() ? 'border-red-500' : ''}
                                                />
                                            </div>
                                        ))}
                                        {touchedFields.skKeputusan && skKeputusanError && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {skKeputusanError}
                                            </p>
                                        )}
                                        {!skKeputusanError && suratKeputusanForm.keputusan.some(k => k.content.trim()) && (
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <span>✓</span> Keputusan valid
                                            </p>
                                        )}
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




                                {signers.map((signer, index) => (
                                    <div key={signer.id} className="space-y-3 p-4 bg-white rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium leading-tight">
                                                    {signers.length === 1
                                                        ? "Kanan"
                                                        : signers.length === 2
                                                            ? index === 0 ? "Kiri" : "Kanan"
                                                            : index === 0 ? "Kiri" : index === 1 ? "Kanan" : "Tengah"}
                                                </span>
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

                                {signers.length < getFilteredRolesByCategory(categoryParam).length && (
                                    <Button
                                        variant="outline"
                                        onClick={addSigner}
                                        className={`w-full${isFaculty ? ' hidden' : ''}`}
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
                                                // Format tanggalDitetapkan untuk preview
                                                {
                                                    ...suratKeputusanForm,
                                                }
                                    }
                                    tembusan={tembusanTexts.map(t => ({ name: t.text }))}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Tembusan Configuration */}
                {currentStep === "tembusan" && (
                    <Card className="bg-neutral-50/50 border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Konfigurasi Tembusan
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Tentukan siapa saja yang akan menerima tembusan surat ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Pengaju Checkbox */}
                            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-border shadow-sm transition-colors hover:border-gray-300">
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
                                        Pengaju akan mendapat akses dan download surat.
                                    </p>
                                </div>
                                <Badge variant="secondary">Disarankan</Badge>
                            </div>

                            <Separator />

                            {/* Section 1: Akun Pengguna untuk Akses Sistem */}
                            <div className="space-y-4">
                                <div className="space-y-2 relative">
                                    <Label className="text-sm font-medium text-[#2B2B2B]">
                                        1. Pilih Akun Pengguna (Dalam Sistem)
                                    </Label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Akun yang dipilih akan dapat <strong>mengakses dan mendownload</strong> surat setelah selesai.
                                        <br />
                                        <span className="text-muted-foreground/80 font-medium flex items-center gap-1 mt-0.5">
                                            <Info className="w-3 h-3" /> Tidak akan tertulis di PDF surat.
                                        </span>
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
                                            className="pl-9 bg-white border-border focus:border-neutral-400 transition-colors"
                                        />
                                        {isSearchingUsers && (
                                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* User Search Results */}
                                    {showUserResults && userSearchQuery.length >= 2 && (
                                        <Card className="shadow-lg border border-border max-h-64 overflow-y-auto mt-1 absolute w-full z-10 bg-white">
                                            {userSearchResults.length === 0 ? (
                                                <div className="p-4 text-center text-muted-foreground text-sm">
                                                    {isSearchingUsers ? 'Mencari...' : 'Tidak ada hasil ditemukan'}
                                                </div>
                                            ) : (
                                                <div className="p-1 space-y-0.5">
                                                    {userSearchResults.map((user) => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 text-left transition-colors group"
                                                            onClick={() => handleSelectUser(user)}
                                                        >
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border",
                                                                "bg-neutral-50 border-neutral-200 text-neutral-600"
                                                            )}>
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-[#2B2B2B] group-hover:text-black transition-colors truncate">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {user.type === 'mahasiswa'
                                                                        ? `${user.identifier} • ${user.programStudi || 'Mahasiswa'}`
                                                                        : `${user.jabatan || 'Pegawai'} • NIP: ${user.identifier}`
                                                                    }
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="text-[10px] shrink-0 border-border text-muted-foreground font-normal">
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
                                        <Label className="text-sm font-medium text-[#2B2B2B] flex items-center justify-between">
                                            <span>Akun Terpilih ({tembusanUsers.length})</span>
                                            <span className="text-xs font-normal text-muted-foreground">Akan dapat mengakses dan mendownload surat</span>
                                        </Label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {tembusanUsers.map((user) => (
                                                <div
                                                    key={user.userId}
                                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border group hover:border-gray-300 transition-all"
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                                        "bg-neutral-50 border-neutral-200 text-neutral-600"
                                                    )}>
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-[#2B2B2B] truncate">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.description}</p>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] bg-neutral-100 text-muted-foreground border-neutral-200 shrink-0 font-normal">
                                                        Dalam Sistem
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
                                    <Label htmlFor="new-tembusan-text" className="text-sm font-medium text-[#2B2B2B]">
                                        2. Tambah Text Tembusan (Tertulis di Surat)
                                    </Label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Text yang diketik akan <strong>tertulis di bagian "Tembusan:"</strong> di PDF surat.
                                        <br />
                                        <span className="text-muted-foreground/80 font-medium flex items-center gap-1 mt-0.5">
                                            <Info className="w-3 h-3" /> Tidak terkait dengan akun sistem.
                                        </span>
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            id="new-tembusan-text"
                                            placeholder="Contoh: Arsip, Kepala Lab Fisika, Yth. Bapak/Ibu..."
                                            value={newTembusanTextInput}
                                            onChange={(e) => setNewTembusanTextInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addTembusanText();
                                                }
                                            }}
                                            className="flex-1 bg-white border-border focus:border-neutral-400 transition-colors"
                                        />
                                        <Button
                                            onClick={addTembusanText}
                                            disabled={!newTembusanTextInput.trim()}
                                            className="bg-[#2B2B2B] text-white hover:bg-[#2B2B2B]/90 shadow-sm"
                                        >
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
                                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-700 shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <span className="flex-1 text-sm font-medium text-[#2B2B2B]">{item.text}</span>
                                                    <Badge variant="secondary" className="text-[10px] bg-neutral-100 text-muted-foreground border-neutral-200 shrink-0 font-normal">
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

                            <div className="mt-4 p-4 rounded-lg bg-neutral-50/50 border border-neutral-300 flex items-start gap-3">
                                <div className="flex h-5 items-center justify-center shrink-0">
                                    <Info className="h-4 w-4 text-neutral-600" />
                                </div>
                                <div className="text-sm text-neutral-600">
                                    <div className="font-semibold text-[#2B2B2B] leading-5 mb-2">Panduan Pengisian:</div>
                                    <ul className="space-y-1.5 list-disc list-outside ml-4">
                                        <li>
                                            <strong className="text-[#2B2B2B]">Pengajuan Surat:</strong> Pengaju otomatis akan mendapatkan akses dan bisa mendownload surat setelah selesai (tidak tertulis di PDF).
                                        </li>
                                        <li>
                                            <strong className="text-[#2B2B2B]">Pilih Akun Pengguna (Dalam Sistem):</strong> Akun yang dipilih akan dapat mengakses dan mendownload surat setelah selesai (tidak tertulis di PDF).
                                        </li>
                                        <li>
                                            <strong className="text-[#2B2B2B]">Tambah Text Tembusan (Tertulis di Surat):</strong> Nama atau teks yang diketik akan tertulis di bagian "Tembusan" pada dokumen PDF surat.
                                        </li>
                                    </ul>
                                </div>
                            </div>
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
                                Upload file lampiran dalam format PDF, JPG, atau PNG. Maksimal 5MB per file, total maksimal 5 file.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* FileUpload Component - konsisten dengan implementasi Pengaju */}
                            <FileUpload
                                files={attachmentFiles}
                                onFilesChange={setAttachmentFiles}
                                maxFiles={5}
                                maxSizeKB={5120} // 5MB
                                acceptedTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']}
                            />

                            {attachmentFiles.length === 0 && (
                                <div className="flex items-center gap-2 rounded-lg border border-[#E1DFE0] bg-white px-4 py-3">
                                    <Info className="h-4 w-4 text-[#6D6D6D] shrink-0" />
                                    <p className="text-[#6D6D6D] text-sm">Lampiran bersifat opsional. Anda dapat melanjutkan tanpa menambahkan lampiran.</p>
                                </div>
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
                                <div className="space-y-3 bg-white rounded-lg border p-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tipe Surat</Label>
                                        <p className="font-medium text-sm">{SURAT_TYPE_LABELS[suratType]}</p>
                                    </div>
                                    <Separator className="my-1" />
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Jenis Surat</Label>
                                        <p className="font-medium text-sm">{CATEGORY_LABELS[categoryParam]}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Informasi Formulir */}
                                <div>
                                    <Label className="text-sm text-muted-foreground mb-3 block font-semibold">
                                        Informasi Formulir
                                    </Label>
                                    <div className="space-y-3 bg-white rounded-lg border p-4">
                                        {/* Judul Surat - shared across all types */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Judul Surat</Label>
                                            <p className="font-medium text-sm">{perihalInput || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                        </div>

                                        {suratType === "SURAT_TUGAS" && (
                                            <>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Keperluan</Label>
                                                    <p className="font-medium text-sm">{suratTugasForm.keperluan || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Judul/Topik Kegiatan</Label>
                                                    <p className="font-medium text-sm">{suratTugasForm.judulSurat || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                            </>
                                        )}

                                        {suratType === "SURAT_TUGAS_TABEL" && (
                                            <>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Keperluan</Label>
                                                    <p className="font-medium text-sm">{suratTugasTabelForm.keperluan || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Judul/Topik Kegiatan</Label>
                                                    <p className="font-medium text-sm">{suratTugasTabelForm.judulSurat || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Tanggal Mulai</Label>
                                                    <p className="font-medium text-sm">{suratTugasTabelForm.tanggalMulai || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Tanggal Selesai</Label>
                                                    <p className="font-medium text-sm">{suratTugasTabelForm.tanggalSelesai || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                            </>
                                        )}

                                        {suratType === "SURAT_KEPUTUSAN" && (
                                            <>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Tentang</Label>
                                                    <p className="font-medium text-sm">{suratKeputusanForm.tentang || <span className="italic text-muted-foreground">Belum diisi</span>}</p>
                                                </div>
                                                <Separator className="my-1" />
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Keterangan</Label>
                                                    <p className="font-medium text-sm text-muted-foreground italic">Tanggal ditetapkan akan diset saat penomoran UPA</p>
                                                </div>
                                            </>
                                        )}
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
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-medium">
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
                                        Tembusan ({(includePengaju ? 1 : 0) + tembusanUsers.length} Dalam Sistem, {tembusanTexts.length} Tertulis di Surat)
                                    </Label>
                                    <div className="space-y-2">
                                        {includePengaju && (
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                                                <User className="w-5 h-5 text-neutral-500" />
                                                <span className="flex-1 font-medium text-[#2B2B2B] text-sm">Pengaju Surat</span>
                                                <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600 border-neutral-200">Dalam Sistem</Badge>
                                            </div>
                                        )}
                                        {tembusanUsers.map((user) => (
                                            <div
                                                key={user.userId}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200"
                                            >
                                                <User className="w-5 h-5 text-neutral-500" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[#2B2B2B] text-sm truncate">{user.name}</p>
                                                    {user.description && (
                                                        <p className="text-xs text-muted-foreground truncate">{user.description}</p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600 border-neutral-200">Dalam Sistem</Badge>
                                            </div>
                                        ))}
                                        {tembusanTexts.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200"
                                            >
                                                <FileText className="w-5 h-5 text-neutral-500" />
                                                <span className="flex-1 font-medium text-[#2B2B2B] text-sm">{item.text}</span>
                                                <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600 border-neutral-200">Tertulis di Surat</Badge>
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
                                        Lampiran ({attachmentFiles.length})
                                    </Label>
                                    {attachmentFiles.length > 0 ? (
                                        <div className="space-y-2">
                                            {attachmentFiles.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${index}`}
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-[#E1DFE0] bg-white group hover:border-gray-300 transition-all"
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                        file.type === 'application/pdf'
                                                            ? "bg-red-100"
                                                            : "bg-blue-100"
                                                    )}>
                                                        {file.type === 'application/pdf' ? (
                                                            <FileText className="w-5 h-5 text-red-600" />
                                                        ) : (
                                                            <Image className="w-5 h-5 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-[#2B2B2B] truncate" title={file.name}>{file.name}</p>
                                                        <p className="text-xs text-[#6D6D6D]">
                                                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                                                        </p>
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
                                                    {
                                                        ...suratKeputusanForm,
                                                    }
                                        }
                                        tembusan={tembusanTexts.map(t => ({ name: t.text }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
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
                            if (isDirty && !submitting) {
                                // Convert relative path to absolute URL for pendingUrl
                                setPendingUrl(window.location.origin + redirectPath);
                                setShowLeaveConfirm(true);
                            } else {
                                router.push(redirectPath);
                            }
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
                            onClick={() => setShowSubmitConfirm(true)}
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
                            className="bg-base-black hover:bg-base-black/90 text-white gap-2"
                        >
                            Lanjutkan
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    )
                }
            />

            {/* Leave Confirmation Dialog */}
            <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Meninggalkan Halaman</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin meninggalkan halaman ini? Data yang telah Anda isi akan hilang dan Anda harus mengisi ulang dari awal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batalkan</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmLeave} className="bg-base-black hover:bg-base-black/90 text-white">
                            Ya, Tinggalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Pembuatan Surat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah data yang dimasukkan sudah benar dan sesuai? Surat akan dibuat ke dalam sistem.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Batalkan</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowSubmitConfirm(false);
                                handleSubmit();
                            }}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Ya, Konfirmasi"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
