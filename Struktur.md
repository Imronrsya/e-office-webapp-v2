# Struktur Lengkap E-Office WebApp V2 - Source Code

Dokumentasi lengkap struktur folder `src/` dari aplikasi E-Office WebApp V2.

---

## 📁 Struktur Direktori Utama

```
src/
├── app/                    # Next.js App Router - Halaman dan routing
├── components/             # Komponen UI yang dapat digunakan ulang
├── features/               # Fitur-fitur aplikasi (modular)
├── lib/                    # Utilities dan helper functions
├── services/               # Service layer untuk API calls
└── types/                  # TypeScript type definitions
```

---

## 🎯 Detail Struktur

### 1️⃣ **app/** - Next.js App Router

Folder ini menggunakan Next.js 13+ App Router dengan file-based routing.

```
app/
├── favicon.ico             # Icon aplikasi
├── globals.css             # Global CSS styles
├── layout.tsx              # Root layout untuk seluruh aplikasi
├── page.tsx                # Halaman utama/landing page (/)
│
├── (auth)/                 # Route group untuk autentikasi
│   └── login/
│       └── page.tsx        # Halaman login (/login)
│
└── (dashboard)/            # Route group untuk dashboard (protected routes)
    ├── layout.tsx          # Layout khusus untuk area dashboard
    ├── dashboard/
    │   └── page.tsx        # Halaman dashboard utama (/dashboard)
    ├── nomor/
    │   └── page.tsx        # Halaman penomoran surat (/nomor)
    ├── pengajuan/
    │   ├── page.tsx        # List pengajuan (/pengajuan)
    │   ├── tambah/
    │   │   └── page.tsx    # Form tambah pengajuan baru (/pengajuan/tambah)
    │   └── [id]/
    │       └── page.tsx    # Detail pengajuan berdasarkan ID (/pengajuan/[id])
    ├── pengaturan/
    │   └── page.tsx        # Halaman pengaturan aplikasi (/pengaturan)
    └── pengguna/
        └── page.tsx        # Halaman manajemen pengguna (/pengguna)
```

**Keterangan:**

- `(auth)` dan `(dashboard)` adalah route groups yang tidak mempengaruhi URL
- Layout bersarang: `app/layout.tsx` → `app/(dashboard)/layout.tsx`
- Dynamic routes menggunakan `[id]` untuk parameter dinamis

---

### 2️⃣ **components/** - Komponen UI Reusable

Komponen-komponen UI yang dapat digunakan di seluruh aplikasi.

```
components/
├── layout/                 # Komponen untuk layout aplikasi
│   ├── page-container.tsx  # Container wrapper untuk halaman
│   └── top-nav.tsx         # Navigation bar atas
│
└── ui/                     # Komponen UI dasar (shadcn/ui style)
    ├── avatar.tsx          # Komponen avatar pengguna
    ├── badge.tsx           # Badge/label kecil
    ├── button.tsx          # Tombol dengan berbagai varian
    ├── card.tsx            # Card container
    ├── dialog.tsx          # Modal/dialog popup
    ├── dropdown-menu.tsx   # Dropdown menu
    ├── input.tsx           # Input field
    ├── label.tsx           # Label untuk form
    ├── select.tsx          # Select/dropdown
    ├── separator.tsx       # Garis pemisah
    ├── skeleton.tsx        # Loading skeleton
    ├── switch.tsx          # Toggle switch
    ├── table.tsx           # Tabel data
    └── textarea.tsx        # Textarea multiline
```

**Keterangan:**

- Komponen UI mengikuti pattern shadcn/ui
- Komponen layout khusus untuk struktur halaman
- Semua komponen fully typed dengan TypeScript

---

### 3️⃣ **features/** - Fitur Modular

Setiap fitur memiliki struktur tersendiri (components, hooks, types).

```
features/
│
├── auth/                   # 🔐 Fitur Autentikasi
│   ├── components/
│   │   ├── forgot-password-modal.tsx  # Modal lupa password
│   │   └── login-form.tsx             # Form login
│   ├── hooks/
│   │   └── use-auth.ts                # Custom hook untuk autentikasi
│   └── types/
│       └── index.ts                   # Type definitions untuk auth
│
├── dashboard/              # 📊 Fitur Dashboard
│   └── components/
│       ├── admin-dashboard.tsx        # Dashboard untuk admin
│       ├── mahasiswa-dashboard.tsx    # Dashboard untuk mahasiswa
│       ├── recent-activity.tsx        # Widget aktivitas terkini
│       └── stats-card.tsx             # Card statistik
│
├── pengajuan/              # 📝 Fitur Pengajuan Surat
│   ├── components/
│   │   ├── details/
│   │   │   └── submission-detail.tsx  # Detail pengajuan
│   │   ├── forms/
│   │   │   └── submission-form.tsx    # Form pengajuan
│   │   └── tables/
│   │       └── pengajuan-table-view.tsx  # Tabel daftar pengajuan
│   ├── hooks/
│   │   └── useSubmissions.ts          # Custom hook untuk submissions
│   └── types/
│       └── index.ts                   # Type definitions untuk pengajuan
│
├── penomoran/              # 🔢 Fitur Penomoran Surat
│   └── components/
│       ├── numbering-modal.tsx        # Modal penomoran
│       └── numbering-table.tsx        # Tabel penomoran
│
└── users/                  # 👥 Fitur Manajemen User
    └── components/
        └── user-table.tsx             # Tabel daftar user
```

