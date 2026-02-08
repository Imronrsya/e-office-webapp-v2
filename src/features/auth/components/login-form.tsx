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
      setError(err.response?.data?.error || "Email atau kata sandi salah");
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
          <span className="text-sm font-bold leading-tight text-base-black">
            Fakultas Sains dan Matematika
          </span>
          <span className="text-sm font-normal leading-tight text-base-black">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}