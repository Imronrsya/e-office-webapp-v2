"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { suratTugasTemplate, type SuratTugasData } from "@/lib/templates/surat-tugas";
import { suratTugasTableTemplate, type SuratTugasTableData } from "@/lib/templates/surat-tugas-table";
import { suratKeputusanTemplate, type SuratKeputusanData } from "@/lib/templates/surat-keputusan";
import { generatePdfWithSignatures, SignerPlaceholder, htmlToPdfBlob, generateSuratHTML } from "@/lib/pdf-generator";
import dynamic from "next/dynamic";
const HTMLToPDFPreview = dynamic(() => import("@/components/surat-preview/PDFPreview").then(mod => mod.PDFPreview), { ssr: false });

interface SignatureData {
    signerRole: string;
    signerName: string;
    signerNip?: string | null;
    signatureUrl?: string | null; // URL of the actual signature image
    prefix?: string | null; // Prefix/awalan like "a.n.", "u.b.", "Plt."
    order: number;
    positionX?: number | null;
    positionY?: number | null;
    positionPage?: number | null;
}

interface PDFPreviewProps {
    fileUrl: string | null;
    fileName?: string;
    isSigned?: boolean;
    content?: Record<string, unknown> | null; // Form data untuk generate preview
    documentType?: 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN';
    signatures?: SignatureData[]; // Signature data with positions
    onDownload?: () => void;
    showToolbar?: boolean; // Control toolbar visibility
}

// Note: We cannot add cache-busting parameters to presigned URLs from MinIO/S3
// because the signature is calculated based on the exact URL including query params.
// Adding extra params like ?t=xxx will cause SignatureDoesNotMatch error.
// Instead, use pdfRefreshKey at the component level to force re-render.

