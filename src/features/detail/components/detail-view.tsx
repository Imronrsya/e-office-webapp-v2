"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Download, FileText } from "lucide-react";
import { SubmissionDetail, LogSummary } from "@/services/surat.service";
import { cn } from "@/lib/utils";

interface DetailViewProps {
    detail: SubmissionDetail;
    onDownloadAttachment: (attachmentId: string, fileName: string) => Promise<void>;
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

// Timeline Item Component
function TimelineItem({ log, isLast, isFirst }: { log: LogSummary; isLast: boolean; isFirst: boolean }) {
    const isDone = !isFirst; // First item is current/waiting, rest are done
    
    return (
        <div className="flex items-start gap-4">
            {/* Timeline Icon */}
            <div className="flex flex-col items-center">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-4",
                    isDone 
                        ? "bg-green-500 border-green-500" 
                        : "bg-white border-zinc-400"
                )}>
                    {isDone ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                        <Clock className="w-5 h-5 text-zinc-400" />
                    )}
                </div>
                {!isLast && (
                    <div className="w-0.5 h-6 bg-zinc-400" />
                )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-2">
                <p className="text-sm font-bold text-black">{log.action}</p>
                <p className="text-sm text-black">
                    Oleh: {log.actorName} • {formatDateTime(log.createdAt)}
                </p>
                {log.notes && (
                    <p className="text-sm text-zinc-500 italic">&ldquo;{log.notes}&rdquo;</p>
                )}
            </div>
        </div>
    );
}

// Info Row Component
function InfoRow({ label, value, showSeparator = true }: { label: string; value: string; showSeparator?: boolean }) {
    return (
        <>
            <div className="py-3">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="text-sm text-black">{value}</p>
            </div>
            {showSeparator && <Separator className="bg-zinc-400" />}
        </>
    );
}

export function DetailView({ detail, onDownloadAttachment }: DetailViewProps) {
    const { submissionValues, logs, attachments } = detail;

    // Reverse logs for display (oldest first, then current status)
    const displayLogs = [...logs].reverse();

    // Add waiting status if not completed
    const isWaiting = !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(detail.status);
    
    return (
        <div className="space-y-6">
            {/* Riwayat Proses */}
            <Card className="bg-neutral-50 border-zinc-400">
                <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-black mb-6">Riwayat Proses</h3>
                    
                    <div className="space-y-0">
                        {/* Current waiting status */}
                        {isWaiting && detail.currentActiveRole && (
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 bg-white border-zinc-400">
                                        <Clock className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    {displayLogs.length > 0 && (
                                        <div className="w-0.5 h-6 bg-zinc-400" />
                                    )}
                                </div>
                                <div className="flex-1 pb-2">
                                    <p className="text-sm font-bold text-black">
                                        {detail.currentActiveRole === 'KAPRODI' && 'Verifikasi Oleh Ketua Prodi'}
                                        {detail.currentActiveRole === 'ADMIN_PRODI' && 'Pembuatan Surat Pengantar'}
                                        {detail.currentActiveRole === 'KADEP' && 'Tanda Tangan Ketua Departemen'}
                                        {!['KAPRODI', 'ADMIN_PRODI', 'KADEP'].includes(detail.currentActiveRole) && `Menunggu ${detail.currentActiveRole}`}
                                    </p>
                                    <p className="text-sm text-zinc-500">Menunggu proses...</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Completed logs */}
                        {displayLogs.map((log, idx) => (
                            <TimelineItem 
                                key={log.id} 
                                log={log} 
                                isFirst={false}
                                isLast={idx === displayLogs.length - 1} 
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Detail Surat */}
            <Card className="bg-neutral-50 border-zinc-400">
                <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-black mb-4">Detail Surat</h3>
                    
                    <InfoRow 
                        label="Tipe Surat" 
                        value={submissionValues.jenisSurat === 'SURAT_TUGAS' ? 'Surat Tugas' : 'Surat Keputusan'} 
                    />
                    <InfoRow 
                        label="Jenis Surat" 
                        value={(() => {
                            const cat = detail.category || detail.letterType?.category;
                            if (!cat) return '-';
                            const map: Record<string, string> = { AKADEMIK: 'Akademik', SUMBER_DAYA: 'Sumber Daya', UMUM: 'Umum' };
                            return map[cat] || cat;
                        })()} 
                    />
                    <InfoRow 
                        label="Judul Surat" 
                        value={submissionValues.judulAcara} 
                    />
                    <InfoRow 
                        label="Keperluan" 
                        value={submissionValues.keperluan} 
                        showSeparator={false}
                    />
                </CardContent>
            </Card>

            {/* Identitas Pemohon */}
            <Card className="bg-neutral-50 border-zinc-400">
                <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-black mb-4">Identitas Pemohon</h3>
                    
                    <InfoRow 
                        label="Nama Lengkap" 
                        value={submissionValues.nama} 
                    />
                    <InfoRow 
                        label={submissionValues.nim ? "NIM" : "NIP"} 
                        value={submissionValues.nim || submissionValues.nip || "-"} 
                    />
                    <InfoRow 
                        label="Program Studi" 
                        value={submissionValues.programStudi} 
                        showSeparator={false}
                    />
                </CardContent>
            </Card>

            {/* Lampiran */}
            {attachments.length > 0 && (
                <Card className="bg-neutral-50 border-zinc-400">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold text-black mb-4">Lampiran</h3>
                        
                        <div className="space-y-3">
                            {attachments.map((att) => (
                                <div 
                                    key={att.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-400"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-black">{att.fileName}</p>
                                            <p className="text-sm text-zinc-400">{formatFileSize(att.fileSize)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDownloadAttachment(att.id, att.fileName)}
                                    >
                                        <Download className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
