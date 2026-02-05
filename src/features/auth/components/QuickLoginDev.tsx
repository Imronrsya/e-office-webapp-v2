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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap } from "lucide-react";

// Test accounts for quick login (Development only)
const TEST_ACCOUNTS = {
  mahasiswa: [
    // Informatika (2 accounts)
    { role: "MAHASISWA", email: "ahmad.budi@students.undip.ac.id", label: "Ahmad Budi Santoso (S1 Informatika)" },
    { role: "MAHASISWA", email: "dewi.sartika@students.undip.ac.id", label: "Dewi Sartika (S1 Informatika)" },
    
    // Biologi (3 accounts - S1, S1 Biotek, S2)
    { role: "MAHASISWA", email: "siti.aminah@students.undip.ac.id", label: "Siti Aminah (S1 Biologi)" },
    { role: "MAHASISWA", email: "rudi.hartono@students.undip.ac.id", label: "Rudi Hartono (S1 Bioteknologi)" },
    { role: "MAHASISWA", email: "dewi.lestari@students.undip.ac.id", label: "Dewi Lestari (S2 Biologi)" },
    
    // Fisika (2 accounts - S1, S2)
    { role: "MAHASISWA", email: "budi.prasetyo@students.undip.ac.id", label: "Budi Prasetyo (S1 Fisika)" },
    { role: "MAHASISWA", email: "andi.wijaya@students.undip.ac.id", label: "Andi Wijaya (S2 Fisika)" },
    
    // Kimia (2 accounts - S1, S2)
    { role: "MAHASISWA", email: "fitri.rahmawati@students.undip.ac.id", label: "Fitri Rahmawati (S1 Kimia)" },
    { role: "MAHASISWA", email: "hendra.gunawan@students.undip.ac.id", label: "Hendra Gunawan (S2 Kimia)" },
    
    // Matematika (2 accounts - S1, S2)
    { role: "MAHASISWA", email: "rina.susanti@students.undip.ac.id", label: "Rina Susanti (S1 Matematika)" },
    { role: "MAHASISWA", email: "joko.santoso@students.undip.ac.id", label: "Joko Santoso (S2 Matematika)" },
    
    // Statistika (1 account)
    { role: "MAHASISWA", email: "lisa.anggraini@students.undip.ac.id", label: "Lisa Anggraini (S1 Statistika)" },
  ],
  dosen: [
    { role: "DOSEN", email: "raden.satrio@lecturer.undip.ac.id", label: "Dr. Raden Satrio (Dosen)" },
  ],
  kadep: [
    { role: "KADEP", email: "kadep.matematika@fsm.undip.ac.id", label: "Dr. Susilo Hariyanto (Kadep Matematika)" },
    { role: "KADEP", email: "kadep.biologi@fsm.undip.ac.id", label: "Prof. Sapto Purnomo Putro (Kadep Biologi)" },
    { role: "KADEP", email: "kadep.fisika@fsm.undip.ac.id", label: "Prof. Heri Sutanto (Kadep Fisika)" },
    { role: "KADEP", email: "kadep.kimia@fsm.undip.ac.id", label: "Adi Darmawan (Kadep Kimia)" },
    { role: "KADEP", email: "kadep.statistika@fsm.undip.ac.id", label: "Dr. Tarno (Kadep Statistika)" },
    { role: "KADEP", email: "kadep.informatika@fsm.undip.ac.id", label: "Dr. Aris Sugiharto (Kadep Informatika)" },
  ],
  kaprodi: [
    { role: "KAPRODI", email: "kaprodi.s2.matematika@fsm.undip.ac.id", label: "Dr. Widowati (Kaprodi S2 Matematika)" },
    { role: "KAPRODI", email: "kaprodi.s1.bioteknologi@fsm.undip.ac.id", label: "Dr. Nur Rahmawati Arfah (Kaprodi S1 Bioteknologi)" },
    { role: "KAPRODI", email: "kaprodi.s2.biologi@fsm.undip.ac.id", label: "Dr. Sri Widodo Agung Suedy (Kaprodi S2 Biologi)" },
    { role: "KAPRODI", email: "kaprodi.s2.fisika@fsm.undip.ac.id", label: "Dr. Budi Astuti (Kaprodi S2 Fisika)" },
    { role: "KAPRODI", email: "kaprodi.profesi.fisikawanmedik@fsm.undip.ac.id", label: "Dr. Suryono (Kaprodi Profesi Fisikawan Medik)" },
    { role: "KAPRODI", email: "kaprodi.s2.kimia@fsm.undip.ac.id", label: "Dr. Adi Darmawan (Kaprodi S2 Kimia)" },
  ],
  adminProdi: [
    { role: "ADMIN_PRODI", email: "admin.s1.matematika@fsm.undip.ac.id", label: "Admin S1 Matematika" },
    { role: "ADMIN_PRODI", email: "admin.s2.matematika@fsm.undip.ac.id", label: "Admin S2 Matematika" },
    { role: "ADMIN_PRODI", email: "admin.s1.biologi@fsm.undip.ac.id", label: "Admin S1 Biologi" },
    { role: "ADMIN_PRODI", email: "admin.s1.bioteknologi@fsm.undip.ac.id", label: "Admin S1 Bioteknologi" },
    { role: "ADMIN_PRODI", email: "admin.s2.biologi@fsm.undip.ac.id", label: "Admin S2 Biologi" },
    { role: "ADMIN_PRODI", email: "admin.s1.fisika@fsm.undip.ac.id", label: "Admin S1 Fisika" },
    { role: "ADMIN_PRODI", email: "admin.s2.fisika@fsm.undip.ac.id", label: "Admin S2 Fisika" },
    { role: "ADMIN_PRODI", email: "admin.profesi.fisikawanmedik@fsm.undip.ac.id", label: "Admin Profesi Fisikawan Medik" },
    { role: "ADMIN_PRODI", email: "admin.s1.kimia@fsm.undip.ac.id", label: "Admin S1 Kimia" },
    { role: "ADMIN_PRODI", email: "admin.s2.kimia@fsm.undip.ac.id", label: "Admin S2 Kimia" },
    { role: "ADMIN_PRODI", email: "admin.s1.statistika@fsm.undip.ac.id", label: "Admin S1 Statistika" },
    { role: "ADMIN_PRODI", email: "admin.s1.informatika@fsm.undip.ac.id", label: "Admin S1 Informatika" },
  ],
  fakultas: [
    { role: "ADMIN_FAKULTAS", email: "admin.fakultas@fsm.undip.ac.id", label: "Admin Fakultas" },
    { role: "DEKAN", email: "dekan@fsm.undip.ac.id", label: "Prof. Kusworo Adi (Dekan FSM)" },
    { role: "WADEK_1", email: "wadek1@fsm.undip.ac.id", label: "Dr. Ngadiwiyana (Wakil Dekan 1)" },
    { role: "WADEK_2", email: "wadek2@fsm.undip.ac.id", label: "Wakil Dekan 2" },
    { role: "MANAJER_TU", email: "manajer.tu@fsm.undip.ac.id", label: "Manajer TU" },
    { role: "SUPERVISOR_AKADEMIK", email: "spv.akademik@fsm.undip.ac.id", label: "Supervisor Akademik" },
    { role: "SUPERVISOR_SUMBER_DAYA", email: "spv.sumberdaya@fsm.undip.ac.id", label: "Supervisor Sumber Daya" },
    { role: "STAF_AKADEMIK", email: "staf.akademik1@fsm.undip.ac.id", label: "Staf Akademik" },
    { role: "STAF_SUMBER_DAYA", email: "staf.sumberdaya@fsm.undip.ac.id", label: "Staf Sumber Daya" },
    { role: "UPA", email: "upa@fsm.undip.ac.id", label: "UPA" },
  ],
};

