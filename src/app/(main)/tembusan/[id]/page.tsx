"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Calendar,
  Hash,
  CheckCircle,
  PenTool,
  QrCode,
  Loader2,
  Eye,
  Paperclip,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { tembusanService, TembusanDetail } from "@/services/tembusan.service";
import dynamic from "next/dynamic";

// Dynamic imports for PDF rendering (client-only)
const PDFPreview = dynamic(
  () =>
    import("@/components/surat-preview/PDFPreview").then(
      (mod) => mod.PDFPreview
    ),
  { ssr: false }
);

// Import frontend templates
import {
  suratTugasTemplate,
  type SuratTugasData,
  type SignatureBlock,
} from "@/lib/templates/surat-tugas";
import {
  suratTugasTableTemplate,
  type SuratTugasTableData,
} from "@/lib/templates/surat-tugas-table";
import {
  suratKeputusanTemplate,
  type SuratKeputusanData,
} from "@/lib/templates/surat-keputusan";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Build HTML content from frontend template using the document data.
 * This ensures the tembusan view matches exactly what the draft/detail pages show.
 */
function buildHtmlFromTemplate(detail: TembusanDetail): string | null {
  try {
    // Convert signaturesFull to SignatureBlock format used by frontend templates
    const signatureBlocks: SignatureBlock[] = (detail.signaturesFull || []).map(
      (sig) => ({
        signerRole: sig.signerRole,
        signerName: sig.signerName,
        signerNip: sig.signerNip || undefined,
        signatureUrl: sig.signatureUrl || undefined,
        prefix: sig.prefix || undefined,
        signedAt: sig.signedAt || undefined,
      })
    );

    // Resolve stempel URL: use local frontend stempel for consistency
    const stempelUrl = detail.sealImageUrl ? "/stempel.png" : undefined;

    // QR code data URL from backend
    const qrCodeDataUrl = detail.qrCodeUrl || undefined;

    // Tembusan list for template rendering
    const tembusan = detail.tembusanList || [];

    // The content field contains the structured form data saved during drafting
    const content = detail.content || {};
    const submissionValues = detail.submissionValues || {};

    switch (detail.documentType) {
      case "SURAT_TUGAS": {
        const data: SuratTugasData = {
          jenisSurat: "tugas",
          jenisSuratText: (content.jenisSuratText as string) || "SURAT TUGAS",
          nomorSurat: detail.nomorSurat || "-",
          namaLengkap:
            (content.namaLengkap as string) ||
            (submissionValues.nama as string) ||
            "",
          nimNip:
            (content.nimNip as string) ||
            (submissionValues.nim as string) ||
            (submissionValues.nip as string) ||
            "",
          programStudi:
            (content.programStudi as string) ||
            (submissionValues.programStudi as string) ||
            "",
          keperluan:
            (content.keperluan as string) ||
            (submissionValues.keperluan as string) ||
            "",
          judulSurat:
            (content.judulSurat as string) || detail.perihal || "",
          tanggalSurat: detail.tanggalSurat
            ? formatDate(detail.tanggalSurat)
            : undefined,
          signatures: signatureBlocks,
          stempelUrl,
          qrCodeDataUrl,
          tembusan,
        };
        return suratTugasTemplate(data);
      }

      case "SURAT_TUGAS_TABEL": {
        const pelaksana =
          (content.pelaksana as Array<Record<string, string>>) ||
          (content.dataMahasiswa as Array<Record<string, string>>) ||
          [];
        const customColumns =
          (content.customColumns as Array<{ key: string; label: string }>) ||
          [];

        const dataMahasiswa = pelaksana.map((p) => ({
          nama: p.nama || "",
          nim: p.nim || "",
          prodi: p.prodi || "",
          ...customColumns.reduce(
            (acc, col) => ({
              ...acc,
              [col.key]: p[col.key] || "",
            }),
            {}
          ),
        }));

        const data: SuratTugasTableData = {
          nomorSurat: detail.nomorSurat || "-",
          dataMahasiswa,
          keterangan:
            (content.keperluan as string) ||
            (content.keterangan as string) ||
            "",
          tanggalMulai: (content.tanggalMulai as string) || "",
          tanggalSelesai: (content.tanggalSelesai as string) || "",
          tanggalSurat: detail.tanggalSurat
            ? formatDate(detail.tanggalSurat)
            : undefined,
          signatures: signatureBlocks,
          stempelUrl,
          qrCodeDataUrl,
          tembusan,
          customColumns,
        };
        return suratTugasTableTemplate(data);
      }

      case "SURAT_KEPUTUSAN": {
        const data: SuratKeputusanData = {
          nomorSurat: detail.nomorSurat || "-",
          tentang: (content.tentang as string) || detail.perihal || "",
          menimbang: (content.menimbang as string[]) || [],
          mengingat: (content.mengingat as string[]) || [],
          menetapkan: (content.menetapkan as string) || "",
          keputusan:
            (content.keputusan as Array<{
              label: string;
              content: string;
            }>) || [],
          tanggalDitetapkan: detail.tanggalSurat
            ? formatDate(detail.tanggalSurat)
            : (content.tanggalDitetapkan as string) || "",
          lampiran: (content.lampiran as boolean) || false,
          dataPeserta:
            (content.dataPeserta as Array<{ nama: string; nim: string }>) ||
            undefined,
          signatures: signatureBlocks,
          stempelUrl,
          qrCodeDataUrl,
          tembusan,
        };
        return suratKeputusanTemplate(data);
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("Error building HTML from template:", error);
    return null;
  }
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TembusanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<TembusanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    name: string;
    isPdf: boolean;
  } | null>(null);
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Fetch detail
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tembusanService.getDetail(resolvedParams.id);

      if (response.success && response.data) {
        setDetail(response.data);
        // Mark as read
        if (!response.data.sudahDibaca) {
          await tembusanService.markAsRead(resolvedParams.id);
        }
      } else {
        toast.error(response.error || "Gagal memuat detail surat");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat detail surat");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Build HTML content from frontend template
  const htmlContent = useMemo(() => {
    if (!detail) return null;
    return buildHtmlFromTemplate(detail);
  }, [detail]);

  // File name for PDF download
  const fileName = useMemo(() => {
    if (!detail) return "Dokumen";
    const docType = detail.jenisDocument.replace(/\s+/g, "-");
    const nomor = detail.nomorSurat?.replace(/\//g, "-") || "dokumen";
    return `${docType}_${nomor}`;
  }, [detail]);

  // Download document handler — uses the frontend-generated PDF (same as PDFPreview toolbar)
  const handleDownloadDocument = async () => {
    if (!generatedPdfUrl) {
      toast.error("PDF belum selesai di-generate, mohon tunggu sebentar");
      return;
    }

    try {
      const response = await fetch(generatedPdfUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Dokumen berhasil diunduh");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Gagal mengunduh dokumen");
    }
  };

  // Attachment handlers
  const handleAttachmentPreview = (url: string, name: string) => {
    const isPdf = url.toLowerCase().includes(".pdf");
    setPreviewAttachment({ url, name, isPdf });
    setAttachmentPreviewOpen(true);
  };

  const handleAttachmentDownload = async (url: string, downloadName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Berhasil mengunduh ${downloadName}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Gagal mengunduh file");
    }
  };

  // Parse attachments
  const docAttachments = useMemo(() => {
    if (!detail) return [];
    const rawAttachments = detail.attachmentUrls || [];
    if (!Array.isArray(rawAttachments)) return [];

    return rawAttachments
      .map((item: any) => {
        if (typeof item === "string") {
          const urlWithoutParams = item.split("?")[0];
          const parts = urlWithoutParams.split("/");
          const fullName = parts[parts.length - 1] || "Lampiran";
          const cleanName = fullName.replace(/^\d+-/, "");
          return { url: item, name: decodeURIComponent(cleanName) };
        }
        return { url: item.url || "", name: item.name || "Lampiran" };
      })
      .filter((item) => item.url && item.url.length > 0);
  }, [detail]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (!detail) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              Dokumen Tidak Ditemukan
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Dokumen yang Anda cari tidak ditemukan atau Anda tidak memiliki
              akses.
            </p>
            <Button variant="outline" onClick={() => router.push("/tembusan")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Inbox
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
        <h1 className="text-2xl font-bold text-black">
          Detail Surat Tembusan
        </h1>
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/tembusan")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Inbox
      </Button>

      {/* 3/4 + 1/4 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Document (3/4 width) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Document Info + Preview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    <FileText className="w-3 h-3 mr-1" />
                    {detail.jenisDocument}
                  </Badge>
                  <CardTitle className="text-xl">
                    {detail.nomorSurat || "Belum Bernomor"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {detail.perihal || "-"}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Selesai
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Document Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Tanggal Surat
                  </p>
                  <p className="font-medium">
                    {formatDate(detail.tanggalSurat)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    Jenis Surat
                  </p>
                  <p className="font-medium">{detail.letterType.name}</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Document Preview - Rendered from Frontend Template */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dokumen
                </h4>

                {htmlContent ? (
                  <div className="rounded-lg overflow-hidden border border-zinc-200">
                    <PDFPreview
                      htmlContent={htmlContent}
                      fileName={fileName}
                      showDraftBadge={false}
                      onPdfReady={setGeneratedPdfUrl}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 bg-zinc-50 rounded-lg border border-dashed">
                    <FileText className="w-10 h-10 text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-500">
                      Preview dokumen tidak tersedia
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lampiran Surat Keluar Card - Same style as staff detail page */}
          {docAttachments.length > 0 && (
            <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-black mb-4">
                  Lampiran Surat Keluar ({docAttachments.length})
                </h3>

                <div className="space-y-3">
                  {docAttachments.map((attachment, index) => {
                    const { url, name } = attachment;
                    const isPdf = url.toLowerCase().includes(".pdf");
                    const isImage = /\.(jpg|jpeg|png|gif)/i.test(url);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3.5 bg-white rounded-lg border border-amber-300"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isPdf
                                ? "bg-red-100"
                                : isImage
                                  ? "bg-green-100"
                                  : "bg-blue-100"
                            )}
                          >
                            <FileText
                              className={cn(
                                "w-5 h-5",
                                isPdf
                                  ? "text-red-600"
                                  : isImage
                                    ? "text-green-600"
                                    : "text-blue-600"
                              )}
                            />
                          </div>
                          <div>
                            <p
                              className="text-sm text-black truncate max-w-[300px]"
                              title={name}
                            >
                              {name}
                            </p>
                            <p className="text-xs text-amber-600">
                              {isPdf
                                ? "PDF Document"
                                : isImage
                                  ? "Image"
                                  : "Attachment"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Preview button - opens modal */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleAttachmentPreview(url, name)
                            }
                            title="Preview"
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {/* Download button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleAttachmentDownload(url, name)
                            }
                            title="Download"
                            className="h-8 w-8"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Card */}
          {detail.qrCodeUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code Verifikasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                      <img
                        src={detail.qrCodeUrl}
                        alt="QR Code Verifikasi"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-zinc-600">
                      Scan QR Code ini untuk memverifikasi keaslian dokumen.
                    </p>
                    <p className="text-xs text-zinc-400">
                      QR Code tertanam dalam dokumen dan dapat di-scan menggunakan kamera smartphone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Info Sidebar (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pemohon Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Pemohon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500">Nama</p>
                  <p className="font-medium">{detail.pemohon.nama}</p>
                </div>
                {detail.pemohon.nim && (
                  <div>
                    <p className="text-sm text-zinc-500">NIM</p>
                    <p className="font-medium">{detail.pemohon.nim}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="font-medium text-sm break-all">
                    {detail.pemohon.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Penandatangan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Penandatangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detail.penandatangan.length > 0 ? (
                <div className="space-y-3">
                  {detail.penandatangan.map((signer, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg"
                    >
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{signer.nama}</p>
                        <p className="text-xs text-zinc-500">
                          {signer.jabatan}
                        </p>
                        {signer.signedAt && (
                          <p className="text-xs text-zinc-400 mt-1">
                            {formatDateTime(signer.signedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Tidak ada penandatangan
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tembusan Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Informasi Penerimaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500">Diterima Sebagai</p>
                  <Badge variant="secondary" className="mt-1">
                    Tembusan
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Tanggal Diterima</p>
                  <p className="font-medium text-sm">
                    {formatDateTime(detail.diterimaTanggal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Dokumen Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4" />
                Unduh Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleDownloadDocument}
                disabled={!generatedPdfUrl}
              >
                {!generatedPdfUrl ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {!generatedPdfUrl ? "Generating..." : "Download PDF"}
              </Button>
              {!generatedPdfUrl && (
                <p className="text-xs text-zinc-400 mt-2 text-center">
                  PDF sedang di-generate dari template
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attachment Preview Dialog */}
      <Dialog
        open={attachmentPreviewOpen}
        onOpenChange={setAttachmentPreviewOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {previewAttachment?.name || "Preview Lampiran"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-[500px]">
            {previewAttachment?.isPdf ? (
              <iframe
                src={previewAttachment.url}
                className="w-full h-full min-h-[500px] border-0"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center p-4">
                <img
                  src={previewAttachment?.url}
                  alt={previewAttachment?.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
