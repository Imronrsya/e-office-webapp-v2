"use client";

/**
 * Legacy Wrappers untuk UniversalDocumentPreview
 * 
 * File ini berisi wrapper components yang mempertahankan backward compatibility
 * dengan interface lama (PDFPreview, SuratPreview, TemplatePreview) namun
 * menggunakan UniversalDocumentPreview di bawahnya.
 * 
 * MIGRATION GUIDE:
 * - Replace imports dari "./components/pdf-preview" ke "@/components/universal-preview"
 * - Replace imports dari "./components/surat-preview" ke "@/components/universal-preview"
 * - Replace imports dari "@/components/surat-preview" ke "@/components/universal-preview"
 */

import { useMemo } from "react";
import { UniversalDocumentPreview } from "./UniversalDocumentPreview";
import type { 
    SignatureData, 
    DocumentType,
    UniversalDocumentPreviewProps 
} from "./types";
import { 
    generateSuratPengantarHTML, 
    formatTanggalIndonesia,
} from "@/lib/templates/surat-pengantar";

// =============================================================================
// LEGACY: PDFPreview Wrapper
// =============================================================================

interface LegacyPDFPreviewProps {
    fileUrl: string | null;
    fileName?: string;
    isSigned?: boolean;
    content?: Record<string, unknown> | null;
    documentType?: 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN';
    signatures?: Array<{
        signerRole: string;
        signerName: string;
        signerNip?: string | null;
        signatureUrl?: string | null;
        order: number;
        positionX?: number | null;
        positionY?: number | null;
        positionPage?: number | null;
    }>;
    onDownload?: () => void;
}

/**
 * Legacy PDFPreview wrapper - uses UniversalDocumentPreview internally
 * @deprecated Use UniversalDocumentPreview directly
 */
export function LegacyPDFPreview({
    fileUrl,
    fileName = "Surat",
    isSigned = false,
    content,
    documentType,
    signatures,
    onDownload,
}: LegacyPDFPreviewProps) {
    // Convert legacy signatures to new SignatureData format
    const convertedSignatures: SignatureData[] | undefined = signatures?.map(sig => ({
        signerRole: sig.signerRole,
        signerName: sig.signerName,
        signerNip: sig.signerNip,
        signatureUrl: sig.signatureUrl,
        prefix: sig.prefix, // Include prefix/awalan
        order: sig.order,
        positionX: sig.positionX,
        positionY: sig.positionY,
        positionPage: sig.positionPage,
    }));

    // Determine mode based on available data
    const mode = fileUrl ? 'pdf' : content ? 'html' : 'auto';

    return (
        <UniversalDocumentPreview
            fileUrl={fileUrl}
            content={content}
            documentType={documentType as DocumentType}
            mode={mode}
            fileName={fileName}
            signatures={convertedSignatures}
            showDraftBadge={!isSigned && !fileUrl}
            metadata={{ status: isSigned ? 'SIGNED' : 'DRAFT' }}
            onDownload={onDownload}
            theme="dark"
        />
    );
}

// =============================================================================
// LEGACY: SuratPreview Wrapper
// =============================================================================

interface LegacySuratPreviewSubmissionData {
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
}

interface LegacySuratPreviewDocumentData {
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
        positionX?: number | null;
        positionY?: number | null;
        positionPage?: number | null;
    }>;
}

interface LegacySuratPreviewProps {
    submissionData?: LegacySuratPreviewSubmissionData;
    documentData?: LegacySuratPreviewDocumentData;
    fileUrl?: string | null;
    fileName?: string;
    onDownload?: () => void;
}

/**
 * Legacy SuratPreview wrapper - uses UniversalDocumentPreview internally
 * @deprecated Use UniversalDocumentPreview directly
 */
