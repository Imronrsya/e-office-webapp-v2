'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import for react-pdf to avoid SSR issues
const Document = dynamic(
    () => import('react-pdf').then(mod => mod.Document),
    { 
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }
);

const Page = dynamic(
    () => import('react-pdf').then(mod => mod.Page),
    { ssr: false }
);

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
    import('react-pdf').then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
    });
}

export interface PdfViewerProps {
    file: string | File | null;
    pageNumber?: number;
    width?: number;
    onLoadSuccess?: (numPages: number) => void;
    onLoadError?: (error: Error) => void;
    renderMode?: 'canvas' | 'custom' | 'none';
    className?: string;
    pageClassName?: string;
}

export function PdfViewer({
    file,
    pageNumber = 1,
    width,
    onLoadSuccess,
    onLoadError,
    renderMode = 'canvas',
    className = '',
    pageClassName = '',
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        onLoadSuccess?.(numPages);
    };

    const handleDocumentLoadError = (error: Error) => {
        console.error('PDF Load Error:', error);
        onLoadError?.(error);
    };

    if (!isClient || !file) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-100 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Document
            file={file}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            className={className}
            loading={
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
            error={
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-red-500">
                    <p>Gagal memuat PDF</p>
                </div>
            }
        >
            <Page 
                pageNumber={pageNumber} 
                width={width}
                renderMode={renderMode}
                className={pageClassName}
                renderTextLayer={true}
                renderAnnotationLayer={true}
            />
        </Document>
    );
}

export { Document, Page };
export default PdfViewer;
