"use client";

import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { Loader2 } from "lucide-react";
// =====================================================================
// QUICK LOGIN DEV IMPORT (Hapus import ini untuk production)
// =====================================================================
import QuickLoginDev from "./QuickLoginDev";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Email atau kata sandi salah");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk quick login dari komponen QuickLoginDev
  const handleQuickLoginWrapper = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal masuk");
      throw err; // Re-throw agar QuickLoginDev bisa handle loading state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-gray-50 overflow-hidden">

      {/* Fixed Topnav — logo & institution name, never overlaps content */}
      <header className="shrink-0 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-8 shadow-sm z-50">
        <div className="relative h-9 w-8 sm:h-11 sm:w-9 shrink-0 overflow-hidden">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo-undip.svg`}
            alt="Logo Universitas Diponegoro"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-xs sm:text-sm font-bold leading-tight text-base-black truncate">
            Fakultas Sains dan Matematika
          </span>
          <span className="text-xs sm:text-sm font-normal leading-tight text-base-black truncate">
            Universitas Diponegoro
          </span>
        </div>
      </header>

      {/* Scrollable body — fills remaining height, always scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-6 py-8">
      <div className="flex flex-col items-center gap-4 w-full max-w-5xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
            E-Office ST/SK DEKAN
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-500">
            Masukkan kredensial Anda untuk mengakses akun.
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
                <PasswordInput
                  id="password"
                  placeholder="Masukkan kata sandi"
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
                className="w-full mt-4 bg-base-black hover:bg-base-black/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            {/* ========================================================= */}
            {/* QUICK LOGIN DEV COMPONENT (Hapus untuk production)      */}
            {/* ========================================================= */}
            <QuickLoginDev onLogin={handleQuickLoginWrapper} isLoading={isLoading} />
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">atau</span>
              </div>
            </div>

            <a
              href="https://apps-fsm.undip.ac.id/sso_api/users/login-with-sso-undip"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              {/* Logo UNDIP mini */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#1a56db" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="#1a56db" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Masuk dengan SSO UNDIP
            </a>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
}