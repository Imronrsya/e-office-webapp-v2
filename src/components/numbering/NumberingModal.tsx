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

interface NumberingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentType: string;
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
  nomorSuggestion,
  onSuccess,
}: NumberingModalProps) {
  const [nomorSurat, setNomorSurat] = useState("");
  const [tanggalSurat, setTanggalSurat] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [checkResult, setCheckResult] = useState<CheckResult>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setNomorSurat(nomorSuggestion || "");
      setTanggalSurat(new Date().toISOString().split("T")[0]);
      setCheckResult({ status: "idle" });
      setError(null);
    }
  }, [open, nomorSuggestion]);

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
      checkNomorSurat(nomorSurat);
    }, 500);

    return () => clearTimeout(timer);
  }, [nomorSurat, checkNomorSurat]);

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

  // Handle submit
  const handleSubmit = async () => {
    if (!nomorSurat.trim()) {
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
      const response = await legalisasiService.assignNumber(documentId, {
        nomorSurat: nomorSurat.trim(),
        tanggalSurat,
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Penomoran Surat
          </DialogTitle>
          <DialogDescription>
            Berikan nomor resmi untuk {getDocumentTypeLabel()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nomor Surat Input */}
          <div className="space-y-2">
            <Label htmlFor="nomorSurat">Nomor Surat</Label>
            <Input
              id="nomorSurat"
              placeholder={getFormatHint()}
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              className={
                checkResult.status === "taken" 
                  ? "border-red-500 focus-visible:ring-red-500" 
                  : checkResult.status === "available"
                  ? "border-green-500 focus-visible:ring-green-500"
                  : ""
              }
            />
            <p className="text-xs text-zinc-500">
              Format: [Nomor Urut]/UN7.5/[Kode Jenis Surat]/[Tahun]
            </p>
            {renderCheckStatus()}
          </div>

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
          {nomorSurat && (
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="text-sm text-zinc-500 mb-1">Preview</p>
              <p className="font-mono text-lg font-medium">
                Nomor: {nomorSurat}
              </p>
              <p className="text-sm text-zinc-600 mt-1">
                Tanggal: {new Date(tanggalSurat).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
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
              !nomorSurat.trim() ||
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
