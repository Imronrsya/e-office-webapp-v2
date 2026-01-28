/**
 * PDF Generator Utility
 * Menggunakan html2canvas dan jspdf untuk generate PDF dari HTML template
 */

import { generateSuratPengantarHTML, SuratPengantarData } from './templates/surat-pengantar';
import { suratTugasTemplate, SuratTugasData } from './templates/surat-tugas';
import { suratTugasTableTemplate, SuratTugasTableData } from './templates/surat-tugas-table';
import { suratKeputusanTemplate, SuratKeputusanData } from './templates/surat-keputusan';

export type SuratType = 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN';

export interface SignerPlaceholder {
    id: string;
    role: string;
    name: string;
    nip?: string;
    x: number;
    y: number;
    page: number;
    order: number;
    signatureUrl?: string; // URL of the signature image to embed
}

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

/**
 * Embed signature placeholder blocks into an existing PDF
 * Uses pdf-lib to add text boxes at specified positions
 * 
 * Note: Coordinates from the frontend positioner are in pixels relative to the
 * rendered PDF width (typically 600-700px). We need to scale them to PDF points (595.28 x 841.89 for A4).
 */
export async function embedSignaturePlaceholders(
    pdfBlob: Blob,
    signers: SignerPlaceholder[],
    renderedWidth: number = 600 // The width at which the PDF was rendered in the positioner
): Promise<Blob> {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    
    // Load the existing PDF
    const pdfBytes = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Sort signers by order
    const sortedSigners = [...signers].sort((a, b) => a.order - b.order);

    // Block dimensions in the rendered view (pixels)
    const renderedBlockHeight = 80;
    const renderedBlockWidth = 160;

    for (const signer of sortedSigners) {
        // Validate page number
        const pageIndex = (signer.page || 1) - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
            console.warn(`Invalid page number ${signer.page} for signer, skipping`);
            continue;
        }

        const page = pages[pageIndex];
        const pageWidth = page.getWidth();  // 595.28 for A4
        const pageHeight = page.getHeight(); // 841.89 for A4

        // Calculate scale factors
        // The rendered view has a certain width, we need to scale to PDF points
        const scaleX = pageWidth / renderedWidth;
        const scaleY = pageHeight / (renderedWidth * 1.414); // A4 aspect ratio is ~1.414

        // Scale coordinates from rendered pixels to PDF points
        const scaledX = signer.x * scaleX;
        const scaledY = signer.y * scaleY;
        const scaledBlockHeight = renderedBlockHeight * scaleY;
        const scaledBlockWidth = renderedBlockWidth * scaleX;

        // Convert Y coordinate (PDF uses bottom-left origin, frontend uses top-left)
        const pdfY = pageHeight - scaledY - scaledBlockHeight;

        try {
            const x = scaledX;
            let currentY = pdfY + scaledBlockHeight - 12; // Start from top of block

            // Draw role/position title (e.g., "Dekan", "Wakil Dekan 1")
            page.drawText(signer.role, {
                x,
                y: currentY,
                size: 11,
                font: fontBold,
                color: rgb(0, 0, 0),
            });
            currentY -= 20;

            // If signature URL is available, embed the actual signature image
            // Otherwise, draw a placeholder dashed line
            if (signer.signatureUrl) {
                try {
                    // Fetch the signature image
                    const signatureResponse = await fetch(signer.signatureUrl);
                    if (signatureResponse.ok) {
                        const signatureBytes = await signatureResponse.arrayBuffer();
                        const signatureUint8 = new Uint8Array(signatureBytes);
                        
                        // Determine image type from URL or response
                        const contentType = signatureResponse.headers.get('content-type') || '';
                        let signatureImage;
                        
                        if (contentType.includes('png') || signer.signatureUrl.includes('.png')) {
                            signatureImage = await pdfDoc.embedPng(signatureUint8);
                        } else {
                            signatureImage = await pdfDoc.embedJpg(signatureUint8);
                        }
                        
                        // Draw the signature image
                        const sigWidth = 80; // Fixed width for signature
                        const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
                        
                        page.drawImage(signatureImage, {
                            x: x + 10,
                            y: currentY - sigHeight + 10,
                            width: sigWidth,
                            height: sigHeight,
                        });
                    } else {
                        console.warn('Failed to fetch signature image:', signer.signatureUrl);
                        // Draw placeholder line as fallback
                        const lineY = currentY + 5;
                        const lineWidth = scaledBlockWidth - 20;
                        page.drawLine({
                            start: { x, y: lineY },
                            end: { x: x + lineWidth, y: lineY },
                            thickness: 0.5,
                            color: rgb(0.6, 0.6, 0.6),
                            dashArray: [3, 3],
                        });
                    }
                } catch (imgError) {
                    console.error('Error embedding signature image:', imgError);
                    // Draw placeholder line as fallback
                    const lineY = currentY + 5;
                    const lineWidth = scaledBlockWidth - 20;
                    page.drawLine({
                        start: { x, y: lineY },
                        end: { x: x + lineWidth, y: lineY },
                        thickness: 0.5,
                        color: rgb(0.6, 0.6, 0.6),
                        dashArray: [3, 3],
                    });
                }
            } else {
                // Draw placeholder line for signature (dashed line)
                const lineY = currentY + 5;
                const lineWidth = scaledBlockWidth - 20;
                page.drawLine({
                    start: { x, y: lineY },
                    end: { x: x + lineWidth, y: lineY },
                    thickness: 0.5,
                    color: rgb(0.6, 0.6, 0.6),
                    dashArray: [3, 3],
                });
            }
            currentY -= 25;

            // Draw signer name with underline
            const displayName = signer.name || '(Nama Pejabat)';
            page.drawText(displayName, {
                x,
                y: currentY,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });

            // Underline the name
            const nameWidth = font.widthOfTextAtSize(displayName, 11);
            page.drawLine({
                start: { x, y: currentY - 2 },
                end: { x: x + nameWidth, y: currentY - 2 },
                thickness: 0.5,
                color: rgb(0, 0, 0),
            });
            currentY -= 14;

            // Draw NIP if available
            if (signer.nip) {
                page.drawText(`NIP. ${signer.nip}`, {
                    x,
                    y: currentY,
                    size: 9,
                    font,
                    color: rgb(0, 0, 0),
                });
            }
        } catch (error) {
            console.error(`Error embedding placeholder for ${signer.name}:`, error);
        }
    }

    // Save and return as blob
    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
}

/**
 * Generate PDF with signature placeholders embedded
 * Combines HTML to PDF conversion with signature block embedding
 */
export async function generatePdfWithSignatures(
    type: SuratType,
    data: Record<string, unknown>,
    signers: SignerPlaceholder[],
    renderedWidth: number = 600 // The width at which the PDF was rendered in the positioner
): Promise<Blob> {
    // First generate the base PDF from HTML
    const html = generateSuratHTML(type, data);
    const basePdf = await htmlToPdfBlob(html);

    // If no signers, return base PDF
    if (!signers || signers.length === 0) {
        return basePdf;
    }

    // Embed signature placeholders
    return embedSignaturePlaceholders(basePdf, signers, renderedWidth);
}

/**
 * Generate PDF blob URL with signature placeholders embedded
 */
export async function generatePdfBlobUrlWithSignatures(
    type: SuratType,
    data: Record<string, unknown>,
    signers: SignerPlaceholder[],
    renderedWidth: number = 600
): Promise<string> {
    const blob = await generatePdfWithSignatures(type, data, signers, renderedWidth);
    return URL.createObjectURL(blob);
}
