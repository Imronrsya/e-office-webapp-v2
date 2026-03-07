/**
 * ====================================================================
 * QUICK LOGIN COMPONENT FOR DEVELOPMENT TESTING ONLY
 * ====================================================================
 * 
 * This component provides quick login functionality for all test accounts
 * during development. It should be REMOVED in production deployment.
 * 
 * To remove this feature for production:
 * 1. Delete this file (QuickLoginDev.tsx)
 * 2. Remove the import and usage in login-form.tsx
 * 
 * All test accounts use the password: "password1234"
 * ====================================================================
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Test accounts for quick login (Development only)
// Sesuai dengan seeder data di src/db/seed.ts

// Mapping dari role key ke label formal
const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN_FAKULTAS: "Admin Fakultas",
  DEKAN: "Dekan",
  WADEK_1: "Wakil Dekan I",
  WADEK_2: "Wakil Dekan II",
  MANAJER_TU: "Manajer Tata Usaha",
  SUPERVISOR_AKADEMIK: "Supervisor Akademik",
  SUPERVISOR_SUMBER_DAYA: "Supervisor Sumberdaya",
  STAF_AKADEMIK: "Staf Akademik",
  STAF_SUMBER_DAYA: "Staf Sumberdaya",
  UPA: "Unit Pelaksana Akademik",
  DOSEN: "Dosen",
  MAHASISWA: "Mahasiswa",
  KADEP: "Ketua Departemen",
  KAPRODI: "Ketua Program Studi",
  ADMIN_PRODI: "Admin Program Studi",
};

type Account = { role: string; email: string; name: string; prodi?: string };

const TEST_ACCOUNTS: {
  superadmin: Account[];
  mahasiswa: Account[];
  dosen: Account[];
  kadep: Account[];
  kaprodi: Account[];
  adminProdi: Account[];
  fakultas: Account[];
} = {
  superadmin: [
    { role: "SUPERADMIN", email: "superadmin@fsm.undip.ac.id", name: "Super Admin" },
  ],
  mahasiswa: [
    { role: "MAHASISWA", email: "ahmad.budi@students.undip.ac.id", name: "Ahmad Budi Santoso", prodi: "S1 Informatika" },
    { role: "MAHASISWA", email: "dewi.sartika@students.undip.ac.id", name: "Dewi Sartika", prodi: "S1 Informatika" },
    { role: "MAHASISWA", email: "siti.aminah@students.undip.ac.id", name: "Siti Aminah", prodi: "S1 Biologi" },
    { role: "MAHASISWA", email: "rudi.hartono@students.undip.ac.id", name: "Rudi Hartono", prodi: "S1 Bioteknologi" },
    { role: "MAHASISWA", email: "dewi.lestari@students.undip.ac.id", name: "Dewi Lestari", prodi: "S2 Biologi" },
    { role: "MAHASISWA", email: "budi.prasetyo@students.undip.ac.id", name: "Budi Prasetyo", prodi: "S1 Fisika" },
    { role: "MAHASISWA", email: "andi.wijaya@students.undip.ac.id", name: "Andi Wijaya", prodi: "S2 Fisika" },
    { role: "MAHASISWA", email: "fikri.maulana@students.undip.ac.id", name: "Fikri Maulana", prodi: "Profesi Fisikawan Medik" },
    { role: "MAHASISWA", email: "fitri.rahmawati@students.undip.ac.id", name: "Fitri Rahmawati", prodi: "S1 Kimia" },
    { role: "MAHASISWA", email: "hendra.gunawan@students.undip.ac.id", name: "Hendra Gunawan", prodi: "S2 Kimia" },
    { role: "MAHASISWA", email: "rina.susanti@students.undip.ac.id", name: "Rina Susanti", prodi: "S1 Matematika" },
    { role: "MAHASISWA", email: "joko.santoso@students.undip.ac.id", name: "Joko Santoso", prodi: "S2 Matematika" },
    { role: "MAHASISWA", email: "lisa.anggraini@students.undip.ac.id", name: "Lisa Anggraini", prodi: "S1 Statistika" },
  ],
  dosen: [
    { role: "DOSEN", email: "raden.satrio@lecturer.undip.ac.id", name: "Dr. Raden Satrio, M.Kom.", prodi: "S1 Informatika" },
    { role: "DOSEN", email: "widowati@lecturer.undip.ac.id", name: "Dr. Widowati, S.Si., M.Si.", prodi: "S1 Matematika" },
    { role: "DOSEN", email: "agung.suprihadi@lecturer.undip.ac.id", name: "Dr. Agung Suprihadi, S.Si., M.Si.", prodi: "S1 Biologi" },
    { role: "DOSEN", email: "endang.kusdiyantini@lecturer.undip.ac.id", name: "Dr. Endang Kusdiyantini, DEA.", prodi: "S1 Bioteknologi" },
    { role: "DOSEN", email: "sri.darwati@lecturer.undip.ac.id", name: "Dr. Sri Darwati, S.Si., M.Si.", prodi: "S2 Biologi" },
    { role: "DOSEN", email: "ainie.khuriati@lecturer.undip.ac.id", name: "Dr. Ainie Khuriati R.S., S.Si., M.Si.", prodi: "S1 Fisika" },
    { role: "DOSEN", email: "suryono@lecturer.undip.ac.id", name: "Prof. Dr. Suryono, S.Si., M.Si.", prodi: "S2 Fisika" },
    { role: "DOSEN", email: "pandji.triadyaksa@lecturer.undip.ac.id", name: "Pandji Triadyaksa, S.Si., M.Sc.", prodi: "Profesi Fisikawan Medik" },
    { role: "DOSEN", email: "khairul.anam@lecturer.undip.ac.id", name: "Dr. Khairul Anam, S.Si., M.Si.", prodi: "S1 Kimia" },
    { role: "DOSEN", email: "retno.ariadi@lecturer.undip.ac.id", name: "Dr. Retno Ariadi Lusiana, S.Si., M.Si.", prodi: "S2 Kimia" },
    { role: "DOSEN", email: "mustafid@lecturer.undip.ac.id", name: "Dr. Mustafid, M.Eng.", prodi: "S1 Statistika" },
    { role: "DOSEN", email: "farikhin@lecturer.undip.ac.id", name: "Dr. Farikhin, S.Si., M.Si.", prodi: "S2 Matematika" },
  ],
  kadep: [
    { role: "KADEP", email: "kadep.matematika@fsm.undip.ac.id", name: "Dr. Susilo Hariyanto, S.Si., M.Si.", prodi: "S1 Matematika" },
    { role: "KADEP", email: "kadep.biologi@fsm.undip.ac.id", name: "Prof. Drs. Sapto Purnomo Putro, M.Si., Ph.D.", prodi: "S1 Biologi" },
    { role: "KADEP", email: "kadep.fisika@fsm.undip.ac.id", name: "Prof. Dr. Heri Sutanto, S.Si., M.Si.", prodi: "S1 Fisika" },
    { role: "KADEP", email: "kadep.kimia@fsm.undip.ac.id", name: "Adi Darmawan, S.Si., M.Si., Ph.D.", prodi: "S1 Kimia" },
    { role: "KADEP", email: "kadep.statistika@fsm.undip.ac.id", name: "Dr. Drs. Tarno, M.Si.", prodi: "S1 Statistika" },
    { role: "KADEP", email: "kadep.informatika@fsm.undip.ac.id", name: "Dr. Aris Sugiharto, S.Si., M.Kom.", prodi: "S1 Informatika" },
  ],
  kaprodi: [
    { role: "KAPRODI", email: "kaprodi.s2.matematika@fsm.undip.ac.id", name: "Dr. Lucia Ratnasari, S.Si., M.Si.", prodi: "S2 Matematika" },
    { role: "KAPRODI", email: "kaprodi.s1.bioteknologi@fsm.undip.ac.id", name: "Dr. Sri Pujiyanto, S.Si., M.Si.", prodi: "S1 Bioteknologi" },
    { role: "KAPRODI", email: "kaprodi.s2.biologi@fsm.undip.ac.id", name: "Prof. Dr. Dra. Erma Prihastanti, M.Si.", prodi: "S2 Biologi" },
    { role: "KAPRODI", email: "kaprodi.s2.fisika@fsm.undip.ac.id", name: "Dr. Eng. Eko Hidayanto, S.Si., M.Si.", prodi: "S2 Fisika" },
    { role: "KAPRODI", email: "kaprodi.profesi.fisikawanmedik@fsm.undip.ac.id", name: "Dr. Choirul Anam, S.Si., M.Si., F.Med.", prodi: "Profesi Fisikawan Medik" },
    { role: "KAPRODI", email: "kaprodi.s2.kimia@fsm.undip.ac.id", name: "Drs. Gunawan, M.Si., Ph.D.", prodi: "S2 Kimia" },
  ],
  adminProdi: [
    { role: "ADMIN_PRODI", email: "admin.s1.matematika@fsm.undip.ac.id", name: "Admin Prodi S1 Matematika" },
    { role: "ADMIN_PRODI", email: "admin.s2.matematika@fsm.undip.ac.id", name: "Admin Prodi S2 Matematika" },
    { role: "ADMIN_PRODI", email: "admin.s1.biologi@fsm.undip.ac.id", name: "Admin Prodi S1 Biologi" },
    { role: "ADMIN_PRODI", email: "admin.s1.bioteknologi@fsm.undip.ac.id", name: "Admin Prodi S1 Bioteknologi" },
    { role: "ADMIN_PRODI", email: "admin.s2.biologi@fsm.undip.ac.id", name: "Admin Prodi S2 Biologi" },
    { role: "ADMIN_PRODI", email: "admin.s1.fisika@fsm.undip.ac.id", name: "Admin Prodi S1 Fisika" },
    { role: "ADMIN_PRODI", email: "admin.s2.fisika@fsm.undip.ac.id", name: "Admin Prodi S2 Fisika" },
    { role: "ADMIN_PRODI", email: "admin.profesi.fisikawanmedik@fsm.undip.ac.id", name: "Admin Prodi Profesi Fisikawan Medik" },
    { role: "ADMIN_PRODI", email: "admin.s1.kimia@fsm.undip.ac.id", name: "Admin Prodi S1 Kimia" },
    { role: "ADMIN_PRODI", email: "admin.s2.kimia@fsm.undip.ac.id", name: "Admin Prodi S2 Kimia" },
    { role: "ADMIN_PRODI", email: "admin.s1.statistika@fsm.undip.ac.id", name: "Admin Prodi S1 Statistika" },
    { role: "ADMIN_PRODI", email: "admin.s1.informatika@fsm.undip.ac.id", name: "Admin Prodi S1 Informatika" },
  ],
  // Lingkup Fakultas (tanpa Super Admin)
  fakultas: [
    { role: "ADMIN_FAKULTAS", email: "admin.fakultas@fsm.undip.ac.id", name: "Bambang Wicaksono, S.E." },
    { role: "DEKAN", email: "dekan@fsm.undip.ac.id", name: "Prof. Dr. Kusworo Adi, S.Si., M.T." },
    { role: "WADEK_1", email: "wadek1@fsm.undip.ac.id", name: "Dr. Ngadiwiyana, S.Si., M.Si." },
    { role: "WADEK_2", email: "wadek2@fsm.undip.ac.id", name: "Dr. Eng. Adi Wibowo, S.Si., M.Kom." },
    { role: "MANAJER_TU", email: "manajer.tu@fsm.undip.ac.id", name: "Lilik Maryuni, S.E., M.Si." },
    { role: "SUPERVISOR_AKADEMIK", email: "spv.akademik@fsm.undip.ac.id", name: "Umi Arbiati, S.Kom." },
    { role: "SUPERVISOR_SUMBER_DAYA", email: "spv.sumberdaya@fsm.undip.ac.id", name: "Awang Kurnia Saputra, S.Kom." },
    { role: "STAF_AKADEMIK", email: "staf.akademik1@fsm.undip.ac.id", name: "Rina Oktavia, A.Md." },
    { role: "STAF_AKADEMIK", email: "staf.akademik2@fsm.undip.ac.id", name: "Budi Hartono, A.Md." },
    { role: "STAF_SUMBER_DAYA", email: "staf.sumberdaya@fsm.undip.ac.id", name: "Yuni Astuti, A.Md." },
    { role: "STAF_SUMBER_DAYA", email: "staf.sumberdaya2@fsm.undip.ac.id", name: "Sari Dewi, A.Md." },
    { role: "UPA", email: "upa@fsm.undip.ac.id", name: "Hendra Wijaya, S.Kom." },
  ],
};

const DEFAULT_PASSWORD = "password1234";

// Category definitions for the sidebar
// Split mahasiswa & adminProdi into S1/S2 sub-categories
const DERIVED_ACCOUNTS = {
  superadmin: TEST_ACCOUNTS.superadmin,
  mahasiswaS1: TEST_ACCOUNTS.mahasiswa.filter((a) => a.prodi?.startsWith("S1")),
  mahasiswaS2: TEST_ACCOUNTS.mahasiswa.filter((a) => a.prodi?.startsWith("S2") || a.prodi?.startsWith("Profesi")),
  dosen: TEST_ACCOUNTS.dosen,
  kadep: TEST_ACCOUNTS.kadep,
  kaprodi: TEST_ACCOUNTS.kaprodi,
  adminProdiS1: TEST_ACCOUNTS.adminProdi.filter((a) => a.email.includes(".s1.")),
  adminProdiS2: TEST_ACCOUNTS.adminProdi.filter((a) => a.email.includes(".s2.") || a.email.includes(".profesi.")),
  fakultas: TEST_ACCOUNTS.fakultas,
};

type CategoryKey = keyof typeof DERIVED_ACCOUNTS;

const CATEGORIES: { key: CategoryKey; label: string; count: number }[] = [
  { key: "superadmin", label: "Super Admin", count: DERIVED_ACCOUNTS.superadmin.length },
  { key: "mahasiswaS1", label: "Mahasiswa S1", count: DERIVED_ACCOUNTS.mahasiswaS1.length },
  { key: "mahasiswaS2", label: "Mahasiswa S2", count: DERIVED_ACCOUNTS.mahasiswaS2.length },
  { key: "dosen", label: "Dosen", count: DERIVED_ACCOUNTS.dosen.length },
  { key: "kadep", label: "Ketua Departemen", count: DERIVED_ACCOUNTS.kadep.length },
  { key: "kaprodi", label: "Ketua Program Studi", count: DERIVED_ACCOUNTS.kaprodi.length },
  { key: "adminProdiS1", label: "Admin Program Studi S1", count: DERIVED_ACCOUNTS.adminProdiS1.length },
  { key: "adminProdiS2", label: "Admin Program Studi S2", count: DERIVED_ACCOUNTS.adminProdiS2.length },
  { key: "fakultas", label: "Lingkup Fakultas", count: DERIVED_ACCOUNTS.fakultas.length },
];

interface QuickLoginDevProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
}

export default function QuickLoginDev({ onLogin, isLoading = false }: QuickLoginDevProps) {
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("mahasiswaS1");

  const handleQuickLogin = async (email: string) => {
    try {
      setQuickLoginLoading(true);
      await onLogin(email, DEFAULT_PASSWORD);
      setDialogOpen(false);
    } catch (error) {
      console.error("Quick login failed:", error);
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const isDisabled = isLoading || quickLoginLoading;
  const activeAccounts = DERIVED_ACCOUNTS[selectedCategory];

  return (
    <div className="pt-4 border-t border-zinc-200">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-dashed border-zinc-300 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 hover:border-zinc-400"
        onClick={() => setDialogOpen(true)}
        disabled={isDisabled}
      >
        Masuk Cepat
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden" hideCloseButton={false}>
          <DialogHeader className="px-4 pt-5 pb-3 border-b border-zinc-200">
            <DialogTitle className="text-base">
              Masuk Cepat (Mode Dev)
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Pilih akun untuk masuk otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex" style={{ height: "520px" }}>
            {/* Sidebar */}
            <div className="w-[200px] flex-shrink-0 border-r border-zinc-200 bg-zinc-50 overflow-y-auto">
              <nav className="flex flex-col gap-0.5 p-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`
                      text-left px-3 py-2 text-sm rounded-lg transition-colors text-base-black
                      ${selectedCategory === cat.key
                        ? "bg-zinc-200/70"
                        : "hover:bg-zinc-100"
                      }
                    `}
                  >
                    <span className="block leading-snug">{cat.label}</span>
                    <span className="text-xs text-zinc-400">
                      {cat.count} akun
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Panel */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {activeAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleQuickLogin(account.email)}
                    disabled={isDisabled}
                    className="w-full flex flex-col gap-0.5 px-3 py-2.5 text-left rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="text-sm text-zinc-800">
                      {account.name}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {ROLE_LABELS[account.role] ?? account.role}{account.prodi && ` • ${account.prodi}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
