# E-Office WebApp v2 (Frontend)

Frontend Web Application untuk sistem E-Office (Surat Tugas & SK Dekan) Fakultas Sains dan Matematika Universitas Diponegoro. Dibangun menggunakan **Next.js 16 (App Router)** dengan pendekatan **Feature-Slice Architecture** untuk maintainabilitas jangka panjang.

## 🏗 Arsitektur: Feature-Slice & App Router

Project ini memisahkan _business logic_ ke dalam folder `features/` dan _routing_ ke dalam folder `app/`.

### Struktur Direktori Utama (`src/`)
-   **`app`**: Routing layer (Next.js App Router). Berisi `layout.tsx`, `page.tsx`, dan route groups.
-   **`features`**: Core business logic, dikelompokkan per domain fitur.
    -   `auth`: Autentikasi dan user users session.
    -   `dashboard`: Halaman utama dan widget statistik.
    -   `draft-surat`: Logic pembuatan dan editing draft surat.
    -   `pengajuan`: Flow pengajuan surat dari user.
    -   `penomoran`: Manajemen nomor surat.
    -   `detail`: Halaman detail surat.
-   **`components`**: Reusable UI components (Button, Input, Dialog, dll) berbasis [shadcn/ui](https://ui.shadcn.com).
-   **`hooks`**: Global custom hooks.
-   **`lib`**: Utility functions dan konfigurasi library (axios, utils).
-   **`services`**: API calls dan external services integration.

### Tech Stack
-   **Framework**: [Next.js 16](https://nextjs.org) (React Framework for the Web)
-   **UI Library**: [React 19](https://react.dev)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
-   **Component Primitives**: [Radix UI](https://www.radix-ui.com) / shadcn/ui
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest) (Server State) & React Context (Client State)
-   **Form Handling**: [React Hook Form](https://react-hook-form.com) dengan resolver Zod

---

## 🚀 Setup & Installation (Staging)

Ikuti langkah-langkah berikut secara berurutan untuk menjalankan frontend di environment staging/dev.

### Staging Frontend
1. Instalasi Package
```bash
bun install
```
2. Copy env example & Sesuaikan env
```bash
cp .env.example .env
```
3. Run App
```bash
bun dev
```

---

## 🎨 Design System

Frontend ini menggunakan **Tailwind CSS 4** sebagai engine styling utama. Komponen UI dibangun dengan filosofi _headless UI_ menggunakan Radix UI untuk aksesibilitas maksimal, dibungkus dengan styling kustom yang konsisten.

-   **Font**: Poppins (melalui `next/font/google`)
-   **Icons**: Lucide React
