'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grip, Hash, Loader2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Dynamic import for react-pdf to avoid SSR issues
const Document = dynamic(
    () => import('react-pdf').then(mod => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
        return mod.Document;
    }),
    { ssr: false }
);

const Page = dynamic(
    () => import('react-pdf').then(mod => mod.Page),
    { ssr: false }
);

// Import styles conditionally on client side
if (typeof window !== 'undefined') {
    // @ts-expect-error - CSS modules
    import('react-pdf/dist/Page/AnnotationLayer.css').catch(() => {});
    // @ts-expect-error - CSS modules
    import('react-pdf/dist/Page/TextLayer.css').catch(() => {});
}

// Resize observer hook
const useResizeObserver = (ref: React.RefObject<HTMLDivElement | null>, callback: (width: number) => void) => {
    useEffect(() => {
        if (!ref.current) return;
        
        let lastWidth = 0;

        const observer = new ResizeObserver((entries) => {
            if (entries.length > 0) {
                const newWidth = Math.floor(entries[0].contentRect.width);
                if (Math.abs(newWidth - lastWidth) > 2) {
                    lastWidth = newWidth;
                    callback(newWidth);
                }
            }
        });
        
        observer.observe(ref.current);
        
        const initialWidth = Math.floor(ref.current.getBoundingClientRect().width);
        lastWidth = initialWidth;
        callback(initialWidth);

        return () => observer.disconnect();
    }, [ref, callback]);
};

export interface NumberPosition {
    x: number;
    y: number;
    page: number;
    fontSize: number;
    nomorSurat: string;
}

interface Props {
    pdfUrl?: string;
    numberPosition: NumberPosition;
    onPositionChange: (position: NumberPosition) => void;
    onRenderedWidthChange?: (width: number) => void;
}

// Memoized PDF Page component
const PdfPage = React.memo(({ 
    file, 
    width, 
    pageNumber, 
    onLoadSuccess, 
    onPageRenderSuccess,
    onLoadError
}: { 
    file: string, 
    width: number, 
    pageNumber: number, 
    onLoadSuccess: (data: { numPages: number }) => void,
    onPageRenderSuccess: (page: { width: number; height: number }) => void,
    onLoadError?: (error: Error) => void
}) => {
    return (
        <Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            onLoadError={(error) => {
                console.error('[PdfPage] Failed to load PDF:', error);
                onLoadError?.(error);
            }}
            className="flex flex-col items-center"
            loading={
                <div className="flex flex-col items-center justify-center min-h-[600px] w-full text-slate-400 gap-3">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">Memuat Dokumen...</span>
                </div>
            }
            error={
                <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-lg p-8">
                    <div className="text-red-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <span className="text-red-500 font-medium">Gagal memuat PDF</span>
                    <p className="text-slate-400 text-sm mt-1">Pastikan file PDF valid dan dapat diakses</p>
                </div>
            }
        >
            {width ? (
                <Page 
                    pageNumber={pageNumber} 
                    width={width > 700 ? 700 : Math.max(width - 32, 300)}
                    className="bg-white shadow-lg"
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={
                        <div className="flex flex-col items-center justify-center min-h-[600px] w-[600px] bg-white text-slate-300">
                            <div className="animate-pulse w-full h-full bg-slate-100 rounded"></div>
                        </div>
                    }
                    onLoadSuccess={(page) => {
                        onPageRenderSuccess({ width: page.width, height: page.height });
                    }}
                />
            ) : (
                <div className="min-h-[600px] w-full flex items-center justify-center text-slate-300">
                    <span className="animate-pulse">Menyiapkan Penampil...</span>
                </div>
            )}
        </Document>
    );
}, (prevProps, nextProps) => {
    return prevProps.file === nextProps.file && 
           Math.abs(prevProps.width - nextProps.width) < 5 && 
           prevProps.pageNumber === nextProps.pageNumber;
});
PdfPage.displayName = 'PdfPage';

// Draggable number box component
const NumberBox = React.memo(({ 
    position, 
    onUpdatePosition,
}: { 
    position: NumberPosition, 
    onUpdatePosition: (x: number, y: number) => void,
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const [localPosition, setLocalPosition] = useState({ x: position.x, y: position.y });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isDragging) {
            setLocalPosition({ x: position.x, y: position.y });
        }
    }, [position.x, position.y, isDragging]);

    const handleDrag = useCallback((_e: DraggableEvent, data: DraggableData) => {
        setLocalPosition({ x: data.x, y: data.y });
    }, []);

    const handleStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleStop = useCallback((_e: DraggableEvent, data: DraggableData) => {
        setIsDragging(false);
        setLocalPosition({ x: data.x, y: data.y });
        onUpdatePosition(data.x, data.y);
    }, [onUpdatePosition]);

    // Dynamic font size calculation (scale from rendered PDF to display)
    const displayFontSize = Math.max(10, Math.min(24, position.fontSize * 0.8));

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            position={localPosition}
            onStart={handleStart}
            onDrag={handleDrag}
            onStop={handleStop}
        >
            <div 
                ref={nodeRef}
                className="absolute top-0 left-0 cursor-move group z-20"
                style={{
                    // Simulate white background overlay effect
                    background: 'white',
                    padding: '2px 8px',
                    border: '2px dashed #3b82f6',
                    borderRadius: '4px',
                }}
            >
                {/* Coordinate display on hover */}
                <div className="absolute -top-6 right-0 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none whitespace-nowrap z-30">
                    X: {Math.round(localPosition.x)} • Y: {Math.round(localPosition.y)}
                </div>

                {/* Number text preview */}
                <div 
                    style={{ 
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: `${displayFontSize}px`,
                        color: '#000000',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                    }}
                >
                    Nomor : {position.nomorSurat || '(Masukkan nomor)'}
                </div>

                {/* Drag handle indicator */}
                <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-60 transition-opacity text-blue-500">
                    <Grip size={10}/>
                </div>
            </div>
        </Draggable>
    );
});
NumberBox.displayName = 'NumberBox';

