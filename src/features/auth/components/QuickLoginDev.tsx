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
import { Zap } from "lucide-react";

// Test accounts for quick login (Development only)
// Sesuai dengan seeder data di src/db/seed.ts

type Account = { role: string; email: string; name: string; prodi?: string };

const TEST_ACCOUNTS: {
  mahasiswa: Account[];
  dosen: Account[];
  kadep: Account[];
  kaprodi: Account[];
  adminProdi: Account[];
  fakultas: Account[];
} = {
  mahasiswa: [
    { role: "MAHASISWA", email: "ahmad.budi@students.undip.ac.id", name: "Ahmad Budi Santoso", prodi: "S1 Informatika" },
    { role: "MAHASISWA", email: "dewi.sartika@students.undip.ac.id", name: "Dewi Sartika", prodi: "S1 Informatika" },
    { role: "MAHASISWA", email: "siti.aminah@students.undip.ac.id", name: "Siti Aminah", prodi: "S1 Biologi" },
    { role: "MAHASISWA", email: "rudi.hartono@students.undip.ac.id", name: "Rudi Hartono", prodi: "S1 Bioteknologi" },
    { role: "MAHASISWA", email: "dewi.lestari@students.undip.ac.id", name: "Dewi Lestari", prodi: "S2 Biologi" },
    { role: "MAHASISWA", email: "budi.prasetyo@students.undip.ac.id", name: "Budi Prasetyo", prodi: "S1 Fisika" },
    { role: "MAHASISWA", email: "andi.wijaya@students.undip.ac.id", name: "Andi Wijaya", prodi: "S2 Fisika" },
    { role: "MAHASISWA", email: "fitri.rahmawati@students.undip.ac.id", name: "Fitri Rahmawati", prodi: "S1 Kimia" },
    { role: "MAHASISWA", email: "hendra.gunawan@students.undip.ac.id", name: "Hendra Gunawan", prodi: "S2 Kimia" },
    { role: "MAHASISWA", email: "rina.susanti@students.undip.ac.id", name: "Rina Susanti", prodi: "S1 Matematika" },
    { role: "MAHASISWA", email: "joko.santoso@students.undip.ac.id", name: "Joko Santoso", prodi: "S2 Matematika" },
    { role: "MAHASISWA", email: "lisa.anggraini@students.undip.ac.id", name: "Lisa Anggraini", prodi: "S1 Statistika" },
  ],
  dosen: [
    { role: "DOSEN", email: "raden.satrio@lecturer.undip.ac.id", name: "Dr. Raden Satrio, M.Kom.", prodi: "S1 Informatika" },
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
  fakultas: [
    { role: "SUPERADMIN", email: "superadmin@fsm.undip.ac.id", name: "Super Admin" },
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
    { role: "UPA", email: "upa@fsm.undip.ac.id", name: "Hendra Wijaya, S.Kom." },
  ],
};

const DEFAULT_PASSWORD = "password1234";

interface QuickLoginDevProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
}

const RoleSection = ({ 
  title, 
  accounts, 
  onLogin, 
  isLoading 
}: { 
  title: string; 
  accounts: Account[];
  onLogin: (email: string) => Promise<void>;
  isLoading: boolean;
}) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-zinc-600">{title}</h3>
    <div className="space-y-1.5">
      {accounts.map((account) => (
        <button
          key={account.email}
          onClick={() => onLogin(account.email)}
          disabled={isLoading}
          className="w-full flex items-start gap-2 px-2 py-1.5 text-left rounded border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 flex-shrink-0 whitespace-nowrap">
            {account.role}
          </span>

          {/* Tampilkan prodi di depan nama untuk mahasiswa, dosen, kaprodi, kadep */}
          {account.prodi && (
            <span className="text-xs text-zinc-500 px-1 py-0.5 rounded whitespace-nowrap">
              {account.prodi}
            </span>
          )}

          <span className="text-xs text-zinc-700 leading-snug">
            {account.name}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default function QuickLoginDev({ onLogin, isLoading = false }: QuickLoginDevProps) {
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const handleQuickLogin = async (email: string) => {
    try {
      setQuickLoginLoading(true);
      await onLogin(email, DEFAULT_PASSWORD);
    } catch (error) {
      console.error("Quick login failed:", error);
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const isDisabled = isLoading || quickLoginLoading;

  return (
    <div className="pt-4 border-t border-zinc-200">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <span className="text-xs font-medium text-zinc-500">Quick Login (Dev Only)</span>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <RoleSection 
          title="Mahasiswa (12)" 
          accounts={TEST_ACCOUNTS.mahasiswa}
          onLogin={handleQuickLogin}
          isLoading={isDisabled}
        />
        
        <RoleSection 
          title="Dosen (1)" 
          accounts={TEST_ACCOUNTS.dosen}
          onLogin={handleQuickLogin}
          isLoading={isDisabled}
        />
        
        <RoleSection 
          title="Kepala Departemen (6)" 
          accounts={TEST_ACCOUNTS.kadep}
          onLogin={handleQuickLogin}
          isLoading={isDisabled}
        />
        
        <RoleSection 
          title="Ketua Program Studi (6)" 
          accounts={TEST_ACCOUNTS.kaprodi}
          onLogin={handleQuickLogin}
          isLoading={isDisabled}
        />
        
        <RoleSection 
          title="Admin Prodi (12)" 
          accounts={TEST_ACCOUNTS.adminProdi}
          onLogin={handleQuickLogin}
          isLoading={isDisabled}
        />
        
        <RoleSection 
          title="Lingkup Fakultas (12)" 
          accounts={TEST_ACCOUNTS.fakultas}
          onLogin={handleQuickLogin}
          isLoading={isDisabled}
        />
      </div>
    </div>
  );
}