export function LegacySuratPreview({
    submissionData,
    documentData,
    fileUrl,
    fileName = "Surat Pengantar",
    onDownload,
}: LegacySuratPreviewProps) {
    // Generate HTML content using the same logic as original SuratPreview
    const htmlContent = useMemo(() => {
        // If there's a PDF file URL, don't generate HTML
        if (fileUrl) return null;
        
        // If there's contentHtml, use it directly
        if (documentData?.contentHtml) return documentData.contentHtml;
        
        // Otherwise generate from submission data
        if (!submissionData) return null;
        
        // Extract signature data
        const kaprodiSig = documentData?.signatures?.find(s => 
            s.signerRole.toLowerCase().includes('kaprodi') || 
            s.signerRole.toLowerCase().includes('ketua prodi')
        );
        const kadepSig = documentData?.signatures?.find(s => 
            s.signerRole.toLowerCase().includes('kadep') || 
            s.signerRole.toLowerCase().includes('ketua departemen')
        );
        
        return generateSuratPengantarHTML({
            nomorSurat: documentData?.nomorSurat || "-",
            tanggalSurat: documentData?.tanggalSurat 
                ? formatTanggalIndonesia(new Date(documentData.tanggalSurat))
                : formatTanggalIndonesia(new Date()),
            
            // Target dari content jika ada, atau gunakan placeholder
            namaTujuan: (documentData?.content as Record<string, unknown>)?.namaTujuan as string || "[Nama Tujuan]",
            jabatanTujuan: (documentData?.content as Record<string, unknown>)?.jabatanTujuan as string || "[Jabatan Tujuan]",
            alamatTujuan: (documentData?.content as Record<string, unknown>)?.alamatTujuan as string || "",
            
            // Perihal dari document atau submission
            perihal: documentData?.perihal || submissionData.keperluan,
            keperluan: submissionData.keperluan,
            
            // Data pengaju
            namaMahasiswa: submissionData.nama,
            nimMahasiswa: submissionData.nim || "",
            programStudi: submissionData.programStudi,
            departemen: submissionData.departemen || "Teknik Informatika",
            
            // Detail kegiatan
            judulAcara: submissionData.judulAcara,
            tanggalMulai: submissionData.tanggalAcara,
            lokasiAcara: submissionData.lokasiAcara,
            durasiAcara: submissionData.durasiAcara || "",
            
            // Tembusan
            tembusan: documentData?.tembusan || [],
            
            // Signatures - Kaprodi
            namaKaprodi: kaprodiSig?.signerName,
            nipKaprodi: kaprodiSig?.signerNip,
            signatureKaprodi: kaprodiSig?.signatureUrl,
            
            // Signatures - Kadep
            namaKadep: kadepSig?.signerName,
            nipKadep: kadepSig?.signerNip,
            signatureKadep: kadepSig?.signatureUrl,
        });
    }, [submissionData, documentData, fileUrl]);

    // Convert signatures
    const convertedSignatures: SignatureData[] | undefined = documentData?.signatures?.map((sig, index) => ({
        signerRole: sig.signerRole,
        signerName: sig.signerName,
        signerNip: sig.signerNip,
        signatureUrl: sig.signatureUrl,
        prefix: sig.prefix, // Include prefix/awalan
        order: index,
        positionX: sig.positionX,
        positionY: sig.positionY,
        positionPage: sig.positionPage,
    }));

    return (
        <UniversalDocumentPreview
            fileUrl={fileUrl}
            htmlContent={htmlContent}
            documentType="SURAT_PENGANTAR"
            mode={fileUrl ? 'pdf' : 'html'}
            fileName={fileName}
            signatures={convertedSignatures}
            showDraftBadge={!documentData?.isSigned && !fileUrl}
            metadata={{ 
                status: documentData?.isSigned ? 'SIGNED' : 'DRAFT',
                nomorSurat: documentData?.nomorSurat || undefined,
                perihal: documentData?.perihal || undefined,
            }}
            onDownload={onDownload}
            theme="dark"
        />
    );
}

// =============================================================================
// LEGACY: TemplatePreview Wrapper
// =============================================================================

export type LegacySuratType = "SURAT_PENGANTAR" | "SURAT_TUGAS" | "SURAT_TUGAS_TABEL" | "SURAT_KEPUTUSAN";

export interface LegacySignerInfo {
    id: string;
    role: string;
    name?: string;
    nip?: string;
    prefix?: string;
    signatureUrl?: string;
}

export interface LegacyTembusanItem {
    name: string;
    description?: string;
}

interface LegacyTemplatePreviewProps {
    suratType: LegacySuratType;
    formData: unknown;
    signers: LegacySignerInfo[];
    tembusan?: LegacyTembusanItem[];
    isLoading?: boolean;
}

/**
 * Legacy TemplatePreview wrapper - uses UniversalDocumentPreview internally
 * @deprecated Use UniversalDocumentPreview directly
 */
export function LegacyTemplatePreview({
    suratType,
    formData,
    signers,
    tembusan,
    isLoading = false,
}: LegacyTemplatePreviewProps) {
    // Convert signers to SignatureData format
    const convertedSignatures: SignatureData[] = signers.map((signer, index) => ({
        signerRole: signer.role,
        signerName: signer.name || '',
        signerNip: signer.nip,
        prefix: signer.prefix, // Include prefix/awalan
        signatureUrl: signer.signatureUrl,
        order: index,
    }));

    // Convert formData to content with tembusan
    const content = useMemo(() => {
        const data = formData as Record<string, unknown>;
        return {
            ...data,
            tembusan: tembusan || [],
        };
    }, [formData, tembusan]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="w-10 h-10 animate-spin border-4 border-primary border-t-transparent rounded-full mb-4" />
                <p>Memuat preview...</p>
            </div>
        );
    }

    return (
        <UniversalDocumentPreview
            content={content}
            documentType={suratType}
            mode="html"
            fileName={`Preview ${suratType.replace(/_/g, ' ')}`}
            signatures={convertedSignatures}
            showDraftBadge={true}
            showToolbar={true}
            theme="light"
            minHeight={400}
        />
    );
}
