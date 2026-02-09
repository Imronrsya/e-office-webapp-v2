"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Menu,
    Minus,
    Plus,
    Maximize2,
    RotateCw,
    Download,
    Printer,
    FileText,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    type UniversalDocumentPreviewProps,
    type SignatureData,
    type PreviewMode,
    detectPreviewMode,
    getStatusBadgeConfig
} from "./types";

// Import templates
import { suratTugasTemplate, type SuratTugasData } from "@/lib/templates/surat-tugas";
import { suratTugasTableTemplate, type SuratTugasTableData } from "@/lib/templates/surat-tugas-table";
import { suratKeputusanTemplate, type SuratKeputusanData } from "@/lib/templates/surat-keputusan";
import { generateSuratPengantarHTML, type SuratPengantarData, formatTanggalIndonesia } from "@/lib/templates/surat-pengantar";
import { htmlToPdfBlob } from "@/lib/pdf-generator";
import dynamic from "next/dynamic";
const PDFPreview = dynamic(() => import("@/components/surat-preview/PDFPreview").then(mod => mod.PDFPreview), { ssr: false });

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export function UniversalDocumentPreview({
    fileUrl,
    htmlContent: providedHtmlContent,
    content,
    documentType = 'OTHER',
    mode = 'auto',
    fileName = "Dokumen",
    metadata,
    signatures,
    stempel,
    qrCode,
    showDraftBadge = false,
    showToolbar = true,
    showStatusBadge = true,
    initialZoom = 100,
    minHeight = 800,
    maxHeight,
    className,
    theme = 'dark',
    onDownload,
    onPrint,
    onFullscreen,
    onZoomChange,
    onError,
}: UniversalDocumentPreviewProps) {
    // State
    const [zoom, setZoom] = useState(initialZoom);
    const [rotation, setRotation] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Determine actual preview mode
    const actualMode: PreviewMode = useMemo(() => {
        if (mode !== 'auto') return mode;
        return detectPreviewMode({ fileUrl, htmlContent: providedHtmlContent, content });
    }, [mode, fileUrl, providedHtmlContent, content]);

    // Generate HTML content from template based on document type
    const generatedHtmlContent = useMemo(() => {
        if (actualMode !== 'html' && actualMode !== 'pdf-blob') return null;
        if (providedHtmlContent) return providedHtmlContent;
        if (!content || !documentType || documentType === 'OTHER') return null;

        try {
            // Convert signatures to SignatureBlock format for templates
            const signatureBlocks = (signatures || []).map(sig => ({
                signerRole: sig.signerRole,
                signerName: sig.signerName,
                signerNip: sig.signerNip || undefined,
                signatureUrl: sig.signatureUrl || undefined,
                prefix: sig.prefix || undefined,
            }));

            // Extract tembusan from content if available
            const contentData = content as Record<string, unknown>;
            const tembusanData = contentData.tembusan as Array<{ name: string; description?: string }> | undefined;

            // Get stempel and QR code URLs
            // Always use the local stempel from frontend public folder
            // Only show stempel if there's an indication it should be shown (from backend sealImageUrl or stempel prop)
            const hasStempel = !!(stempel?.imageUrl || stempel?.imageData || (contentData.stempelUrl as string));
            const stempelUrl = hasStempel ? '/stempel.png' : undefined;
            const qrCodeDataUrl = qrCode?.content || (contentData.qrCodeDataUrl as string) || undefined;

            switch (documentType) {
                case 'SURAT_TUGAS': {
                    const data = {
                        ...content as unknown as SuratTugasData,
                        signatures: signatureBlocks,
                        tembusan: tembusanData || [],
                        stempelUrl,
                        qrCodeDataUrl,
                        // Format tanggal surat if available
                        tanggalSurat: (contentData.tanggalSurat as string)
                            ? `Semarang, ${formatTanggalIndonesia(contentData.tanggalSurat as string)}`
                            : undefined
                    };
                    return suratTugasTemplate(data);
                }
                case 'SURAT_TUGAS_TABEL': {
                    const tableContent = content as Record<string, unknown>;
                    // Convert pelaksana to dataMahasiswa if dataMahasiswa is not already present
                    const pelaksana = (tableContent.pelaksana as Array<Record<string, string>>) || [];
                    const dataMahasiswa = (tableContent.dataMahasiswa as Array<Record<string, string>>) || pelaksana.map(p => ({
                        nama: p.nama || '',
                        nim: p.nim || '',
                        prodi: p.prodi || '',
                        ...Object.fromEntries(Object.entries(p).filter(([k]) => !['key', 'nama', 'nim', 'prodi'].includes(k))),
                    }));
                    const data = {
                        ...content as unknown as SuratTugasTableData,
                        dataMahasiswa: dataMahasiswa as unknown as SuratTugasTableData['dataMahasiswa'],
                        customColumns: (tableContent.customColumns as SuratTugasTableData['customColumns']) || [],
                        signatures: signatureBlocks,
                        tembusan: tembusanData || [],
                        stempelUrl,
                        qrCodeDataUrl,
                        // Format tanggal surat if available
                        tanggalSurat: (contentData.tanggalSurat as string)
                            ? `Semarang, ${formatTanggalIndonesia(contentData.tanggalSurat as string)}`
                            : undefined
                    };
                    return suratTugasTableTemplate(data);
                }
                case 'SURAT_KEPUTUSAN': {
                    const data = {
                        ...content as unknown as SuratKeputusanData,
                        signatures: signatureBlocks,
                        tembusan: tembusanData || [],
                        stempelUrl,
                        qrCodeDataUrl,
                    };
                    return suratKeputusanTemplate(data);
                }
                case 'SURAT_PENGANTAR': {
                    // For SURAT_PENGANTAR, we need to convert signatures to namaKaprodi/namaKadep format
                    const pengantarData = content as unknown as SuratPengantarData;

                    // Extract Kaprodi and Kadep signatures
                    const kaprodiSig = signatureBlocks.find(s =>
                        s.signerRole.toLowerCase().includes('kaprodi') ||
                        s.signerRole.toLowerCase().includes('ketua prodi')
                    );
                    const kadepSig = signatureBlocks.find(s =>
                        s.signerRole.toLowerCase().includes('kadep') ||
                        s.signerRole.toLowerCase().includes('ketua departemen')
                    );

                    return generateSuratPengantarHTML({
                        ...pengantarData,
                        tembusan: tembusanData || pengantarData.tembusan || [],
                        // Kaprodi signature
                        namaKaprodi: kaprodiSig?.signerName || pengantarData.namaKaprodi,
                        nipKaprodi: kaprodiSig?.signerNip || pengantarData.nipKaprodi,
                        signatureKaprodi: kaprodiSig?.signatureUrl || pengantarData.signatureKaprodi,
                        prefixKaprodi: kaprodiSig?.prefix || pengantarData.prefixKaprodi,
                        // Kadep signature
                        namaKadep: kadepSig?.signerName || pengantarData.namaKadep,
                        nipKadep: kadepSig?.signerNip || pengantarData.nipKadep,
                        signatureKadep: kadepSig?.signatureUrl || pengantarData.signatureKadep,
                        prefixKadep: kadepSig?.prefix || pengantarData.prefixKadep,
                    });
                }
                default:
                    return null;
            }
        } catch (err) {
            console.error('Error generating HTML content:', err);
            const error = err instanceof Error ? err : new Error('Failed to generate HTML');
            setError(error);
            onError?.(error);
            return null;
        }
    }, [actualMode, providedHtmlContent, content, documentType, signatures, onError]);

    // Effective HTML content (provided or generated)
    const effectiveHtmlContent = providedHtmlContent || generatedHtmlContent;

    // Generate PDF blob when needed (for pdf-blob mode)
    useEffect(() => {
        if (actualMode !== 'pdf-blob' || !effectiveHtmlContent) {
            return;
        }

        const generatePdf = async () => {
            setIsGenerating(true);
            try {
                // Use htmlToPdfBlob to convert HTML to PDF
                const pdfBlob = await htmlToPdfBlob(effectiveHtmlContent);
                const url = URL.createObjectURL(pdfBlob);
                setPdfBlobUrl(url);
            } catch (err) {
                console.error('Error generating PDF:', err);
                const error = err instanceof Error ? err : new Error('Failed to generate PDF');
                setError(error);
                onError?.(error);
            } finally {
                setIsGenerating(false);
                setIsLoading(false);
            }
        };

        generatePdf();

        // Cleanup
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [actualMode, effectiveHtmlContent, onError]);

    // Handle zoom
    const handleZoomIn = useCallback(() => {
        setZoom(prev => {
            const newZoom = Math.min(prev + 25, 200);
            onZoomChange?.(newZoom);
            return newZoom;
        });
    }, [onZoomChange]);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => {
            const newZoom = Math.max(prev - 25, 50);
            onZoomChange?.(newZoom);
            return newZoom;
        });
    }, [onZoomChange]);

    // Handle rotation
    const handleRotate = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    // Handle fullscreen
    const handleFullscreen = useCallback(() => {
        if (onFullscreen) {
            onFullscreen();
            return;
        }

        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    }, [onFullscreen]);

    // Handle print
    const handlePrint = useCallback(() => {
        if (onPrint) {
            onPrint();
            return;
        }

        if (iframeRef.current) {
            iframeRef.current.contentWindow?.print();
        }
    }, [onPrint]);

    // Handle download - langsung download PDF dengan kualitas yang sama seperti print
    const handleDownload = useCallback(async () => {
        if (onDownload) {
            onDownload();
            return;
        }

        // Jika ada HTML content, generate PDF dan download langsung
        if (effectiveHtmlContent) {
            try {
                const { htmlToPdfBlob } = await import('@/lib/pdf-generator');
                const pdfBlob = await htmlToPdfBlob(effectiveHtmlContent);
                const blobUrl = URL.createObjectURL(pdfBlob);

                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (error) {
                console.error('PDF generation failed:', error);
            }
            return;
        }

        // Default download behavior for URL-based PDFs
        const url = fileUrl || pdfBlobUrl;
        if (url) {
            try {
                // Fetch the file and create a proper download
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Cleanup blob URL after download
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (error) {
                console.error('Download failed:', error);
                // Fallback to direct link
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } else {
            console.warn('No content available for download');
        }
    }, [onDownload, fileUrl, pdfBlobUrl, fileName, effectiveHtmlContent]);

    // Page navigation
    const handlePrevPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    // Iframe load handler - auto-resize iframe to content height and count pages
    const handleIframeLoad = useCallback(() => {
        setIsLoading(false);

        // Wait a moment for the JS pagination script inside the iframe to finish
        setTimeout(() => {
            const iframe = iframeRef.current;
            if (iframe?.contentDocument?.body) {
                const body = iframe.contentDocument.body;
                const contentHeight = body.scrollHeight;
                iframe.style.height = contentHeight + 'px';

                // Count pages from visual-page divs (JS pagination) or fallback
                const pagesContainer = iframe.contentDocument.getElementById('pages-container');
                if (pagesContainer) {
                    const pageCount = parseInt(pagesContainer.getAttribute('data-page-count') || '1', 10);
                    setTotalPages(pageCount);
                } else {
                    const visualPages = iframe.contentDocument.querySelectorAll('.visual-page');
                    if (visualPages.length > 0) {
                        setTotalPages(visualPages.length);
                    } else {
                        // Fallback: calculate pages from content height (A4 = 297mm ≈ 1123px at 96dpi)
                        const pageHeight = 1123;
                        const pages = Math.max(1, Math.ceil(contentHeight / pageHeight));
                        setTotalPages(pages);
                    }
                }
            }
        }, 250);
    }, []);

    // Status badge config
    const statusBadge = showStatusBadge ? getStatusBadgeConfig(metadata?.status) : null;

    // Theme classes
    const themeClasses = {
        container: theme === 'dark'
            ? 'bg-zinc-800'
            : 'bg-white border',
        toolbar: theme === 'dark'
            ? 'bg-zinc-700 text-white'
            : 'bg-gray-50 text-gray-900 border-b',
        preview: theme === 'dark'
            ? 'bg-zinc-600'
            : 'bg-gray-100',
        button: theme === 'dark'
            ? 'text-white hover:bg-zinc-600'
            : 'text-gray-700 hover:bg-gray-200',
        buttonDisabled: theme === 'dark'
            ? 'text-zinc-500'
            : 'text-gray-300',
        text: theme === 'dark'
            ? 'text-zinc-400'
            : 'text-gray-500',
    };

    // Render toolbar
    const renderToolbar = () => {
        if (!showToolbar) return null;

        return (
            <div className={cn(
                "flex items-center justify-between px-3 py-2 text-sm",
                themeClasses.toolbar
            )}>
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", themeClasses.button)}
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Unduh
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <span className="truncate max-w-[150px]">{fileName}</span>
                    <span className={themeClasses.text}>|</span>

                    {/* Page navigation */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevPage}
                            disabled={currentPage <= 1}
                            className={cn("h-7 w-7", themeClasses.button, currentPage <= 1 && themeClasses.buttonDisabled)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className={themeClasses.text}>
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className={cn("h-7 w-7", themeClasses.button, currentPage >= totalPages && themeClasses.buttonDisabled)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={zoom <= 50}
                        className={cn("h-8 w-8", themeClasses.button, zoom <= 50 && themeClasses.buttonDisabled)}
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                    <span className="min-w-[50px] text-center">{zoom}%</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        disabled={zoom >= 200}
                        className={cn("h-8 w-8", themeClasses.button, zoom >= 200 && themeClasses.buttonDisabled)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    <span className={cn("mx-2", themeClasses.text)}>|</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFullscreen}
                        className={cn("h-8 w-8", themeClasses.button)}
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRotate}
                        className={cn("h-8 w-8", themeClasses.button)}
                    >
                        <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrint}
                        className={cn("h-8 w-8", themeClasses.button)}
                    >
                        <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        className={cn("h-8 w-8", themeClasses.button)}
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    };

    // Render status badge
    const renderStatusBadge = () => {
        const badge = showDraftBadge
            ? { text: 'DRAFT', color: 'yellow' as const, position: 'top-right' as const }
            : statusBadge;

        if (!badge) return null;

        const colorClasses = {
            yellow: 'bg-yellow-500 text-white',
            green: 'bg-green-500 text-white',
            blue: 'bg-blue-500 text-white',
            red: 'bg-red-500 text-white',
            gray: 'bg-gray-500 text-white',
        };

        const positionClasses = {
            'top-right': 'top-16 right-4',
            'top-left': 'top-16 left-4',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
        };

        return (
            <div className={cn("absolute z-10", positionClasses[badge.position || 'top-right'])}>
                <span className={cn(
                    "px-3 py-1 rounded text-sm font-medium shadow",
                    colorClasses[badge.color]
                )}>
                    {badge.text}
                </span>
            </div>
        );
    };

    // Render loading state
    const renderLoading = () => (
        <div className={cn(
            "flex-1 flex items-center justify-center",
            theme === 'dark' ? 'text-white' : 'text-gray-600'
        )}>
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                <p>{isGenerating ? 'Membuat dokumen...' : 'Memuat preview...'}</p>
            </div>
        </div>
    );

    // Render error state
    const renderError = () => (
        <div className={cn(
            "flex-1 flex items-center justify-center",
            theme === 'dark' ? 'text-white' : 'text-gray-600'
        )}>
            <div className="text-center p-8">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-red-500" />
                <p className="text-lg font-medium">Gagal Memuat Dokumen</p>
                <p className="text-sm opacity-70 mt-2">
                    {error?.message || 'Terjadi kesalahan saat memuat dokumen'}
                </p>
            </div>
        </div>
    );

    // Render empty state
    const renderEmpty = () => (
        <div className={cn(
            "flex-1 flex items-center justify-center",
            theme === 'dark' ? 'text-white' : 'text-gray-600'
        )}>
            <div className="text-center p-8">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Preview Dokumen</p>
                <p className={cn("text-sm mt-2", themeClasses.text)}>
                    Dokumen belum tersedia
                </p>
            </div>
        </div>
    );

    // Render PDF preview (from URL or blob)
    const renderPdfPreview = () => {
        const pdfUrl = fileUrl || pdfBlobUrl;

        if (!pdfUrl) {
            if (isLoading || isGenerating) return renderLoading();
            return renderEmpty();
        }

        // Add #toolbar=0 to hide browser's built-in PDF toolbar
        const pdfUrlWithoutToolbar = pdfUrl.includes('#')
            ? `${pdfUrl}&toolbar=0&navpanes=0&scrollbar=0`
            : `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;

        return (
            <div className={cn("flex-1 overflow-auto", themeClasses.preview)}>
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
                        src={pdfUrlWithoutToolbar}
                        className="bg-white rounded shadow-lg"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            border: 'none'
                        }}
                        onLoad={handleIframeLoad}
                        title="PDF Preview"
                    />
                </div>
            </div>
        );
    };

    // Render HTML preview with PDF pagination
    // PDFPreview has its own toolbar, so return it directly
    const renderHtmlPreview = () => {
        if (!effectiveHtmlContent) {
            if (isLoading) return renderLoading();
            return renderEmpty();
        }

        // Return PDFPreview directly - it has its own complete toolbar
        return (
            <PDFPreview
                htmlContent={effectiveHtmlContent}
                fileName={fileName}
                showDraftBadge={showDraftBadge}
            />
        );
    };

    // Render content based on mode
    const renderContent = () => {
        if (error) return renderError();

        switch (actualMode) {
            case 'pdf':
                return renderPdfPreview();
            case 'pdf-blob':
                return isGenerating ? renderLoading() : renderPdfPreview();
            case 'html':
                return renderHtmlPreview();
            default:
                return renderEmpty();
        }
    };

    // Container styles
    const containerStyle: React.CSSProperties = {
        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
        ...(maxHeight && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "rounded-xl overflow-hidden flex flex-col h-full relative",
                themeClasses.container,
                className
            )}
            style={{ ...containerStyle, height: '75vh' }}
        >
            {/* Skip parent toolbar for HTML mode - PDFPreview has its own */}
            {actualMode !== 'html' && renderToolbar()}
            {renderContent()}
            {/* Skip status badge for HTML mode - PDFPreview handles it */}
            {actualMode !== 'html' && renderStatusBadge()}
        </div>
    );
}
