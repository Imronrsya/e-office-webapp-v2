// Types for Universal Document Preview Component
// Single Source of Truth untuk semua preview di aplikasi

export interface SignatureData {
    signerRole: string;
    signerName: string;
    signerNip?: string | null;
    signatureUrl?: string | null; // URL of the actual signature image
    signatureData?: string | null; // Base64 data untuk signature baru
    order: number;
    positionX?: number | null;
    positionY?: number | null;
    positionPage?: number | null;
}

export interface StempelData {
    imageUrl?: string | null;
    imageData?: string | null; // Base64 data
    positionX?: number | null;
    positionY?: number | null;
    positionPage?: number | null;
    width?: number;
    height?: number;
}

export interface QRCodeData {
    content: string; // URL or verification code
    positionX?: number | null;
    positionY?: number | null;
    positionPage?: number | null;
    size?: number;
}

export interface DocumentMetadata {
    nomorSurat?: string;
    tanggalSurat?: string;
    perihal?: string;
    jenisNaskahDinas?: string;
    sifatNaskahDinas?: string;
    status?: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'SIGNED' | 'COMPLETED' | 'REJECTED';
}

export type DocumentType = 
    | 'SURAT_PENGANTAR' 
    | 'SURAT_TUGAS' 
    | 'SURAT_TUGAS_TABEL' 
    | 'SURAT_KEPUTUSAN'
    | 'SURAT_MASUK'
    | 'SURAT_KELUAR'
    | 'OTHER';

export type PreviewMode = 
    | 'pdf'           // Display existing PDF from URL
    | 'html'          // Display HTML content (for drafting)
    | 'pdf-blob'      // Generate PDF blob from HTML content
    | 'auto';         // Auto-detect based on available data

export interface UniversalDocumentPreviewProps {
    // Source data - at least one required
    fileUrl?: string | null;           // URL to existing PDF file
    htmlContent?: string | null;       // Raw HTML content for preview
    content?: Record<string, unknown> | null;  // Form data untuk generate HTML/PDF
    
    // Document configuration
    documentType?: DocumentType;
    mode?: PreviewMode;
    fileName?: string;
    metadata?: DocumentMetadata;
    
    // Signature and stamping
    signatures?: SignatureData[];
    stempel?: StempelData | null;
    qrCode?: QRCodeData | null;
    
    // Display options
    showDraftBadge?: boolean;
    showToolbar?: boolean;
    showStatusBadge?: boolean;
    initialZoom?: number;
    minHeight?: number | string;
    maxHeight?: number | string;
    className?: string;
    
    // Theme
    theme?: 'dark' | 'light';
    
    // Callbacks
    onDownload?: () => void;
    onPrint?: () => void;
    onFullscreen?: () => void;
    onZoomChange?: (zoom: number) => void;
    onError?: (error: Error) => void;
}

// Toolbar configuration
export interface ToolbarConfig {
    showZoom?: boolean;
    showRotate?: boolean;
    showFullscreen?: boolean;
    showPrint?: boolean;
    showDownload?: boolean;
    showMenu?: boolean;
    position?: 'top' | 'bottom';
}

// Status badge configuration
export interface StatusBadgeConfig {
    text: string;
    color: 'yellow' | 'green' | 'blue' | 'red' | 'gray';
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Helper function to get status badge config
export function getStatusBadgeConfig(status?: DocumentMetadata['status']): StatusBadgeConfig | null {
    switch (status) {
        case 'DRAFT':
            return { text: 'DRAFT', color: 'yellow', position: 'top-right' };
        case 'SUBMITTED':
            return { text: 'DIAJUKAN', color: 'blue', position: 'top-right' };
        case 'VERIFIED':
            return { text: 'TERVERIFIKASI', color: 'blue', position: 'top-right' };
        case 'SIGNED':
            return { text: 'DITANDATANGANI', color: 'green', position: 'top-right' };
        case 'COMPLETED':
            return { text: 'SELESAI', color: 'green', position: 'top-right' };
        case 'REJECTED':
            return { text: 'DITOLAK', color: 'red', position: 'top-right' };
        default:
            return null;
    }
}

// Helper to detect preview mode
export function detectPreviewMode(props: Pick<UniversalDocumentPreviewProps, 'fileUrl' | 'htmlContent' | 'content'>): PreviewMode {
    if (props.fileUrl) return 'pdf';
    if (props.htmlContent) return 'html';
    if (props.content) return 'pdf-blob';
    return 'auto';
}
