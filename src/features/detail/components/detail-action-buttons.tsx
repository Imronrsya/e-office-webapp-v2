"use client";

import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    XCircle,
    FileSignature,
    Send,
    Share2,
    Eye,
    RotateCcw,
    CheckCheck,
    Hash,
    Stamp,
} from "lucide-react";
import { SubmissionPermissions } from "@/services/surat.service";

interface DetailActionButtonsProps {
    permissions: SubmissionPermissions;
    submissionId: string;
    onApprove?: () => void;
    onReject?: () => void;
    onSign?: () => void;
    onDraft?: () => void;
    onForward?: () => void;
    onDispose?: () => void;
    onVerify?: () => void;
    onReturn?: () => void;
    onFinish?: () => void;
    onAssignNumber?: () => void;
    onStamp?: () => void;
}

export function DetailActionButtons({ permissions, onApprove, onReject, onSign, onDraft, onForward, onDispose, onVerify, onReturn, onFinish, onAssignNumber, onStamp }: DetailActionButtonsProps) {
    const buttons = [];

    // Department Approval Actions (Kaprodi)
    if (permissions.canApprove && onApprove) {
        buttons.push(
            <Button key="approve" onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Setujui
            </Button>
        );
    }

    if (permissions.canReject && onReject) {
        buttons.push(
            <Button key="reject" onClick={onReject} variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Tolak
            </Button>
        );
    }

    // Department Sign Actions (Kadep)
    if (permissions.canSign && onSign) {
        buttons.push(
            <Button key="sign" onClick={onSign} className="bg-blue-600 hover:bg-blue-700">
                <FileSignature className="w-4 h-4 mr-2" />
                Tanda Tangan
            </Button>
        );
    }

    // Department Draft Actions (Admin Prodi)
    if (permissions.canDraft && onDraft) {
        buttons.push(
            <Button key="draft" onClick={onDraft} className="bg-purple-600 hover:bg-purple-700">
                <FileSignature className="w-4 h-4 mr-2" />
                Buat Surat Pengantar
            </Button>
        );
    }

    // Faculty Actions
    if (permissions.canForward && onForward) {
        buttons.push(
            <Button key="forward" onClick={onForward} className="bg-indigo-600 hover:bg-indigo-700">
                <Send className="w-4 h-4 mr-2" />
                Teruskan
            </Button>
        );
    }

    if (permissions.canDispose && onDispose) {
        buttons.push(
            <Button key="dispose" onClick={onDispose} className="bg-cyan-600 hover:bg-cyan-700">
                <Share2 className="w-4 h-4 mr-2" />
                Disposisi
            </Button>
        );
    }

    if (permissions.canVerify && onVerify) {
        buttons.push(
            <Button key="verify" onClick={onVerify} className="bg-teal-600 hover:bg-teal-700">
                <Eye className="w-4 h-4 mr-2" />
                Verifikasi
            </Button>
        );
    }

    if (permissions.canReturn && onReturn) {
        buttons.push(
            <Button key="return" onClick={onReturn} variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                <RotateCcw className="w-4 h-4 mr-2" />
                Kembalikan
            </Button>
        );
    }

    if (permissions.canFinish && onFinish) {
        buttons.push(
            <Button key="finish" onClick={onFinish} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCheck className="w-4 h-4 mr-2" />
                Selesaikan
            </Button>
        );
    }

    // UPA Actions
    if (permissions.canAssignNumber && onAssignNumber) {
        buttons.push(
            <Button key="assign-number" onClick={onAssignNumber} className="bg-amber-600 hover:bg-amber-700">
                <Hash className="w-4 h-4 mr-2" />
                Beri Nomor
            </Button>
        );
    }

    if (permissions.canStamp && onStamp) {
        buttons.push(
            <Button key="stamp" onClick={onStamp} className="bg-rose-600 hover:bg-rose-700">
                <Stamp className="w-4 h-4 mr-2" />
                Beri Cap
            </Button>
        );
    }

    return <>{buttons}</>;
}
