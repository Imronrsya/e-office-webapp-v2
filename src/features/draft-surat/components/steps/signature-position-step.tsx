'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDraftSurat, Signer } from '../../context/draft-surat-context';
import { ChevronLeft, Download, Grip, Send, FileCheck, Loader2 } from 'lucide-react';

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
if (typeof window !== 'undefined') {
  import('react-pdf/dist/Page/AnnotationLayer.css');
  import('react-pdf/dist/Page/TextLayer.css');
}

// Import templates
import { generateSuratPengantarHTML as suratPengantarTemplate } from '@/lib/templates/surat-pengantar';
import { suratTugasTemplate } from '@/lib/templates/surat-tugas';
import { suratTugasTableTemplate } from '@/lib/templates/surat-tugas-table';
import { suratKeputusanTemplate } from '@/lib/templates/surat-keputusan';

// Custom hook for resize observer
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

const COLORS: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-50/50', text: 'text-slate-900' },
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50/50', text: 'text-slate-900' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50/50', text: 'text-slate-900' },
  amber: { border: 'border-amber-500', bg: 'bg-amber-50/50', text: 'text-slate-900' },
  rose: { border: 'border-rose-500', bg: 'bg-rose-50/50', text: 'text-slate-900' },
  cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50/50', text: 'text-slate-900' },
};

// Memoized SignerBox component
const SignerBox = React.memo(({ 
  signer, 
  onUpdatePosition
}: { 
  signer: Signer, 
  onUpdatePosition: (id: number, x: number, y: number) => void
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const styles = COLORS[signer.color] || COLORS.blue;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    let deltaX = 0;
    let deltaY = 0;

    switch (e.key) {
      case 'ArrowUp': deltaY = -step; break;
      case 'ArrowDown': deltaY = step; break;
      case 'ArrowLeft': deltaX = -step; break;
      case 'ArrowRight': deltaX = step; break;
      default: return;
    }

    e.preventDefault();
    const newX = position.x + deltaX;
    const newY = position.y + deltaY;
    
    setPosition({ x: newX, y: newY });
    onUpdatePosition(signer.id, newX, newY);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={position}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
    >
      <div 
        ref={nodeRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`absolute top-0 left-0 min-w-[13rem] max-w-fit h-[120px] border-2 border-dashed ${styles.border} ${styles.bg} rounded-lg cursor-move flex flex-col justify-between px-3 py-2 group z-20 hover:shadow-lg transition-shadow backdrop-blur-sm text-left outline-none focus:ring-2 focus:ring-primary`}
      >
        {/* Position indicator */}
        <div className="absolute -top-6 right-0 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none whitespace-nowrap z-30 shadow-sm">
          X: {Math.round(position.x)} • Y: {Math.round(position.y)}
        </div>

        {/* Signer content */}
        <div className={`text-[9pt] leading-tight ${styles.text}`} style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <div className="min-h-[0.75rem] mb-3 whitespace-pre text-gray-600">{signer.prefix || ' '}</div>
          <div className="font-medium">{signer.role || 'Jabatan'}</div>
        </div>

        <div className={`text-[9pt] leading-tight ${styles.text}`} style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <div className="underline mb-0.5">{signer.name || 'Nama Pejabat'}</div>
          <div className="text-gray-600">{signer.nip || 'NIP'}</div>
        </div>

        {/* Drag handle indicator */}
        <div className={`absolute bottom-1 right-1 opacity-0 group-hover:opacity-40 transition-opacity ${styles.text}`}>
          <Grip size={12}/>
        </div>
      </div>
    </Draggable>
  );
});

SignerBox.displayName = 'SignerBox';

