"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, Pencil, FolderOpen, Loader2, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { SignatureCanvas } from "./SignatureCanvas";
import { SignatureUpload } from "./SignatureUpload";
import { SignatureSaved } from "./SignatureSaved";

// Dynamic imports for preview components (same as detail page)
import dynamic from "next/dynamic";
const SuratPreview = dynamic(
  () => import("@/components/universal-preview").then((mod) => mod.SuratPreview),
  { ssr: false }
);
const PDFPreview = dynamic(
  () => import("@/components/universal-preview").then((mod) => mod.PDFPreview),
  { ssr: false }
);

export interface SignatureModalResult {
  signatureData?: string; // base64 data for new signatures
  signatureUrl?: string; // URL for saved signatures
  saveSignature: boolean;
}

// Preview data for Surat Pengantar (Kaprodi/Kadep)
export interface SuratPengantarPreviewData {
  type: "surat-pengantar";
  submissionData: {
    nama: string;
    nim?: string;
    nip?: string;
    programStudi: string;
    departemen?: string;
    keperluan: string;
    judulAcara: string;
    tanggalAcara: string;
    lokasiAcara: string;
    durasiAcara?: string;
  };
  documentData?: {
    nomorSurat?: string | null;
    tanggalSurat?: string | null;
    perihal?: string | null;
    content?: Record<string, unknown> | null;
    contentHtml?: string | null;
    isSigned?: boolean;
    tembusan?: Array<{ name: string; description?: string }> | null;
    signatures?: Array<{
      signerRole: string;
      signerName: string;
      signerNip?: string;
      signatureUrl?: string;
      positionX?: number | null;
      positionY?: number | null;
      positionPage?: number | null;
    }>;
  };
  fileUrl?: string | null;
  // Info about the current signer so we can inject their temp signature
  currentSignerRole: string;
}

// Preview data for SK/ST (Dekan/Wadek)
export interface SuratHasilPreviewData {
  type: "surat-hasil";
  content: Record<string, unknown> | null;
  documentType: "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN";
  signatures?: Array<{
    signerRole: string;
    signerName: string;
    signerNip?: string | null;
    signatureUrl?: string | null;
    prefix?: string | null;
    order: number;
    positionX?: number | null;
    positionY?: number | null;
    positionPage?: number | null;
  }>;
  fileUrl?: string | null;
  isSigned?: boolean;
  // Info about the current signer so we can inject their temp signature
  currentSignerRole: string;
}

export type PreviewData = SuratPengantarPreviewData | SuratHasilPreviewData;

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: SignatureModalResult) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  // Preview data - if provided, show side-by-side layout with live preview
  previewData?: PreviewData;
}

type TabValue = "upload" | "draw" | "saved";

