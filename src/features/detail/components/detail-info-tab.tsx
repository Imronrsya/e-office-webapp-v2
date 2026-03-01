"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    FileText,
    Calendar,
    MapPin,
    Clock,
    User,
    Building,
} from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";

interface DetailInfoTabProps {
    detail: SubmissionDetail;
}

function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
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

export function DetailInfoTab({ detail }: DetailInfoTabProps) {
    const { submissionValues } = detail;

    return (
        <div className="space-y-4">
            {/* Informasi Pengaju */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Informasi Pengaju
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Nama</p>
                            <p className="font-medium">{submissionValues.nama}</p>
                        </div>
                        {submissionValues.nim && (
                            <div>
                                <p className="text-muted-foreground">NIM</p>
                                <p className="font-medium">{submissionValues.nim}</p>
                            </div>
                        )}
                        {submissionValues.nip && (
                            <div>
                                <p className="text-muted-foreground">NIP</p>
                                <p className="font-medium">{submissionValues.nip}</p>
                            </div>
                        )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Departemen</p>
                            <p className="font-medium">{submissionValues.departemen}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Program Studi</p>
                            <p className="font-medium">{submissionValues.programStudi}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Acara */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Detail Pengajuan
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm">
                        <p className="text-muted-foreground">Tipe Surat</p>
                        <p className="font-medium">
                            {submissionValues.jenisSurat === 'SURAT_TUGAS' ? 'Surat Tugas (ST)' : 'Surat Keputusan (SK)'}
                        </p>
                    </div>
                    <div className="text-sm">
                        <p className="text-muted-foreground">Jenis Surat</p>
                        <p className="font-medium">
                            {(() => {
                                const cat = detail.category || detail.letterType?.category;
                                if (!cat) return '-';
                                const map: Record<string, string> = { AKADEMIK: 'Akademik', SUMBER_DAYA: 'Sumber Daya', UMUM: 'Umum' };
                                return map[cat] || cat;
                            })()}
                        </p>
                    </div>
                    <div className="text-sm">
                        <p className="text-muted-foreground">Keperluan</p>
                        <p className="font-medium">{submissionValues.keperluan}</p>
                    </div>
                    <div className="text-sm">
                        <p className="text-muted-foreground">Judul Acara</p>
                        <p className="font-medium">{submissionValues.judulAcara}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground">Tanggal Acara</p>
                                <p className="font-medium">{formatDate(submissionValues.tanggalAcara)}</p>
                            </div>
                        </div>
                        {submissionValues.durasiAcara && (
                            <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-muted-foreground">Durasi</p>
                                    <p className="font-medium">{submissionValues.durasiAcara}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-muted-foreground">Lokasi</p>
                            <p className="font-medium">{submissionValues.lokasiAcara}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2 text-sm">
                        <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-muted-foreground">TTD Kepala Departemen</p>
                            <p className="font-medium">{submissionValues.butuhTtdKadep ? 'Ya, diperlukan' : 'Tidak diperlukan'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Konfigurasi Tanda Tangan */}
            {detail.signatureConfig && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Konfigurasi Tanda Tangan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>
                            <p className="text-muted-foreground">Penandatangan</p>
                            <p className="font-medium">{detail.signatureConfig.targetSigner}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">TTD Kadep</p>
                            <p className="font-medium">{detail.signatureConfig.requestKadepSign ? 'Ya' : 'Tidak'}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Metadata */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Informasi Tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Diajukan oleh: <span className="text-foreground">{detail.createdBy.name}</span></p>
                    <p>Email: <span className="text-foreground">{detail.createdBy.email}</span></p>
                    <p>Tanggal pengajuan: <span className="text-foreground">{formatDateTime(detail.submittedAt)}</span></p>
                    {detail.completedAt && (
                        <p>Tanggal selesai: <span className="text-foreground">{formatDateTime(detail.completedAt)}</span></p>
                    )}
                    {detail.currentActiveRole && (
                        <p>Saat ini di: <span className="text-foreground">{detail.currentActiveRole}</span></p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
