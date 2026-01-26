"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FileText,
    Download,
    CheckCircle,
} from "lucide-react";
import { SubmissionDetail } from "@/services/surat.service";

interface DetailDocumentTabProps {
    detail: SubmissionDetail;
    onDownloadDocument: (docId: string, fileName: string) => Promise<void>;
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

export function DetailDocumentTab({ detail, onDownloadDocument }: DetailDocumentTabProps) {
    if (detail.documents.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Belum ada dokumen</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {detail.documents.map((doc) => (
                <Card key={doc.id}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                                {doc.type === 'SURAT_PENGANTAR' ? 'Surat Pengantar' :
                                 doc.type === 'SURAT_TUGAS' ? 'Surat Tugas' : 'Surat Keputusan'}
                            </CardTitle>
                            {doc.isSigned && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Ditandatangani
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {doc.nomorSurat && (
                            <div className="text-sm">
                                <p className="text-muted-foreground">Nomor Surat</p>
                                <p className="font-medium font-mono">{doc.nomorSurat}</p>
                            </div>
                        )}
                        {doc.perihal && (
                            <div className="text-sm">
                                <p className="text-muted-foreground">Perihal</p>
                                <p className="font-medium">{doc.perihal}</p>
                            </div>
                        )}
                        {doc.tanggalSurat && (
                            <div className="text-sm">
                                <p className="text-muted-foreground">Tanggal Surat</p>
                                <p className="font-medium">{formatDate(doc.tanggalSurat)}</p>
                            </div>
                        )}
                        {doc.signatures.length > 0 && (
                            <>
                                <Separator />
                                <div className="text-sm">
                                    <p className="text-muted-foreground mb-2">Tanda Tangan</p>
                                    <div className="space-y-2">
                                        {doc.signatures.map((sig, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{sig.signerName}</p>
                                                    <p className="text-xs text-muted-foreground">{sig.signerRole} • {formatDateTime(sig.signedAt)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        {detail.permissions.canDownload && doc.fileUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => onDownloadDocument(doc.id, `${doc.type}_${doc.nomorSurat || doc.id}.pdf`)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}