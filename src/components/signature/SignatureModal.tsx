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

// Use UniversalDocumentPreview directly (not legacy wrappers) for better control
import dynamic from "next/dynamic";
const UniversalDocumentPreview = dynamic(
  () => import("@/components/universal-preview").then((mod) => mod.UniversalDocumentPreview),
  { ssr: false }
);

// Import template generators for Surat Pengantar HTML generation
import {
  generateSuratPengantarHTML,
  formatTanggalIndonesia,
} from "@/lib/templates/surat-pengantar";

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
      prefix?: string | null;
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

  // =========================================================================
  // Build preview props for UniversalDocumentPreview
  // =========================================================================
  const previewProps = useMemo(() => {
    if (!previewData) return null;

    if (previewData.type === "surat-pengantar") {
      // Build signatures with temp signature injected
      const signaturesWithTemp = buildSuratPengantarSignatures(
        previewData.documentData?.signatures,
        previewData.currentSignerRole,
        currentTempSignature
      );

      // Generate HTML content for Surat Pengantar
      let htmlContent: string | null = null;

      if (previewData.documentData?.contentHtml) {
        htmlContent = previewData.documentData.contentHtml;
      } else if (previewData.submissionData) {
        const contentData = (previewData.documentData?.content as Record<string, unknown>) || {};

        // Build signature blocks for template
        const signatureBlocks = (signaturesWithTemp || []).map(s => ({
          signerRole: s.signerRole,
          signerName: s.signerName,
          signerNip: s.signerNip,
          signatureUrl: s.signatureUrl,
          prefix: s.prefix || undefined,
        }));

        // Also extract legacy fields as fallback
        const kaprodiSig = signatureBlocks.find(s =>
          s.signerRole.toLowerCase().includes('kaprodi') ||
          s.signerRole.toLowerCase().includes('ketua prodi')
        );
        const kadepSig = signatureBlocks.find(s =>
          s.signerRole.toLowerCase().includes('kadep') ||
          s.signerRole.toLowerCase().includes('ketua departemen')
        );

        const nomorSurat = (contentData.nomorSurat as string) || previewData.documentData?.nomorSurat || "-";
        const tanggalSuratRaw = (contentData.tanggalSurat as string) || previewData.documentData?.tanggalSurat;
        const tanggalSurat = tanggalSuratRaw
          ? formatTanggalIndonesia(new Date(tanggalSuratRaw))
          : formatTanggalIndonesia(new Date());

        htmlContent = generateSuratPengantarHTML({
          nomorSurat,
          tanggalSurat,
          namaTujuan: (contentData.namaTujuan as string) || "[Nama Tujuan]",
          jabatanTujuan: (contentData.jabatanTujuan as string) || "[Jabatan Tujuan]",
          alamatTujuan: (contentData.alamatTujuan as string) || "",
          perihal: (contentData.perihal as string) || previewData.documentData?.perihal || previewData.submissionData.keperluan,
          keperluan: (contentData.keperluan as string) || previewData.submissionData.keperluan,
          namaMahasiswa: (contentData.namaMahasiswa as string) || previewData.submissionData.nama,
          nimMahasiswa: (contentData.nimMahasiswa as string) || previewData.submissionData.nim || previewData.submissionData.nip || "",
          programStudi: (contentData.programStudi as string) || previewData.submissionData.programStudi,
          departemen: (contentData.departemen as string) || previewData.submissionData.departemen || "Teknik Informatika",
          isPengajuMahasiswa: !!previewData.submissionData.nim,
          judulAcara: (contentData.judulAcara as string) || previewData.submissionData.judulAcara,
          tanggalMulai: (contentData.tanggalMulai as string) || previewData.submissionData.tanggalAcara,
          lokasiAcara: (contentData.lokasiAcara as string) || previewData.submissionData.lokasiAcara,
          durasiAcara: (contentData.durasiAcara as string) || previewData.submissionData.durasiAcara || "",
          tembusan: previewData.documentData?.tembusan || [],
          signatures: signatureBlocks.length > 0 ? signatureBlocks : undefined,
          namaKaprodi: kaprodiSig?.signerName,
          nipKaprodi: kaprodiSig?.signerNip,
          signatureKaprodi: kaprodiSig?.signatureUrl,
          prefixKaprodi: kaprodiSig?.prefix,
          namaKadep: kadepSig?.signerName,
          nipKadep: kadepSig?.signerNip,
          signatureKadep: kadepSig?.signatureUrl,
          prefixKadep: kadepSig?.prefix,
          showDraftWatermark: true, // Always show DRAFT watermark in signature modal
        });
      }

      return {
        htmlContent,
        documentType: 'SURAT_PENGANTAR' as const,
        mode: 'html' as const,
        fileName: 'Surat Pengantar',
        showDraftBadge: true, // Always DRAFT in signature modal
      };
    }

    if (previewData.type === "surat-hasil") {
      // Build signatures with temp signature injected
      const signaturesWithTemp = buildSuratHasilSignatures(
        previewData.signatures,
        previewData.currentSignerRole,
        currentTempSignature
      );

      // Convert to SignatureData format for UniversalDocumentPreview
      const convertedSignatures = (signaturesWithTemp || []).map(sig => ({
        signerRole: sig.signerRole,
        signerName: sig.signerName,
        signerNip: sig.signerNip,
        signatureUrl: sig.signatureUrl,
        prefix: sig.prefix,
        order: sig.order,
        positionX: sig.positionX,
        positionY: sig.positionY,
        positionPage: sig.positionPage,
      }));

      return {
        content: previewData.content,
        documentType: previewData.documentType,
        mode: 'html' as const,
        fileName: previewData.documentType === "SURAT_KEPUTUSAN"
          ? "Surat Keputusan"
          : "Surat Tugas",
        signatures: convertedSignatures,
        showDraftBadge: true, // Always DRAFT in signature modal
      };
    }

    return null;
  }, [previewData, currentTempSignature]);

  // Render the live preview panel using UniversalDocumentPreview directly
  const renderPreview = () => {
    if (!previewProps) return null;

    return (
      <UniversalDocumentPreview
        {...previewProps}
        theme="dark"
        showToolbar={true}
        showStatusBadge={false}
        className="!h-full !min-h-0 !rounded-none"
        minHeight={0}
      />
    );
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
        <DialogContent hideCloseButton className="sm:max-w-[1400px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left: Live Document Preview - takes full remaining height */}
            <div className="lg:w-[60%] flex flex-col min-h-0">
              <div className="flex items-center gap-2 px-6 py-2 border-b bg-muted/30">
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
              <div className="flex-1 overflow-hidden bg-zinc-100 relative flex flex-col min-h-0">
                {renderPreview()}
              </div>
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="hidden lg:block" />

            {/* Right: Signature Input */}
            <div className="lg:w-[40%] flex flex-col min-h-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4 text-left">
                <DialogTitle className="text-xl">{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pb-2">
                {renderSignatureInput()}
              </div>
              {/* Footer integrated inside right panel - no border separator */}
              <div className="flex justify-end gap-2 px-6 py-4">
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
              </div>
            </div>
          </div>
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
  prefix?: string | null;
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
