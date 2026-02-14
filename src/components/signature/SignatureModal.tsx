"use client";

import React, { useState, useCallback } from "react";
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
import { Upload, Pencil, FolderOpen, Loader2 } from "lucide-react";

import { SignatureCanvas } from "./SignatureCanvas";
import { SignatureUpload } from "./SignatureUpload";
import { SignatureSaved } from "./SignatureSaved";

export interface SignatureModalResult {
  signatureData?: string; // base64 data for new signatures
  signatureUrl?: string; // URL for saved signatures
  saveSignature: boolean;
}

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: SignatureModalResult) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

type TabValue = "upload" | "draw" | "saved";

export function SignatureModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Tanda Tangan Digital",
  description = "Pilih metode tanda tangan yang Anda inginkan",
  isLoading = false,
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("draw");
  const [saveSignature, setSaveSignature] = useState(false);

  // State for each tab's signature
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [selectedSavedUrl, setSelectedSavedUrl] = useState<string | null>(null);

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

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

          <div className="mt-4 min-h-[300px]">
            <TabsContent value="draw" className="mt-0">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gambar tanda tangan Anda menggunakan mouse atau layar sentuh
                </p>
                <SignatureCanvas
                  onSignatureChange={setDrawnSignature}
                  width={480}
                  height={180}
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
