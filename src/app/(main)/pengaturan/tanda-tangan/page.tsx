"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { signatureService } from "@/services/signature.service";
import { SignatureCanvas } from "@/components/signature/SignatureCanvas";
import { SignatureUpload } from "@/components/signature/SignatureUpload";
import { SignatureSaved } from "@/components/signature/SignatureSaved";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Pencil,
  Upload,
  FolderOpen,
  Loader2,
  ChevronLeft,
  PenTool,
  Save,
} from "lucide-react";

// ============================================================================
// Constants
// ============================================================================

const SIGNATURE_MANAGEMENT_ROLES = ["KAPRODI", "KADEP", "DEKAN", "WADEK_1", "WADEK_2"];

type TabValue = "draw" | "upload" | "saved";

// ============================================================================
// Component
// ============================================================================

export default function SignatureManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabValue>("draw");
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Key to force re-mount SignatureSaved when new signature is saved
  const [savedKey, setSavedKey] = useState(0);

  // Role guard
  useEffect(() => {
    if (!authLoading && user) {
      if (!user.role || !SIGNATURE_MANAGEMENT_ROLES.includes(user.role)) {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, user, router]);

  // Check if current tab has a valid signature to save
  const hasValidSignature = useCallback(() => {
    switch (activeTab) {
      case "draw":
        return !!drawnSignature;
      case "upload":
        return !!uploadedSignature;
      default:
        return false;
    }
  }, [activeTab, drawnSignature, uploadedSignature]);

  // Save signature and redirect to "Tersimpan" tab
  const handleSaveSignature = async () => {
    if (!hasValidSignature()) return;

    setIsSaving(true);
    try {
      let signatureData: string | null = null;
      let method: "DRAW" | "UPLOAD" = "DRAW";

      if (activeTab === "draw" && drawnSignature) {
        signatureData = drawnSignature;
        method = "DRAW";
      } else if (activeTab === "upload" && uploadedSignature) {
        signatureData = uploadedSignature;
        method = "UPLOAD";
      }

      if (!signatureData) return;

      const result = await signatureService.uploadSignature(
        signatureData,
        method,
        method === "DRAW" ? "Tanda Tangan (Gambar)" : "Tanda Tangan (Unggah)"
      );

      if (result) {
        toast.success("Tanda tangan berhasil disimpan");
        // Clear the input
        setDrawnSignature(null);
        setUploadedSignature(null);
        // Increment key to force re-fetch saved signatures
        setSavedKey((prev) => prev + 1);
        // Switch to "Tersimpan" tab
        setActiveTab("saved");
      } else {
        toast.error("Gagal menyimpan tanda tangan");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || "Gagal menyimpan tanda tangan";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  // Role guard UI
  if (!user?.role || !SIGNATURE_MANAGEMENT_ROLES.includes(user.role)) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 px-3 py-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-base-black flex items-center gap-2">
            <PenTool className="size-5" />
            Manajemen Tanda Tangan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola template tanda tangan digital Anda
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Tanda Tangan Digital</CardTitle>
          <CardDescription>
            Buat tanda tangan baru dengan menggambar atau mengunggah, atau kelola tanda tangan yang sudah tersimpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TabValue);
              // Clear temporary signatures when switching tabs
              setDrawnSignature(null);
              setUploadedSignature(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Gambar</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Unggah</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Tersimpan</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 overflow-hidden">
              {/* Draw Tab */}
              <TabsContent value="draw" className="mt-0">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Gambar tanda tangan Anda menggunakan mouse atau layar sentuh
                  </p>
                  <div className="min-h-[220px]">
                    <SignatureCanvas
                      onSignatureChange={setDrawnSignature}
                      width={480}
                      height={160}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="mt-0">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Unggah gambar tanda tangan Anda (PNG atau JPG, maks 2MB)
                  </p>
                  <div className="min-h-[220px]">
                    <SignatureUpload onSignatureChange={setUploadedSignature} />
                  </div>
                </div>
              </TabsContent>

              {/* Saved Tab */}
              <TabsContent value="saved" className="mt-0">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Daftar tanda tangan yang sudah tersimpan
                  </p>
                  <div className="min-h-[220px]">
                    <SignatureSaved
                      key={savedKey}
                      onSelect={() => {
                        // No selection behavior in management mode
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Save Button - always render to maintain consistent height, invisible on saved tab */}
          <div className={`flex justify-end pt-4 border-t mt-4 ${activeTab === "saved" ? "invisible" : ""}`}>
            <Button
              onClick={handleSaveSignature}
              disabled={!hasValidSignature() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Tanda Tangan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
