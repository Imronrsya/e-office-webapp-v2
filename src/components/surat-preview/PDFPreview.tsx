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
    /** Callback fired when PDF blob URL is ready (or null on error) */
    onPdfReady?: (url: string | null) => void;
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
    onZoomChange,
    onPdfReady
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
            // Create an iframe to render the content in isolation (preserves body styles/fonts)
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                width: 210mm;
                min-height: 297mm;
                border: none;
                z-index: -1;
            `;
            document.body.appendChild(iframe);

            // Write content to iframe
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) {
                throw new Error("Could not access iframe document");
            }

            doc.open();
            doc.write(htmlContent);
            doc.close();

            // Hide QR code in the HTML snapshot so we don't render it twice (we manually stamp it)
            const qrElements = doc.querySelectorAll('.qr-running');
            qrElements.forEach((el) => {
                (el as HTMLElement).style.display = 'none';
            });

            // Wait for images to load
            await new Promise<void>((resolve) => {
                const checkImages = () => {
                    const images = doc.images;
                    let loaded = true;
                    for (let i = 0; i < images.length; i++) {
                        if (!images[i].complete) {
                            loaded = false;
                            break;
                        }
                    }
                    if (loaded) resolve();
                    else setTimeout(checkImages, 100);
                };

                if (doc.readyState === 'complete') {
                    checkImages();
                } else {
                    iframe.onload = checkImages;
                }
            });

            // Small buffer to ensure rendering is complete
            await new Promise(resolve => requestAnimationFrame(resolve));

            const canvas = await html2canvas(doc.body, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 794, // A4 width at 96 DPI approx
                windowWidth: 794,
            });

            document.body.removeChild(iframe);

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

            // Helper to check if remaining content has actual text/graphics (not just whitespace)
            const hasSignificantContent = (fromY: number): boolean => {
                if (fromY >= totalHeight) return false;

                const ctx = canvas.getContext('2d');
                if (!ctx) return true; // If we can't check, assume content exists

                const checkHeight = Math.min(100, totalHeight - fromY); // Check first 100px
                const imageData = ctx.getImageData(0, fromY, canvas.width, checkHeight);
                const data = imageData.data;

                let nonWhitePixels = 0;
                const totalPixels = data.length / 4;

                // Count non-white pixels
                for (let i = 0; i < data.length; i += 4) {
                    // Check if pixel is NOT white (< 250 for any RGB channel means it's not pure white)
                    if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
                        nonWhitePixels++;
                    }
                }

                // If more than 0.5% of pixels are non-white, consider it as significant content
                return (nonWhitePixels / totalPixels) > 0.005;
            };

            while (currentY < totalHeight) {
                // Calculate usable height for this specific page
                // Page 1: 297mm - 30mm bottom = 267mm
                // Page 2+: 297mm - 30mm bottom - 15mm top = 252mm
                const pageUsableHeightMm = pageNum === 0 ? usableHeight : (usableHeight - 15);
                const pageUsableHeightPx = Math.floor(pageUsableHeightMm * pxPerMm);

                // Calculate how much content is left
                const remainingHeight = totalHeight - currentY;

                // If this is not the first page, check if remaining content is significant
                // Don't create a new page for just whitespace
                if (pageNum > 0) {
                    if (remainingHeight < 50 || !hasSignificantContent(currentY)) {
                        break;
                    }
                    pdf.addPage();
                }

                // Calculate target end position for this page
                const targetEndY = currentY + pageUsableHeightPx;

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

                    // --- Manual QR Code Stamping (Every Page) ---
                    // Coordinates: Bottom-Right
                    // A4 Width: 210mm
                    // A4 Height: 297mm
                    // Desired Right Margin from edge: ~20mm (aligned with text)
                    // Desired Bottom Margin from edge: ~25mm
                    const qrSize = 18; // 18mm size (diperbesar dari 15mm)
                    const qrX = 210 - 20 - qrSize; // Right align at 20mm margin
                    const qrY = 297 - 25; // Bottom align at 25mm margin

                    // Check if we found a QR code in the document
                    const qrImgElement = doc.querySelector('.qr-running img') as HTMLImageElement;
                    if (qrImgElement && qrImgElement.src) {
                        try {
                            pdf.addImage(qrImgElement.src, 'PNG', qrX, qrY, qrSize, qrSize);
                        } catch (e) {
                            console.warn('Failed to add QR code to page', e);
                        }
                    }
                    // ------------------------------------------
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
                onPdfReady?.(url);
            }
        } catch (err) {
            console.error('PDF generation error:', err);
            if (currentRenderId === renderIdRef.current) {
                setError('Gagal generate PDF preview');
                onPdfReady?.(null);
            }
        } finally {
            if (currentRenderId === renderIdRef.current) {
                setIsGenerating(false);
            }
        }
    }, [htmlContent]);

    useEffect(() => {
        // Debounce slightly to prevent flicker on rapid updates, but keep it snappy
        const timer = setTimeout(() => generatePDF(), 100);
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
        const targetPage = Math.max(1, Math.min(numPages, page));
        setCurrentPage(targetPage);

        // Scroll to the specific page
        const pageElement = document.getElementById(`page-${targetPage}`);
        if (pageElement && mainViewRef.current) {
            // Menggunakan parent scrollable container secara langsung
            const containerTop = mainViewRef.current.getBoundingClientRect().top;
            const elementTop = pageElement.getBoundingClientRect().top;
            const scrollTop = mainViewRef.current.scrollTop;

            mainViewRef.current.scrollTo({
                top: scrollTop + elementTop - containerTop - 24, // 24px is p-6 padding
                behavior: 'smooth'
            });
        }
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

        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            // Wait for iframe content to be fully loaded
            setTimeout(() => {
                const iframeWindow = iframe.contentWindow;
                if (!iframeWindow) {
                    document.body.removeChild(iframe);
                    return;
                }

                // Listen for afterprint event to know when user is done
                const cleanupIframe = () => {
                    // Give a small delay to ensure print dialog is fully closed
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 100);
                };

                // Add event listeners for when print dialog closes
                iframeWindow.addEventListener('afterprint', cleanupIframe);

                // Fallback: also clean up if user navigates away or closes window
                // This handles edge cases where afterprint might not fire
                const fallbackCleanup = setTimeout(() => {
                    cleanupIframe();
                }, 60000); // 60 seconds fallback

                // Focus and trigger print
                iframeWindow.focus();
                iframeWindow.print();

                // If print() returns immediately (some browsers), clean up the timeout
                // The afterprint event will handle the actual cleanup
            }, 250); // Increased timeout to ensure PDF is fully rendered
        };

        // Fallback error handler
        iframe.onerror = () => {
            console.error('Failed to load PDF for printing');
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        };
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

    // Sync sidebar with scroll
    useEffect(() => {
        if (!mainViewRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageNumber = Number(entry.target.id.replace('page-', ''));
                        setCurrentPage(pageNumber);
                    }
                });
            },
            {
                root: mainViewRef.current,
                threshold: 0,
                // Shrink the detection area to just the middle 10% horizontal strip
                // This ensures we highlight the page that occupies the center of the view,
                // regardless of its height relative to the viewport.
                rootMargin: '-45% 0px -45% 0px'
            }
        );

        // Observe all page elements
        for (let i = 1; i <= numPages; i++) {
            const element = document.getElementById(`page-${i}`);
            if (element) observer.observe(element);
        }

        return () => observer.disconnect();
    }, [numPages, pdfUrl]); // Re-run when PDF changes

    // Initial loading state (only when no PDF is shown yet)
    if (isGenerating && !pdfUrl) {
        return (
            <div className={cn("flex flex-col bg-zinc-800 rounded-xl overflow-hidden", className)} style={{ height: '75vh', minHeight: '800px' }}>
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

    // Error state (only when no PDF and not generating)
    if ((error || !pdfUrl) && !isGenerating) {
        return (
            <div className={cn("flex flex-col bg-zinc-800 rounded-xl overflow-hidden", className)} style={{ height: '75vh', minHeight: '800px' }}>
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
            className={cn("flex flex-col bg-zinc-800 rounded-xl overflow-hidden relative", className)}
            style={{ height: '75vh', minHeight: '800px' }}
        >
            {/* ... rest of the component ... */}
            {/* Loading Overlay when updating */}
            {isGenerating && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-zinc-800/90 text-white px-6 py-4 rounded-lg shadow-xl flex flex-col items-center border border-zinc-700">
                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-400" />
                        <span className="text-sm font-medium">Updating preview...</span>
                    </div>
                </div>
            )}

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
                            <Document file={pdfUrl} loading={null} error={null} className="flex flex-col items-center">
                                {Array.from({ length: numPages }, (_, index) => (
                                    <div
                                        key={index + 1}
                                        onClick={() => goToPage(index + 1)}
                                        className={cn(
                                            "cursor-pointer transition-all duration-150 mb-3 relative flex justify-center", // Added flex justify-center
                                            currentPage === index + 1
                                                ? "ring-2 ring-blue-500 rounded-sm" // Changed rounded to rounded-sm
                                                : "hover:ring-2 hover:ring-zinc-600 rounded-sm"
                                        )}
                                    >
                                        <Page
                                            pageNumber={index + 1}
                                            width={80} // Fixed width for thumbnails
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="shadow-sm"
                                        />

                                        {/* Page number label */}
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">
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
                    className="flex-1 overflow-auto bg-zinc-600 relative"
                >
                    <div
                        className="flex flex-col items-center p-6 space-y-4"
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
                            className="flex flex-col gap-4"
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                <div
                                    key={`page_${index + 1}`}
                                    id={`page-${index + 1}`}
                                    className="relative"
                                >
                                    <Page
                                        pageNumber={index + 1}
                                        scale={zoom / 100}
                                        className="shadow-2xl rounded bg-white"
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                    {/* Page number indicator (optional, mostly for debug/clarity on long docs) */}
                                    <div className="absolute -right-12 top-0 text-zinc-400 text-xs font-mono hidden xl:block">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </Document>
                    </div>
                </div>
            </div>
        </div>
    );
}
