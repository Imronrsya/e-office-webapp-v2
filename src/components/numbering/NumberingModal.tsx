"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Hash, Calendar } from "lucide-react";
import { legalisasiService } from "@/services/legalisasi.service";
import { api } from "@/lib/api";
import NumberingPositioner, { type NumberPosition } from "./NumberingPositioner";
import { generatePdfWithSignatures, type SignerPlaceholder } from "@/lib/pdf-generator";

interface SignatureData {
  signerRole: string;
  signerName: string;
  signerNip?: string | null;
  signatureUrl?: string | null;
  signedAt: string;
  order: number;
  positionX?: number | null;
  positionY?: number | null;
  positionPage?: number | null;
}

interface NumberingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentType: string;
  pdfUrl?: string; // URL PDF untuk preview
  content?: Record<string, unknown> | null; // Content untuk generate PDF jika fileUrl tidak ada
  signatures?: SignatureData[]; // Signature data untuk generate PDF
  nomorSuggestion?: string;
  onSuccess: () => void;
}

interface CheckResult {
  status: "idle" | "checking" | "available" | "taken" | "error";
  message?: string;
  existingDocument?: {
    perihal: string;
    tanggalSurat: string;
    letterType: string;
  };
}

export function NumberingModal({
  open,
  onOpenChange,
  documentId,
  documentType,
  pdfUrl,
  content,
  signatures,
  nomorSuggestion,
  onSuccess,
}: NumberingModalProps) {
  const [tanggalSurat, setTanggalSurat] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [checkResult, setCheckResult] = useState<CheckResult>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedPdfWidth, setRenderedPdfWidth] = useState<number>(0);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [fetchedPdfUrl, setFetchedPdfUrl] = useState<string | null>(null);
  
  // Number position state for drag-and-drop
  const [numberPosition, setNumberPosition] = useState<NumberPosition>({
    x: 270, // Default position (center-ish)
    y: 165, // Below header
    page: 1,
    fontSize: 11,
    nomorSurat: nomorSuggestion || "",
  });

  // Effective PDF URL - prioritize fetched blob URL, then generated one
  const effectivePdfUrl = fetchedPdfUrl || generatedPdfUrl;

  // Fetch PDF from backend proxy when document has a fileUrl
  useEffect(() => {
    if (!open || !documentId) return;
    
    // If there's a pdfUrl, fetch it via the proxy endpoint (avoids signed URL issues)
    const fetchPdfFromProxy = async () => {
      setIsGeneratingPdf(true);
      console.log('[NumberingModal] Fetching PDF via proxy for document:', documentId);
      
      try {
        const response = await api.get(`/api/legalisasi/document/${documentId}/pdf`, {
          responseType: 'blob'
        });
        
        // Create blob URL from response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setFetchedPdfUrl(url);
        console.log('[NumberingModal] PDF fetched successfully via proxy');
      } catch (error) {
        console.warn('[NumberingModal] Failed to fetch PDF via proxy, will try to generate:', error);
        // If proxy fails, we'll fall back to generating from content below
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    // Try to fetch existing PDF if pdfUrl indicates there's one
    if (pdfUrl) {
      fetchPdfFromProxy();
      return;
    }

    // If no pdfUrl, generate from content
    if (!content || documentType === 'SURAT_PENGANTAR') {
      console.log('[NumberingModal] No content or unsupported type, cannot generate PDF');
      return;
    }

    const generatePdf = async () => {
      setIsGeneratingPdf(true);
      console.log('[NumberingModal] Generating PDF from content...');
      
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
        const pdfBlob = await generatePdfWithSignatures(
          documentType as 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN',
          content,
          signerPlaceholders,
          600 // default rendered width
        );

        // Create blob URL
        const url = URL.createObjectURL(pdfBlob);
        setGeneratedPdfUrl(url);
        console.log('[NumberingModal] PDF generated successfully');
      } catch (error) {
        console.error('[NumberingModal] Failed to generate PDF:', error);
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    generatePdf();

    // Cleanup on unmount
    return () => {
      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl);
      }
      if (fetchedPdfUrl) {
        URL.revokeObjectURL(fetchedPdfUrl);
      }
    };
  }, [open, pdfUrl, content, documentType, signatures, documentId]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      console.log('[NumberingModal] Modal opened with pdfUrl:', pdfUrl);
      setNumberPosition({
        x: 270,
        y: 165,
        page: 1,
        fontSize: 11,
        nomorSurat: nomorSuggestion || "",
      });
      setTanggalSurat(new Date().toISOString().split("T")[0]);
      setCheckResult({ status: "idle" });
      setError(null);
      // Reset fetched PDF URL when modal opens (will be re-fetched)
      setFetchedPdfUrl(null);
      setGeneratedPdfUrl(null);
    }
  }, [open, nomorSuggestion, pdfUrl]);

  // Debounced check for nomor surat availability
  const checkNomorSurat = useCallback(async (nomor: string) => {
    if (!nomor || nomor.length < 5) {
      setCheckResult({ status: "idle" });
      return;
    }

    setCheckResult({ status: "checking" });

    try {
      const response = await legalisasiService.checkNumber(nomor);
      
      if (response.success && response.data) {
        if (response.data.isAvailable) {
          setCheckResult({ 
            status: "available",
            message: "Nomor tersedia"
          });
        } else {
          setCheckResult({ 
            status: "taken",
            message: "Nomor sudah digunakan",
            existingDocument: response.data.existingDocument
          });
        }
      } else {
        setCheckResult({ 
          status: "error",
          message: response.error || "Gagal memeriksa nomor"
        });
      }
    } catch {
      setCheckResult({ 
        status: "error",
        message: "Terjadi kesalahan saat memeriksa nomor"
      });
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      checkNomorSurat(numberPosition.nomorSurat);
    }, 500);

    return () => clearTimeout(timer);
  }, [numberPosition.nomorSurat, checkNomorSurat]);

  // Get document type label
  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case "SURAT_TUGAS":
      case "SURAT_TUGAS_TABEL":
        return "Surat Tugas";
      case "SURAT_KEPUTUSAN":
        return "Surat Keputusan";
      default:
        return documentType;
    }
  };

  // Get format hint based on document type
  const getFormatHint = () => {
    const year = new Date().getFullYear();
    const month = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
    switch (documentType) {
      case "SURAT_TUGAS":
      case "SURAT_TUGAS_TABEL":
        return `Contoh: 001/UN7.5/ST/${month}/${year}`;
      case "SURAT_KEPUTUSAN":
        return `Contoh: 001/UN7.5/SK/${month}/${year}`;
      default:
        return `Contoh: 001/UN7.5/XX/${month}/${year}`;
    }
  };

  // Handle submit with position data
  const handleSubmit = async () => {
    if (!numberPosition.nomorSurat.trim()) {
      setError("Nomor surat wajib diisi");
      return;
    }

    if (!tanggalSurat) {
      setError("Tanggal surat wajib diisi");
      return;
    }

    if (checkResult.status === "taken") {
      setError("Nomor surat sudah digunakan, silakan pilih nomor lain");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate scale factor to convert from rendered PDF coordinates to actual PDF coordinates
      // A4 PDF is typically 595 points wide, so we need to scale
      const A4_WIDTH = 595;
      const scaleFactor = renderedPdfWidth > 0 ? A4_WIDTH / renderedPdfWidth : 1;
      
      const response = await legalisasiService.assignNumberWithPosition(documentId, {
        nomorSurat: numberPosition.nomorSurat.trim(),
        tanggalSurat,
        position: {
          x: Math.round(numberPosition.x * scaleFactor),
          y: Math.round(numberPosition.y * scaleFactor),
          page: numberPosition.page,
          fontSize: numberPosition.fontSize,
        },
      });

      if (response.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(response.error || "Gagal memberikan nomor surat");
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan nomor surat");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render check status icon
  const renderCheckStatus = () => {
    switch (checkResult.status) {
      case "checking":
        return (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memeriksa...</span>
          </div>
        );
      case "available":
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>{checkResult.message}</span>
          </div>
        );
      case "taken":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              <span>{checkResult.message}</span>
            </div>
            {checkResult.existingDocument && (
              <p className="text-xs text-red-500 ml-6">
                Digunakan pada: {checkResult.existingDocument.perihal || "Tidak ada perihal"}
              </p>
            )}
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>{checkResult.message}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Penomoran Surat
          </DialogTitle>
          <DialogDescription>
            Masukkan nomor surat dan drag ke posisi yang diinginkan pada dokumen
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Panel - PDF Positioner */}
          <div className="order-2 lg:order-1">
            {isGeneratingPdf ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-slate-600">Membuat preview PDF...</span>
              </div>
            ) : (
              <NumberingPositioner
                pdfUrl={effectivePdfUrl || undefined}
                numberPosition={numberPosition}
                onPositionChange={setNumberPosition}
                onRenderedWidthChange={setRenderedPdfWidth}
              />
            )}
          </div>

          {/* Right Panel - Form */}
          <div className="order-1 lg:order-2 space-y-4">
            {/* Nomor Surat Check Status */}
            {renderCheckStatus()}

            {/* Tanggal Surat Input */}
            <div className="space-y-2">
              <Label htmlFor="tanggalSurat" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tanggal Surat
              </Label>
              <Input
                id="tanggalSurat"
                type="date"
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Preview */}
            {numberPosition.nomorSurat && (
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-sm text-zinc-500 mb-1">Preview Nomor</p>
                <p className="font-mono text-lg font-medium">
                  Nomor: {numberPosition.nomorSurat}
                </p>
                <p className="text-sm text-zinc-600 mt-1">
                  Tanggal: {new Date(tanggalSurat).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="text-xs text-zinc-500 mt-2 space-y-1">
                  <p>Posisi: X={Math.round(numberPosition.x)}, Y={Math.round(numberPosition.y)}</p>
                  <p>Halaman: {numberPosition.page}</p>
                  <p>Font: {numberPosition.fontSize}pt</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Format Reference */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-2">Format Penomoran:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Dengan bulan: XXX/UN7.5/ST/I/YYYY</li>
                <li>• Tanpa bulan: XXX/UN7.5/SK/YYYY</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2 italic">
                Kode jenis: ST (Surat Tugas), SK (Surat Keputusan)
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !numberPosition.nomorSurat.trim() ||
              !tanggalSurat ||
              checkResult.status === "taken" ||
              checkResult.status === "checking"
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Nomor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
