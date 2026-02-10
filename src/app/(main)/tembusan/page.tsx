"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Search,
  Download,
  Eye,
  FileText,
  Inbox,
  Mail,
  MailOpen,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { tembusanService, TembusanInboxItem } from "@/services/tembusan.service";
import { buildHtmlFromTemplate, generatePdfBlobFromHtml } from "@/lib/tembusan-pdf-utils";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TembusanInboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<TembusanInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch inbox data
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tembusanService.getInbox({
        page,
        limit: 10,
        search: searchQuery || undefined,
        sortOrder: "desc",
      });

      if (response.success && response.data) {
        setItems(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      } else {
        toast.error(response.error || "Gagal memuat data");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInbox();
  };

  // Handle view detail
  const handleViewDetail = async (item: TembusanInboxItem) => {
    // Mark as read
    if (!item.sudahDibaca) {
      await tembusanService.markAsRead(item.documentId);
    }
    router.push(`/tembusan/${item.documentId}`);
  };

  // Handle download — generate PDF client-side (same as detail page)
  const handleDownload = async (item: TembusanInboxItem) => {
    try {
      const response = await tembusanService.getDetail(item.documentId);
      if (!response.success || !response.data) {
        toast.error(response.error || "Gagal memuat detail dokumen");
        return;
      }

      const htmlContent = buildHtmlFromTemplate(response.data);
      if (!htmlContent) {
        toast.error("Template dokumen tidak tersedia");
        return;
      }

      const pdfBlob = await generatePdfBlobFromHtml(htmlContent);
      const fileName = `${item.jenisDocument.replace(/\s+/g, "-")}_${item.nomorSurat?.replace(/\//g, "-") || "dokumen"}.pdf`;
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Dokumen berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh dokumen");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
        <h1 className="text-2xl font-bold text-black">Surat Tembusan</h1>
      </div>

      {/* Back Button and Description */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>
        <p className="text-sm text-zinc-600">
          Daftar surat yang Anda terima sebagai tembusan. Surat-surat ini dikirimkan kepada Anda untuk diketahui.
        </p>
      </div>

      {/* Search and Filter Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Cari nomor surat, perihal, atau pemohon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={fetchInbox}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Inbox className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Inbox Tembusan</CardTitle>
                <CardDescription>
                  {total} surat diterima
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-zinc-100 rounded-full mb-4">
                <Inbox className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-1">
                Tidak Ada Surat Tembusan
              </h3>
              <p className="text-sm text-zinc-500 max-w-md">
                Saat ini Anda belum menerima surat tembusan. Surat akan muncul di sini ketika ada surat yang diteruskan kepada Anda.
              </p>
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nomor & Perihal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Tanggal Surat</TableHead>
                    <TableHead>Diterima</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={!item.sudahDibaca ? "bg-blue-50/50" : ""}
                    >
                      <TableCell>
                        {item.sudahDibaca ? (
                          <MailOpen className="w-5 h-5 text-zinc-400" />
                        ) : (
                          <Mail className="w-5 h-5 text-blue-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-zinc-900">
                            {item.nomorSurat || "Belum bernomor"}
                          </div>
                          <div className="text-sm text-zinc-500 line-clamp-1">
                            {item.perihal || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          <FileText className="w-3 h-3 mr-1" />
                          {item.jenisDocument}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{item.pemohon.nama}</div>
                          {item.pemohon.nim && (
                            <div className="text-xs text-zinc-500">{item.pemohon.nim}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(item.tanggalSurat)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {formatDateTime(item.diterimaTanggal)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(item)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Lihat
                          </Button>
                          {item.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(item)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-zinc-500">
                Halaman {page} dari {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
