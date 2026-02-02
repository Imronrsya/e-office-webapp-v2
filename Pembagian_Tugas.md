# 📋 Pembagian Tugas Tim Frontend E-Office WebApp V2

**Tim Frontend**: 6 Developer  
**Tanggal**: 21 Januari 2026  
**Tujuan**: Membangun aplikasi E-Office dengan sistem pengajuan surat, disposisi, dan penomoran

---

## 📌 Daftar Isi

1. [DEV 1: The Architect & Global UI](#-dev-1-the-architect--global-ui-layouting)
2. [DEV 2: The Gatekeeper](#-dev-2-the-gatekeeper-auth--user-management)
3. [DEV 3: The Initiator](#-dev-3-the-initiator-flow-pengajuan-departemen)
4. [DEV 4: The Verifier](#-dev-4-the-verifier-flow-disposisi-fakultas--prodi)
5. [DEV 5: The Editor Specialist](#-dev-5-the-editor-specialist-rich-text-engine)
6. [DEV 6: The Finisher](#-dev-6-the-finisher-output-security--penomoran)

---

## 👤 DEV 1: The Architect & Global UI (Layouting)

### 🎯 Tanggung Jawab

Fondasi aplikasi, Navigasi, dan Layout Dashboard yang responsif.

### 📦 Scope Kerja

#### 1. Global Layout

**File**: `app/layout.tsx` & `app/(dashboard)/layout.tsx`

- Setup font, Tailwind globals, dan struktur dasar halaman
- Integrasi Sidebar & Navbar agar muncul di semua halaman dashboard

#### 2. Navigation Components

**Folder**: `components/layout/`

- **Sidebar Dynamic**: Menu sidebar harus berubah berdasarkan Role user yang login
  - Contoh: Mahasiswa cuma lihat "Pengajuan"
  - Contoh: Dekan lihat "Disposisi"
- **User Dropdown**: Di pojok kanan atas, ada menu Logout & Profile

#### 3. UI Kit Maintenance

**Folder**: `components/ui/`

- Bertanggung jawab menginstall komponen Shadcn baru jika diminta teman
- Contoh command: `bunx shadcn-ui@latest add tabs`

#### 4. Dashboard Home

**Folder**: `features/dashboard/`

- Membuat widget statistik sederhana:
  - "Surat Masuk: 5"
  - "Perlu Diproses: 2"

---

## 👤 DEV 2: The Gatekeeper (Auth & User Management)

### 🎯 Tanggung Jawab

Pintu masuk aplikasi dan pengelolaan data pengguna.

### 📦 Scope Kerja

#### 1. Authentication

**Folder**: `features/auth/`

- **Login Page** (`components/login-form.tsx`):
  - Form login dengan validasi Zod
- **Auth Logic** (`hooks/use-auth.ts`):
  - Simulasi login yang menyimpan token & role di localStorage/Cookies

**Halaman**: `app/(auth)/login/page.tsx`

#### 2. User Management

**Folder**: `features/users/`

- **User Table** (`components/user-table.tsx`):
  - Tabel CRUD data Dosen, Mahasiswa, & Pejabat
- **Role Assignment**:
  - Fitur untuk mengubah role user
  - Contoh: Dosen A diangkat jadi Kaprodi

**Halaman**: `app/(dashboard)/pengguna/page.tsx`

---

## 👤 DEV 3: The Initiator (Flow Pengajuan Departemen)

### 🎯 Tanggung Jawab

Hulu sistem (Formulir Pengajuan & Tracking Mahasiswa/Dosen).

### 📦 Scope Kerja

#### 1. Form Wizard Pengajuan

**Folder**: `features/pengajuan/components/forms/`

Form multi-step dengan tahapan:

- **Step 1**: Data Diri (Autofill dari Auth)
- **Step 2**: Detail Surat
  - Jenis Surat
  - Judul Acara
  - Tanggal
  - Lokasi
- **Step 3**: Lampiran (Upload File)
- **Step 4**: Konfigurasi Tanda Tangan
  - Pilih: Sampai Kaprodi saja / Sampai Kadep

#### 2. List Pengajuan

**Folder**: `features/pengajuan/components/tables/`

- Tabel history pengajuan untuk mahasiswa
- Status: Draft, Diproses, Selesai

#### 3. Detail & Tracking

**Folder**: `features/pengajuan/components/details/`

- Halaman detail yang menampilkan timeline posisi surat
- Contoh: "Sedang di Admin Prodi"

**Halaman**: `app/(dashboard)/pengajuan/tambah/page.tsx`

---

## 👤 DEV 4: The Verifier (Flow Disposisi Fakultas & Prodi)

### 🎯 Tanggung Jawab

Logika bisnis persetujuan, disposisi berjenjang, dan routing surat.

### 📦 Scope Kerja

#### 1. Inbox Pejabat

**Folder**: `features/disposisi/components/tables/`

- Tabel "Surat Masuk" yang berbeda-beda isinya tergantung siapa yang login
  - Kaprodi
  - Dekan
  - Admin Fakultas

#### 2. Action Panel

**Folder**: `features/disposisi/components/actions/`

- **Tombol Disposisi**:
  - Modal untuk meneruskan surat ke bawahan
  - Filter dropdown pejabat sesuai jenis surat: Akademik/SDM/Umum
- **Tombol Kembalikan**:
  - Modal input alasan penolakan
- **Logic Multi-Select**:
  - Khusus Manajer TU, bisa pilih Wadek 1 & 2 sekaligus

**Halaman**: `app/(dashboard)/surat-masuk/page.tsx`

---

## 👤 DEV 5: The Editor Specialist (Rich Text Engine)

### 🎯 Tanggung Jawab

Jantung aplikasi (Editor Surat mirip Microsoft Word). **Ini tugas paling teknis berat**.

### 📦 Scope Kerja

#### 1. Tiptap Implementation

**Folder**: `features/drafting/components/editor/`

- **Canvas A4**:
  - Styling editor agar terlihat seperti kertas putih di tengah layar abu-abu
- **Toolbar**:
  - Tombol: Bold, Italic, Alignment (Center/Justify), List

#### 2. Template Engine

**File**: `hooks/use-template.ts`

- Saat Admin Prodi membuka editor, otomatis terisi template surat:
  - Kop Surat
  - Pembuka
  - Penutup
- Template ter-inject data dari Dev 3 (Nama, Judul Acara)

#### 3. Dynamic Signature Grid

- **Fitur "Insert Signature Block"**:
  - Membuat tabel transparan 2 kolom di editor
  - Tempat tanda tangan pejabat

#### 4. Integration

- Komponen Editor ini nanti akan dipasang di halaman detail milik **Dev 4**

---

## 👤 DEV 6: The Finisher (Output, Security & Penomoran)

### 🎯 Tanggung Jawab

Hilir sistem (Cetak PDF, QR Code, dan Penomoran Surat).

### 📦 Scope Kerja

#### 1. PDF Generation

**Folder**: `components/preview/`

- Mengonversi hasil HTML dari **Dev 5** menjadi PDF siap cetak
- Menggunakan: `react-pdf` / `html2pdf`
- Pastikan layout PDF persis dengan tampilan editor

#### 2. Security Badge

**Folder**: `features/security/`

- **Implementasi QR Code**:
  - Berisi link validasi
- **Enkripsi**:
  - Integrasi simulasi enkripsi AES

#### 3. Penomoran Surat

**Folder**: `features/penomoran/`

- **UI untuk UPA**:
  - Input Nomor Surat & Tanggal Sah
- **Stamping Tool**:
  - Fitur visual untuk menempelkan gambar stempel/TTD
  - Di atas preview surat sebelum difinalisasi

---

## 📊 Ringkasan Pembagian

| Developer | Role              | Fokus Utama                | Dependencies        |
| --------- | ----------------- | -------------------------- | ------------------- |
| **DEV 1** | Architect         | Layout, Navigation, UI Kit | -                   |
| **DEV 2** | Gatekeeper        | Auth, User Management      | DEV 1 (Layout)      |
| **DEV 3** | Initiator         | Form Pengajuan, Tracking   | DEV 1, DEV 2        |
| **DEV 4** | Verifier          | Disposisi, Approval Flow   | DEV 1, DEV 2, DEV 3 |
| **DEV 5** | Editor Specialist | Rich Text Editor, Template | DEV 4 (Integration) |
| **DEV 6** | Finisher          | PDF, QR Code, Penomoran    | DEV 5 (HTML Output) |

---

## 🔄 Alur Kerja Tim

```
DEV 1 (Layout & UI)
    ↓
DEV 2 (Auth & Users)
    ↓
DEV 3 (Form Pengajuan) ──→ DEV 4 (Disposisi & Approval)
                               ↓
                          DEV 5 (Rich Editor)
                               ↓
                          DEV 6 (PDF & Security)
```

---

## 📝 Catatan Koordinasi

### Komunikasi Antar Dev

- **DEV 3 → DEV 4**: Struktur data pengajuan yang akan didisposisi
- **DEV 4 → DEV 5**: Kapan editor harus muncul di flow disposisi
- **DEV 5 → DEV 6**: Format HTML output yang akan dikonversi ke PDF
- **Semua DEV → DEV 1**: Request komponen UI baru dari Shadcn

### Meeting Points

1. **Week 1**: Setup basic layout (DEV 1) & Auth (DEV 2)
2. **Week 2**: Form pengajuan (DEV 3) & Inbox disposisi (DEV 4)
3. **Week 3**: Rich editor integration (DEV 5)
4. **Week 4**: PDF generation & finalisasi (DEV 6)

---

## ✅ Checklist Progress

### DEV 1: The Architect

- [ ] Global Layout Setup
- [ ] Sidebar dengan Role-based menu
- [ ] User Dropdown
- [ ] Dashboard widgets
- [ ] UI Kit maintenance system

### DEV 2: The Gatekeeper

- [ ] Login Form dengan Zod validation
- [ ] Auth hook (localStorage/Cookies)
- [ ] User Table CRUD
- [ ] Role Assignment feature

### DEV 3: The Initiator

- [ ] Form Wizard Step 1-4
- [ ] List Pengajuan Table
- [ ] Detail & Tracking page
- [ ] Upload lampiran

### DEV 4: The Verifier

- [ ] Inbox Pejabat (role-based)
- [ ] Disposisi Modal
- [ ] Kembalikan Modal
- [ ] Multi-select logic

### DEV 5: The Editor Specialist

- [ ] Tiptap Editor dengan Canvas A4
- [ ] Toolbar (Bold, Italic, Alignment)
- [ ] Template Engine
- [ ] Dynamic Signature Grid
- [ ] Integration dengan Dev 4

### DEV 6: The Finisher

- [ ] PDF Generation
- [ ] QR Code implementation
- [ ] Enkripsi AES
- [ ] UI Penomoran
- [ ] Stamping Tool

---

## 🚀 Tech Stack Reference

### Semua Developer Menggunakan:

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Form Validation**: Zod
- **HTTP Client**: Axios

### Spesifik per Developer:

- **DEV 2**: localStorage/Cookies, JWT handling
- **DEV 3**: React Hook Form, File Upload
- **DEV 4**: State management (Zustand/Context)
- **DEV 5**: Tiptap Editor, Prosemirror
- **DEV 6**: react-pdf/html2pdf, qrcode, crypto-js

---

_Dokumen ini adalah panduan pembagian tugas. Setiap developer diharapkan berkomunikasi aktif jika ada blocker atau butuh bantuan dari developer lain._

**Last Updated**: 21 Januari 2026