export default function NumberingPositioner({
    pdfUrl,
    numberPosition,
    onPositionChange,
    onRenderedWidthChange
}: Props) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debug log for pdfUrl
    useEffect(() => {
        console.log('[NumberingPositioner] pdfUrl received:', pdfUrl);
        setPdfError(null);
    }, [pdfUrl]);

    // Calculate the actual rendered width (capped at 700)
    const renderedWidth = containerWidth > 700 ? 700 : Math.max(containerWidth - 32, 300);

    // Notify parent when rendered width changes
    useEffect(() => {
        if (renderedWidth > 0 && onRenderedWidthChange) {
            onRenderedWidthChange(renderedWidth);
        }
    }, [renderedWidth, onRenderedWidthChange]);

    useResizeObserver(containerRef, (width) => {
        setContainerWidth(width);
    });

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        // Start at page 1 (where number usually is)
        setPageNumber(1);
    }, []);

    const onPageRenderSuccess = useCallback((dims: { width: number; height: number }) => {
        setPdfDimensions(dims);
    }, []);

    const handlePositionUpdate = useCallback((x: number, y: number) => {
        onPositionChange({
            ...numberPosition,
            x,
            y,
            page: pageNumber,
        });
    }, [numberPosition, pageNumber, onPositionChange]);

    const handleNomorChange = useCallback((nomor: string) => {
        onPositionChange({
            ...numberPosition,
            nomorSurat: nomor,
        });
    }, [numberPosition, onPositionChange]);

    const handleFontSizeChange = useCallback((size: number) => {
        onPositionChange({
            ...numberPosition,
            fontSize: size,
        });
    }, [numberPosition, onPositionChange]);

    // Navigation handlers
    const goToFirstPage = () => setPageNumber(1);
    const goToPreviousPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
    const goToLastPage = () => setPageNumber(numPages);

    // Check if number is on current page
    const isNumberOnCurrentPage = numberPosition.page === pageNumber;

    return (
        <div className="flex flex-col gap-4 w-full" ref={containerRef}>
            {/* Input Section */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-slate-700">
                    <Hash className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Input Nomor Surat</span>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="nomorSurat" className="text-sm font-medium">
                            Nomor Surat
                        </Label>
                        <Input
                            id="nomorSurat"
                            placeholder="Contoh: 001/UN7.5/ST/I/2026"
                            value={numberPosition.nomorSurat}
                            onChange={(e) => handleNomorChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    
                    <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Ukuran Font: {numberPosition.fontSize}pt
                        </Label>
                        <input
                            type="range"
                            value={numberPosition.fontSize}
                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
                            min={8}
                            max={16}
                            step={1}
                            className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>8pt</span>
                            <span>16pt</span>
                        </div>
                    </div>
                </div>

                {numberPosition.nomorSurat && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                            <strong>Petunjuk:</strong> Drag kotak nomor surat ke posisi yang diinginkan di PDF.
                            Nomor akan di-overlay dengan background putih dan teks hitam.
                        </p>
                    </div>
                )}
            </div>

            {/* PDF Viewer */}
            {pdfUrl ? (
                <div className="border rounded-lg overflow-hidden bg-slate-100">
                    {/* Page Navigation */}
                    <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-2">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToFirstPage}
                                disabled={pageNumber <= 1}
                                className="h-8 w-8 text-white hover:bg-slate-700 disabled:opacity-30"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToPreviousPage}
                                disabled={pageNumber <= 1}
                                className="h-8 w-8 text-white hover:bg-slate-700 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm">
                                Halaman {pageNumber} / {numPages || '-'}
                            </span>
                            {isNumberOnCurrentPage && numberPosition.nomorSurat && (
                                <Badge variant="secondary" className="bg-blue-500 text-white">
                                    Nomor di halaman ini
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToNextPage}
                                disabled={pageNumber >= numPages}
                                className="h-8 w-8 text-white hover:bg-slate-700 disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToLastPage}
                                disabled={pageNumber >= numPages}
                                className="h-8 w-8 text-white hover:bg-slate-700 disabled:opacity-30"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* PDF Content with Draggable Number */}
                    <div 
                        className="relative flex justify-center p-4 bg-slate-200 min-h-[600px]"
                        style={{ overflow: 'auto' }}
                    >
                        <div className="relative">
                            <PdfPage
                                file={pdfUrl}
                                width={containerWidth}
                                pageNumber={pageNumber}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onPageRenderSuccess={onPageRenderSuccess}
                                onLoadError={(error) => setPdfError(error.message)}
                            />
                            
                            {/* Draggable Number Box - only show on current page and when number is entered */}
                            {numberPosition.nomorSurat && isNumberOnCurrentPage && (
                                <div 
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                    style={{ 
                                        width: pdfDimensions?.width || renderedWidth,
                                        height: pdfDimensions?.height || 800,
                                    }}
                                >
                                    <div className="pointer-events-auto w-full h-full relative">
                                        <NumberBox
                                            position={numberPosition}
                                            onUpdatePosition={handlePositionUpdate}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                    <div className="text-center p-4">
                        <div className="text-amber-500 mb-3">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-slate-600 font-medium">PDF tidak tersedia</span>
                        <p className="text-slate-400 text-sm mt-1">
                            Dokumen PDF belum diunggah atau URL tidak valid
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