export function SignaturePositionStep() {
  const { state, updateSigner, prevStep } = useDraftSurat();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  useResizeObserver(containerRef, (width) => {
    setContainerWidth(width);
  });

  // Generate PDF from HTML template
  useEffect(() => {
    const generatePdf = async () => {
      if (!state.formData || !state.selectedTemplate) return;

      setIsGenerating(true);

      try {
        // Generate HTML based on template
        let html = '';
        switch (state.selectedTemplate) {
          case 'surat-pengantar':
            html = suratPengantarTemplate(state.formData as never);
            break;
          case 'surat-tugas':
            html = suratTugasTemplate(state.formData as never);
            break;
          case 'surat-tugas-table':
            html = suratTugasTableTemplate(state.formData as never);
            break;
          case 'surat-keputusan':
            html = suratKeputusanTemplate(state.formData as never);
            break;
        }

        // For now, we'll create a simple placeholder PDF
        // In production, you'd use a server-side HTML to PDF converter
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        
        // Add placeholder text
        page.drawText('Preview Surat', {
          x: 50,
          y: 800,
          size: 16,
          font,
        });
        
        page.drawText('Drag tanda tangan ke posisi yang diinginkan', {
          x: 50,
          y: 750,
          size: 12,
          font,
        });

        page.drawText('Area tanda tangan berada di bawah', {
          x: 50,
          y: 400,
          size: 10,
          font,
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.formData, state.selectedTemplate]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const handlePositionUpdate = useCallback((id: number, x: number, y: number) => {
    updateSigner(id, { x, y });
  }, [updateSigner]);

  const handleDownload = async () => {
    // Implementation for downloading the PDF with embedded signatures
    alert('Fitur download akan tersedia setelah integrasi backend');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Here you would submit the draft to the backend
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Surat berhasil disimpan dan dikirim untuk ditandatangani!');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Gagal mengirim surat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayWidth = containerWidth > 800 ? 800 : Math.max(containerWidth - 64, 300);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atur Posisi Tanda Tangan</h2>
          <p className="text-muted-foreground mt-1">
            Drag kotak tanda tangan ke posisi yang diinginkan pada dokumen
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PDF Preview with Draggable Signers */}
        <div 
          ref={containerRef}
          className="flex-1 bg-slate-200/60 rounded-xl overflow-hidden border border-slate-200 shadow-inner p-8 flex justify-center min-h-[600px] relative"
        >
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-muted-foreground">Generating preview...</p>
            </div>
          ) : pdfUrl ? (
            <div className="relative shadow-xl" ref={pdfWrapperRef}>
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="flex flex-col items-center"
                loading={
                  <div className="flex flex-col items-center justify-center min-h-[600px] w-full text-slate-400 gap-3">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">Memuat Dokumen...</span>
                  </div>
                }
              >
                {displayWidth > 0 && (
                  <Page 
                    pageNumber={pageNumber} 
                    width={displayWidth}
                    className="bg-white shadow-lg"
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                )}
              </Document>

              {/* Draggable Signer Boxes */}
              {state.signers
                .filter(s => s.page === pageNumber)
                .map((signer) => (
                  <SignerBox
                    key={signer.id}
                    signer={signer}
                    onUpdatePosition={handlePositionUpdate}
                  />
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileCheck className="w-12 h-12 mb-4 opacity-50" />
              <p>Tidak dapat memuat preview</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full"></span>
                Penandatangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.signers.map((signer, index) => {
                const colorClass = signer.color === 'blue' ? 'bg-blue-500' :
                  signer.color === 'emerald' ? 'bg-emerald-500' :
                  signer.color === 'purple' ? 'bg-purple-500' :
                  signer.color === 'amber' ? 'bg-amber-500' :
                  signer.color === 'rose' ? 'bg-rose-500' : 'bg-cyan-500';

                return (
                  <div 
                    key={signer.id} 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`w-6 h-6 rounded-full ${colorClass} text-white text-xs flex items-center justify-center font-bold`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{signer.name || 'Nama'}</p>
                      <p className="text-xs text-muted-foreground truncate">{signer.role || 'Jabatan'}</p>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground bg-white px-2 py-1 rounded border">
                      {Math.round(signer.x)}, {Math.round(signer.y)}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Page Navigation */}
          {numPages > 1 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                  >
                    Prev
                  </Button>
                  <span className="text-sm font-medium px-4">
                    {pageNumber} / {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    disabled={pageNumber >= numPages}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim untuk Ditandatangani
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Draft
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center px-4">
            Tip: Gunakan arrow keys untuk penyesuaian posisi yang lebih presisi. 
            Tahan Shift untuk perpindahan 10px.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    </div>
  );
}
