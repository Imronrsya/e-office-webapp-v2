"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";
import { cn } from "@/lib/utils";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    RefreshCw,
} from "lucide-react";

interface DetailHeaderProps {
    detail: SubmissionDetail;
    onBack: () => void;
}

function getStatusBadge(status: string) {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
        DRAFT: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Draft" },
        SUBMITTED: { variant: "default", icon: <AlertCircle className="w-3 h-3" />, label: "Diajukan" },
        WAITING_KAPRODI: { variant: "default", icon: <Clock className="w-3 h-3" />, label: "Menunggu Kaprodi" },
        WAITING_ADMIN_PRODI: { variant: "default", icon: <Clock className="w-3 h-3" />, label: "Menunggu Admin Prodi" },
        WAITING_KADEP: { variant: "default", icon: <Clock className="w-3 h-3" />, label: "Menunggu Kadep" },
        APPROVED_DEPT: { variant: "default", icon: <CheckCircle className="w-3 h-3" />, label: "Disetujui Departemen" },
        REJECTED_DEPT: { variant: "destructive", icon: <XCircle className="w-3 h-3" />, label: "Ditolak Departemen" },
        WAITING_FACULTY: { variant: "default", icon: <Clock className="w-3 h-3" />, label: "Menunggu Fakultas" },
        PROCESSING_FACULTY: { variant: "default", icon: <RefreshCw className="w-3 h-3" />, label: "Diproses Fakultas" },
        COMPLETED: { variant: "secondary", icon: <CheckCircle className="w-3 h-3" />, label: "Selesai" },
        REJECTED: { variant: "destructive", icon: <XCircle className="w-3 h-3" />, label: "Ditolak" },
        RETURNED: { variant: "outline", icon: <AlertCircle className="w-3 h-3" />, label: "Dikembalikan" },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, icon: <Clock className="w-3 h-3" />, label: status };

    return (
        <Badge variant={config.variant} className="flex items-center gap-1">
            {config.icon}
            {config.label}
        </Badge>
    );
}

export function DetailHeader({ detail, onBack }: DetailHeaderProps) {
    const { submissionValues } = detail;

    return (
        <div className="bg-white border-b sticky top-0 z-10">
            <div className="container max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-semibold truncate">{submissionValues.judulAcara}</h1>
                        <p className="text-sm text-muted-foreground">{detail.letterType.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(detail.status)}
                    <Badge variant="outline">{detail.priority}</Badge>
                </div>
            </div>
        </div>
    );
}
