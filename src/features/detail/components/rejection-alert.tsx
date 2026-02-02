"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";

interface RejectionAlertProps {
    detail: SubmissionDetail;
}

export function RejectionAlert({ detail }: RejectionAlertProps) {
    if (!detail.permissions.showAlasanDitolak || !detail.rejectionReason) {
        return null;
    }

    return (
        <Card className="border-destructive bg-destructive/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Alasan Penolakan
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{detail.rejectionReason}</p>
            </CardContent>
        </Card>
    );
}