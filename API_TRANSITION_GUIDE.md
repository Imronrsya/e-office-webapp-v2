# API Transition Guide

## 🎯 Status API Readiness

**Status**: ✅ **READY** - Semua dashboard sudah menggunakan service layer pattern

### Dashboard Status

| Dashboard           | Status   | Hook                            | Role Filter         |
| ------------------- | -------- | ------------------------------- | ------------------- |
| Pengaju             | ✅ Ready | useSubmissions()                | -                   |
| Kaprodi             | ✅ Ready | useInbox('kaprodi')             | kaprodi             |
| Admin Prodi         | ✅ Ready | useInbox('admin_prodi')         | admin_prodi         |
| Kadep               | ✅ Ready | useInbox('kadep')               | kadep               |
| Admin Fakultas      | ✅ Ready | useInbox('admin_fakultas')      | admin_fakultas      |
| Manajer TU          | ✅ Ready | useInbox('manajer_tu')          | manajer_tu          |
| Dekan               | ✅ Ready | useInbox('dekan')               | dekan               |
| Wadek 1             | ✅ Ready | useInbox('wadek_1')             | wadek_1             |
| Wadek 2             | ✅ Ready | useInbox('wadek_2')             | wadek_2             |
| Supervisor Akademik | ✅ Ready | useInbox('supervisor_akademik') | supervisor_akademik |
| Supervisor SDM      | ✅ Ready | useInbox('supervisor_sdm')      | supervisor_sdm      |
| Staf Akademik       | ✅ Ready | useInbox('staf_akademik')       | staf_akademik       |
| Staf SDM            | ✅ Ready | useInbox('staf_sdm')            | staf_sdm            |
| UPA                 | ✅ Ready | useInbox('upa')                 | upa                 |

---

## 🚀 Cara Switch ke Real API

Ketika backend sudah siap, hanya perlu **3 langkah** untuk menggunakan real API:

### Step 1: Install Axios (jika belum)

```bash
npm install axios
```

### Step 2: Update Environment Variable