const DEFAULT_PASSWORD = "password1234";

interface QuickLoginDevProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
}

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

  return (
    <div className="pt-4 border-t border-zinc-200">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-medium text-zinc-500">Quick Login (Dev Only)</span>
      </div>
      <Select 
        onValueChange={handleQuickLogin} 
        disabled={isLoading || quickLoginLoading}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder={quickLoginLoading ? "Logging in..." : "Pilih akun untuk login cepat"} />
        </SelectTrigger>
        <SelectContent>
          {/* Mahasiswa Section */}
          <SelectGroup>
            <SelectLabel className="text-xs text-zinc-400">— Mahasiswa (12) —</SelectLabel>
            {TEST_ACCOUNTS.mahasiswa.map((account) => (
              <SelectItem key={account.email} value={account.email}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {account.role}
                  </span>
                  <span className="text-sm">{account.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {/* Dosen Section */}
          <SelectGroup>
            <SelectLabel className="text-xs text-zinc-400">— Dosen (1) —</SelectLabel>
            {TEST_ACCOUNTS.dosen.map((account) => (
              <SelectItem key={account.email} value={account.email}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {account.role}
                  </span>
                  <span className="text-sm">{account.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {/* Kepala Departemen Section */}
          <SelectGroup>
            <SelectLabel className="text-xs text-zinc-400">— Kepala Departemen (6) —</SelectLabel>
            {TEST_ACCOUNTS.kadep.map((account) => (
              <SelectItem key={account.email} value={account.email}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {account.role}
                  </span>
                  <span className="text-sm">{account.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {/* Ketua Program Studi Section */}
          <SelectGroup>
            <SelectLabel className="text-xs text-zinc-400">— Ketua Program Studi (6) —</SelectLabel>
            {TEST_ACCOUNTS.kaprodi.map((account) => (
              <SelectItem key={account.email} value={account.email}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {account.role}
                  </span>
                  <span className="text-sm">{account.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {/* Admin Prodi Section */}
          <SelectGroup>
            <SelectLabel className="text-xs text-zinc-400">— Admin Prodi (12) —</SelectLabel>
            {TEST_ACCOUNTS.adminProdi.map((account) => (
              <SelectItem key={account.email} value={account.email}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {account.role}
                  </span>
                  <span className="text-sm">{account.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {/* Lingkup Fakultas Section */}
          <SelectGroup>
            <SelectLabel className="text-xs text-zinc-400">— Lingkup Fakultas (10) —</SelectLabel>
            {TEST_ACCOUNTS.fakultas.map((account) => (
              <SelectItem key={account.email} value={account.email}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                    {account.role}
                  </span>
                  <span className="text-sm">{account.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
