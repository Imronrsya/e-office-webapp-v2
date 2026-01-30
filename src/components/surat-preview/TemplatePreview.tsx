"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, Maximize2, RotateCw } from "lucide-react";
import { 
    generateSuratPengantarHTML, 
    SuratPengantarData 
} from "@/lib/templates/surat-pengantar";
import { suratTugasTemplate, SuratTugasData, SignatureBlock } from "@/lib/templates/surat-tugas";
import { suratTugasTableTemplate, SuratTugasTableData } from "@/lib/templates/surat-tugas-table";
import { suratKeputusanTemplate, SuratKeputusanData } from "@/lib/templates/surat-keputusan";

export type SuratType = "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN";

export interface SignerInfo {
    id: string;
    role: string;
    name?: string;
    nip?: string;
    prefix?: string;
    signatureUrl?: string;
}

interface TemplatePreviewProps {
    suratType: SuratType;
    formData: unknown;
    signers: SignerInfo[];
    isLoading?: boolean;
}

/**
 * Component to preview surat templates with signatures rendered in place
 * Uses CSS-based signature positioning from templates (no drag-and-drop)
 */
export function TemplatePreview({
    suratType,
    formData,
    signers,
    isLoading = false,
}: TemplatePreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate HTML content with signatures
    const htmlContent = useMemo(() => {
        if (!suratType || !formData) return null;

        try {
            // Convert signers to SignatureBlock format for templates
            const signatureBlocks: SignatureBlock[] = signers.map(s => ({
                signerRole: s.role,
                signerName: s.name || s.role,
                signerNip: s.nip,
                signatureUrl: s.signatureUrl,
                prefix: s.prefix,
            }));

            const data = formData as Record<string, unknown>;

            switch (suratType) {
                case "SURAT_PENGANTAR": {
                    // For surat pengantar, map signers to specific roles
                    const kaprodiSigner = signers.find(s => s.role === "KAPRODI");
                    const kadepSigner = signers.find(s => s.role === "KADEP");
                    
                    // Map form fields to template fields
                    const formDataMapped = data as Record<string, unknown>;
                    const pengantarData: SuratPengantarData = {
                        nomorSurat: (formDataMapped.nomorSurat as string) || "",
                        tanggalSurat: (formDataMapped.tanggalSurat as string) || "",
                        perihal: (formDataMapped.perihal as string) || "",
                        namaTujuan: (formDataMapped.namaTujuan as string) || "",
                        jabatanTujuan: (formDataMapped.jabatanTujuan as string) || "",
                        alamatTujuan: (formDataMapped.alamatTujuan as string) || "",
                        // Map kegiatanMagang to keperluan
                        keperluan: (formDataMapped.keperluan as string) || (formDataMapped.kegiatanMagang as string) || "",
                        namaMahasiswa: (formDataMapped.namaMahasiswa as string) || "",
                        nimMahasiswa: (formDataMapped.nimMahasiswa as string) || "",
                        programStudi: (formDataMapped.programStudi as string) || "",
                        departemen: (formDataMapped.departemen as string) || "",
                        // Map judulProposal to judulAcara
                        judulAcara: (formDataMapped.judulAcara as string) || (formDataMapped.judulProposal as string) || "",
                        tanggalMulai: (formDataMapped.tanggalMulai as string) || "",
                        lokasiAcara: (formDataMapped.lokasiAcara as string) || "",
                        durasiAcara: (formDataMapped.durasiAcara as string),
                        // TTD Kaprodi - use name or fallback to role label
                        namaKaprodi: kaprodiSigner ? (kaprodiSigner.name || "Ketua Program Studi") : undefined,
                        nipKaprodi: kaprodiSigner?.nip,
                        signatureKaprodi: kaprodiSigner?.signatureUrl,
                        // TTD Kadep - use name or fallback to role label
                        namaKadep: kadepSigner ? (kadepSigner.name || "Ketua Departemen") : undefined,
                        nipKadep: kadepSigner?.nip,
                        signatureKadep: kadepSigner?.signatureUrl,
                        tembusan: (formDataMapped.tembusan as string),
                    };
                    return generateSuratPengantarHTML(pengantarData);
                }
                case "SURAT_TUGAS": {
                    const tugasData: SuratTugasData = {
                        ...data as unknown as SuratTugasData,
                        signatures: signatureBlocks,
                    };
                    return suratTugasTemplate(tugasData);
                }
                case "SURAT_TUGAS_TABEL": {
                    const tabelData: SuratTugasTableData = {
                        ...data as unknown as SuratTugasTableData,
                        signatures: signatureBlocks,
                    };
                    return suratTugasTableTemplate(tabelData);
                }
                case "SURAT_KEPUTUSAN": {
                    const keputusanData: SuratKeputusanData = {
                        ...data as unknown as SuratKeputusanData,
                        signatures: signatureBlocks,
                    };
                    return suratKeputusanTemplate(keputusanData);
                }
                default:
                    return null;
            }
        } catch (error) {
            console.error("Error generating template:", error);
            return null;
        }
    }, [suratType, formData, signers]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    
    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground bg-gray-50 rounded-lg border">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Memuat preview...</p>
            </div>
        );
    }

    if (!htmlContent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground bg-gray-50 rounded-lg border">
                <p>Tidak dapat menampilkan preview</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex flex-col bg-white rounded-lg border overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[4rem] text-center">{zoom}%</span>
                    <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleRotate}>
                        <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleFullscreen}>
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Preview Container */}
            <div 
                className="flex-1 overflow-auto p-4 bg-gray-100"
                style={{ maxHeight: "600px" }}
            >
                <div
                    className="mx-auto bg-white shadow-lg"
                    style={{
                        width: `${794 * (zoom / 100)}px`,
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        srcDoc={htmlContent}
                        className="w-full border-0"
                        style={{
                            height: `${1123 * (zoom / 100)}px`,
                            pointerEvents: "none",
                        }}
                        title="Surat Preview"
                    />
                </div>
            </div>
        </div>
    );
}