Tambahkan di file `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

### Step 3: Enable Real API Mode

Edit file: `src/services/submission.service.ts`

**Sebelum:**

```typescript
const USE_MOCK = true; // ← Ubah ini
```

**Sesudah:**

```typescript
const USE_MOCK = false; // ← Sudah pakai real API!
```

### Step 4: Uncomment Axios Calls

Di file yang sama (`submission.service.ts`), uncomment semua axios calls:

```typescript
// Uncomment ini:
const response = await axios.get(`${API_URL}/submissions`, {
  params: options,
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
return response.data;
```

---

## 📦 Arsitektur Service Layer

### 1. Service Layer Pattern

```
Component → Hook → Service → (Mock/API)
                        ↓
                    Adapter Pattern
```

**Keuntungan:**

- ✅ Component tidak tahu dari mana data berasal
- ✅ Ganti mock → real API tanpa ubah UI
- ✅ Reusable hooks untuk semua component
- ✅ Single source of truth untuk data fetching

### 2. Hook Structure

#### `useSubmissions()` - Untuk list submissions

```typescript
const { submissions, loading, error, refetch } = useSubmissions({
  status: "pending", // optional filter
});
```

#### `useInbox(role)` - Untuk inbox by role

```typescript
const { submissions, loading, error, refetch } = useInbox("kaprodi");
```

Filter otomatis berdasarkan `posisiSekarang` field.

#### `useSubmission(id)` - Untuk single submission

```typescript
const { submission, loading, error } = useSubmission("REQ-001");
```

### 3. Mock Data Structure

Mock data di: `src/data/mock-db.ts`

Struktur submission:

```typescript
{
  id: "REQ-001",
  pengaju: { userId, name, role },
  jenis: "Surat Tugas" | "Surat Pengantar" | "SK Dekan",
  kategori: "Akademik" | "SDM" | "Umum",
  status: "pending_kaprodi" | "approved_kaprodi" | ...,
  posisiSekarang: "kaprodi" | "admin_prodi" | "kadep" | ...,
  content: {
    hal: "Judul/Perihal surat",
    // ... fields lain
  },
  workflow: [...history],
  createdAt, updatedAt
}
```

---

## 🔄 Workflow & Status Mapping

| Status               | posisiSekarang                         | Terlihat di Dashboard        |
| -------------------- | -------------------------------------- | ---------------------------- |
| `pending_kaprodi`    | `kaprodi`                              | Kaprodi                      |
| `approved_kaprodi`   | `admin_prodi`                          | Admin Prodi                  |
| `draft_complete`     | `kadep`                                | Kadep                        |
| `sent_to_fakultas`   | `admin_fakultas`                       | Admin Fakultas               |
| `disposisi_fakultas` | `manajer_tu`, `supervisor_*`, `staf_*` | Manajer TU, Supervisor, Staf |
| `pending_dekan`      | `dekan`                                | Dekan                        |
| `proses_upa`         | `upa`                                  | UPA                          |

---

## 🧪 Testing dengan Mock Data

Mock data sudah mencakup **10 submissions** di berbagai workflow stage:

- **REQ-001, REQ-002**: Di Kaprodi (pending_kaprodi)
- **REQ-003**: Approved Kaprodi, ke Admin Prodi
- **REQ-004**: Draft complete, ke Kadep
- **REQ-005**: Sent to fakultas
- **REQ-006, REQ-007, REQ-008, REQ-009**: Disposisi fakultas (di berbagai posisi)
- **REQ-010**: Proses UPA

Coba login dengan role berbeda untuk melihat inbox yang berbeda.

---

## 🎨 UI Pattern

Semua dashboard mengikuti pattern yang sama:

```typescript
export default function SomeDashboard() {
  const { submissions, loading } = useInbox('role_name');

  return (
    <div>
      {loading ? (
        <p>Memuat data...</p>
      ) : submissions.length === 0 ? (
        <p>Tidak ada data</p>
      ) : (
        submissions.map(submission => (
          <div key={submission.id}>
            <h3>{submission.content.hal}</h3>
            {/* Display fields, buttons, etc */}
          </div>
        ))
      )}
    </div>
  );
}
```

**Keuntungan:**

- Consistent UX across all dashboards
- Auto handle loading & empty states
- Real data dari mock/API tanpa hardcode

---

## ✅ Checklist Sebelum Deploy

- [ ] Backend API sudah siap
- [ ] Endpoint `/api/submissions` sudah bisa dipanggil
- [ ] API format response sesuai dengan type `Submission` di schema.ts
- [ ] Authentication token ready
- [ ] Environment variable `NEXT_PUBLIC_API_URL` sudah diset
- [ ] Axios sudah diinstall: `npm install axios`
- [ ] Set `USE_MOCK = false` di submission.service.ts
- [ ] Uncomment semua axios calls di service
- [ ] Test dengan real API di dev environment
- [ ] Verify semua dashboard menampilkan data dari API

---

## 📝 Notes

1. **Field Mapping**: Pastikan backend API mengirim field:
   - `content.hal` (bukan `title`)
   - `jenis` (bukan `type`)
   - `kategori` (bukan `category`)
   - `posisiSekarang` untuk filtering by role

2. **Authentication**: Tambahkan function `getToken()` di service untuk ambil JWT token

3. **Error Handling**: Sudah ada error handling di hooks, tapi bisa ditambahkan toast notifications

4. **Pagination**: Saat ini belum ada pagination, bisa ditambahkan nanti di hooks

5. **Real-time Updates**: Bisa tambahkan WebSocket atau polling untuk real-time inbox updates

---

## 🎉 Summary

**Current State**: 100% API-ready - NO hardcoded data in any dashboard

**To Go Live**: Just flip `USE_MOCK` switch and uncomment axios calls

**Zero UI Changes Needed**: Semua dashboard sudah pakai service layer pattern
