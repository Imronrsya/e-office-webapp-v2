"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Check, Upload, Pencil } from "lucide-react";
import { signatureService, type SavedSignature } from "@/services/signature.service";
import { cn } from "@/lib/utils";

interface SignatureSavedProps {
  onSelect: (signatureUrl: string, signatureData?: string) => void;
  selectedId?: string;
}

export function SignatureSaved({ onSelect, selectedId }: SignatureSavedProps) {
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState<SavedSignature | null>(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    setLoading(true);
    try {
      const data = await signatureService.getMySavedSignatures();
      setSignatures(data);
    } catch (error) {
      console.error("Failed to load signatures:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!signatureToDelete) return;

    setDeletingId(signatureToDelete.id);
    const success = await signatureService.deleteSignature(signatureToDelete.id);

    if (success) {
      setSignatures((prev) => prev.filter((s) => s.id !== signatureToDelete.id));
    }

    setDeletingId(null);
    setShowDeleteDialog(false);
    setSignatureToDelete(null);
  };

  const confirmDelete = (signature: SavedSignature) => {
    setSignatureToDelete(signature);
    setShowDeleteDialog(true);
  };

  const handleSelect = (signature: SavedSignature) => {
    // Pass the fileUrl for selection - backend will handle the rest
    onSelect(signature.fileUrl);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (signatures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4 opacity-50"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        <p className="text-center text-sm">
          Anda belum memiliki tanda tangan tersimpan.
          <br />
          Simpan tanda tangan saat menandatangani dokumen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden">
        {signatures.map((signature) => {
          // `selectedId` from parent may be either the signature `id` or the
          // `fileUrl` (the modal stores the selected saved signature as a URL).
          const isSelected = selectedId === signature.id || selectedId === signature.fileUrl;
          const isDeleting = deletingId === signature.id;

          return (
            <Card
              key={signature.id}
              className={cn(
                "relative p-2.5 sm:p-3 cursor-pointer transition-all border border-zinc-200 shadow-none hover:bg-zinc-100 hover:border-zinc-300 overflow-hidden",
                isSelected && "bg-zinc-100 border-zinc-300",
                isDeleting && "opacity-50 pointer-events-none"
              )}
              onClick={() => handleSelect(signature)}
            >
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                {/* Signature Preview */}
                <div className="relative h-12 w-16 sm:h-14 sm:w-20 bg-white rounded border flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signature.fileUrl}
                    alt={signature.alias || "Tanda Tangan"}
                    className="absolute inset-0 w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Info + Actions */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 overflow-hidden">
                      <p className="font-medium text-sm truncate">
                        {signature.alias || "Tanda Tangan"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {signature.type === "UPLOAD" ? (
                            <>
                              <Upload className="h-3 w-3 mr-1" />
                              Unggah
                            </>
                          ) : (
                            <>
                              <Pencil className="h-3 w-3 mr-1" />
                              Gambar
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(signature.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(signature);
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tanda Tangan?</DialogTitle>
            <DialogDescription>
              Tanda tangan &quot;{signatureToDelete?.alias || "Tanda Tangan"}&quot; akan
              dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
