"use client";

import { use, useState, useEffect, useCallback } from "react";
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
  X,
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
  const [downloading, setDownloading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; isPdf: boolean } | null>(null);
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);

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

  // Handle download
  const handleDownload = async () => {
    if (!detail?.fileUrl) {
      toast.error("File tidak tersedia");
      return;
    }

    setDownloading(true);
    try {
      const fileName = `${detail.jenisDocument.replace(/\s+/g, "-")}_${detail.nomorSurat?.replace(/\//g, "-") || "dokumen"}.pdf`;
      await tembusanService.downloadDocument(detail.fileUrl, fileName);
      toast.success("Dokumen berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh dokumen");
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-5xl">
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
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              Dokumen Tidak Ditemukan
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Dokumen yang Anda cari tidak ditemukan atau Anda tidak memiliki akses.
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
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
        <h1 className="text-2xl font-bold text-black">Detail Surat Tembusan</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Info Card */}
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
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                  <p className="font-medium">{formatDate(detail.tanggalSurat)}</p>
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

              {/* PDF Preview or Download Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dokumen
                </h4>
                
                {detail.fileUrl ? (
                  <div className="space-y-4">
                    {/* PDF Embed Preview */}
                    <div className="border rounded-lg overflow-hidden bg-zinc-50">
                      <iframe
                        src={`${detail.fileUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-[500px]"
                        title="PDF Preview"
                      />
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {downloading ? "Mengunduh..." : "Unduh Dokumen PDF"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 bg-zinc-50 rounded-lg border border-dashed">
                    <FileText className="w-10 h-10 text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-500">
                      File dokumen tidak tersedia
                    </p>
                  </div>
                )}
              </div>

              {/* Lampiran Surat Keluar */}
              {(() => {
                const rawAttachments = detail.attachmentUrls || [];
                const docAttachments: Array<{ url: string; name: string }> = Array.isArray(rawAttachments)
                  ? rawAttachments.map((item: any) => {
                      if (typeof item === 'string') {
                        const urlWithoutParams = item.split('?')[0];
                        const parts = urlWithoutParams.split('/');
                        const fullName = parts[parts.length - 1] || 'Lampiran';
                        const cleanName = fullName.replace(/^\d+-/, '');
                        return { url: item, name: decodeURIComponent(cleanName) };
                      }
                      return { url: item.url || '', name: item.name || 'Lampiran' };
                    }).filter((item) => item.url && item.url.length > 0)
                  : [];

                if (docAttachments.length === 0) return null;

                const handleAttachmentPreview = (url: string, name: string) => {
                  const isPdf = url.toLowerCase().includes('.pdf');
                  setPreviewAttachment({ url, name, isPdf });
                  setAttachmentPreviewOpen(true);
                };

                const handleAttachmentDownload = async (url: string, fileName: string) => {
                  try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);
                    toast.success(`Berhasil mengunduh ${fileName}`);
                  } catch (error) {
                    console.error('Download failed:', error);
                    toast.error('Gagal mengunduh file');
                  }
                };

                return (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Lampiran Surat Keluar ({docAttachments.length})
                      </h4>
                      <div className="space-y-3">
                        {docAttachments.map((attachment, index) => {
                          const { url, name } = attachment;
                          const isPdf = url.toLowerCase().includes('.pdf');
                          const isImage = /\.(jpg|jpeg|png|gif)/i.test(url);

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3.5 bg-white rounded-lg border border-amber-300"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  isPdf ? "bg-red-100" : isImage ? "bg-green-100" : "bg-blue-100"
                                )}>
                                  <FileText className={cn(
                                    "w-5 h-5",
                                    isPdf ? "text-red-600" : isImage ? "text-green-600" : "text-blue-600"
                                  )} />
                                </div>
                                <div>
                                  <p className="text-sm text-black truncate max-w-[180px]" title={name}>
                                    {name}
                                  </p>
                                  <p className="text-xs text-amber-600">
                                    {isPdf ? 'PDF Document' : isImage ? 'Image' : 'Attachment'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAttachmentPreview(url, name)}
                                  title="Preview"
                                  className="h-8 w-8"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAttachmentDownload(url, name)}
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
                    </div>
                  </>
                );
              })()}

              {/* QR Code */}
              {detail.qrCodeUrl && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      QR Code Verifikasi
                    </h4>
                    <div className="flex items-center gap-4">
                      <img
                        src={detail.qrCodeUrl}
                        alt="QR Code Verifikasi"
                        className="w-24 h-24 border rounded-lg p-1"
                      />
                      <p className="text-sm text-zinc-500">
                        Scan QR code ini untuk memverifikasi keaslian dokumen.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info Sidebar */}
        <div className="space-y-6">
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
                  <p className="font-medium text-sm">{detail.pemohon.email}</p>
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
                      <div className="flex-1">
                        <p className="font-medium text-sm">{signer.nama}</p>
                        <p className="text-xs text-zinc-500">{signer.jabatan}</p>
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
              <CardTitle className="text-base">Informasi Penerimaan</CardTitle>
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
        </div>
      </div>

      {/* Attachment Preview Dialog */}
      <Dialog open={attachmentPreviewOpen} onOpenChange={setAttachmentPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate pr-4">{previewAttachment?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {previewAttachment?.isPdf ? (
              <iframe
                src={`${previewAttachment.url}#toolbar=0&navpanes=0`}
                className="w-full h-[70vh] rounded-lg border"
                title="Preview Lampiran"
              />
            ) : (
              <div className="flex items-center justify-center bg-zinc-50 rounded-lg p-4">
                <img
                  src={previewAttachment?.url}
                  alt={previewAttachment?.name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
