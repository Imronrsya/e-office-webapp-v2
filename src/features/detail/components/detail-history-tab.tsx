"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
    History,
} from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";
import { cn } from "@/lib/utils";

interface DetailHistoryTabProps {
    detail: SubmissionDetail;
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

export function DetailHistoryTab({ detail }: DetailHistoryTabProps) {
    if (detail.logs.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Belum ada riwayat</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-4">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-4">
                        {detail.logs.map((log, idx) => (
                            <div key={log.id} className="relative pl-10">
                                {/* Timeline dot */}
                                <div className={cn(
                                    "absolute left-2.5 w-3 h-3 rounded-full border-2 bg-background",
                                    idx === 0 ? "border-primary" : "border-muted-foreground/30"
                                )} />

                                <div className="text-sm">
                                    <p className="font-medium">{log.action}</p>
                                    <p className="text-muted-foreground">
                                        {log.actorName} ({log.actorRole})
                                    </p>
                                    {log.fromStatus && log.toStatus && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {log.fromStatus} → {log.toStatus}
                                        </p>
                                    )}
                                    {log.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                            &ldquo;{log.notes}&rdquo;
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDateTime(log.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}