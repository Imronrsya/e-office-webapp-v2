"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Menu,
    Minus,
    Plus,
    Maximize2,
    RotateCw,
    Download,
    Printer,
    MoreVertical,
    FileText,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    generateSuratPengantarHTML,
    formatTanggalIndonesia,
    type SuratPengantarData
} from "@/lib/templates/surat-pengantar";
import dynamic from "next/dynamic";
const PDFPreview = dynamic(() => import("@/components/surat-preview/PDFPreview").then(mod => mod.PDFPreview), { ssr: false });

interface SuratPreviewProps {
    // Data dari submission
    submissionData?: {
        nama: string;
        nim?: string;
        nip?: string;
        programStudi: string;
        departemen?: string;
        keperluan: string;
        judulAcara: string;
        tanggalAcara: string;
        lokasiAcara: string;
        durasiAcara?: string;
    };
    // Data dari document (jika sudah diproses)
    documentData?: {
        nomorSurat?: string | null;
        tanggalSurat?: string | null;
        perihal?: string | null;
        content?: Record<string, unknown> | null; // Content data from draft (namaTujuan, jabatanTujuan, etc.)
        contentHtml?: string | null;
        isSigned?: boolean;
        tembusan?: Array<{ name: string; description?: string }> | null; // Tembusan recipients dari draft
        signatures?: Array<{
            signerRole: string;
            signerName: string;
            signerNip?: string;
            signatureUrl?: string;
            // Position data from positioner
            positionX?: number | null;
            positionY?: number | null;
            positionPage?: number | null;
        }>;
    };
    // URL file PDF jika sudah digenerate
    fileUrl?: string | null;
    fileName?: string;
    onDownload?: () => void;
}

export function SuratPreview({
    submissionData,
    documentData,
    fileUrl,
    fileName = "Surat Pengantar",
    onDownload,
}: SuratPreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    const handlePrint = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow?.print();
        }
    };

    // Generate HTML content from template
    const htmlContent = useMemo(() => {
        // Jika ada contentHtml dari document, gunakan itu
        if (documentData?.contentHtml) {
            return documentData.contentHtml;
        }

        // Jika tidak ada submission data, return null
        if (!submissionData) {
            return null;
        }

        // Extract content data from document (namaTujuan, jabatanTujuan, alamatTujuan, etc.)
        const contentData = documentData?.content as {
            namaTujuan?: string;
            jabatanTujuan?: string;
            alamatTujuan?: string;
            keperluan?: string;
        } | undefined;

        // Get signature data from document
        const signatures = documentData?.signatures || [];
        const kaprodiSig = signatures.find(s => s.signerRole === 'KAPRODI');
        const kadepSig = signatures.find(s => s.signerRole === 'KADEP');

        // Generate dari template with signatures included directly
        const templateData: SuratPengantarData = {
            nomorSurat: documentData?.nomorSurat || "-",
            tanggalSurat: documentData?.tanggalSurat
                ? formatTanggalIndonesia(documentData.tanggalSurat)
                : formatTanggalIndonesia(new Date()),
            perihal: documentData?.perihal || submissionData.keperluan,
            namaTujuan: contentData?.namaTujuan || "",
            jabatanTujuan: contentData?.jabatanTujuan || "",
            alamatTujuan: contentData?.alamatTujuan || "",
            keperluan: contentData?.keperluan || submissionData.keperluan,
            namaMahasiswa: submissionData.nama,
            nimMahasiswa: submissionData.nim || submissionData.nip || "-",
            programStudi: submissionData.programStudi,
            departemen: submissionData.departemen || "-",
            judulAcara: submissionData.judulAcara,
            tanggalMulai: formatTanggalIndonesia(submissionData.tanggalAcara),
            lokasiAcara: submissionData.lokasiAcara,
            durasiAcara: submissionData.durasiAcara,
            // Flag untuk menentukan apakah pengaju mahasiswa atau dosen
            isPengajuMahasiswa: !!submissionData.nim, // true jika ada NIM, false jika NIP
            // Pass signature data directly to template - signatures will be rendered in template's ttd-container
            namaKaprodi: kaprodiSig?.signerName,
            nipKaprodi: kaprodiSig?.signerNip,
            signatureKaprodi: kaprodiSig?.signatureUrl,
            namaKadep: kadepSig?.signerName,
            nipKadep: kadepSig?.signerNip,
            signatureKadep: kadepSig?.signatureUrl,
            // Pass tembusan data from document
            tembusan: documentData?.tembusan || undefined,
        };

        // Generate HTML - signatures are rendered directly in template at the correct position
        return generateSuratPengantarHTML(templateData);
    }, [submissionData, documentData]);

    // Jika ada file URL (PDF), tampilkan PDF
    if (fileUrl) {
        return (
            <div ref={containerRef} className="bg-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px] relative">
                {/* Toolbar */}
                <div className="flex items-center justify-between bg-zinc-700 px-3 py-2 text-white text-sm">
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-600 h-8 w-8">
                                    <Menu className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={onDownload}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Unduh
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-2" />
                                    Cetak
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <span className="truncate max-w-[120px]">{fileName}</span>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-400">1 / 1</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={zoom <= 50}
                            className="text-white hover:bg-zinc-600 h-8 w-8 disabled:text-zinc-500"
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span className="min-w-[50px] text-center">{zoom}%</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={zoom >= 200}
                            className="text-white hover:bg-zinc-600 h-8 w-8 disabled:text-zinc-500"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                        <span className="text-zinc-500 mx-2">|</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFullscreen}
                            className="text-white hover:bg-zinc-600 h-8 w-8"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRotate}
                            className="text-white hover:bg-zinc-600 h-8 w-8"
                        >
                            <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDownload}
                            className="text-white hover:bg-zinc-600 h-8 w-8"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrint}
                            className="text-white hover:bg-zinc-600 h-8 w-8"
                        >
                            <Printer className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 bg-zinc-600 overflow-auto">
                    <div
                        className="w-full h-full flex items-center justify-center p-4"
                        style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            src={`${fileUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full bg-white rounded shadow-lg"
                            style={{ minHeight: '500px' }}
                            title="PDF Preview"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Jika ada HTML content, render dengan PDFPreview
    // PDFPreview sudah lengkap dengan toolbar, sidebar thumbnails, dan draft badge
    if (htmlContent) {
        return (
            <PDFPreview
                htmlContent={htmlContent}
                fileName={fileName}
                showDraftBadge={!documentData?.isSigned}
            />
        );
    }

    // Placeholder jika tidak ada data
    return (
        <div className="bg-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-700 px-3 py-2 text-white text-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-600 h-8 w-8">
                        <Menu className="w-4 h-4" />
                    </Button>
                    <span className="truncate max-w-[120px]">{fileName}</span>
                    <span className="text-zinc-400">|</span>
                    <span className="text-zinc-400">- / -</span>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <Minus className="w-4 h-4" />
                    </Button>
                    <span className="min-w-[50px] text-center text-zinc-400">-%</span>
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-zinc-500 mx-2">|</span>
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled className="text-zinc-500 h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-white p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Preview Dokumen</p>
                    <p className="text-sm text-zinc-400 mt-2">
                        Dokumen belum tersedia
                    </p>
                </div>
            </div>
        </div>
    );
}
