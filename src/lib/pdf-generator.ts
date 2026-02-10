/**
 * PDF Generator Utility
 * Menggunakan html2canvas dan jspdf untuk generate PDF dari HTML template
 */

import { generateSuratPengantarHTML, SuratPengantarData } from './templates/surat-pengantar';
import { suratTugasTemplate, SuratTugasData, SignatureBlock } from './templates/surat-tugas';
import { suratTugasTableTemplate, SuratTugasTableData } from './templates/surat-tugas-table';
import { suratKeputusanTemplate, SuratKeputusanData } from './templates/surat-keputusan';

export type SuratType = 'SURAT_PENGANTAR' | 'SURAT_TUGAS' | 'SURAT_TUGAS_TABEL' | 'SURAT_KEPUTUSAN';

export interface SignerPlaceholder {
    id: string;
    role: string;
    name: string;
    nip?: string;
    prefix?: string; // Awalan/keterangan seperti "Mengetahui,"
    x: number;
    y: number;
    page: number;
    order: number;
    signatureUrl?: string; // URL of the signature image to embed
}

export interface QRCodePosition {
    x: number;      // X position from right edge (in PDF points)
    y: number;      // Y position from bottom edge (in PDF points)
    width: number;  // QR Code width
    height: number; // QR Code height
}

// Re-export SignatureBlock for convenience
export type { SignatureBlock };

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
 * 
 * Features:
 * - First page: margin top 1cm, margin bottom 3cm
 * - Page 2+: margin top 3cm, margin bottom 3cm
 * - Smart pagination with signature block handling
 * - Proper image loading for logos
 */
export async function htmlToPdfBlob(html: string): Promise<Blob> {
    // Create an iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm'; // A4 width
    iframe.style.height = 'auto';
    document.body.appendChild(iframe);

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
            throw new Error('Could not access iframe document');
        }

        // Inject CSS for proper pagination into the HTML
        const paginatedHtml = injectPaginationStyles(html);

        iframeDoc.open();
        iframeDoc.write(paginatedHtml);
        iframeDoc.close();

        // Wait for all images to load properly
        await waitForImages(iframeDoc);

        // A4 dimensions
        const a4WidthMm = 210;
        const a4HeightMm = 297;
        const marginTopFirstPageMm = 10; // 1cm for first page
        const marginTopMm = 30;  // 3cm for page 2+
        const marginBottomMm = 30; // 3cm

        // Convert mm to pixels (96 DPI)
        const mmToPixels = (mm: number) => (mm / 25.4) * 96;
        const contentWidthPx = mmToPixels(a4WidthMm);
        const contentHeightPx = mmToPixels(a4HeightMm); // Full page height for first page

        // Get actual content dimensions
        const bodyHeight = iframeDoc.body.scrollHeight;

        // Use html2canvas to capture the content
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(iframeDoc.body, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: contentWidthPx,
            height: bodyHeight,
            windowWidth: contentWidthPx,
            windowHeight: bodyHeight,
            imageTimeout: 15000, // Wait up to 15 seconds for images
            onclone: (clonedDoc) => {
                // Force font rendering in cloned document
                const style = clonedDoc.createElement('style');
                style.textContent = `
                    * {
                        font-family: 'Times New Roman', Times, Georgia, serif !important;
                        -webkit-font-smoothing: antialiased;
                        text-rendering: optimizeLegibility;
                    }
                `;
                clonedDoc.head.appendChild(style);

                // Wait for fonts in cloned doc
                if (clonedDoc.fonts && clonedDoc.fonts.ready) {
                    return clonedDoc.fonts.ready;
                }
            }
        });

        // Convert canvas to PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        // Calculate pixels per mm
        const pixelsPerMm = canvas.width / a4WidthMm;

        // First page: content area = 297mm - 10mm top margin - 30mm bottom margin = 257mm
        // Page 2+: content area = 297mm - 30mm top margin - 30mm bottom margin = 237mm
        const firstPageHeightPx = (a4HeightMm - marginTopFirstPageMm - marginBottomMm) * pixelsPerMm;
        const subsequentPageHeightPx = (a4HeightMm - marginTopMm - marginBottomMm) * pixelsPerMm;

        // Calculate number of pages
        let remainingHeight = canvas.height;
        let numPages = 1;
        remainingHeight -= firstPageHeightPx;
        while (remainingHeight > 0) {
            numPages++;
            remainingHeight -= subsequentPageHeightPx;
        }

        if (numPages <= 1) {
            // Single page - add 1cm top margin
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgHeight = (canvas.height / canvas.width) * pdfWidth;
            pdf.addImage(imgData, 'JPEG', 0, marginTopFirstPageMm, pdfWidth, Math.min(pdfHeight - marginTopFirstPageMm, imgHeight));
        } else {
            // Multi-page - slice the canvas for each page
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) {
                throw new Error('Could not get canvas context');
            }

            let sourceY = 0;

            for (let pageNum = 0; pageNum < numPages; pageNum++) {
                if (pageNum > 0) {
                    pdf.addPage();
                }

                // Determine content height for this page
                const pageContentHeightPx = pageNum === 0 ? firstPageHeightPx : subsequentPageHeightPx;
                const sourceHeight = Math.min(pageContentHeightPx, canvas.height - sourceY);

                if (sourceHeight <= 0) break;

                // Set temp canvas size for this page's content
                tempCanvas.width = canvas.width;
                tempCanvas.height = sourceHeight;

                // Draw the portion of the original canvas
                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(
                    canvas,
                    0, sourceY,                 // Source x, y
                    canvas.width, sourceHeight, // Source width, height
                    0, 0,                       // Dest x, y
                    canvas.width, sourceHeight  // Dest width, height
                );

                const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.95);

                // Calculate height in mm for this page content
                const pageContentHeightMm = (sourceHeight / canvas.width) * pdfWidth;

                // First page: y = marginTopFirstPageMm (1cm top margin)
                // Page 2+: y = marginTopMm (3cm top margin)
                const yPosition = pageNum === 0 ? marginTopFirstPageMm : marginTopMm;

                pdf.addImage(pageImgData, 'JPEG', 0, yPosition, pdfWidth, pageContentHeightMm);

                sourceY += sourceHeight;
            }
        }

        // Return as blob
        return pdf.output('blob');
    } finally {
        document.body.removeChild(iframe);
    }
}