export function SignatureModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Tanda Tangan Digital",
  description = "Pilih metode tanda tangan yang Anda inginkan",
  isLoading = false,
  previewData,
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("draw");
  const [saveSignature, setSaveSignature] = useState(false);

  // State for each tab's signature
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [selectedSavedUrl, setSelectedSavedUrl] = useState<string | null>(null);

  // Get current temporary signature based on active tab
  const currentTempSignature = useMemo(() => {
    switch (activeTab) {
      case "draw":
        return drawnSignature ? { signatureData: drawnSignature } : null;
      case "upload":
        return uploadedSignature ? { signatureData: uploadedSignature } : null;
      case "saved":
        return selectedSavedUrl ? { signatureUrl: selectedSavedUrl } : null;
      default:
        return null;
    }
  }, [activeTab, drawnSignature, uploadedSignature, selectedSavedUrl]);

  const hasPreview = !!previewData;

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state when closing
      setDrawnSignature(null);
      setUploadedSignature(null);
      setSelectedSavedUrl(null);
      setSaveSignature(false);
      setActiveTab("draw");
    }
    onOpenChange(newOpen);
  };

  // Check if current tab has a valid signature
  const hasValidSignature = useCallback(() => {
    switch (activeTab) {
      case "draw":
        return !!drawnSignature;
      case "upload":
        return !!uploadedSignature;
      case "saved":
        return !!selectedSavedUrl;
      default:
        return false;
    }
  }, [activeTab, drawnSignature, uploadedSignature, selectedSavedUrl]);

  // Handle confirm
  const handleConfirm = () => {
    if (!hasValidSignature()) return;

    const result: SignatureModalResult = {
      saveSignature: saveSignature && activeTab !== "saved", // Don't re-save already saved signatures
    };

    switch (activeTab) {
      case "draw":
        result.signatureData = drawnSignature!;
        break;
      case "upload":
        result.signatureData = uploadedSignature!;
        break;
      case "saved":
        result.signatureUrl = selectedSavedUrl!;
        break;
    }

    onConfirm(result);
  };

  // Render the live preview panel
  const renderPreview = () => {
    if (!previewData) return null;

    if (previewData.type === "surat-pengantar") {
      // Build document data with temporary signature injected
      const docData = previewData.documentData
        ? {
          ...previewData.documentData,
          signatures: buildSuratPengantarSignatures(
            previewData.documentData.signatures,
            previewData.currentSignerRole,
            currentTempSignature
          ),
        }
        : undefined;

      return (
        <SuratPreview
          submissionData={previewData.submissionData}
          documentData={docData}
          fileUrl={null} // Always use template for live preview
          fileName="Surat Pengantar"
          // Force watermark to be shown regardless of temp signature progress,
          // because if they are here, they haven't finished signing anyway.
          showDraftBadge={true}
        />
      );
    }

    if (previewData.type === "surat-hasil") {
      // Build signatures with temp signature injected
      const signaturesWithTemp = buildSuratHasilSignatures(
        previewData.signatures,
        previewData.currentSignerRole,
        currentTempSignature
      );

      return (
        <PDFPreview
          fileUrl={null} // Always use template for live preview
          fileName={
            previewData.documentType === "SURAT_KEPUTUSAN"
              ? "Surat Keputusan"
              : "Surat Tugas"
          }
          isSigned={false}
          showDraftBadge={true}
          content={previewData.content}
          documentType={previewData.documentType}
          signatures={signaturesWithTemp}
        />
      );
    }

    return null;
  };

  // Render signature input section (tabs + canvas/upload/saved)
  const renderSignatureInput = () => (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Gambar</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Unggah</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Tersimpan</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 min-h-[250px]">
          <TabsContent value="draw" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gambar tanda tangan Anda menggunakan mouse atau layar sentuh
              </p>
              <SignatureCanvas
                onSignatureChange={setDrawnSignature}
                width={hasPreview ? 400 : 480}
                height={hasPreview ? 150 : 180}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Unggah gambar tanda tangan Anda (PNG atau JPG, maks 2MB)
              </p>
              <SignatureUpload onSignatureChange={setUploadedSignature} />
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pilih dari tanda tangan yang sudah tersimpan
              </p>
              <SignatureSaved
                onSelect={(url) => setSelectedSavedUrl(url)}
                selectedId={selectedSavedUrl || undefined}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Save checkbox - only show for new signatures */}
      {activeTab !== "saved" && (
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Checkbox
            id="save-signature"
            checked={saveSignature}
            onCheckedChange={(checked) => setSaveSignature(!!checked)}
          />
          <Label
            htmlFor="save-signature"
            className="text-sm font-normal cursor-pointer"
          >
            Simpan tanda tangan untuk digunakan nanti
          </Label>
        </div>
      )}
    </>
  );

  // Layout with preview (side-by-side)
  if (hasPreview) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent hideCloseButton className="sm:max-w-[1400px] max-h-[92vh] flex flex-col p-6">
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden mt-2">
            {/* Left: Live Document Preview */}
            <div className="lg:w-[60%] flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Preview Surat
                </span>
                {currentTempSignature && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Tanda tangan diterapkan
                  </span>
                )}
              </div>
              <div className="flex-1 rounded-lg overflow-hidden border bg-zinc-100 relative flex flex-col min-h-0">
                {renderPreview()}
              </div>
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="hidden lg:block" />

            {/* Right: Signature Input */}
            <div className="lg:w-[40%] flex flex-col min-h-0 overflow-hidden">
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-xl">{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2 pb-2">
                {renderSignatureInput()}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!hasValidSignature() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Tanda Tangani"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Fallback: Original layout without preview
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {renderSignatureInput()}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasValidSignature() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Tanda Tangani"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Explicit type for surat pengantar signature entries
type PengantarSignatureEntry = {
  signerRole: string;
  signerName: string;
  signerNip?: string;
  signatureUrl?: string;
  positionX?: number | null;
  positionY?: number | null;
  positionPage?: number | null;
};

function buildSuratPengantarSignatures(
  existingSignatures: PengantarSignatureEntry[] | undefined,
  currentSignerRole: string,
  tempSignature: { signatureData?: string; signatureUrl?: string } | null
): PengantarSignatureEntry[] | undefined {
  const sigs = [...(existingSignatures || [])];

  if (!tempSignature) return sigs.length > 0 ? sigs : existingSignatures;

  // Find the current signer's signature entry and inject the temp data
  const signerIndex = sigs.findIndex(
    (s) => s.signerRole === currentSignerRole
  );

  if (signerIndex !== -1) {
    // Update existing entry with temp signature
    sigs[signerIndex] = {
      ...sigs[signerIndex],
      signatureUrl: tempSignature.signatureUrl || tempSignature.signatureData,
    };
  } else {
    // Add new entry for this signer with temp signature
    sigs.push({
      signerRole: currentSignerRole,
      signerName: "",
      signerNip: "",
      signatureUrl: tempSignature.signatureUrl || tempSignature.signatureData,
    });
  }

  return sigs;
}

// =============================================================================
// Helper: Inject temporary signature into surat hasil signatures array
// =============================================================================
function buildSuratHasilSignatures(
  existingSignatures: SuratHasilPreviewData["signatures"],
  currentSignerRole: string,
  tempSignature: { signatureData?: string; signatureUrl?: string } | null
): SuratHasilPreviewData["signatures"] {
  const sigs = [...(existingSignatures || [])];

  if (!tempSignature) return sigs;

  // Find the current signer's signature entry and inject the temp data
  const signerIndex = sigs.findIndex(
    (s) => s.signerRole === currentSignerRole
  );

  if (signerIndex !== -1) {
    // Update existing entry with temp signature
    sigs[signerIndex] = {
      ...sigs[signerIndex],
      signatureUrl: tempSignature.signatureUrl || tempSignature.signatureData || null,
    };
  }

  return sigs;
}
