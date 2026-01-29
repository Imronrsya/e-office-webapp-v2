"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { LogSummary } from "@/services/surat.service";
import { cn } from "@/lib/utils";

interface ProcessHistoryProps {
    logs: LogSummary[];
    isWaiting: boolean;
    currentActiveRole: string | null;
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

function getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
        'KAPRODI': 'Ketua Prodi',
        'ADMIN_PRODI': 'Admin Prodi',
        'KADEP': 'Ketua Departemen',
        'ADMIN_FAKULTAS': 'Admin Fakultas',
        'DEKAN': 'Dekan',
        'WADEK_1': 'Wakil Dekan 1',
        'WADEK_2': 'Wakil Dekan 2',
        'UPA': 'UPA',
        'MANAJER_TU': 'Manajer TU',
        'SUPERVISOR_AKADEMIK': 'Supervisor Akademik',
        'SUPERVISOR_SUMBER_DAYA': 'Supervisor Sumber Daya',
        'STAF_AKADEMIK': 'Staf Akademik',
        'STAF_SUMBER_DAYA': 'Staf Sumber Daya',
    };
    return roleLabels[role] || role;
}

function getWaitingLabel(role: string): string {
    const waitingLabels: Record<string, string> = {
        'KAPRODI': 'Verifikasi Oleh Ketua Prodi',
        'ADMIN_PRODI': 'Pembuatan Surat Pengantar',
        'KADEP': 'Tanda Tangan Ketua Departemen',
        'ADMIN_FAKULTAS': 'Penerimaan di Admin Fakultas',
        'DEKAN': 'Proses Oleh Dekan',
        'WADEK_1': 'Proses Oleh Wakil Dekan 1',
        'WADEK_2': 'Proses Oleh Wakil Dekan 2',
        'MANAJER_TU': 'Verifikasi Oleh Manajer TU',
        'SUPERVISOR_AKADEMIK': 'Verifikasi Oleh Supervisor',
        'SUPERVISOR_SUMBER_DAYA': 'Verifikasi Oleh Supervisor',
        'STAF_AKADEMIK': 'Pembuatan Surat Oleh Staf',
        'STAF_SUMBER_DAYA': 'Pembuatan Surat Oleh Staf',
    };
    return waitingLabels[role] || `Menunggu ${getRoleLabel(role)}`;
}

export function ProcessHistory({ logs, isWaiting, currentActiveRole }: ProcessHistoryProps) {
    // Sort logs in reverse chronological order (newest first from top to bottom)
    const displayLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <h3 className="text-sm font-bold text-black mb-6">Riwayat Proses</h3>
                
                <div className="flex gap-4">
                    {/* Timeline Icons Column */}
                    <div className="flex flex-col items-center pt-1">
                        {/* Current waiting status (at top) */}
                        {isWaiting && currentActiveRole && (
                            <>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 bg-white border-zinc-400 flex-shrink-0">
                                    <Clock className="w-4 h-4 text-zinc-400" />
                                </div>
                                {displayLogs.length > 0 && <div className="w-0.5 h-12 bg-zinc-400" />}
                            </>
                        )}
                        
                        {/* Completed logs */}
                        {displayLogs.map((log, idx) => (
                            <div key={log.id} className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                {idx < displayLogs.length - 1 && <div className="w-0.5 h-12 bg-zinc-400" />}
                            </div>
                        ))}
                    </div>
                    
                    {/* Timeline Content Column */}
                    <div className="flex flex-col flex-1 pt-1">
                        {/* Current waiting status content */}
                        {isWaiting && currentActiveRole && (
                            <div className={cn(
                                "flex items-start min-h-10",
                                displayLogs.length > 0 && "mb-8"
                            )}>
                                <div>
                                    <p className="text-sm font-bold text-black leading-5">
                                        {getWaitingLabel(currentActiveRole)}
                                    </p>
                                    <p className="text-sm text-zinc-500 leading-5">Menunggu proses...</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Completed logs content */}
                        {displayLogs.map((log, idx) => (
                            <div 
                                key={log.id} 
                                className={cn(
                                    "flex items-start min-h-10",
                                    idx < displayLogs.length - 1 && "mb-8"
                                )}
                            >
                                <div>
                                    <p className="text-sm font-bold text-black leading-5">{log.action}</p>
                                    <p className="text-sm text-black leading-5">
                                        Oleh: {log.actorName} • {formatDateTime(log.createdAt)}
                                    </p>
                                    {log.notes && (
                                        <p className="text-sm text-zinc-500 italic mt-1">
                                            &ldquo;{log.notes}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
