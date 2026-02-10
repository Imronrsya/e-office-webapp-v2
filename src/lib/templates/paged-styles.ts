/**
 * Shared CSS styles for paged.js integration
 * Used across all surat templates for consistent pagination and QR code placement
 */

export const pagedStyles = `
/* Paged.js Configuration */
@page {
    size: A4;
    margin: 15mm 20mm 25mm 20mm; /* Extra bottom margin for QR code */
    
    /* Running footer untuk QR Code di setiap halaman */
    @bottom-right {
        content: element(qr-running);
    }
    
    /* Page counter - opsional */
    @bottom-center {
        content: none;
    }
}

/* First page - bisa berbeda jika diperlukan */
@page :first {
    margin-top: 10mm;
}

/* QR Code Running Element */
.qr-running {
    position: running(qr-running);
    text-align: right;
    padding: 0;
    margin-right: -2mm; /* Fine-tune alignment with text edge if needed, or remove */
    width: 60mm; /* Ensure it has space to align right */
}

.qr-running img {
    width: 70px;
    height: 70px;
    display: inline-block;
}

.qr-running .qr-label {
    display: none;
}

/* QR Placeholder ketika belum di-generate */
.qr-placeholder {
    width: 60px;
    height: 60px;
    border: 1px dashed #cccccc;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
}

.qr-placeholder-text {
    font-size: 5pt;
    color: #999999;
    text-align: center;
    padding: 2px;
}

/* Page break rules */
.signature-block {
    break-inside: avoid;
}

.ttd-container {
    break-inside: avoid;
}

.ttd-count-1,
.ttd-count-2,
.ttd-count-3 {
    break-inside: avoid;
}

.footer-section {
    break-inside: avoid;
}

.keputusan-point {
    break-inside: avoid;
}

.tembusan-container {
    break-inside: avoid;
}

/* Table rows should not break */
.table-mahasiswa tr,
.table-peserta tr {
    break-inside: avoid;
}

/* Header should stay on first page only - tidak di-break */
.header-container {
    break-after: avoid;
}

/* Lampiran always starts new page */
.lampiran-content {
    break-before: page;
}

/* Print color adjustments */
@media print {
    body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    
    .qr-running {
        position: running(qr-running);
    }
}
`;

/**
 * Generate QR Code running footer HTML
 * @param qrCodeDataUrl - Base64 data URL of QR code (optional)
 * @returns HTML string for QR running element
 */
export const generateQRRunningFooter = (qrCodeDataUrl?: string): string => {
    if (qrCodeDataUrl) {
        return `
            <div class="qr-running">
                <img src="${qrCodeDataUrl}" alt="QR Code Verifikasi" crossorigin="anonymous" />
            </div>
        `;
    }

    // Placeholder when QR code not yet generated
    return '';
};