export function PDFPreview({
    fileUrl,
    fileName = "Surat",
    isSigned = false,
    content,
    documentType,
    signatures,
    onDownload,
    showToolbar = true
}: PDFPreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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

    // Generate HTML content from template based on document type and content
    const htmlContent = useMemo(() => {
        if (!content || !documentType) return null;

        try {
            // Convert signatures to SignatureBlock format for templates
            const signatureBlocks = (signatures || []).map(sig => ({
                signerRole: sig.signerRole,
                signerName: sig.signerName,
                signerNip: sig.signerNip || undefined,
                signatureUrl: sig.signatureUrl || undefined,
                prefix: sig.prefix || undefined, // Include prefix/awalan from signature data
            }));

            // Extract tembusan and stempelUrl from content if available
            const contentData = content as Record<string, unknown>;
            const tembusanData = contentData.tembusan as Array<{ name: string; description?: string }> | undefined;
            // Extract stempel URL from content (passed from detail page as stempelUrl or sealImageUrl)
            // Stempel only appears after UPA clicks "bubuhkan stempel" which sets sealImageUrl in database
            const stempelUrl = (contentData.stempelUrl || contentData.sealImageUrl) as string | undefined;

            // Debug logging untuk stempel
            console.log('[PDFPreview] stempelUrl:', stempelUrl);
            console.log('[PDFPreview] signatureBlocks:', signatureBlocks);
            console.log('[PDFPreview] content keys:', Object.keys(contentData));

            switch (documentType) {
                case 'SURAT_TUGAS': {
                    const data = {
                        ...content as unknown as SuratTugasData,
                        signatures: signatureBlocks,
                        tembusan: tembusanData,
                        stempelUrl: stempelUrl,
                    };
                    return suratTugasTemplate(data);
                }
                case 'SURAT_TUGAS_TABEL': {
                    // Handle both old format (pelaksana) and new format (dataMahasiswa)
                    const tableContent = content as Record<string, unknown>;
                    const dataMahasiswa = (tableContent.dataMahasiswa || tableContent.pelaksana || []) as Array<{ nama: string; nim: string; prodi: string;[key: string]: string }>;

                    const data = {
                        ...content as unknown as SuratTugasTableData,
                        dataMahasiswa: dataMahasiswa,
                        signatures: signatureBlocks,
                        tembusan: tembusanData,
                        stempelUrl: stempelUrl,
                    };
                    return suratTugasTableTemplate(data);
                }
                case 'SURAT_KEPUTUSAN': {
                    const data = {
                        ...content as unknown as SuratKeputusanData,
                        signatures: signatureBlocks,
                        tembusan: tembusanData,
                        stempelUrl: stempelUrl,
                    };
                    return suratKeputusanTemplate(data);
                }
                default:
                    return null;
            }
        } catch (error) {
            console.error('Failed to generate preview:', error);
            return null;
        }
    }, [content, documentType, signatures]);

    // Generate PDF with signature blocks embedded when we have content and signatures
    // ONLY if fileUrl is NOT available (fileUrl from backend takes priority)
    useEffect(() => {
        // ✅ Skip PDF generation if we already have a fileUrl from backend
        // Backend PDF sudah ter-regenerate dengan nomor surat, stempel, dan QR code
        if (fileUrl) {
            return;
        }

        // Only generate PDF if we have content, documentType, and signatures with position data
        if (!content || !documentType || documentType === 'SURAT_PENGANTAR') {
            return;
        }

        // Check if any signature has position data
        const hasPositionData = signatures?.some(
            sig => sig.positionX != null && sig.positionY != null
        );

        if (!hasPositionData) {
            return;
        }

        const generatePdf = async () => {
            setIsGeneratingPdf(true);
            try {
                // Convert signatures to SignerPlaceholder format
                const signerPlaceholders: SignerPlaceholder[] = (signatures || [])
                    .filter(sig => sig.positionX != null && sig.positionY != null)
                    .map(sig => ({
                        id: `${sig.signerRole}-${sig.order}`,
                        role: sig.signerRole,
                        name: sig.signerName,
                        nip: sig.signerNip || undefined,
                        prefix: sig.prefix || undefined, // Include prefix/awalan
                        x: sig.positionX || 0,
                        y: sig.positionY || 0,
                        page: sig.positionPage || 1,
                        order: sig.order,
                        signatureUrl: sig.signatureUrl || undefined
                    }));

                // Generate PDF with embedded signature blocks
                // Use a default rendered width of 600 (typical positioner width)
                const pdfBlob = await generatePdfWithSignatures(
                    documentType as 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN',
                    content,
                    signerPlaceholders,
                    600
                );

                // Create blob URL
                const url = URL.createObjectURL(pdfBlob);
                setPdfBlobUrl(url);
            } catch (error) {
                console.error('Failed to generate PDF with signatures:', error);
            } finally {
                setIsGeneratingPdf(false);
            }
        };

        generatePdf();

        // Cleanup on unmount or when dependencies change
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, documentType, signatures, fileUrl]);

    // Show loading state while generating PDF with signatures
    if (isGeneratingPdf) {
        return (
            <div className="bg-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px]">
                <div className="flex items-center justify-between bg-zinc-700 px-3 py-2 text-white text-sm">
                    <div className="flex items-center gap-3">
                        <span className="truncate max-w-[120px]">{fileName}</span>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin opacity-50" />
                        <p className="text-lg font-medium">Memuat Preview</p>
                        <p className="text-sm text-zinc-400 mt-2">
                            Sedang menyiapkan dokumen dengan blok tanda tangan...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ PRIORITAS 1: Jika ada file URL dari backend, tampilkan PDF tersebut
    // PDF dari backend sudah ter-regenerate dengan nomor surat, stempel, dan QR code
    if (fileUrl) {
        return (
            <div ref={containerRef} className="bg-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px] relative">
                {/* Toolbar */}
                {showToolbar && (
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
                )}

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

                {/* SALINAN Badge */}
                <div className="absolute bottom-4 right-4">
                    <span className="bg-white text-zinc-800 px-3 py-1 rounded text-sm font-medium shadow">
                        SALINAN
                    </span>
                </div>
            </div>
        );
    }

    // PRIORITAS 2: Jika ada pdfBlobUrl (PDF dengan signature blocks embedded), tampilkan itu
    // Ini untuk draft PDF yang belum ada di backend
    if (pdfBlobUrl) {
        return (
            <div ref={containerRef} className="bg-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px] relative">
                {/* Toolbar */}
                {showToolbar && (
                    <div className="flex items-center justify-between bg-zinc-700 px-3 py-2 text-white text-sm">
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-600 h-8 w-8">
                                        <Menu className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
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
                                onClick={handlePrint}
                                className="text-white hover:bg-zinc-600 h-8 w-8"
                            >
                                <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    // Download the generated PDF blob properly
                                    if (pdfBlobUrl) {
                                        try {
                                            // Fetch the blob from the blob URL
                                            const response = await fetch(pdfBlobUrl);
                                            const blob = await response.blob();

                                            // Create a new blob URL for download
                                            const downloadUrl = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = downloadUrl;
                                            link.download = `${fileName}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);

                                            // Clean up the URL after download
                                            setTimeout(() => {
                                                window.URL.revokeObjectURL(downloadUrl);
                                            }, 100);
                                        } catch (error) {
                                            console.error('Download error:', error);
                                            // Fallback: open in new tab
                                            window.open(pdfBlobUrl, '_blank');
                                        }
                                    } else if (onDownload) {
                                        onDownload();
                                    }
                                }}
                                className="text-white hover:bg-zinc-600 h-8 w-8"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* PDF Viewer with signature blocks */}
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
                            src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full bg-white rounded shadow-lg"
                            style={{ minHeight: '500px' }}
                            title="PDF Preview with Signatures"
                        />
                    </div>
                </div>

                {/* DRAFT Badge */}
                <div className="absolute top-16 right-4">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded text-sm font-medium shadow">
                        DRAFT
                    </span>
                </div>
            </div>
        );
    }

    // Jika ada HTML content (dari form data), render dengan PDFPreview
    // PDFPreview sudah lengkap dengan toolbar, sidebar thumbnails, dan draft badge
    if (htmlContent) {
        return (
            <HTMLToPDFPreview
                htmlContent={htmlContent}
                fileName={fileName}
                showDraftBadge={true}
            />
        );
    }

    // Placeholder jika tidak ada PDF dan tidak ada content
    return (
        <div className="bg-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Toolbar */}
            {showToolbar && (
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
            )}

            {/* Placeholder Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-white p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Preview Dokumen</p>
                    <p className="text-sm text-zinc-400 mt-2">
                        {isSigned
                            ? "Dokumen akan ditampilkan setelah surat ditandatangani"
                            : "Dokumen belum tersedia"
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}