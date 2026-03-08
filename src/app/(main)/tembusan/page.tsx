"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
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
import { TablePagination } from "@/features/dashboard/components/table-pagination";

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
  const [limit, setLimit] = useState(5);

  // Fetch inbox data
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tembusanService.getInbox({
        page,
        limit,
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
  }, [page, limit, searchQuery]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInbox();
  };

  // Handle limit change — reset page to 1 when rows-per-page changes
  const handleLimitChange = (newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
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
    <section
      aria-label="Surat Tembusan"
      className="flex flex-1 flex-col min-h-0"
    >
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
          <h1 className="text-2xl font-bold text-black">Surat Tembusan</h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
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
      </div>

      {/* Table — scrollable area (Dashboard style) */}
      <div
        className="mt-0 flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-white"
      >
        <div className="h-full overflow-auto">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4 p-6">
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
            <table className="w-full table-fixed caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-20">
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b shadow-[0_1px_0_0_theme(colors.border)]">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nomor & Perihal</TableHead>
                  <TableHead>Tipe Surat</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Tanggal Surat</TableHead>
                  <TableHead>Diterima</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={!item.sudahDibaca ? "bg-muted/50" : ""}
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
                        <div className="font-medium text-zinc-900 truncate max-w-[200px] md:max-w-[300px] lg:max-w-[450px]">
                          {item.nomorSurat || "Belum bernomor"}
                        </div>
                        <div className="text-sm text-zinc-500 truncate max-w-[200px] md:max-w-[300px] lg:max-w-[450px]">
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
                        <div className="text-sm font-medium truncate max-w-[150px] md:max-w-[200px]">{item.pemohon.nama}</div>
                        {item.pemohon.nim && (
                          <div className="text-xs text-zinc-500 truncate max-w-[150px] md:max-w-[200px]">{item.pemohon.nim}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(item.tanggalSurat)}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {formatDateTime(item.diterimaTanggal)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
            </table>
          )}
        </div>
      </div>

      {/* Pagination — sticky bottom bar (Dashboard style) */}
      <div className="shrink-0 mt-4 border-t border-gray-200 pt-2">
        <TablePagination
          pagination={{
            page,
            limit,
            total,
            totalPages,
          }}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </div>
    </section>
  );
}
