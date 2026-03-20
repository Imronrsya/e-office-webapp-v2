"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Loader2 } from "lucide-react";


function SSOCallbackComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { checkSession, user, loading } = useAuth();

  const [status, setStatus] = useState<"processing" | "error" | "no_role">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Base path from environment variables
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // Exchange raw token for Better Auth cookie
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token SSO tidak ditemukan di URL.");
      return;
    }

    const activate = async () => {
      try {
        // Call set-session to set e-office.session_token cookie
        const res = await fetch(
          `${BASE_PATH}/api/auth/sso/set-session?token=${encodeURIComponent(token)}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Gagal mengaktifkan sesi SSO.");
        }

        // Refresh AuthContext with new session cookie
        await checkSession();
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Terjadi kesalahan saat proses SSO.");
      }
    };

    activate();
  }, [token]);

  // Redirect user based on role once available
  useEffect(() => {
    if (loading || status !== "processing") return;
    if (!user) return; // Tunggu checkSession selesai

    const rawRoles: (string | undefined)[] = user.roles ?? [user.role];
    const roles: string[] = rawRoles.filter((r): r is string => !!r).map((r) => r.toUpperCase());


    // Redirect all known roles to dashboard
    const isKnownRole = roles.some(role => [
      "SUPER_ADMIN", "SUPERADMIN", "MAHASISWA", "DOSEN", "KAPRODI", 
      "ADMIN_PRODI", "KADEP", "ADMIN_FAKULTAS", "DEKAN", 
      "WADEK_1", "WADEK_2", "MANAJER_TU", 
      "SUPERVISOR_AKADEMIK", "SUPERVISOR_SUMBER_DAYA", 
      "STAF_AKADEMIK", "STAF_SUMBER_DAYA", "UPA"
    ].includes(role));

    if (isKnownRole) {
      // Next.js router handles basePath automatically
      router.replace("/dashboard");
    } else {
      setStatus("no_role");
    }
  }, [user, loading, status]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-4">
        <div className="text-red-500 text-xl font-semibold">Gagal Masuk via SSO</div>
        <p className="text-gray-600 max-w-sm">{errorMessage}</p>
        <a
          href={`${BASE_PATH}/login`}
          className="mt-2 text-sm text-blue-600 underline"
        >
          Kembali ke halaman login
        </a>
      </div>
    );
  }

  if (status === "no_role") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-4">
        <div className="text-yellow-600 text-xl font-semibold">Akun Tidak Memiliki Akses</div>
        <p className="text-gray-600 max-w-sm">
          Akun SSO Anda berhasil terverifikasi, namun belum memiliki role yang sesuai di sistem ini.
          Hubungi administrator untuk mendapatkan akses.
        </p>
        <a
          href={`${BASE_PATH}/login`}
          className="mt-2 text-sm text-blue-600 underline"
        >
          Kembali ke halaman login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      <p className="text-gray-600 text-sm">Memproses login SSO, harap tunggu...</p>
    </div>
  );
}

// Wajib di-wrap Suspense karena menggunakan useSearchParams()
export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      }
    >
      <SSOCallbackComponent />
    </Suspense>
  );
}
