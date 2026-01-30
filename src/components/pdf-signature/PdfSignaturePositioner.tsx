'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grip, X, Plus, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Dynamic import for react-pdf to avoid SSR issues (DOMMatrix is not defined)
const Document = dynamic(
    () => import('react-pdf').then(mod => {
        // Configure PDF.js worker
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
// Note: These styles are now handled via CSS in global.css or imported in layout

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

export interface SignerPosition {
    id: string;
    role: string;
    name: string;
    nip?: string;
    prefix?: string;
    x: number;
    y: number;
    page: number;
    order: number;
}

interface Props {
    pdfUrl?: string;
    signers: SignerPosition[];
    onSignersChange: (signers: SignerPosition[]) => void;
    signerRoles: Array<{ value: string; label: string }>;
    readOnly?: boolean;
    /** Callback when the rendered PDF width changes - useful for coordinate scaling */
    onRenderedWidthChange?: (width: number) => void;
}

const COLORS = [
    { border: 'border-blue-500', bg: 'bg-blue-50/50', text: 'text-slate-900', ring: 'ring-blue-500' },
    { border: 'border-emerald-500', bg: 'bg-emerald-50/50', text: 'text-slate-900', ring: 'ring-emerald-500' },
    { border: 'border-purple-500', bg: 'bg-purple-50/50', text: 'text-slate-900', ring: 'ring-purple-500' },
    { border: 'border-amber-500', bg: 'bg-amber-50/50', text: 'text-slate-900', ring: 'ring-amber-500' },
    { border: 'border-rose-500', bg: 'bg-rose-50/50', text: 'text-slate-900', ring: 'ring-rose-500' },
];

// Memoized PDF Page component
const PdfPage = React.memo(({ 
    file, 
    width, 
    pageNumber, 
    onLoadSuccess, 
    onPageRenderSuccess 
}: { 
    file: string, 
    width: number, 
    pageNumber: number, 
    onLoadSuccess: (data: { numPages: number }) => void,
    onPageRenderSuccess: (page: { width: number; height: number }) => void 
}) => {
    return (
        <Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            className="flex flex-col items-center"
            loading={
                <div className="flex flex-col items-center justify-center min-h-[600px] w-full text-slate-400 gap-3">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">Memuat Dokumen...</span>
                </div>
            }
            error={
                <div className="flex items-center justify-center min-h-[600px] w-full text-red-400 bg-white rounded-lg p-8">
                    Gagal memuat PDF. Pastikan file valid.
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

// Draggable signer box component
const SignerBox = React.memo(({ 
    signer, 
    index, 
    onUpdatePosition,
    signerRoles,
    onRemove,
    onUpdateField,
    readOnly
}: { 
    signer: SignerPosition, 
    index: number, 
    onUpdatePosition: (id: string, x: number, y: number) => void,
    signerRoles: Array<{ value: string; label: string }>,
    onRemove: (id: string) => void,
    onUpdateField: (id: string, field: keyof SignerPosition, value: string) => void,
    readOnly?: boolean
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const styles = COLORS[index % COLORS.length];

    const [position, setPosition] = useState({ x: signer.x, y: signer.y });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isDragging) {
            setPosition({ x: signer.x, y: signer.y });
        }
    }, [signer.x, signer.y, isDragging]);

    const handleDrag = useCallback((_e: DraggableEvent, data: DraggableData) => {
        setPosition({ x: data.x, y: data.y });
    }, []);

    const handleStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleStop = useCallback((_e: DraggableEvent, data: DraggableData) => {
        setIsDragging(false);
        setPosition({ x: data.x, y: data.y });
        onUpdatePosition(signer.id, data.x, data.y);
    }, [signer.id, onUpdatePosition]);

    const roleLabel = signerRoles.find(r => r.value === signer.role)?.label || signer.role;

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            position={position}
            onStart={handleStart}
            onDrag={handleDrag}
            onStop={handleStop}
            disabled={readOnly}
        >
            <div 
                ref={nodeRef}
                className={`absolute top-0 left-0 min-w-[180px] max-w-[220px] border-2 border-dashed ${styles.border} ${styles.bg} rounded-lg ${readOnly ? 'cursor-default' : 'cursor-move'} flex flex-col p-3 group z-20 hover:shadow-lg transition-shadow backdrop-blur-sm`}
            >
                {/* Coordinate display on hover */}
                <div className="absolute -top-6 right-0 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none whitespace-nowrap z-30">
                    X: {Math.round(position.x)} • Y: {Math.round(position.y)}
                </div>

                {/* Remove button */}
                {!readOnly && (
                    <button
                        onClick={() => onRemove(signer.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-30"
                    >
                        <X size={12} />
                    </button>
                )}

                {/* Signer info */}
                <div className={`text-xs leading-relaxed ${styles.text}`} style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {signer.prefix && (
                        <div className="text-[10px] mb-2 opacity-70">{signer.prefix}</div>
                    )}
                    <div className="font-semibold">{roleLabel}</div>
                    <div className="h-12 border-b border-dashed border-current my-2 opacity-30"></div>
                    <div className="text-[11px]">{signer.name || "(Nama Pejabat)"}</div>
                    {signer.nip && (
                        <div className="text-[10px] opacity-70">NIP. {signer.nip}</div>
                    )}
                </div>

                {/* Drag handle */}
                {!readOnly && (
                    <div className={`absolute bottom-1 right-1 opacity-0 group-hover:opacity-40 transition-opacity ${styles.text}`}>
                        <Grip size={12}/>
                    </div>
                )}
            </div>
        </Draggable>
    );
});
SignerBox.displayName = 'SignerBox';

export default function PdfSignaturePositioner({
    pdfUrl,
    signers,
    onSignersChange,
    signerRoles,
    readOnly = false,
    onRenderedWidthChange
}: Props) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const pdfWrapperRef = useRef<HTMLDivElement>(null);

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
        // Auto-navigate to last page (usually where signatures are)
        setPageNumber(numPages);
    }, []);

    const onPageRenderSuccess = useCallback((_dims: { width: number; height: number }) => {
        // Can be used for coordinate calculations if needed
    }, []);

    const handlePositionUpdate = useCallback((id: string, x: number, y: number) => {
        const updated = signers.map(s => s.id === id ? { ...s, x, y } : s);
        onSignersChange(updated);
    }, [signers, onSignersChange]);

    const handleRemoveSigner = useCallback((id: string) => {
        if (signers.length <= 1) return;
        const filtered = signers.filter(s => s.id !== id);
        const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
        onSignersChange(reordered);
    }, [signers, onSignersChange]);

    const handleUpdateField = useCallback((id: string, field: keyof SignerPosition, value: string) => {
        const updated = signers.map(s => s.id === id ? { ...s, [field]: value } : s);
        onSignersChange(updated);
    }, [signers, onSignersChange]);

    const addSigner = () => {
        const signersOnPage = signers.filter(s => s.page === pageNumber);
        if (signersOnPage.length >= 4) {
            return;
        }

        const newId = `signer-${Date.now()}`;
        const BOX_H = 120;
        const START_Y = 400;
        const ROW_GAP = 30;
        const ROW_2_Y = START_Y + BOX_H + ROW_GAP;
        const X_LEFT = 50;
        const X_RIGHT = 350;
        const X_CENTER = (X_LEFT + X_RIGHT) / 2;

        let x = X_RIGHT, y = START_Y;
        const count = signersOnPage.length;
        
        if (count === 0) {
            x = X_RIGHT; y = START_Y;
        } else if (count === 1) {
            x = X_LEFT; y = START_Y;
        } else if (count === 2) {
            x = X_CENTER; y = ROW_2_Y;
        } else if (count === 3) {
            x = X_LEFT; y = ROW_2_Y;
        }

        const newSigner: SignerPosition = {
            id: newId,
            role: '',
            name: '',
            nip: '',
            prefix: '',
            x,
            y,
            page: pageNumber,
            order: signers.length + 1
        };

        onSignersChange([...signers, newSigner]);
    };

    const updateSignerRole = (id: string, role: string) => {
        const roleData = signerRoles.find(r => r.value === role);
        const updated = signers.map(s => s.id === id ? { 
            ...s, 
            role,
            name: roleData?.label || role
        } : s);
        onSignersChange(updated);
    };

    if (!pdfUrl) {
        return (
            <Card className="bg-neutral-50 border-zinc-400">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Upload className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">Pratinjau PDF Belum Tersedia</h3>
                        <p className="text-slate-500 max-w-sm">
                            Template PDF akan ditampilkan di sini untuk penempatan tanda tangan.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="bg-neutral-50 border-zinc-400">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Posisi Tanda Tangan</CardTitle>
                            <CardDescription>
                                Seret kotak tanda tangan ke posisi yang diinginkan pada dokumen
                            </CardDescription>
                        </div>
                        
                        {/* Page Navigation */}
                        {numPages > 1 && (
                            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPageNumber(1)}
                                    disabled={pageNumber <= 1}
                                    className="h-8 w-8"
                                >
                                    <ChevronsLeft size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                    disabled={pageNumber <= 1}
                                    className="h-8 w-8"
                                >
                                    <ChevronLeft size={14} />
                                </Button>
                                <span className="text-sm font-medium text-slate-600 min-w-[4rem] text-center">
                                    {pageNumber} / {numPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                                    disabled={pageNumber >= numPages}
                                    className="h-8 w-8"
                                >
                                    <ChevronRight size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPageNumber(numPages)}
                                    disabled={pageNumber >= numPages}
                                    className="h-8 w-8"
                                >
                                    <ChevronsRight size={14} />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="p-4">
                    {/* PDF Viewer with Draggable Overlays */}
                    <div 
                        ref={containerRef}
                        className="bg-slate-200/60 rounded-xl overflow-hidden border border-slate-200 p-4 flex justify-center min-h-[500px] relative"
                    >
                        <div className="relative shadow-xl" ref={pdfWrapperRef}>
                            <PdfPage 
                                key={pdfUrl}
                                file={pdfUrl} 
                                width={containerWidth} 
                                pageNumber={pageNumber}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onPageRenderSuccess={onPageRenderSuccess}
                            />

                            {/* Draggable Signer Overlays */}
                            {signers
                                .filter(s => s.page === pageNumber)
                                .map((signer, index) => (
                                    <SignerBox
                                        key={signer.id}
                                        index={index}
                                        signer={signer}
                                        onUpdatePosition={handlePositionUpdate}
                                        signerRoles={signerRoles}
                                        onRemove={handleRemoveSigner}
                                        onUpdateField={handleUpdateField}
                                        readOnly={readOnly}
                                    />
                                ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Signer Configuration Panel */}
            <Card className="bg-neutral-50 border-zinc-400">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Konfigurasi Penanda Tangan
                    </CardTitle>
                    <CardDescription>
                        Pilih pejabat dan atur informasi penandatangan
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {signers.map((signer, index) => (
                        <div key={signer.id} className={`p-4 rounded-lg border ${signer.page === pageNumber ? 'bg-white border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${COLORS[index % COLORS.length].border.replace('border-', 'bg-')}`}></div>
                                    <span className="text-sm font-medium">Penandatangan {index + 1}</span>
                                    {signer.page !== pageNumber && (
                                        <Badge variant="outline" className="text-xs">
                                            Halaman {signer.page}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {signer.page !== pageNumber && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPageNumber(signer.page)}
                                            className="text-xs h-7"
                                        >
                                            Lihat
                                        </Button>
                                    )}
                                    {signers.length > 1 && !readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSigner(signer.id)}
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Jabatan</Label>
                                    <Select
                                        value={signer.role}
                                        onValueChange={(value) => updateSignerRole(signer.id, value)}
                                        disabled={readOnly}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Pilih Jabatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {signerRoles.map((role) => (
                                                <SelectItem 
                                                    key={role.value} 
                                                    value={role.value}
                                                    disabled={signers.some(s => s.role === role.value && s.id !== signer.id)}
                                                >
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Awalan (opsional)</Label>
                                    <Input
                                        value={signer.prefix || ''}
                                        onChange={(e) => handleUpdateField(signer.id, 'prefix', e.target.value)}
                                        placeholder="Mengetahui,"
                                        className="h-9"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Nama Pejabat</Label>
                                    <Input
                                        value={signer.name}
                                        onChange={(e) => handleUpdateField(signer.id, 'name', e.target.value)}
                                        placeholder="Dr. Ahmad"
                                        className="h-9"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">NIP</Label>
                                    <Input
                                        value={signer.nip || ''}
                                        onChange={(e) => handleUpdateField(signer.id, 'nip', e.target.value)}
                                        placeholder="197403171998021001"
                                        className="h-9"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {!readOnly && signers.length < 4 && (
                        <Button
                            variant="outline"
                            onClick={addSigner}
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Penanda Tangan
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
