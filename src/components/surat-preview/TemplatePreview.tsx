"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, Maximize2, RotateCw } from "lucide-react";
import dynamic from "next/dynamic";
const PDFPreview = dynamic(() => import("./PDFPreview").then(mod => mod.PDFPreview), { ssr: false });
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

export interface TembusanItem {
    name: string;
    description?: string;
}

interface TemplatePreviewProps {
    suratType: SuratType;
    formData: unknown;
    signers: SignerInfo[];
    tembusan?: TembusanItem[];  // Tembusan untuk surat tugas / surat keputusan
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
    tembusan,
    isLoading = false,
}: TemplatePreviewProps) {
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
                        prefixKaprodi: kaprodiSigner?.prefix, // Awalan seperti "Mengetahui,"
                        // TTD Kadep - use name or fallback to role label
                        namaKadep: kadepSigner ? (kadepSigner.name || "Ketua Departemen") : undefined,
                        nipKadep: kadepSigner?.nip,
                        signatureKadep: kadepSigner?.signatureUrl,
                        prefixKadep: kadepSigner?.prefix, // Awalan seperti "Mengetahui,"
                        tembusan: (formDataMapped.tembusan as string),
                    };
                    return generateSuratPengantarHTML(pengantarData);
                }
                case "SURAT_TUGAS": {
                    const tugasData: SuratTugasData = {
                        ...data as unknown as SuratTugasData,
                        signatures: signatureBlocks,
                        tembusan: tembusan,  // Teruskan tembusan dari prop
                    };
                    return suratTugasTemplate(tugasData);
                }
                case "SURAT_TUGAS_TABEL": {
                    // Map form fields to template fields
                    const formDataMapped = data as Record<string, unknown>;
                    const pelaksana = (formDataMapped.pelaksana as Array<Record<string, string>>) || [];
                    const customColumns = (formDataMapped.customColumns as Array<{ key: string; label: string }>) || [];

                    // Convert pelaksana to dataMahasiswa format with custom columns
                    const dataMahasiswa = pelaksana.map(p => ({
                        nama: p.nama || "",
                        nim: p.nim || "",
                        prodi: p.prodi || "",
                        // Include custom column values
                        ...customColumns.reduce((acc, col) => ({
                            ...acc,
                            [col.key]: p[col.key] || ""
                        }), {})
                    }));

                    // Format tanggal untuk display
                    const formatTanggal = (dateStr: string): string => {
                        if (!dateStr) return "-";
                        try {
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });
                        } catch {
                            return dateStr;
                        }
                    };

                    const tanggalMulai = (formDataMapped.tanggalMulai as string) || "";
                    const tanggalSelesai = (formDataMapped.tanggalSelesai as string) || "";
                    const tanggalSurat = (formDataMapped.tanggalSurat as string) || "";

                    const tabelData: SuratTugasTableData = {
                        nomorSurat: (formDataMapped.nomorSurat as string) || "-",
                        dataMahasiswa: dataMahasiswa,
                        keterangan: (formDataMapped.keperluan as string) || "",
                        tanggalMulai: formatTanggal(tanggalMulai),
                        tanggalSelesai: formatTanggal(tanggalSelesai),
                        tanggalSurat: formatTanggal(tanggalSurat),
                        signatures: signatureBlocks,
                        tembusan: tembusan,
                        customColumns: customColumns,
                    };
                    return suratTugasTableTemplate(tabelData);
                }
                case "SURAT_KEPUTUSAN": {
                    const keputusanData: SuratKeputusanData = {
                        ...data as unknown as SuratKeputusanData,
                        signatures: signatureBlocks,
                        tembusan: tembusan,  // Teruskan tembusan dari prop
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
    }, [suratType, formData, signers, tembusan]);

    if (!isLoading && !htmlContent) {
        return (
            <div className="flex flex-col items-center justify-center text-muted-foreground bg-zinc-800 rounded-xl border border-zinc-700" style={{ minHeight: '800px', height: '75vh' }}>
                <p className="text-zinc-400">Tidak dapat menampilkan preview</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {isLoading ? (
                <div className="flex flex-col h-full bg-zinc-800 rounded-xl overflow-hidden" style={{ minHeight: '800px', height: '75vh' }}>
                    <div className="flex items-center bg-zinc-700 px-3 py-2 text-white text-sm">
                        <span className="truncate">Preview Dokumen</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-zinc-600">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-white mb-3 mx-auto" />
                            <span className="text-sm text-gray-300">Generating preview...</span>
                        </div>
                    </div>
                </div>
            ) : (
                <PDFPreview
                    htmlContent={htmlContent || ""}
                />
            )}
        </div>
    );
}
