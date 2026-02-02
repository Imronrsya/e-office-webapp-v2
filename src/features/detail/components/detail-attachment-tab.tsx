"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Paperclip,
    Download,
} from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";

interface DetailAttachmentTabProps {
    detail: SubmissionDetail;
    onDownloadAttachment: (attachmentId: string, fileName: string) => Promise<void>;
}

function formatFileSize(bytes: number | null | undefined) {
    if (!bytes) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDateTime(dateString: string | null | undefined) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function DetailAttachmentTab({ detail, onDownloadAttachment }: DetailAttachmentTabProps) {
    if (detail.attachments.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Paperclip className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Tidak ada lampiran</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-4">
                <div className="space-y-2">
                    {detail.attachments.map((att) => (
                        <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                                <Paperclip className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{att.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(att.fileSize)} • {formatDateTime(att.uploadedAt)}
                                </p>
                                {att.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{att.description}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDownloadAttachment(att.id, att.fileName)}
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}