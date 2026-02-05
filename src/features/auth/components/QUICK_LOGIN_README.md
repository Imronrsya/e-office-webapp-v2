# Quick Login Feature - Development Only

## ⚠️ PENTING: HAPUS UNTUK PRODUCTION

Fitur Quick Login ini hanya untuk development/testing dan **HARUS DIHAPUS** sebelum deploy ke production.

## 📋 Apa itu Quick Login?

Quick Login adalah komponen yang memungkinkan developer untuk login cepat menggunakan akun test yang sudah di-seed ke database, tanpa perlu mengetik email dan password secara manual.

### Akun yang Tersedia:
- **Mahasiswa (12)**: Dari berbagai departemen (Informatika, Biologi, Fisika, Kimia, Matematika, Statistika)
- **Dosen (1)**: Dr. Raden Satrio
- **Kepala Departemen (6)**: Semua departemen
- **Ketua Program Studi (6)**: S2 Matematika, S1/S2 Biologi, S2 Fisika, Profesi Fisikawan Medik, S2 Kimia
- **Admin Prodi (12)**: Semua program studi
- **Lingkup Fakultas (10)**: Admin Fakultas, Dekan, Wadek, Manajer TU, Supervisor, Staff, UPA

**Password semua akun**: `password1234`

## 🗑️ Cara Menghapus untuk Production

### Langkah 1: Hapus File QuickLoginDev.tsx
```bash
# Di folder: e-office-webapp-v2/src/features/auth/components/
rm QuickLoginDev.tsx
```

### Langkah 2: Edit login-form.tsx
Buka file: `e-office-webapp-v2/src/features/auth/components/login-form.tsx`

**Hapus import QuickLoginDev** (baris 11-13):
```typescript
// =====================================================================
// QUICK LOGIN DEV IMPORT (Hapus import ini untuk production)
// =====================================================================
import QuickLoginDev from "./QuickLoginDev";
```

**Hapus handler wrapper** (baris 43-53):
```typescript
// Handler untuk quick login dari komponen QuickLoginDev
const handleQuickLoginWrapper = async (email: string, password: string) => {
  setError(null);
  setIsLoading(true);
  try {
    await login(email, password);
  } catch (err: any) {
    setError(err.response?.data?.error || "Quick login failed");
    throw err; // Re-throw agar QuickLoginDev bisa handle loading state
  } finally {
    setIsLoading(false);
  }
};
```

**Hapus penggunaan komponen** (cari dan hapus sekitar baris 140-143):
```tsx
{/* ========================================================= */}
{/* QUICK LOGIN DEV COMPONENT (Hapus untuk production)      */}
{/* ========================================================= */}
<QuickLoginDev onLogin={handleQuickLoginWrapper} isLoading={isLoading} />
```

### Langkah 3: Hapus file dokumentasi ini
```bash
# Di folder: e-office-webapp-v2/src/features/auth/components/
rm QUICK_LOGIN_README.md
```

## ✅ Verifikasi Penghapusan

Setelah menghapus, pastikan:
1. ✅ File `QuickLoginDev.tsx` sudah tidak ada
2. ✅ File `QUICK_LOGIN_README.md` sudah tidak ada
3. ✅ Tidak ada import atau referensi ke `QuickLoginDev` di `login-form.tsx`
4. ✅ Login page masih berfungsi normal (hanya form email/password biasa)
5. ✅ Tidak ada error saat build: `npm run build`

## 📝 Catatan Tambahan

### Mengapa harus dihapus?
1. **Keamanan**: Expose semua email akun test dan pattern password
2. **User Experience**: User production tidak perlu melihat fitur testing
3. **Code Cleanliness**: Production code harus bersih dari development utilities

### Alternatif untuk Production Testing
Jika tetap perlu testing di production, gunakan:
- Environment variables untuk enable/disable feature
- Conditional rendering based on `process.env.NODE_ENV`
- Separate testing environment (staging)

### File Structure Setelah Dihapus
```
e-office-webapp-v2/src/features/auth/components/
├── login-form.tsx         ← Hanya form login biasa
└── (QuickLoginDev.tsx dihapus)
└── (QUICK_LOGIN_README.md dihapus)
```

## 🔐 Keamanan

**JANGAN PERNAH**:
- ❌ Deploy fitur quick login ke production
- ❌ Commit credentials atau password dalam code
- ❌ Menggunakan password yang sama untuk production

**SELALU**:
- ✅ Review code sebelum deploy
- ✅ Gunakan environment variables untuk credentials
- ✅ Enable proper authentication di production
- ✅ Hapus semua development utilities sebelum deploy

---

**Dibuat**: ${new Date().toISOString().split('T')[0]}  
**Untuk**: E-Office FSM UNDIP Development Team  
**Status**: 🔴 DEVELOPMENT ONLY - REMOVE BEFORE PRODUCTION
