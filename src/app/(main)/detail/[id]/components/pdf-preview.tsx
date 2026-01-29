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

interface SignatureData {
    signerRole: string;
    signerName: string;
    signerNip?: string | null;
    signatureUrl?: string | null; // URL of the actual signature image
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
    onDownload 
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
            switch (documentType) {
                case 'SURAT_TUGAS': {
                    const data = content as unknown as SuratTugasData;
                    return suratTugasTemplate(data);
                }
                case 'SURAT_TUGAS_TABEL': {
                    const data = content as unknown as SuratTugasTableData;
                    return suratTugasTableTemplate(data);
                }
                case 'SURAT_KEPUTUSAN': {
                    const data = content as unknown as SuratKeputusanData;
                    return suratKeputusanTemplate(data);
                }
                default:
                    return null;
            }
        } catch (error) {
            console.error('Failed to generate preview:', error);
            return null;
        }
    }, [content, documentType]);

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
                    </div>
                </div>

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

    // Jika ada HTML content (dari form data), render HTML preview
    if (htmlContent) {
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
                                <DropdownMenuItem onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-2" />
                                    Cetak
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <span className="truncate max-w-[120px]">{fileName}</span>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-400">- / -</span>
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
                    </div>
                </div>

                {/* HTML Preview */}
                <div className="flex-1 bg-zinc-600 overflow-auto">
                    <div 
                        className="flex items-start justify-center p-4"
                        style={{ 
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            srcDoc={htmlContent}
                            className="bg-white rounded shadow-lg"
                            style={{ 
                                width: '21cm', 
                                minHeight: '29.7cm',
                                border: 'none'
                            }}
                            title="Surat Preview"
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

    // Placeholder jika tidak ada PDF dan tidak ada content
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