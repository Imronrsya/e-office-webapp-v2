"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Maximize2,
    RotateCw,
    Printer,
    Download,
    Menu,
    PanelLeftClose,
    PanelLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
    htmlContent: string;
    zoom?: number;
    fileName?: string;
    className?: string;
    showDraftBadge?: boolean;
    onZoomChange?: (zoom: number) => void;
}

/**
 * Complete PDF Viewer with sidebar thumbnails and toolbar
 * Similar to Chrome PDF viewer
 */
export function PDFPreview({
    htmlContent,
    zoom: externalZoom,
    fileName = "Dokumen",
    className = "",
    showDraftBadge = true,
    onZoomChange
}: PDFPreviewProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isGenerating, setIsGenerating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [internalZoom, setInternalZoom] = useState(100);
    const [rotation, setRotation] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const mainViewRef = useRef<HTMLDivElement>(null);
    const renderIdRef = useRef(0);

    // Use external zoom if provided, otherwise internal
    const zoom = externalZoom ?? internalZoom;
    const setZoom = (value: number) => {
        setInternalZoom(value);
        onZoomChange?.(value);
    };

    const generatePDF = useCallback(async () => {
        if (!htmlContent) return;

        const currentRenderId = ++renderIdRef.current;
        setIsGenerating(true);
        setError(null);

        try {
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                width: 210mm;
                background: white;
                z-index: -1;
            `;
            tempContainer.innerHTML = htmlContent;
            document.body.appendChild(tempContainer);

            const images = tempContainer.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: tempContainer.scrollWidth,
                height: tempContainer.scrollHeight,
            });

            document.body.removeChild(tempContainer);

            if (currentRenderId !== renderIdRef.current) return;

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 full height in mm
            const bottomMargin = 30; // Bottom margin for QR code in mm
            const usableHeight = pageHeight - bottomMargin; // Content area: 267mm

            // Calculate dimensions
            const pxPerMm = canvas.width / imgWidth;
            const usableHeightPx = Math.floor(usableHeight * pxPerMm);
            const lineHeightPx = Math.floor(16 * (canvas.width / 210 / 3.78)); // ~16px line height scaled

            // Function to find a safe break point (white horizontal line)
            const findSafeBreakPoint = (targetY: number, searchRange: number = 50): number => {
                const ctx = canvas.getContext('2d');
                if (!ctx) return targetY;

                // Search upward from targetY for a mostly-white line
                for (let y = targetY; y > targetY - searchRange && y > 0; y--) {
                    const imageData = ctx.getImageData(20, y, canvas.width - 40, 1);
                    const data = imageData.data;
                    let whitePixels = 0;

                    for (let i = 0; i < data.length; i += 4) {
                        // Check if pixel is close to white
                        if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) {
                            whitePixels++;
                        }
                    }

                    // If more than 95% of the line is white, it's a safe break
                    if (whitePixels / (data.length / 4) > 0.95) {
                        return y;
                    }
                }

                return targetY; // Fallback to original position
            };

            const pdf = new jsPDF('p', 'mm', 'a4');
            const totalHeight = canvas.height;
            let currentY = 0;
            let pageNum = 0;

            while (currentY < totalHeight) {
                if (pageNum > 0) {
                    pdf.addPage();
                }

                // Calculate target end position for this page
                const targetEndY = currentY + usableHeightPx;

                // Find safe break point near target
                const safeEndY = targetEndY >= totalHeight
                    ? totalHeight
                    : findSafeBreakPoint(targetEndY, lineHeightPx * 3);

                const sliceHeight = safeEndY - currentY;

                if (sliceHeight <= 0) break;

                // Create canvas slice for this page
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sliceHeight;
                const ctx = pageCanvas.getContext('2d');

                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                    ctx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

                    const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                    const sliceImgHeight = (sliceHeight / canvas.width) * imgWidth;

                    // Add top margin for pages 2+ (15mm)
                    const topMargin = pageNum > 0 ? 15 : 0;
                    pdf.addImage(sliceImgData, 'JPEG', 0, topMargin, imgWidth, sliceImgHeight);
                }

                currentY = safeEndY;
                pageNum++;

                // Safety: prevent infinite loop
                if (pageNum > 50) break;
            }

            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);

            if (currentRenderId === renderIdRef.current) {
                if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                setPdfUrl(url);
            }
        } catch (err) {
            console.error('PDF generation error:', err);
            if (currentRenderId === renderIdRef.current) {
                setError('Gagal generate PDF preview');
            }
        } finally {
            if (currentRenderId === renderIdRef.current) {
                setIsGenerating(false);
            }
        }
    }, [htmlContent]);

    useEffect(() => {
        const timer = setTimeout(() => generatePDF(), 500);
        return () => clearTimeout(timer);
    }, [generatePDF]);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setCurrentPage(1);
    };

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(numPages, page)));
        if (mainViewRef.current) mainViewRef.current.scrollTop = 0;
    };

    const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
    const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));
    const handleRotate = () => setRotation((rotation + 90) % 360);

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    const handlePrint = async () => {
        if (!pdfUrl) return;
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
            printWindow.addEventListener('load', () => {
                printWindow.print();
            });
        }
    };

    const handleDownload = async () => {
        if (!pdfUrl) return;
        try {
            const response = await fetch(pdfUrl);
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${fileName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            window.open(pdfUrl, '_blank');
        }
    };

    // Loading state
    if (isGenerating) {
        return (
            <div className={cn("flex flex-col bg-zinc-800 rounded-xl overflow-hidden", className)} style={{ height: '70vh', minHeight: '500px' }}>
                <div className="flex items-center bg-zinc-700 px-3 py-2 text-white text-sm">
                    <span className="truncate">{fileName}</span>
                </div>
                <div className="flex-1 flex items-center justify-center bg-zinc-600">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-white mb-3 mx-auto" />
                        <span className="text-sm text-gray-300">Generating PDF preview...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !pdfUrl) {
        return (
            <div className={cn("flex flex-col bg-zinc-800 rounded-xl overflow-hidden", className)} style={{ height: '70vh', minHeight: '500px' }}>
                <div className="flex items-center bg-zinc-700 px-3 py-2 text-white text-sm">
                    <span className="truncate">{fileName}</span>
                </div>
                <div className="flex-1 flex items-center justify-center bg-zinc-600">
                    <div className="text-center text-red-400">{error || 'Gagal memuat preview'}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("flex flex-col bg-zinc-800 rounded-xl overflow-hidden", className)}
            style={{ height: '70vh', minHeight: '500px' }}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-700 px-3 py-2 text-white text-sm border-b border-zinc-600">
                {/* Left section: Menu & filename & page nav */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="text-white hover:bg-zinc-600 h-8 w-8"
                        title={showSidebar ? "Hide sidebar" : "Show sidebar"}
                    >
                        {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    </Button>

                    <span className="truncate max-w-[150px] font-medium">{fileName}</span>

                    <span className="text-zinc-400 mx-2">|</span>

                    {/* Page navigation */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="text-white hover:bg-zinc-600 h-7 w-7 disabled:text-zinc-500"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="min-w-[60px] text-center">
                            {currentPage} / {numPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= numPages}
                            className="text-white hover:bg-zinc-600 h-7 w-7 disabled:text-zinc-500"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Right section: Zoom & actions */}
                <div className="flex items-center gap-1">
                    {/* Zoom controls */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={zoom <= 50}
                        className="text-white hover:bg-zinc-600 h-8 w-8 disabled:text-zinc-500"
                        title="Zoom out"
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
                        title="Zoom in"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>

                    <span className="text-zinc-500 mx-1">|</span>

                    {/* Action buttons */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFullscreen}
                        className="text-white hover:bg-zinc-600 h-8 w-8"
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRotate}
                        className="text-white hover:bg-zinc-600 h-8 w-8"
                        title="Rotate"
                    >
                        <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrint}
                        className="text-white hover:bg-zinc-600 h-8 w-8"
                        title="Print"
                    >
                        <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        className="text-white hover:bg-zinc-600 h-8 w-8"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar with thumbnails */}
                {showSidebar && numPages > 0 && (
                    <div className="w-28 bg-zinc-800 border-r border-zinc-600 overflow-y-auto flex-shrink-0">
                        <div className="p-2 space-y-2">
                            <Document file={pdfUrl} loading={null} error={null}>
                                {Array.from({ length: numPages }, (_, index) => (
                                    <div
                                        key={index + 1}
                                        onClick={() => goToPage(index + 1)}
                                        className={cn(
                                            "cursor-pointer transition-all duration-150 rounded overflow-hidden mb-2",
                                            currentPage === index + 1
                                                ? "ring-2 ring-blue-500"
                                                : "hover:ring-2 hover:ring-zinc-500 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <div className="bg-white shadow">
                                            <Page
                                                pageNumber={index + 1}
                                                width={90}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </div>
                                        <div className={cn(
                                            "text-center text-xs py-1",
                                            currentPage === index + 1 ? "text-blue-400 font-medium" : "text-gray-400"
                                        )}>
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </Document>
                        </div>
                    </div>
                )}

                {/* Main PDF view */}
                <div
                    ref={mainViewRef}
                    className="flex-1 overflow-auto bg-zinc-600"
                >
                    <div
                        className="flex justify-center p-6"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                        }}
                    >
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                </div>
                            }
                            error={
                                <div className="text-red-400 py-4">Gagal memuat PDF</div>
                            }
                        >
                            <Page
                                pageNumber={currentPage}
                                scale={zoom / 100}
                                className="shadow-2xl rounded"
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        </Document>
                    </div>
                </div>
            </div>
        </div>
    );
}
