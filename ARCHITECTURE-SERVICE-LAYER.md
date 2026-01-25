# 📚 DOKUMENTASI: Service Layer Architecture

## 🎯 Tujuan

Memisahkan logika data (mock/API) dari UI Components, sehingga **mudah beralih dari data dummy ke real API** tanpa mengubah kode di banyak tempat.

---

## 📂 Struktur File

```
src/
├── data/
│   └── mock-db.ts              # Data dummy untuk development
├── services/
│   └── surat.service.ts        # Service Layer (Mock ↔ API Switch)
└── features/
    └── dashboard/
        └── roles/
            └── *-dashboard.tsx # Components pakai service, BUKAN langsung mock-db
```

---

## 🔧 Cara Kerja

### 1️⃣ **Saat Development (Pakai Mock Data)**

```typescript
// File: src/services/surat.service.ts
const USE_MOCK = true; // ✅ Pakai data dummy
```

Di dashboard components:

```typescript
import { suratService } from "@/services/surat.service";

// Fetch data (otomatis pakai mock)
const response = await suratService.getAll({
  tipeSurat: "Surat Masuk",
  status: "menunggu_anda",
});
```

### 2️⃣ **Saat Backend Ready (Pakai Real API)**

**LANGKAH-LANGKAH:**

#### Step 1: Set Environment Variable

```bash
# File: .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# atau
NEXT_PUBLIC_API_URL=https://your-production-api.com/api
```

#### Step 2: Switch Mode di Service

```typescript
// File: src/services/surat.service.ts
const USE_MOCK = false; // ⚠️ UBAH JADI FALSE
```

#### Step 3: Uncomment Kode API

Di file yang sama, uncomment bagian ini:

```typescript
// Dari yang tadinya comment:
/*
const response = await fetch(`${API_URL}/surat?${queryParams}`);
return await response.json();
*/

// Jadi:
const response = await fetch(`${API_URL}/surat?${queryParams}`);
return await response.json();
```

#### Step 4: SELESAI! ✅

Semua dashboard otomatis pakai Real API tanpa perlu edit file lain!

---

## 📖 API Service Methods

### `suratService.getAll(params)`

**Fungsi:** Ambil semua data surat dengan filter
**Parameter:**

- `tipeSurat`: 'Surat Masuk' | 'Surat Keluar' (opsional)
- `status`: Status surat atau 'semua' (opsional)
- `search`: Kata kunci pencarian (opsional)
- `dateFrom`: Filter tanggal dari (opsional)
- `dateTo`: Filter tanggal sampai (opsional)
- `page`: Halaman (default: 1)
- `limit`: Jumlah per halaman (default: 10)

**Return:**

```typescript
{
  data: SuratMock[],
  total: number,
  page: number,
  totalPages: number
}
```

**Contoh:**

```typescript
const result = await suratService.getAll({
  tipeSurat: "Surat Masuk",
  status: "menunggu_anda",
  search: "PKL",
  page: 1,
  limit: 10,
});
```

---

### `suratService.getById(id)`

**Fungsi:** Ambil detail satu surat
**Parameter:** `id` (string)
**Return:** `SuratMock | null`

**Contoh:**

```typescript
const surat = await suratService.getById("SM-001");
```

---

### `suratService.create(data)`

**Fungsi:** Buat surat baru
**Parameter:** Data surat (tanpa id & tanggalSurat)
**Return:** `SuratMock`

**Contoh:**

```typescript
const newSurat = await suratService.create({
  namaPengaju: "Budi Santoso",
  rolePengaju: "mahasiswa",
  judulSurat: "Permohonan PKL",
  tipeSurat: "Surat Masuk",
  jenisSurat: "Surat Pengantar",
  status: "menunggu_anda",
});
```

---

### `suratService.update(id, data)`

**Fungsi:** Update data surat
**Parameter:**

- `id`: ID surat
- `data`: Field yang mau diubah (partial)

**Contoh:**

```typescript
await suratService.update("SM-001", {
  status: "selesai",
});
```

---

### `suratService.updateStatus(id, status)`

**Fungsi:** Update status surat saja
**Parameter:**

- `id`: ID surat
- `status`: Status baru

**Contoh:**

```typescript
await suratService.updateStatus("SM-001", "diproses");
```

---

### `suratService.delete(id)`

**Fungsi:** Hapus surat
**Parameter:** `id` (string)
**Return:** `void`

**Contoh:**

