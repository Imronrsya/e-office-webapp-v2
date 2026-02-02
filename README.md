# Aplikasi Frontend E-Office Pengajuan Surat Tugas/Keputusan

> Aplikasi web E-Office modern yang dibangun dengan Next.js 14 App Router, Shadcn UI, TypeScript, dan Bun.

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Instalasi & Setup](#-instalasi--setup)
- [Struktur Proyek](#-struktur-proyek)
- [Komponen Shadcn UI](#-komponen-shadcn-ui)
- [Fitur Utama](#-fitur-utama)
- [Panduan Development](#-panduan-development)
- [Best Practices](#-best-practices)

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Bahasa**: TypeScript
- **Package Manager**: Bun
- **UI Library**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Validasi Form**: Zod
- **State Management**: React Hooks + Custom Hooks
- **HTTP Client**: Fetch API

---

## 🚀 Instalasi & Setup

### Prasyarat

- Bun terinstal (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (untuk kompatibilitas)
- Git

### Instruksi Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd e-office-monorepo
   ```

2. **Navigasi ke folder frontend**
   ```bash
   cd e-office-webapp-v2
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```

4. **Setup environment variables**
   ```bash
   # Salin file environment contoh
   cp .env.example .env.local
   
   # Edit .env.local dan konfigurasi API endpoint Anda
   # Contoh:
   # NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

5. **Jalankan development server**
   ```bash
   bun dev
   ```

6. **Buka browser Anda**
   ```
   http://localhost:3000
   ```

### Script yang Tersedia

```bash
bun dev          # Jalankan development server
bun build        # Build untuk production
bun start        # Jalankan production server
bun lint         # Jalankan ESLint
```

---

## 📁 Struktur Proyek

Proyek ini menggunakan **Feature-First Architecture** yang memisahkan kode berdasarkan fitur bisnis, bukan berdasarkan tipe file teknis. Pendekatan ini meningkatkan maintainability dan scalability.

```
e-office-webapp-v2/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   ├── components/                   # Komponen bersama
│   ├── features/                     # Modul feature-first ⭐
│   ├── lib/                          # Utilities & helpers
│   └── types/                        # Definisi tipe global
├── public/                           # Aset statis
└── [file konfigurasi]
```

### 📂 Penjelasan Struktur Detail

#### 1️⃣ `src/app/` - Next.js 14 App Router

Next.js 14 menggunakan **file-system based routing**. Folder ini mengatur semua routing dan layout aplikasi.

```
app/
├── (auth)/                           # Route Group: Authentication
│   └── login/
│       └── page.tsx                  # Route: /login
│
├── (dashboard)/                      # Route Group: Dashboard (dengan layout)
│   ├── layout.tsx                    # Shared layout untuk semua dashboard routes
│   ├── dashboard/
│   │   └── page.tsx                  # Route: /dashboard
│   ├── pengajuan/
│   │   ├── page.tsx                  # Route: /pengajuan (list view)
│   │   ├── tambah/
│   │   │   └── page.tsx              # Route: /pengajuan/tambah
│   │   └── [id]/
│   │       └── page.tsx              # Route: /pengajuan/[id] (dynamic)
│   ├── nomor/
│   │   └── page.tsx                  # Route: /nomor
│   ├── pengguna/
│   │   └── page.tsx                  # Route: /pengguna
│   └── pengaturan/
│       └── page.tsx                  # Route: /pengaturan
│
├── layout.tsx                        # Root layout (global)
├── page.tsx                          # Route: / (homepage/redirect)
└── globals.css                       # Global styles & Tailwind imports
```

**🔑 Konsep Kunci:**

- **Route Groups** `(auth)`, `(dashboard)`: Folder dengan tanda kurung tidak mempengaruhi URL path. Digunakan untuk mengorganisir routes dan menerapkan shared layouts.
  - `(auth)`: Routes tanpa navigation bar (layar login)
  - `(dashboard)`: Routes dengan TopNav dan layout dashboard
  
- **Dynamic Routes** `[id]`: Sintaks bracket untuk dynamic segments (contoh: `/pengajuan/123`)

- **Nested Layouts**: Setiap `layout.tsx` membungkus semua child routes di bawahnya

---

#### 2️⃣ `src/components/` - Komponen Bersama

Komponen yang digunakan di berbagai fitur. **Hanya komponen presentational/UI generik**.

```
components/
├── ui/                               # Shadcn UI Primitives (DO NOT EDIT MANUALLY)
│   ├── button.tsx                    # Base button component
│   ├── input.tsx                     # Form input
│   ├── table.tsx                     # Data table
│   ├── card.tsx                      # Card container
│   ├── dropdown-menu.tsx             # Dropdown menu
│   ├── dialog.tsx                    # Modal dialog
│   └── [other-ui-components].tsx
│
└── layout/                           # Layout components
    ├── top-nav.tsx                   # Top navigation bar (used in dashboard)
    ├── page-container.tsx            # Wrapper untuk page content
    ├── navbar.tsx                    # (deprecated - for reference)
    └── sidebar.tsx                   # (deprecated - for reference)
```

**⚠️ Penting:**
- **`components/ui/`**: Komponen dari Shadcn UI CLI. Jangan edit manual kecuali perlu kustomisasi minor.
- **`components/layout/`**: Layout wrappers yang digunakan di berbagai halaman.

---

#### 3️⃣ `src/features/` - Feature-First Architecture ⭐

**Ini adalah inti arsitektur aplikasi.** Setiap folder di `features/` merepresentasikan satu **domain bisnis** yang berdiri sendiri (self-contained).

```
features/
├── auth/                             # 🔐 Authentication Feature
│   ├── components/
│   │   ├── login-form.tsx            # Login form with Zod validation
│   │   └── forgot-password-modal.tsx # Password reset modal
│   ├── hooks/
│   │   └── use-auth.ts               # Auth state management & API calls
│   └── types/
│       └── index.ts                  # Auth-specific TypeScript types
│
├── dashboard/                        # 📊 Dashboard Feature
│   └── components/
│       ├── stats-card.tsx            # Statistics display card
│       └── recent-activity.tsx       # Recent activity widget
│
├── pengajuan/                        # 📝 Submission Management Feature
│   ├── components/
│   │   ├── forms/
│   │   │   └── submission-form.tsx   # Create/edit submission form
│   │   ├── tables/
│   │   │   └── pengajuan-table-view.tsx # Data table with actions
│   │   └── details/
│   │       └── submission-detail.tsx # Detail view component
│   ├── hooks/
│   │   └── use-submissions.ts        # CRUD operations & state
│   └── types/
│       └── index.ts                  # Submission-specific types
│
├── penomoran/                        # 🔢 Numbering Feature
│   └── components/
│       ├── numbering-modal.tsx       # Modal untuk assign nomor surat
│       └── numbering-table.tsx       # Table untuk manage penomoran
│
└── users/                            # 👥 User Management Feature
    └── components/
        └── user-table.tsx            # User CRUD operations table
```

**🎯 Filosofi Feature-First:**

Setiap modul fitur mengandung **semua yang dibutuhkan** untuk fitur tersebut:

1. **`components/`**: Komponen UI spesifik untuk fitur ini
   - Bisa nested (forms/, tables/, details/) untuk organisasi
   - Hanya digunakan dalam fitur ini, tidak di-share

2. **`hooks/`**: Custom React hooks untuk:
   - Data fetching (API calls)
   - State management (local state)
   - Business logic (validasi, transformasi)
   
   **Contoh**: `use-submissions.ts` menangani semua operasi CRUD untuk submissions.

3. **`types/`**: TypeScript interfaces & types spesifik untuk fitur
   - Extend dari global types di `src/types/schema.ts`
   - Validasi atau derived types spesifik fitur

**✅ Keuntungan:**
- **Encapsulation**: Semua yang terkait fitur X ada di folder `features/X/`
- **Scalability**: Tambah fitur baru tanpa mempengaruhi kode yang ada
- **Team Collaboration**: Banyak developer bisa bekerja paralel pada fitur berbeda
- **Code Discovery**: Mudah menemukan di mana logika fitur berada

---

#### 4️⃣ `src/lib/` - Utilities & Helpers

Shared utilities yang digunakan di semua fitur.

```
lib/
├── api.ts                            # API client & request helpers
├── utils.ts                          # Utility functions (cn(), formatters, etc.)
└── validations.ts                    # Shared Zod validation schemas
```

**Tujuan:**
- **`api.ts`**: Konfigurasi API terpusat, base URL, auth headers
- **`utils.ts`**: Fungsi helper (Shadcn's `cn()` untuk classnames, date formatters, dll.)
- **`validations.ts`**: Zod schemas yang dapat digunakan kembali untuk validasi form

---

#### 5️⃣ `src/types/` - Definisi Tipe Global

```
types/
└── schema.ts                         # Core data contracts
```

Berisi **TypeScript types global** yang dibagikan di seluruh aplikasi:
- `User`, `Submission`, `Department`, dll.
- Tipe API response/request
- Shared enums

**Aturan**: Hanya untuk types yang benar-benar global. Types spesifik fitur masuk ke `features/[feature]/types/`.

---

## 🎨 Komponen Shadcn UI

Shadcn UI adalah kumpulan **copy-paste components** yang dibangun di atas Radix UI. Komponen di-install ke `src/components/ui/` dan sepenuhnya dapat dikustomisasi.

### Menambahkan Komponen Baru

Gunakan Shadcn CLI untuk menambahkan komponen:

```bash
# Menggunakan Bun (direkomendasikan)
bunx shadcn-ui@latest add button
bunx shadcn-ui@latest add dialog
bunx shadcn-ui@latest add form

# Menggunakan npx (alternatif)
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dropdown-menu
```

### Perintah yang Tersedia

```bash
# Tambah komponen spesifik
bunx shadcn-ui@latest add [component-name]

# Tambah beberapa komponen sekaligus
bunx shadcn-ui@latest add button input label

# Update komponen yang ada
bunx shadcn-ui@latest update

# Lihat semua komponen yang tersedia
bunx shadcn-ui@latest
```

### Komponen Umum

| Komponen | Kegunaan | Perintah |
|-----------|----------|---------|
| `button` | Tombol & aksi | `bunx shadcn-ui@latest add button` |
| `input` | Input form | `bunx shadcn-ui@latest add input` |
| `table` | Tabel data | `bunx shadcn-ui@latest add table` |
| `dialog` | Modal | `bunx shadcn-ui@latest add dialog` |
| `dropdown-menu` | Menu dropdown | `bunx shadcn-ui@latest add dropdown-menu` |
| `form` | Penanganan form | `bunx shadcn-ui@latest add form` |
| `card` | Container konten | `bunx shadcn-ui@latest add card` |
| `badge` | Badge status | `bunx shadcn-ui@latest add badge` |
| `select` | Dropdown select | `bunx shadcn-ui@latest add select` |
| `toast` | Notifikasi | `bunx shadcn-ui@latest add toast` |

### Konfigurasi Komponen

Konfigurasi ada di `components.json`:

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Catatan Penting

- ⚠️ **JANGAN edit** file di `components/ui/` secara manual kecuali diperlukan
- Komponen dirancang untuk **copy-paste**, jadi Anda memiliki kodenya
- Kustomisasi melalui **Tailwind classes** atau **CSS variables** di `globals.css`
- Semua komponen mendukung **dark mode** melalui varian `dark:` Tailwind

---

## ✨ Fitur Utama

### 1. 🔐 Autentikasi (`features/auth/`)
- Login dengan email & password
- Manajemen sesi
- Alur lupa password
- Protected routes

### 2. 📊 Dashboard (`features/dashboard/`)
- Kartu statistik (total pengajuan, pending, disetujui, dll.)
- Feed aktivitas terkini
- Aksi cepat
- Visualisasi data (grafik)

### 3. 📝 Manajemen Pengajuan (`features/pengajuan/`)
- **Tampilan List**: Tabel dengan filtering, sorting, pencarian
- **Buat**: Form untuk pengajuan baru dengan validasi
- **Edit**: Update pengajuan yang ada
- **Detail**: Tampilan lengkap pengajuan dengan riwayat
- **Pelacakan Status**: Pending → In Review → Approved/Rejected

### 4. 🔢 Penomoran Dokumen (`features/penomoran/`)
- Assign nomor surat otomatis
- Format: [PREFIX]/[NUMBER]/[YEAR]
- Tracking nomor yang sudah digunakan
- Riwayat penomoran

### 5. 👥 Manajemen Pengguna (`features/users/`)
- Operasi CRUD untuk users
- Role-based access control (RBAC)
- Aktivasi/deaktivasi pengguna
- Pencarian & filter pengguna

---

## 💻 Panduan Development

### Konvensi Penamaan File

```
✅ kebab-case untuk file:     login-form.tsx, use-auth.ts
✅ PascalCase untuk komponen: LoginForm, StatsCard
✅ camelCase untuk fungsi:    handleSubmit, fetchUsers
✅ UPPER_CASE untuk konstanta: API_BASE_URL, MAX_FILE_SIZE
```

### Struktur Komponen

```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
}

// 3. Komponen
export function LoginForm({ onSubmit }: LoginFormProps) {
  // 3a. Hooks
  const [email, setEmail] = useState('');
  
  // 3b. Handlers
  const handleSubmit = () => {
    // ...
  };
  
  // 3c. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
}
```

### Pola Custom Hooks

```typescript
// features/pengajuan/hooks/use-submissions.ts
export function useSubmissions() {
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchSubmissions = async () => {
    setLoading(true);
    // API call...
    setLoading(false);
  };
  
  return {
    data,
    loading,
    fetchSubmissions,
    // operasi lainnya
  };
}
```

### Menambahkan Fitur Baru

1. **Buat folder fitur**
   ```bash
   mkdir -p src/features/new-feature/{components,hooks,types}
   ```

2. **Buat file yang diperlukan**
   ```
   features/new-feature/
   ├── components/
   │   └── new-feature-form.tsx
   ├── hooks/
   │   └── use-new-feature.ts
   └── types/
       └── index.ts
   ```

3. **Tambahkan route di `app/`**
   ```bash
   mkdir -p src/app/\(dashboard\)/new-feature
   # Buat page.tsx
   ```

4. **Update navigasi** di `components/layout/top-nav.tsx`

---

## 🎯 Best Practices

### 1. Manajemen Paket
- ✅ **Selalu gunakan Bun** sebagai package manager
  ```bash
  bun add [package]        # Tambah dependency
  bun remove [package]     # Hapus dependency
  bun install              # Install semua dependencies
  ```
- ❌ **Jangan campur** perintah npm, yarn, atau pnpm

### 2. Komponen Shadcn UI
- ✅ **Gunakan CLI** untuk menambah komponen: `bunx shadcn-ui@latest add [component]`
- ✅ Kustomisasi melalui Tailwind classes atau CSS variables
- ❌ **Jangan edit** file di `components/ui/` secara manual kecuali benar-benar diperlukan
- ✅ Jika perlu kustomisasi kompleks, pertimbangkan membuat wrapper component

### 3. State Management
- ✅ **Local state** (useState) untuk UI state (modals, forms)
- ✅ **Custom hooks** untuk state & business logic spesifik fitur
- ✅ **Lift state up** hanya jika diperlukan
- ❌ **Hindari prop drilling** → gunakan hooks atau context

### 4. Penempatan Business Logic
- ✅ **Logika bisnis** masuk ke `features/[feature]/hooks/`
- ✅ **API calls** di custom hooks, bukan di components
- ✅ **Validations** dengan Zod schemas di `lib/validations.ts` atau feature types
- ❌ **Jangan taruh** logika kompleks di UI components

### 5. Organisasi Kode
- ✅ **Feature-first**: Kelompokkan berdasarkan fitur, bukan tipe teknis
- ✅ **Co-location**: Simpan file terkait berdekatan (component + hook + type)
- ✅ **Single Responsibility**: Satu komponen = satu tanggung jawab
- ❌ **Hindari** God components (500+ baris)

### 6. TypeScript
- ✅ **Selalu beri tipe** props, state, API responses
- ✅ Gunakan **interfaces** untuk object shapes
- ✅ Gunakan **types** untuk unions, intersections
- ❌ **Hindari `any`** → gunakan `unknown` jika tipe benar-benar tidak diketahui

### 7. Performa
- ✅ Gunakan **React.memo** untuk komponen yang mahal
- ✅ Gunakan **useMemo/useCallback** untuk komputasi yang mahal
- ✅ **Lazy load** routes dengan Next.js dynamic imports
- ✅ **Optimalkan gambar** dengan komponen Next.js `<Image>`

### 8. Styling
- ✅ Gunakan **Tailwind utility classes** terlebih dahulu
- ✅ Gunakan **CSS modules** untuk style kompleks spesifik komponen
- ✅ Gunakan **utility `cn()` Shadcn** untuk conditional classes
  ```tsx
  import { cn } from '@/lib/utils';
  
  <div className={cn("base-class", isActive && "active-class")} />
  ```
- ❌ **Hindari** inline styles kecuali dinamis

### 9. Forms & Validasi
- ✅ Gunakan **Zod** untuk validasi schema
- ✅ Gunakan **React Hook Form** untuk form kompleks (opsional)
- ✅ **Validasi on blur** untuk UX yang lebih baik
- ✅ Tampilkan **pesan error yang jelas**

### 10. API Calls
- ✅ **Sentralisasi** konfigurasi API di `lib/api.ts`
- ✅ Handle **loading states** (skeleton, spinners)
- ✅ Handle **error states** (toast notifications, error boundaries)
- ✅ Implementasi **retry logic** untuk operasi kritis

---

## 📚 Sumber Daya Tambahan

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Validation](https://zod.dev/)

---

## 🤝 Kontribusi

1. Buat branch baru: `git checkout -b feature/fitur-anda`
2. Lakukan perubahan
3. Test secara menyeluruh
4. Commit: `git commit -m "feat: tambah fitur anda"`
5. Push: `git push origin feature/fitur-anda`
6. Buat Pull Request

---

## 📝 Catatan

- **Struktur Monorepo**: Frontend ini adalah bagian dari monorepo. Backend API ada di `../e-office-api-v2/`
- **Integrasi API**: Konfigurasi `NEXT_PUBLIC_API_URL` di `.env.local` untuk terhubung ke backend
- **Autentikasi**: Token disimpan di localStorage/cookies (cek `features/auth/hooks/use-auth.ts`)

---

**Selamat Coding! 🚀**

Dibangun dengan ❤️ menggunakan Next.js 14, Shadcn UI, dan Bun.