/**
 * Wait for all images in the document to load
 */
async function waitForImages(doc: Document): Promise<void> {
    const images = doc.querySelectorAll('img');
    const imagePromises: Promise<void>[] = [];

    images.forEach((img) => {
        if (!img.complete) {
            imagePromises.push(
                new Promise((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => {
                        console.warn('Image failed to load:', img.src);
                        resolve(); // Continue even if image fails
                    };
                    // Set timeout to avoid waiting forever
                    setTimeout(resolve, 5000);
                })
            );
        }
    });

    // Also add a minimum wait time for rendering
    imagePromises.push(new Promise(resolve => setTimeout(resolve, 500)));

    await Promise.all(imagePromises);

    // Wait for fonts to be loaded
    if (doc.fonts && doc.fonts.ready) {
        await doc.fonts.ready;
    }

    // Additional wait for font rendering
    await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Inject CSS styles for proper pagination handling
 * Apply @media print styles directly since html2canvas doesn't respect @media print
 * Also remove body padding since pdf-generator handles margins
 */
function injectPaginationStyles(html: string): string {
    const paginationCSS = `
        <style id="pagination-styles">
            /* Force print styles to apply (html2canvas doesn't use @media print) */
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                /* Remove padding - pdf-generator handles margins for download */
                padding: 0 76px 0 76px !important;
                /* Ensure font is loaded */
                font-family: 'Times New Roman', Times, Georgia, serif !important;
            }
            
            /* Force all text to use proper font */
            *, *::before, *::after {
                font-family: inherit !important;
            }
            
            /* Page break handling */
            .ttd-section, .signature-section, .ttd-wrapper, .ttd-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            /* Keep MEMUTUSKAN with Menetapkan */
            .memutuskan-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            /* Keep footer section (date, signatures, tembusan) together */
            .footer-section-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            /* Prevent widows and orphans */
            p, li {
                widows: 2;
                orphans: 2;
            }
            
            /* Tembusan should stay with signature */
            .tembusan-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                position: static !important;
            }
            
            /* ttd-tembusan-wrapper should not be split */
            .ttd-tembusan-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            /* QR Code positioning */
            .qr-code-container {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
            }
            
            /* Ensure text wraps properly */
            .section-content, .point-content, .keputusan-content {
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
            }
        </style>
    `;

    // Insert before </head> or at the start of the document
    if (html.includes('</head>')) {
        return html.replace('</head>', `${paginationCSS}</head>`);
    } else if (html.includes('<body')) {
        return html.replace('<body', `${paginationCSS}<body`);
    } else {
        return paginationCSS + html;
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

        // Calculate the rendered height based on the actual page aspect ratio
        // This is crucial because the positioner renders the PDF maintaining aspect ratio
        const pageAspectRatio = pageHeight / pageWidth;
        const renderedHeight = renderedWidth * pageAspectRatio;

        // Calculate scale factors from rendered pixels to PDF points
        const scaleX = pageWidth / renderedWidth;
        const scaleY = pageHeight / renderedHeight;

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

            // Draw prefix if provided (e.g., "Mengetahui,")
            if (signer.prefix && signer.prefix.trim()) {
                page.drawText(signer.prefix, {
                    x,
                    y: currentY,
                    size: 10,
                    font: font,
                    color: rgb(0, 0, 0),
                });
                currentY -= 14;
            }

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
    return new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
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

/**
 * Default QR Code position (bottom-right corner)
 */
const DEFAULT_QR_POSITION: QRCodePosition = {
    x: 30,      // 30 points from right edge
    y: 30,      // 30 points from bottom edge
    width: 60,  // 60 points wide (~21mm)
    height: 60, // 60 points tall
};

/**
 * Embed QR Code ke semua halaman PDF
 * QR Code akan muncul di sudut kanan bawah setiap halaman
 * 
 * @param pdfBlob - PDF blob yang akan di-embed QR Code
 * @param qrCodeDataUrl - QR Code sebagai data URL (base64)
 * @param position - Posisi QR Code (optional, default bottom-right)
 * @returns Promise<Blob> - PDF dengan QR Code di setiap halaman
 */
export async function embedQRCodeToAllPages(
    pdfBlob: Blob,
    qrCodeDataUrl: string,
    position: Partial<QRCodePosition> = {}
): Promise<Blob> {
    const { PDFDocument } = await import('pdf-lib');

    // Merge with default position
    const qrPosition = { ...DEFAULT_QR_POSITION, ...position };

    // Load the existing PDF
    const pdfBytes = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Convert QR Code data URL to bytes
    let qrImageBytes: Uint8Array;
    try {
        // Extract base64 from data URL
        const base64Data = qrCodeDataUrl.split(',')[1];
        qrImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } catch (error) {
        console.error('Error parsing QR Code data URL:', error);
        throw new Error('Invalid QR Code data URL');
    }

    // Embed the QR Code image
    let qrImage;
    try {
        if (qrCodeDataUrl.includes('image/png')) {
            qrImage = await pdfDoc.embedPng(qrImageBytes);
        } else {
            qrImage = await pdfDoc.embedJpg(qrImageBytes);
        }
    } catch (error) {
        console.error('Error embedding QR Code image:', error);
        throw new Error('Failed to embed QR Code image');
    }

    // Add QR Code to each page
    for (const page of pages) {
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        // Calculate position (from bottom-right corner)
        const x = pageWidth - qrPosition.x - qrPosition.width;
        const y = qrPosition.y;

        try {
            page.drawImage(qrImage, {
                x,
                y,
                width: qrPosition.width,
                height: qrPosition.height,
            });
        } catch (error) {
            console.error('Error drawing QR Code on page:', error);
        }
    }

    // Save and return as blob
    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Generate final PDF dengan semua komponen (nomor surat, tanda tangan, QR Code)
 * 
 * @param type - Tipe surat
 * @param data - Data surat termasuk signatures dan qrCodeDataUrl
 * @param options - Opsi tambahan
 * @returns Promise<Blob> - PDF final yang siap distribusi
 */
export async function generateFinalPdf(
    type: SuratType,
    data: Record<string, unknown> & {
        signatures?: SignatureBlock[];
        qrCodeDataUrl?: string;
    },
    options: {
        embedQRToAllPages?: boolean;
    } = {}
): Promise<Blob> {
    // Generate HTML dengan semua data (termasuk nomor surat, signatures, QR dalam HTML)
    const html = generateSuratHTML(type, data);
    let pdfBlob = await htmlToPdfBlob(html);

    // Jika ada QR Code dan opsi embedQRToAllPages aktif, embed ke semua halaman
    // Note: QR di HTML akan muncul di halaman pertama saja (karena position: fixed)
    // Untuk multi-page PDF, kita perlu embed QR ke setiap halaman via pdf-lib
    if (options.embedQRToAllPages && data.qrCodeDataUrl) {
        pdfBlob = await embedQRCodeToAllPages(pdfBlob, data.qrCodeDataUrl);
    }

    return pdfBlob;
}

/**
 * Generate final PDF dan return sebagai Blob URL
 */
export async function generateFinalPdfBlobUrl(
    type: SuratType,
    data: Record<string, unknown> & {
        signatures?: SignatureBlock[];
        qrCodeDataUrl?: string;
    },
    options: {
        embedQRToAllPages?: boolean;
    } = {}
): Promise<string> {
    const blob = await generateFinalPdf(type, data, options);
    return URL.createObjectURL(blob);
}

/**
 * Download PDF langsung
 */
export function downloadPdf(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
