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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    FileText, 
    ArrowRight, 
    ArrowLeft,
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
        color: "blue"
    },
    {
        id: "SUMBER_DAYA" as LetterCategory,
        label: "Sumber Daya",
        description: "Surat terkait sumber daya seperti pengadaan, inventaris, dll.",
        icon: Building2,
        color: "emerald"
    },
    {
        id: "UMUM" as LetterCategory,
        label: "Umum",
        description: "Surat umum lainnya yang tidak termasuk kategori di atas.",
        icon: Globe,
        color: "purple"
    }
];

const TEMPLATES = [
    {
        id: "surat-tugas" as TemplateTypeOption,
        label: "Surat Tugas",
        description: "Surat penugasan untuk satu orang dengan format standar.",
        icon: ClipboardList,
        color: "blue"
    },
    {
        id: "surat-tugas-table" as TemplateTypeOption,
        label: "Surat Tugas (Tabel)",
        description: "Surat penugasan untuk banyak orang dengan format tabel.",
        icon: Table,
        color: "emerald"
    },
    {
        id: "surat-keputusan" as TemplateTypeOption,
        label: "Surat Keputusan",
        description: "Surat keputusan dekan untuk penetapan atau kegiatan resmi.",
        icon: Award,
        color: "purple"
    }
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BuatSuratDialog({ open, onOpenChange }: BuatSuratDialogProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCategory, setSelectedCategory] = useState<LetterCategory | "">("");
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateTypeOption | "">("");

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

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { border: string; bg: string; hover: string }> = {
            blue: {
                border: isSelected ? "border-blue-600" : "border-border hover:border-blue-300",
                bg: isSelected ? "bg-blue-50" : "hover:bg-blue-50/50",
                hover: "hover:border-blue-300"
            },
            emerald: {
                border: isSelected ? "border-emerald-600" : "border-border hover:border-emerald-300",
                bg: isSelected ? "bg-emerald-50" : "hover:bg-emerald-50/50",
                hover: "hover:border-emerald-300"
            },
            purple: {
                border: isSelected ? "border-purple-600" : "border-border hover:border-purple-300",
                bg: isSelected ? "bg-purple-50" : "hover:bg-purple-50/50",
                hover: "hover:border-purple-300"
            }
        };
        return colors[color] || colors.blue;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
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
                        <RadioGroup
                            value={selectedCategory}
                            onValueChange={(value) => handleCategorySelect(value as LetterCategory)}
                            className="grid grid-cols-1 gap-3"
                        >
                            {CATEGORIES.map((category) => {
                                const IconComponent = category.icon;
                                const isSelected = selectedCategory === category.id;
                                const colorClasses = getColorClasses(category.color, isSelected);

                                return (
                                    <Label
                                        key={category.id}
                                        htmlFor={category.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            colorClasses.border,
                                            colorClasses.bg
                                        )}
                                    >
                                        <RadioGroupItem value={category.id} id={category.id} className="mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <IconComponent className={cn(
                                                    "w-5 h-5",
                                                    category.color === "blue" && "text-blue-600",
                                                    category.color === "emerald" && "text-emerald-600",
                                                    category.color === "purple" && "text-purple-600"
                                                )} />
                                                <span className="font-semibold">{category.label}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                        </div>
                                    </Label>
                                );
                            })}
                        </RadioGroup>
                    )}

                    {/* Step 2: Template Selection */}
                    {step === 2 && (
                        <RadioGroup
                            value={selectedTemplate}
                            onValueChange={(value) => handleTemplateSelect(value as TemplateTypeOption)}
                            className="grid grid-cols-1 gap-3"
                        >
                            {TEMPLATES.map((template) => {
                                const IconComponent = template.icon;
                                const isSelected = selectedTemplate === template.id;
                                const colorClasses = getColorClasses(template.color, isSelected);

                                return (
                                    <Label
                                        key={template.id}
                                        htmlFor={template.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            colorClasses.border,
                                            colorClasses.bg
                                        )}
                                    >
                                        <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <IconComponent className={cn(
                                                    "w-5 h-5",
                                                    template.color === "blue" && "text-blue-600",
                                                    template.color === "emerald" && "text-emerald-600",
                                                    template.color === "purple" && "text-purple-600"
                                                )} />
                                                <span className="font-semibold">{template.label}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {template.description}
                                            </p>
                                        </div>
                                    </Label>
                                );
                            })}
                        </RadioGroup>
                    )}
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    {step === 2 && (
                        <Button 
                            variant="outline" 
                            onClick={handleBack}
                            className="flex-1 sm:flex-none"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
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
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleSubmit}
                            disabled={!selectedTemplate}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Buat Surat
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
