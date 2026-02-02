// Universal Document Preview - Single Source of Truth
// Export all components and types from this module

export { UniversalDocumentPreview } from './UniversalDocumentPreview';

// Legacy wrappers for backward compatibility
export { 
    LegacyPDFPreview, 
    LegacySuratPreview, 
    LegacyTemplatePreview,
    type LegacySuratType,
    type LegacySignerInfo,
    type LegacyTembusanItem,
} from './LegacyWrappers';

// Aliases for easier migration
export { LegacyPDFPreview as PDFPreview } from './LegacyWrappers';
export { LegacySuratPreview as SuratPreview } from './LegacyWrappers';
export { LegacyTemplatePreview as TemplatePreview } from './LegacyWrappers';

// Types
export type {
    SignatureData,
    StempelData,
    QRCodeData,
    DocumentMetadata,
    DocumentType,
    PreviewMode,
    UniversalDocumentPreviewProps,
    ToolbarConfig,
    StatusBadgeConfig,
} from './types';
export { getStatusBadgeConfig, detectPreviewMode } from './types';
