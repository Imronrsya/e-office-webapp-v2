"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Circle } from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";
import { cn } from "@/lib/utils";

interface DetailHistorySidebarProps {
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

export function DetailHistorySidebar({ detail }: DetailHistorySidebarProps) {
    if (detail.logs.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Riwayat Proses</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Belum ada riwayat</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-fit sticky top-20">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Riwayat Proses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {detail.logs.map((log, idx) => {
                    const isLatest = idx === 0;
                    const isDone = log.toStatus && !log.toStatus.includes("WAITING");
                    
                    return (
                        <div key={log.id} className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                isDone ? "bg-green-100" : isLatest ? "bg-blue-100" : "bg-gray-100"
                            )}>
                                {isDone ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : isLatest ? (
                                    <Clock className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-sm font-medium leading-tight">{log.action}</p>
                                <p className="text-xs text-muted-foreground">
                                    Oleh: {log.actorName}
                                </p>
                                {log.notes && (
                                    <p className="text-xs text-muted-foreground italic">
                                        &ldquo;{log.notes}&rdquo;
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTime(log.createdAt)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
