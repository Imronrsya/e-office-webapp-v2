"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Info, History } from "lucide-react";
import { LogSummary } from "@/services/surat.service";
import { cn } from "@/lib/utils";

interface ProcessHistoryProps {
    logs: LogSummary[];
    isWaiting: boolean;
    currentActiveRole: string | null;
    currentStatus?: string;
    userScope?: 'DEPARTEMEN' | 'FAKULTAS' | 'UPA';
    filterType?: 'masuk' | 'keluar' | null;
    /** Enable collapsible mode — show only maxVisible items by default */
    collapsible?: boolean;
    /** Number of items to show when collapsed (default: 3) */
    maxVisible?: number;
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
        'WADEK_1': 'Wakil Dekan I',
        'WADEK_2': 'Wakil Dekan II',
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
        'WADEK_1': 'Proses Oleh Wakil Dekan I',
        'WADEK_2': 'Proses Oleh Wakil Dekan II',
        'MANAJER_TU': 'Verifikasi Oleh Manajer TU',
        'SUPERVISOR_AKADEMIK': 'Verifikasi Oleh Supervisor',
        'SUPERVISOR_SUMBER_DAYA': 'Verifikasi Oleh Supervisor',
        'STAF_AKADEMIK': 'Pembuatan Surat Oleh Staf',
        'STAF_SUMBER_DAYA': 'Pembuatan Surat Oleh Staf',
    };
    return waitingLabels[role] || `Menunggu ${getRoleLabel(role)}`;
}