```typescript
await suratService.delete("SM-001");
```

---

## 💡 Best Practices

### ✅ DO (Yang BENAR)

```typescript
// ✅ Import dari service
import { suratService } from "@/services/surat.service";

// ✅ Pakai service di component
const data = await suratService.getAll({ tipeSurat: "Surat Masuk" });
```

### ❌ DON'T (JANGAN)

```typescript
// ❌ JANGAN import langsung dari mock-db
import { MOCK_SURAT_DATA } from "@/data/mock-db";

// ❌ JANGAN pakai data langsung
const data = MOCK_SURAT_DATA.filter(...);
```

**ALASAN:** Kalau import langsung dari `mock-db.ts`, nanti susah ganti ke API!

---

## 🗺️ Roadmap Transisi

### Phase 1: Development (Sekarang) ✅

- [x] Buat mock data
- [x] Buat service layer
- [x] Components pakai service
- [x] Testing dengan mock data

### Phase 2: Backend Integration (Minggu Depan)

- [ ] Backend team buat API
- [ ] Set `NEXT_PUBLIC_API_URL` di `.env.local`
- [ ] Ubah `USE_MOCK = false`
- [ ] Uncomment kode API calls
- [ ] Testing dengan real API
- [ ] Fix bugs (kalau ada)

### Phase 3: Production

- [ ] Hapus `mock-db.ts` (opsional)
- [ ] Hapus kode mock di service (opsional)
- [ ] Deploy

---

## 🔍 Troubleshooting

### Error: "Cannot find module '@/data/mock-db'"

**Solusi:** Pastikan file `mock-db.ts` ada di `src/data/`

### Data tidak muncul

**Solusi:**

1. Cek `USE_MOCK = true` di `surat.service.ts`
2. Cek console browser untuk error
3. Cek Network tab untuk request

### API Error 404/500

**Solusi:**

1. Cek `NEXT_PUBLIC_API_URL` sudah benar
2. Cek Backend sudah running
3. Cek CORS settings di Backend
4. Cek endpoint URL di service file

---

## 🎓 Penjelasan Konsep

### Mengapa Pakai Service Layer?

**Tanpa Service Layer (❌ BURUK):**

```
Dashboard Component → Langsung ke Mock Data
                    → Susah ganti ke API
```

**Dengan Service Layer (✅ BAGUS):**

```
Dashboard Component → Service Layer → Mock Data (saat dev)
                                   → Real API (saat production)
```

### Keuntungan:

1. ✅ **Single Source of Truth**: Semua data lewat 1 pintu (service)
2. ✅ **Easy Switch**: Tinggal ganti 1 flag (`USE_MOCK`)
3. ✅ **Type Safe**: TypeScript tetap ketat
4. ✅ **Maintainable**: Kode terorganisir rapi
5. ✅ **Testable**: Mudah di-test (mock atau real)

---

## 📝 Checklist Untuk Tim Backend

Saat Backend ready, pastikan API punya endpoints ini:

- [ ] `GET /api/surat` - List surat (dengan filter, pagination, search)
- [ ] `GET /api/surat/:id` - Detail satu surat
- [ ] `POST /api/surat` - Buat surat baru
- [ ] `PUT /api/surat/:id` - Update surat
- [ ] `PATCH /api/surat/:id/status` - Update status saja
- [ ] `DELETE /api/surat/:id` - Hapus surat

**Response Format yang Diharapkan:**

```typescript
// GET /api/surat
{
  "data": [
    {
      "id": "SM-001",
      "namaPengaju": "Budi",
      "rolePengaju": "mahasiswa",
      "judulSurat": "...",
      "tipeSurat": "Surat Masuk",
      "jenisSurat": "Surat Pengantar",
      "tanggalSurat": "2026-01-22",
      "status": "menunggu_anda"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

---

## 🚀 Quick Start Guide

### Untuk Developer Front-End (Sekarang):

1. Import service: `import { suratService } from "@/services/surat.service"`
2. Pakai method-nya: `await suratService.getAll({ ... })`
3. JANGAN import dari `mock-db.ts` langsung!

### Untuk Developer Back-End (Nanti):

1. Buat API sesuai endpoints di atas
2. Kasih tau URL API-nya (misal: `http://localhost:3001/api`)
3. Front-end tinggal set environment variable & switch flag

---

## 📞 Contact & Questions

Ada pertanyaan? Tanya di grup atau baca file ini lagi! 😄

**Happy Coding! 🎉**
