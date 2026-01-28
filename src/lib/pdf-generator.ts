/**
 * PDF Generator Utility
 * Menggunakan html2canvas dan jspdf untuk generate PDF dari HTML template
 */

import { generateSuratPengantarHTML, SuratPengantarData } from './templates/surat-pengantar';
import { suratTugasTemplate, SuratTugasData } from './templates/surat-tugas';
import { suratTugasTableTemplate, SuratTugasTableData } from './templates/surat-tugas-table';
import { suratKeputusanTemplate, SuratKeputusanData } from './templates/surat-keputusan';

export type SuratType = 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN';

/**
 * Generate HTML string based on surat type and data
 */
export function generateSuratHTML(
    type: SuratType,
    data: Record<string, unknown>
): string {
    switch (type) {
        case 'SURAT_PENGANTAR':
            return generateSuratPengantarHTML(data as unknown as SuratPengantarData);
        case 'SURAT_TUGAS':
            return suratTugasTemplate(data as unknown as SuratTugasData);
        case 'SURAT_TUGAS_TABEL':
            return suratTugasTableTemplate(data as unknown as SuratTugasTableData);
        case 'SURAT_KEPUTUSAN':
            return suratKeputusanTemplate(data as unknown as SuratKeputusanData);
        default:
            throw new Error(`Unknown surat type: ${type}`);
    }
}

/**
 * Convert HTML to PDF blob using browser's print functionality
 * This creates a PDF that can be displayed in the positioner
 */
export async function htmlToPdfBlob(html: string): Promise<Blob> {
    // Create an iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm'; // A4 width
    iframe.style.height = '297mm'; // A4 height
    document.body.appendChild(iframe);

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
            throw new Error('Could not access iframe document');
        }

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use html2canvas to capture the content
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(iframeDoc.body, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 794, // A4 width in pixels at 96 DPI
            height: 1123, // A4 height in pixels at 96 DPI
        });

        // Convert canvas to PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        // Return as blob
        return pdf.output('blob');
    } finally {
        document.body.removeChild(iframe);
    }
}

/**
 * Generate PDF data URL from HTML
 * Returns a base64 data URL that can be used as PDF source
 */
export async function generatePdfDataUrl(
    type: SuratType,
    data: Record<string, unknown>
): Promise<string> {
    const html = generateSuratHTML(type, data);
    const blob = await htmlToPdfBlob(html);
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Generate PDF blob URL from HTML
 * Returns a blob URL that can be used as PDF source
 */
export async function generatePdfBlobUrl(
    type: SuratType,
    data: Record<string, unknown>
): Promise<string> {
    const html = generateSuratHTML(type, data);
    const blob = await htmlToPdfBlob(html);
    return URL.createObjectURL(blob);
}
