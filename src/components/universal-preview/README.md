# Universal Document Preview

Komponen preview dokumen yang menjadi **Single Source of Truth** untuk seluruh aplikasi E-Office.

## Features

- 🔗 **Multiple Source Support**: PDF URL, HTML content, atau generate dari form data
- 🔍 **Zoom Control**: 50% - 200%
- 🔄 **Rotation**: Putar dokumen 90°
- 📺 **Fullscreen**: Mode layar penuh
- 🖨️ **Print**: Cetak langsung
- 📥 **Download**: Unduh dokumen
- ✍️ **Signature Support**: Visualisasi tanda tangan dengan posisi
- 🏷️ **Status Badge**: DRAFT, SUBMITTED, VERIFIED, SIGNED, COMPLETED, REJECTED
- 🎨 **Theme**: Dark & Light mode

## Penggunaan

### Basic - PDF dari URL

```tsx
import { UniversalDocumentPreview } from "@/components/universal-preview";

<UniversalDocumentPreview
    fileUrl="https://example.com/document.pdf"
    fileName="Surat Tugas"
/>
```

### HTML Preview (Draft)

```tsx
import { UniversalDocumentPreview } from "@/components/universal-preview";

<UniversalDocumentPreview
    content={formData}
    documentType="SURAT_TUGAS"
    mode="html"
    showDraftBadge={true}
    signatures={signatures}
/>
```

### Dengan Signatures

```tsx
import { UniversalDocumentPreview, SignatureData } from "@/components/universal-preview";

const signatures: SignatureData[] = [
    {
        signerRole: "Ketua Departemen",
        signerName: "Dr. Ahmad",
        signerNip: "198012345678",
        signatureUrl: "https://...",
        order: 1,
        positionX: 400,
        positionY: 700,
        positionPage: 1,
    }
];

<UniversalDocumentPreview
    fileUrl={pdfUrl}
    signatures={signatures}
    metadata={{ status: 'SIGNED' }}
/>
```

## Legacy Wrappers (Backward Compatibility)

Untuk migrasi yang mulus, tersedia wrapper untuk komponen lama:

```tsx
// Import langsung dari universal-preview (recommended)
import { PDFPreview, SuratPreview, TemplatePreview } from "@/components/universal-preview";

// Atau gunakan alias
import { LegacyPDFPreview as PDFPreview } from "@/components/universal-preview";
```

### Migrasi dari PDFPreview

```tsx
// Before (old import)
import { PDFPreview } from "./components/pdf-preview";

// After (new import - no code changes needed!)
import { PDFPreview } from "@/components/universal-preview";
```

### Migrasi dari TemplatePreview

```tsx
// Before (old import)
import { TemplatePreview } from "@/components/surat-preview";

// After (new import - no code changes needed!)
import { TemplatePreview } from "@/components/universal-preview";
```

## Props Reference

### UniversalDocumentPreviewProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fileUrl` | `string \| null` | - | URL ke file PDF |
| `htmlContent` | `string \| null` | - | Raw HTML untuk preview |
| `content` | `Record<string, unknown>` | - | Form data untuk generate HTML |
| `documentType` | `DocumentType` | `'OTHER'` | Tipe dokumen |
| `mode` | `PreviewMode` | `'auto'` | Mode preview |
| `fileName` | `string` | `'Dokumen'` | Nama file |
| `metadata` | `DocumentMetadata` | - | Metadata dokumen |
| `signatures` | `SignatureData[]` | - | Data tanda tangan |
| `stempel` | `StempelData` | - | Data stempel |
| `qrCode` | `QRCodeData` | - | Data QR Code |
| `showDraftBadge` | `boolean` | `false` | Tampilkan badge DRAFT |
| `showToolbar` | `boolean` | `true` | Tampilkan toolbar |
| `showStatusBadge` | `boolean` | `true` | Tampilkan status badge |
| `initialZoom` | `number` | `100` | Zoom awal (%) |
| `minHeight` | `number \| string` | `600` | Tinggi minimum |
| `maxHeight` | `number \| string` | - | Tinggi maksimum |
| `className` | `string` | - | Custom CSS class |
| `theme` | `'dark' \| 'light'` | `'dark'` | Theme |
| `onDownload` | `() => void` | - | Callback download |
| `onPrint` | `() => void` | - | Callback print |
| `onFullscreen` | `() => void` | - | Callback fullscreen |
| `onZoomChange` | `(zoom: number) => void` | - | Callback zoom change |
| `onError` | `(error: Error) => void` | - | Callback error |

### DocumentType

```typescript
type DocumentType = 
    | 'SURAT_PENGANTAR' 
    | 'SURAT_TUGAS' 
    | 'SURAT_TUGAS_TABEL' 
    | 'SURAT_KEPUTUSAN'
    | 'SURAT_MASUK'
    | 'SURAT_KELUAR'
    | 'OTHER';
```

### PreviewMode

```typescript
type PreviewMode = 
    | 'pdf'       // Display existing PDF from URL
    | 'html'      // Display HTML content (for drafting)
    | 'pdf-blob'  // Generate PDF blob from HTML content
    | 'auto';     // Auto-detect based on available data
```

## File Structure

```
src/components/universal-preview/
├── index.ts                      # Re-exports
├── types.ts                      # TypeScript interfaces
├── UniversalDocumentPreview.tsx  # Main component
├── LegacyWrappers.tsx            # Backward compatibility
└── README.md                     # This file
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  UniversalDocumentPreview                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                      Toolbar                            ││
│  │  [Menu] [Filename] [Page Nav] [Zoom] [Actions]          ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                    Preview Area                         ││
│  │                                                         ││
│  │    ┌─────────────────────────────────┐                  ││
│  │    │                                 │                  ││
│  │    │      PDF/HTML Content           │  [DRAFT]         ││
│  │    │                                 │                  ││
│  │    │      + Signatures Overlay       │                  ││
│  │    │      + Stempel Overlay          │                  ││
│  │    │      + QR Code Overlay          │                  ││
│  │    │                                 │                  ││
│  │    └─────────────────────────────────┘                  ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Migration Checklist

Halaman yang sudah menggunakan UniversalDocumentPreview:

- [x] `detail/[id]/page.tsx` - PDFPreview, SuratPreview
- [x] `draft-surat/[id]/page.tsx` - TemplatePreview
- [x] `buat-surat/page.tsx` - TemplatePreview
- [ ] `nomor/page.tsx` - (belum ada preview)
- [ ] Komponen signature positioner

## Notes

- Komponen lama (`pdf-preview.tsx`, `surat-preview.tsx`, `TemplatePreview.tsx`) masih dipertahankan untuk referensi
- Gunakan `theme="light"` untuk preview saat editing (draft)
- Gunakan `theme="dark"` untuk preview final/detail