function getActionLabel(action: string, actorRole?: string): string {
    // Special handling for DISPOSITION action based on actor role
    if (action.toUpperCase() === 'DISPOSITION' && actorRole === 'ADMIN_FAKULTAS') {
        return 'Diteruskan';
    }

    // Special handling for staff verification (Diverifikasi -> Diajukan)
    if (action.toUpperCase() === 'VERIFY' && actorRole && ['STAF_AKADEMIK', 'STAF_SUMBER_DAYA', 'ADMIN_PRODI'].includes(actorRole)) {
        return 'Diajukan';
    }

    // Special handling for supervisor approval (Disetujui -> Diverifikasi)
    if (action.toUpperCase() === 'APPROVE' && actorRole && ['SUPERVISOR_AKADEMIK', 'SUPERVISOR_SUMBER_DAYA'].includes(actorRole)) {
        return 'Diverifikasi';
    }

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

function transformNotes(notes: string | null, action: string, actorRole?: string): string | null {
    if (!notes) return notes;

    // Transform notes for Admin Fakultas disposition actions
    if (action.toUpperCase() === 'DISPOSITION' && actorRole === 'ADMIN_FAKULTAS') {
        // Replace "Disposisi ke" with "Meneruskan ke"
        // Case variations: "Disposisi ke", "disposisi ke", "DISPOSISI KE"
        return notes.replace(/Disposisi ke/gi, 'Meneruskan ke');
    }

    return notes;
}

export function ProcessHistory({ logs, isWaiting, currentActiveRole, currentStatus, userScope, filterType, collapsible = false, maxVisible = 3 }: ProcessHistoryProps) {
    const [expanded, setExpanded] = useState(false);
    // Filter logs berdasarkan scope dan filter type
    // Untuk lingkup fakultas dengan filter:
    // - masuk: hanya tampilkan log terkait surat pengantar (dari pengajuan hingga didisposisikan ke staf)
    // - keluar: hanya tampilkan log terkait surat hasil (dari staf membuat draft hingga UPA selesai)
    const filterLogsForDisplay = (allLogs: LogSummary[]): LogSummary[] => {
        // Filter out tembusan logs and intermediate UPA actions 
        // as they are not needed in the visible history
        const baseLogs = allLogs.filter(log => {
            if (log.notes?.toLowerCase().includes('tembusan dikirim ke')) return false;
            if (['ASSIGN_NUMBER', 'STAMP', 'GENERATE_QR'].includes(log.action)) return false;
            return true;
        });

        if (userScope === 'FAKULTAS' && filterType) {
            if (filterType === 'masuk') {
                // Riwayat Surat Masuk:
                // Pengajuan -> Kaprodi approve -> Admin Prodi buat draft pengantar -> 
                // Kadep tanda tangan -> Diterima Fakultas -> Didisposisikan ke Staf/Supervisor ->
                // CLOSING: Draft Dibuat oleh Staf (DRAFT_CREATE dari SURAT_DIBUAT)

                // Log yang termasuk surat masuk (berdasarkan status)
                const suratMasukStatuses = [
                    'SUBMITTED',
                    'KAPRODI_REVIEW',
                    'SURAT_PENGANTAR_DRAFT',
                    'SURAT_PENGANTAR_REVIEW',
                    'SURAT_PENGANTAR_SIGNED',
                    'FAKULTAS_RECEIVED',
                    'FAKULTAS_DISPOSITION',
                    'SURAT_DIBUAT', // PENUTUP Surat Masuk - disposisi ke staff
                ];

                return baseLogs.filter(log => {
                    const fromStatus = log.fromStatus?.toUpperCase() || '';
                    const toStatus = log.toStatus?.toUpperCase() || '';

                    // PERBAIKAN: Include log DRAFT_CREATE yang fromStatus = SURAT_DIBUAT
                    // sebagai CLOSING marker untuk Surat Masuk
                    const isDraftCreateFromSuratDibuat =
                        log.action === 'DRAFT_CREATE' &&
                        fromStatus.includes('SURAT_DIBUAT');

                    if (isDraftCreateFromSuratDibuat) {
                        return true; // PASTI include - ini closing Surat Masuk
                    }

                    // Include jika fromStatus atau toStatus ada di fase surat masuk
                    const isInMasukPhase = suratMasukStatuses.some(status =>
                        fromStatus.includes(status) || toStatus.includes(status)
                    );

                    // Exclude log disposisi yang menuju SURAT_DIBUAT jika dari fase keluar
                    // Ini untuk mencegah duplikasi log disposisi di timeline masuk
                    const isDispositionToSuratDibuat =
                        log.action === 'DISPOSITION' &&
                        toStatus.includes('SURAT_DIBUAT');

                    // Exclude jika sudah masuk fase drafting SK/ST (FAKULTAS_DRAFTING dan seterusnya)
                    const isInKeluarPhase =
                        fromStatus.includes('FAKULTAS_DRAFTING') || toStatus.includes('FAKULTAS_DRAFTING') ||
                        fromStatus.includes('FAKULTAS_VERIFICATION') || toStatus.includes('FAKULTAS_VERIFICATION') ||
                        fromStatus.includes('FAKULTAS_SIGNING') || toStatus.includes('FAKULTAS_SIGNING') ||
                        fromStatus.includes('UPA_') || toStatus.includes('UPA_') ||
                        fromStatus.includes('COMPLETED') || toStatus.includes('COMPLETED');

                    // Include jika di fase masuk DAN (disposisi ke SURAT_DIBUAT ATAU tidak di fase keluar)
                    return isInMasukPhase && (isDispositionToSuratDibuat || !isInKeluarPhase);
                });
            } else {
                // Riwayat Surat Keluar:
                // Staf/Supervisor buat draft SK/ST -> Supervisor verifikasi -> Manajer TU verifikasi ->
                // Pejabat tanda tangan -> UPA beri nomor -> UPA stempel -> UPA finalisasi

                // PERBAIKAN: Log pertama HARUS "Draft Surat Dibuat" (DRAFT_CREATE)
                // JANGAN include log DISPOSITION ke SURAT_DIBUAT (itu milik Surat Masuk)

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

                return baseLogs.filter(log => {
                    const fromStatus = log.fromStatus?.toUpperCase() || '';
                    const toStatus = log.toStatus?.toUpperCase() || '';

                    // PERBAIKAN: Exclude log DISPOSITION dengan toStatus SURAT_DIBUAT
                    // (itu milik timeline Surat Masuk, bukan Surat Keluar)
                    const isDispositionToSuratDibuat =
                        log.action === 'DISPOSITION' &&
                        toStatus.includes('SURAT_DIBUAT');

                    if (isDispositionToSuratDibuat) {
                        return false; // JANGAN tampilkan di Surat Keluar
                    }

                    // Include jika fromStatus atau toStatus ada di fase surat keluar
                    return suratKeluarStatuses.some(status =>
                        fromStatus.includes(status) || toStatus.includes(status)
                    );
                });
            }
        }

        // Untuk departemen dan UPA, tampilkan semua log (kecuali tembusan)
        return baseLogs;
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

    // PERBAIKAN: Di Surat Masuk, jika sudah ada log "Draft Dibuat" dari fase SURAT_DIBUAT
    // (yaitu Staf mulai membuat draft SK/ST), maka jangan tampilkan "waiting" indicator 
    // karena Surat Masuk sudah selesai.
    // NOTE: Harus spesifik cek fromStatus = SURAT_DIBUAT agar tidak salah match 
    // dengan DRAFT_CREATE dari Admin Prodi (surat pengantar) yang fromStatus = SURAT_PENGANTAR_DRAFT
    const shouldHideWaiting =
        userScope === 'FAKULTAS' &&
        filterType === 'masuk' &&
        displayLogs.some(log =>
            log.action === 'DRAFT_CREATE' &&
            log.fromStatus?.toUpperCase().includes('SURAT_DIBUAT')
        );

    const showWaiting = isWaiting && currentActiveRole && !shouldHideWaiting;

    // Collapsible support: show only N most recent items when collapsed
    const visibleLogs = collapsible && !expanded
        ? displayLogs.slice(0, maxVisible)
        : displayLogs;
    const hasMore = collapsible && displayLogs.length > maxVisible;

    return (
        <Card className="bg-neutral-50 border-zinc-400">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" />
                    {getTitle()}
                </CardTitle>
            </CardHeader>
            <CardContent>

                {/* Info untuk filter surat keluar jika belum ada log */}
                {userScope === 'FAKULTAS' && filterType === 'keluar' && displayLogs.length === 0 && (
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <Info className="w-4 h-4" />
                        <span>Belum ada riwayat proses surat keluar.</span>
                    </div>
                )}

                <div className={cn(
                    "space-y-0",
                    collapsible && expanded && "max-h-[400px] overflow-y-auto pr-1"
                )}>
                    {/* Current waiting status (at top) */}
                    {showWaiting && (
                        <div className="flex gap-4">
                            {/* Timeline Icon */}
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 bg-white border-zinc-400 flex-shrink-0">
                                    <Clock className="w-4 h-4 text-zinc-400" />
                                </div>
                                {visibleLogs.length > 0 && <div className="w-0.5 flex-1 bg-zinc-400 min-h-4" />}
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
                    {visibleLogs.map((log, idx) => (
                        <div key={log.id} className="flex gap-4">
                            {/* Timeline Icon */}
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                {idx < visibleLogs.length - 1 && <div className="w-0.5 flex-1 bg-zinc-400 min-h-4" />}
                            </div>
                            {/* Content */}
                            <div className={cn(
                                "min-w-0 flex-1",
                                idx < visibleLogs.length - 1 && "pb-6"
                            )}>
                                <p className="text-sm font-bold text-black leading-5">{getActionLabel(log.action, log.actorRole)}</p>
                                <p className="text-sm text-black leading-5">
                                    Oleh: {log.actorName} • {formatDateTime(log.createdAt)}
                                </p>
                                {log.notes && (
                                    <p className="text-sm text-zinc-500 italic mt-1 break-words whitespace-pre-wrap">
                                        &ldquo;{transformNotes(log.notes, log.action, log.actorRole)}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Expand/Collapse button */}
                {hasMore && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        {expanded ? "Tampilkan Sedikit" : `Lihat Semua (${displayLogs.length})`}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
