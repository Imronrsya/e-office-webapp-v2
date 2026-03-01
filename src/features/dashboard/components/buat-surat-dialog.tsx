"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    GraduationCap,
    Building2,
    Globe,
    ClipboardList,
    Table,
    Award
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type LetterCategory = "AKADEMIK" | "SUMBER_DAYA" | "UMUM";
// Use lowercase to match TemplateType from @/lib/templates
export type TemplateTypeOption = "surat-tugas" | "surat-tugas-table" | "surat-keputusan";

interface BuatSuratDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** User role to filter available categories */
    userRole?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
    {
        id: "AKADEMIK" as LetterCategory,
        label: "Akademik",
        description: "Surat terkait kegiatan akademik seperti seminar, penelitian, dll.",
        icon: GraduationCap,
    },
    {
        id: "SUMBER_DAYA" as LetterCategory,
        label: "Sumber Daya",
        description: "Surat terkait sumber daya seperti pengadaan, inventaris, dll.",
        icon: Building2,
    },
    {
        id: "UMUM" as LetterCategory,
        label: "Umum",
        description: "Surat umum lainnya yang tidak termasuk kategori di atas.",
        icon: Globe,
    }
];

const TEMPLATES = [
    {
        id: "surat-tugas" as TemplateTypeOption,
        label: "Surat Tugas",
        description: "Surat penugasan untuk satu orang dengan format standar.",
        icon: ClipboardList,
    },
    {
        id: "surat-tugas-table" as TemplateTypeOption,
        label: "Surat Tugas (Tabel)",
        description: "Surat penugasan untuk banyak orang dengan format tabel.",
        icon: Table,
    },
    {
        id: "surat-keputusan" as TemplateTypeOption,
        label: "Surat Keputusan",
        description: "Surat keputusan dekan untuk penetapan atau kegiatan resmi.",
        icon: Award,
    }
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BuatSuratDialog({ open, onOpenChange, userRole = "" }: BuatSuratDialogProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCategory, setSelectedCategory] = useState<LetterCategory | "">("");
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateTypeOption | "">("");

    // Filter categories based on user role
    // STAF_AKADEMIK / SUPERVISOR_AKADEMIK → AKADEMIK, UMUM
    // STAF_SUMBER_DAYA / SUPERVISOR_SUMBER_DAYA → SUMBER_DAYA, UMUM
    const availableCategories = CATEGORIES.filter((category) => {
        const isAkademikRole = ["STAF_AKADEMIK", "SUPERVISOR_AKADEMIK"].includes(userRole);
        const isSumberDayaRole = ["STAF_SUMBER_DAYA", "SUPERVISOR_SUMBER_DAYA"].includes(userRole);

        if (isAkademikRole) {
            return category.id === "AKADEMIK" || category.id === "UMUM";
        }
        if (isSumberDayaRole) {
            return category.id === "SUMBER_DAYA" || category.id === "UMUM";
        }
        // Default: show all categories
        return true;
    });

    const handleCategorySelect = (category: LetterCategory) => {
        setSelectedCategory(category);
    };

    const handleTemplateSelect = (template: TemplateTypeOption) => {
        setSelectedTemplate(template);
    };

    const handleNext = () => {
        if (step === 1 && selectedCategory) {
            setStep(2);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setSelectedTemplate("");
        }
    };

    const handleSubmit = () => {
        if (!selectedCategory || !selectedTemplate) return;

        // Navigate to buat-surat page with query params
        router.push(`/buat-surat?category=${selectedCategory}&type=${selectedTemplate}`);
        handleClose();
    };

    const handleClose = () => {
        setStep(1);
        setSelectedCategory("");
        setSelectedTemplate("");
        onOpenChange(false);
    };

    const getCardClasses = (isSelected: boolean) => {
        return isSelected
            ? "border-[#2B2B2B] bg-neutral-50"
            : "border-[#E1DFE0] bg-white hover:border-[#2B2B2B]/40 hover:bg-neutral-50/50";
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg" hideCloseButton>
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 ? "Pilih Jenis Surat" : "Pilih Template Surat"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Pilih kategori jenis surat yang akan Anda buat."
                            : "Pilih template surat sesuai kebutuhan Anda."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1: Category Selection */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 gap-3">
                            {availableCategories.map((category) => {
                                const IconComponent = category.icon;
                                const isSelected = selectedCategory === category.id;

                                return (
                                    <div
                                        key={category.id}
                                        onClick={() => handleCategorySelect(category.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            getCardClasses(isSelected)
                                        )}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <IconComponent className="w-5 h-5 text-[#2B2B2B]" />
                                                <span className="font-semibold">{category.label}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 2: Template Selection */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 gap-3">
                            {TEMPLATES.map((template) => {
                                const IconComponent = template.icon;
                                const isSelected = selectedTemplate === template.id;

                                return (
                                    <div
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            getCardClasses(isSelected)
                                        )}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <IconComponent className="w-5 h-5 text-[#2B2B2B]" />
                                                <span className="font-semibold">{template.label}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1 sm:flex-none border-[#E1DFE0] text-[#2B2B2B]"
                    >
                        Batal
                    </Button>

                    {step === 2 && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="flex-1 sm:flex-none border-[#E1DFE0] text-base-black font-medium"
                        >
                            Kembali
                        </Button>
                    )}

                    {step === 1 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!selectedCategory}
                            className="flex-1 sm:flex-none"
                        >
                            Lanjutkan
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedTemplate}
                            className="flex-1 sm:flex-none bg-base-black text-white hover:bg-base-black/90"
                        >
                            Buat Surat
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
