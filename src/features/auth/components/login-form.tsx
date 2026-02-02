"use client";

import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Loader2, Zap } from "lucide-react";

// Test accounts for quick login (Development only)
const TEST_ACCOUNTS = {
  departemen: [
    { role: "MAHASISWA", email: "ahmad.budi@students.undip.ac.id", label: "Ahmad Budi (Mahasiswa)" },
    { role: "MAHASISWA", email: "dewi.sartika@students.undip.ac.id", label: "Dewi Sartika (Mahasiswa)" },
    { role: "DOSEN", email: "raden.satrio@lecturer.undip.ac.id", label: "Dr. Raden Satrio (Dosen)" },
    { role: "KAPRODI", email: "kaprodi.if@undip.ac.id", label: "Kaprodi Informatika" },
    { role: "ADMIN_PRODI", email: "admin.prodi.if@undip.ac.id", label: "Admin Prodi Informatika" },
    { role: "KADEP", email: "kadep.if@undip.ac.id", label: "Kadep Informatika" },
  ],
  fakultas: [
    { role: "ADMIN_FAKULTAS", email: "admin.fakultas@fsm.undip.ac.id", label: "Admin Fakultas" },
    { role: "DEKAN", email: "dekan@fsm.undip.ac.id", label: "Dekan FSM" },
    { role: "WADEK_1", email: "wadek1@fsm.undip.ac.id", label: "Wakil Dekan 1" },
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

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login handler for test accounts
  const handleQuickLogin = async (selectedEmail: string) => {
    if (!selectedEmail) return;
    
    setError(null);
    setQuickLoginLoading(true);

    try {
      await login(selectedEmail, DEFAULT_PASSWORD);
    } catch (err: any) {
      setError(err.response?.data?.error || "Quick login failed");
    } finally {
      setQuickLoginLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 relative overflow-hidden">

      {/* Header Logo */}
      <div className="absolute left-8 top-8 flex items-center gap-3">
        <div className="relative h-12 w-10 overflow-hidden">
          <Image
            src="/logo-undip.svg"
            alt="Logo Universitas Diponegoro"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-sm font-bold leading-tight text-primary-base">
            Fakultas Sains dan Matematika
          </span>
          <span className="text-sm font-normal leading-tight text-primary-base">
            Universitas Diponegoro
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-5xl">
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900 md:text-8xl">
            SK/ST DEKAN
          </h1>
          <p className="text-xl text-gray-500">
            Enter your credentials to access your account.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-lg border-zinc-200">
          <CardHeader className="pb-0">
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 font-medium text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-4 bg-[#2B2B2B] hover:bg-[#2B2B2B]/90 text-white"
                disabled={isLoading || quickLoginLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Quick Login for Testing (Development Only) */}
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
                  <SelectGroup>
                    <SelectLabel className="text-xs text-zinc-400">— Lingkup Departemen —</SelectLabel>
                    {TEST_ACCOUNTS.departemen.map((account) => (
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
                  <SelectGroup>
                    <SelectLabel className="text-xs text-zinc-400">— Lingkup Fakultas —</SelectLabel>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}