**Keterangan:**

- Setiap feature mengikuti pattern: `components/`, `hooks/`, `types/`
- Struktur modular memudahkan maintenance dan scalability
- Components diorganisir berdasarkan fungsi (details, forms, tables)

---

### 4️⃣ **lib/** - Utilities & Helpers

Fungsi-fungsi helper dan konfigurasi utility.

```
lib/
├── api.ts              # 🌐 API client configuration & axios instance
├── utils.ts            # 🛠️ Utility functions umum (formatting, helpers)
└── validations.ts      # ✅ Schema validasi (Zod/Yup)
```

**Fungsi:**

- `api.ts`: Setup axios, interceptors, base URL
- `utils.ts`: Helper functions (className merger, date formatter, dll)
- `validations.ts`: Schema validasi form menggunakan Zod/Yup

---

### 5️⃣ **services/** - Service Layer

Layer untuk komunikasi dengan API backend.

```
services/
└── submission.service.ts   # Service untuk API submissions/pengajuan
```

**Keterangan:**

- Service layer memisahkan logic API dari komponen
- Menggunakan axios instance dari `lib/api.ts`
- Return typed responses untuk type safety

**Pattern Service:**

```typescript
// submission.service.ts
export const submissionService = {
  getAll: () => api.get("/submissions"),
  getById: (id: string) => api.get(`/submissions/${id}`),
  create: (data) => api.post("/submissions", data),
  update: (id, data) => api.put(`/submissions/${id}`, data),
  delete: (id) => api.delete(`/submissions/${id}`),
};
```

---

### 6️⃣ **types/** - Type Definitions

Definisi tipe TypeScript global.

```
types/
├── schema.ts       # 📋 Schema types untuk database models
└── submission.ts   # 📝 Types khusus untuk submission/pengajuan
```

**Keterangan:**

- Shared types yang digunakan di banyak tempat
- Sinkronisasi dengan schema backend (Prisma)
- Export interface dan type aliases

---

## 🔄 Flow Data Aplikasi

```
User Interaction
      ↓
  [Page Component] (app/)
      ↓
  [Feature Component] (features/)
      ↓
  [Custom Hook] (features/*/hooks)
      ↓
  [Service Layer] (services/)
      ↓
  [API Client] (lib/api.ts)
      ↓
  Backend API
```

---

## 📦 Konvensi Penamaan

### File Components

- **Pages**: `page.tsx` (Next.js convention)
- **Components**: `kebab-case.tsx` (contoh: `login-form.tsx`)
- **Layouts**: `layout.tsx` (Next.js convention)

### Folders

- **Route groups**: `(nama-group)` dengan kurung
- **Dynamic routes**: `[param]` dengan kurung siku
- **Feature modules**: `lowercase` (contoh: `auth`, `pengajuan`)

### Code Style

- **Components**: PascalCase (contoh: `LoginForm`)
- **Functions**: camelCase (contoh: `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (contoh: `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (contoh: `UserType`, `SubmissionData`)

---

## 🎨 Pattern & Best Practices

### 1. Colocation

Setiap feature memiliki components, hooks, dan types dalam satu folder:

```
features/auth/
├── components/    # Komponen UI khusus auth
├── hooks/         # Custom hooks khusus auth
└── types/         # Types khusus auth
```

### 2. Separation of Concerns

- **Pages**: Hanya routing dan layout
- **Components**: UI dan presentasi
- **Hooks**: Logic dan state management
- **Services**: API calls
- **Types**: Type definitions

### 3. Reusability

- Komponen UI umum di `components/ui/`
- Komponen spesifik di `features/*/components/`
- Shared types di `types/`
- Shared utils di `lib/`

### 4. Type Safety

- Semua file menggunakan TypeScript
- Strict type checking
- Shared types untuk konsistensi

---

## 🚀 Cara Menambah Fitur Baru

1. **Buat folder feature baru**:

   ```
   features/nama-fitur/
   ├── components/
   ├── hooks/
   └── types/
   ```

2. **Tambah route di app/**:

   ```
   app/(dashboard)/nama-fitur/
   └── page.tsx
   ```

3. **Buat service jika perlu**:

   ```
   services/nama-fitur.service.ts
   ```

4. **Definisikan types**:
   ```
   types/nama-fitur.ts
   ```

---

## 📝 Catatan Penting

- **Next.js 13+ App Router**: Menggunakan Server Components by default
- **TypeScript**: Strict mode enabled
- **Styling**: Menggunakan Tailwind CSS
- **UI Components**: Berbasis shadcn/ui
- **State Management**: React hooks + custom hooks
- **API Communication**: Axios dengan interceptors
- **Validation**: Zod/Yup untuk validasi form

---

## 🔗 Hubungan dengan Backend

Aplikasi ini terhubung dengan backend API di folder `e-office-api-v2/`:

```
Frontend (webapp-v2)     →    Backend (api-v2)
/pengajuan              →     /api/submissions
/nomor                  →     /api/numbering
/pengguna               →     /api/users
/auth/login             →     /api/auth/login
```

---

## 📚 Dependencies Utama

- **Next.js 14+**: React framework
- **React 18+**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **Axios**: HTTP client
- **Zod**: Schema validation
- **React Hook Form**: Form management

---

_Dokumentasi ini dibuat untuk memudahkan developer dalam memahami struktur dan arsitektur aplikasi E-Office WebApp V2._

**Last Updated**: 21 Januari 2026
