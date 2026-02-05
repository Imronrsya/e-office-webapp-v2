"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Info } from "lucide-react";
import { LogSummary } from "@/services/surat.service";
import { cn } from "@/lib/utils";

interface ProcessHistoryProps {
    logs: LogSummary[];
    isWaiting: boolean;
    currentActiveRole: string | null;
    /** Current status of the letter */
    currentStatus?: string;
    /** Scope user untuk menyesuaikan tampilan timeline */
    userScope?: 'DEPARTEMEN' | 'FAKULTAS' | 'UPA';
    /** Filter type dari dashboard (masuk/keluar) - hanya untuk lingkup fakultas */
    filterType?: 'masuk' | 'keluar' | null;
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

function getWaitingLabel(role: string, status?: string): string {
    // Special handling for KADEP - different label based on status
    if (role === 'KADEP') {
        // If status is SUBMITTED, KADEP is verifying (approving)
        // If status is SURAT_PENGANTAR_REVIEW, KADEP is signing
        if (status === 'SUBMITTED') {
            return 'Verifikasi Oleh Ketua Departemen';
        }
        return 'Tanda Tangan Ketua Departemen';
    }
    
    const waitingLabels: Record<string, string> = {
        'KAPRODI': 'Verifikasi Oleh Ketua Prodi',
        'ADMIN_PRODI': 'Pembuatan Surat Pengantar',
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

function getActionLabel(action: string): string {
    const actionLabels: Record<string, string> = {
        'SUBMIT': 'Pengajuan Dibuat',
        'RESUBMIT': 'Pengajuan Ulang',
        'APPROVE': 'Disetujui',
        'REJECT': 'Ditolak',
        'RETURN': 'Dikembalikan',
        'DISPOSITION': 'Didisposisikan',
        'DRAFT_CREATE': 'Draft Dibuat',
        'DRAFT_UPDATE': 'Draft Diperbarui',
        'VERIFY': 'Diverifikasi',
        'REQUEST_REVISION': 'Diminta Revisi',
        'SIGN': 'Ditandatangani',
        'ASSIGN_NUMBER': 'Diberi Nomor Surat',
        'STAMP': 'Distempel',
        'GENERATE_QR': 'QR Code Dibuat',
        'FINALIZE': 'Diselesaikan',
        'STATUS_CHANGE': 'Status Diubah',
        'COMMENT': 'Komentar',
        'VIEW': 'Dilihat',
    };
    return actionLabels[action.toUpperCase()] || action;
}

export function ProcessHistory({ logs, isWaiting, currentActiveRole, currentStatus, userScope, filterType }: ProcessHistoryProps) {
    // Filter logs berdasarkan scope dan filter type
    // Untuk lingkup fakultas dengan filter:
    // - masuk: hanya tampilkan log terkait surat pengantar (dari pengajuan hingga didisposisikan ke staf)
    // - keluar: hanya tampilkan log terkait surat hasil (dari staf membuat draft hingga UPA selesai)
    const filterLogsForDisplay = (allLogs: LogSummary[]): LogSummary[] => {
        if (userScope === 'FAKULTAS' && filterType) {
            if (filterType === 'masuk') {
                // Riwayat Surat Masuk:
                // Pengajuan -> Kaprodi approve -> Admin Prodi buat draft pengantar -> 
                // Kadep tanda tangan -> Diterima Fakultas -> Didisposisikan ke Staf/Supervisor
                // BERHENTI di sini. Proses selanjutnya (Staf buat draft SK/ST) masuk ke surat keluar.
                
                // Log yang termasuk surat masuk (berdasarkan status)
                const suratMasukStatuses = [
                    'SUBMITTED',
                    'KAPRODI_REVIEW',
                    'SURAT_PENGANTAR_DRAFT',
                    'SURAT_PENGANTAR_REVIEW',
                    'SURAT_PENGANTAR_SIGNED',
                    'FAKULTAS_RECEIVED',
                    'FAKULTAS_DISPOSITION',
                ];
                
                return allLogs.filter(log => {
                    const fromStatus = log.fromStatus?.toUpperCase() || '';
                    const toStatus = log.toStatus?.toUpperCase() || '';
                    
                    // Include jika fromStatus atau toStatus ada di fase surat masuk
                    const isInMasukPhase = suratMasukStatuses.some(status => 
                        fromStatus.includes(status) || toStatus.includes(status)
                    );
                    
                    // Exclude jika sudah masuk fase drafting SK/ST (FAKULTAS_DRAFTING dan seterusnya)
                    const isInKeluarPhase = 
                        fromStatus.includes('FAKULTAS_DRAFTING') || toStatus.includes('FAKULTAS_DRAFTING') ||
                        fromStatus.includes('FAKULTAS_VERIFICATION') || toStatus.includes('FAKULTAS_VERIFICATION') ||
                        fromStatus.includes('FAKULTAS_SIGNING') || toStatus.includes('FAKULTAS_SIGNING') ||
                        fromStatus.includes('UPA_') || toStatus.includes('UPA_') ||
                        fromStatus.includes('COMPLETED') || toStatus.includes('COMPLETED');
                    
                    return isInMasukPhase && !isInKeluarPhase;
                });
            } else {
                // Riwayat Surat Keluar:
                // Staf/Supervisor buat draft SK/ST -> Supervisor verifikasi -> Manajer TU verifikasi ->
                // Pejabat tanda tangan -> UPA beri nomor -> UPA stempel -> UPA finalisasi
                
                // Log yang termasuk surat keluar (berdasarkan status)
                const suratKeluarStatuses = [
                    'FAKULTAS_DRAFTING',
                    'FAKULTAS_VERIFICATION', 
                    'FAKULTAS_SIGNING',
                    'UPA_NUMBERING',
                    'UPA_STAMPING',
                    'UPA_FINALIZING',
                    'COMPLETED',
                ];
                
                return allLogs.filter(log => {
                    const fromStatus = log.fromStatus?.toUpperCase() || '';
                    const toStatus = log.toStatus?.toUpperCase() || '';
                    
                    // Include jika fromStatus atau toStatus ada di fase surat keluar
                    return suratKeluarStatuses.some(status => 
                        fromStatus.includes(status) || toStatus.includes(status)
                    );
                });
            }
        }
        
        // Untuk departemen dan UPA, tampilkan semua log
        return allLogs;
    };

    // Sort logs in reverse chronological order (newest first from top to bottom)
    const filteredLogs = filterLogsForDisplay(logs);
    const displayLogs = [...filteredLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Determine title based on scope and filter
    const getTitle = () => {
        if (userScope === 'FAKULTAS' && filterType) {
            return filterType === 'masuk' ? 'Riwayat Surat Masuk' : 'Riwayat Surat Keluar';
        }
        return 'Riwayat Proses';
    };

    return (
        <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <h3 className="text-sm font-bold text-black mb-6">{getTitle()}</h3>
                
                {/* Info untuk filter surat keluar jika belum ada log */}
                {userScope === 'FAKULTAS' && filterType === 'keluar' && displayLogs.length === 0 && (
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <Info className="w-4 h-4" />
                        <span>Belum ada riwayat proses surat keluar.</span>
                    </div>
                )}
                
                <div className="space-y-0">
                    {/* Current waiting status (at top) */}
                    {isWaiting && currentActiveRole && (
                        <div className="flex gap-4">
                            {/* Timeline Icon */}
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 bg-white border-zinc-400 flex-shrink-0">
                                    <Clock className="w-4 h-4 text-zinc-400" />
                                </div>
                                {displayLogs.length > 0 && <div className="w-0.5 flex-1 bg-zinc-400 min-h-4" />}
                            </div>
                            {/* Content */}
                            <div className="min-w-0 flex-1 pb-6">
                                <p className="text-sm font-bold text-black leading-5">
                                    {getWaitingLabel(currentActiveRole, currentStatus)}
                                </p>
                                <p className="text-sm text-zinc-500 leading-5">Menunggu proses...</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Completed logs */}
                    {displayLogs.map((log, idx) => (
                        <div key={log.id} className="flex gap-4">
                            {/* Timeline Icon */}
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                {idx < displayLogs.length - 1 && <div className="w-0.5 flex-1 bg-zinc-400 min-h-4" />}
                            </div>
                            {/* Content */}
                            <div className={cn(
                                "min-w-0 flex-1",
                                idx < displayLogs.length - 1 && "pb-6"
                            )}>
                                <p className="text-sm font-bold text-black leading-5">{getActionLabel(log.action)}</p>
                                <p className="text-sm text-black leading-5">
                                    Oleh: {log.actorName} • {formatDateTime(log.createdAt)}
                                </p>
                                {log.notes && (
                                    <p className="text-sm text-zinc-500 italic mt-1 break-words whitespace-pre-wrap">
                                        &ldquo;{log.notes}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
