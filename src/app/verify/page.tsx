"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { XCircle, AlertCircle, Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface DocumentVerification {
  nomorSurat: string;
  tanggalSurat: string;
  perihal: string;
  jenisDocument: string;
  penandatangan: Array<{
    nama: string;
    jabatan: string;
  }>;
  pemohon: {
    nama: string;
    nim?: string;
  };
  dibuatPada: string;
}

interface VerificationResult {
  valid: boolean;
  status: "VERIFIED" | "NOT_FOUND" | "INVALID_TOKEN" | "EXPIRED";
  message: string;
  data?: DocumentVerification;
}

// ============================================================================
// VERIFIED CHECK ICON — decorative rings + check
// ============================================================================

function VerifiedIcon({ size = 96 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer orbit ring */}
      <svg
        className="absolute inset-0 animate-[spin_20s_linear_infinite]"
        viewBox="0 0 96 96"
        fill="none"
      >
        <circle cx="48" cy="48" r="46" stroke="#2B2B2B" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.15" />
        <circle cx="48" cy="2" r="2.5" fill="#2B2B2B" opacity="0.2" />
        <circle cx="94" cy="48" r="2" fill="#2B2B2B" opacity="0.12" />
        <circle cx="48" cy="94" r="1.5" fill="#2B2B2B" opacity="0.1" />
      </svg>

      {/* Middle ring */}
      <svg
        className="absolute inset-0 animate-[spin_30s_linear_infinite_reverse]"
        viewBox="0 0 96 96"
        fill="none"
      >
        <circle cx="48" cy="48" r="38" stroke="#2B2B2B" strokeWidth="0.5" strokeDasharray="3 8" opacity="0.1" />
        <circle cx="10" cy="48" r="2" fill="#2B2B2B" opacity="0.15" />
      </svg>

      {/* Center circle with check */}
      <div
        className="absolute rounded-full bg-base-black flex items-center justify-center shadow-lg"
        style={{
          width: size * 0.52,
          height: size * 0.52,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: size * 0.24, height: size * 0.24 }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Small floating accent dot */}
      <div
        className="absolute w-2 h-2 rounded-full bg-base-black opacity-20"
        style={{ top: "18%", right: "12%" }}
      />
    </div>
  );
}

// ============================================================================
// PAGE SHELL — gray bg + logo top-right + centered white card
// ============================================================================

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-neutral-100 relative flex flex-col items-center justify-center p-4">
      {/* Institution header — top left */}
      <div className="absolute top-5 left-5">
        <InstitutionHeader />
      </div>

      {/* White card with elevation */}
      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-gray-100/80 w-full max-w-md overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// INSTITUTION HEADER (inside card)
// ============================================================================

function InstitutionHeader() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative h-9 w-7 overflow-hidden shrink-0">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo-undip.svg`}
          alt="Logo Universitas Diponegoro"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-xs font-bold leading-tight text-base-black">
          Fakultas Sains dan Matematika
        </span>
        <span className="text-[11px] font-normal leading-tight text-base-gray">
          Universitas Diponegoro
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function LoadingState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center px-8 py-16">
        <div className="mt-0 text-center">
          <Loader2 className="w-10 h-10 text-base-black animate-spin mx-auto mb-5" />
          <p className="text-sm font-medium text-base-black">Memverifikasi Dokumen</p>
          <p className="text-xs text-base-gray mt-1">Mohon tunggu sebentar...</p>
        </div>
      </div>
    </PageShell>
  );
}

// ============================================================================
// VERIFICATION CONTENT COMPONENT
// ============================================================================

function VerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyDocument = async () => {
      if (!token) {
        setError("Token verifikasi tidak ditemukan. Silakan scan ulang QR Code.");
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl = getApiUrl();
        const response = await fetch(
          `${apiUrl}/verification/verify?token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          throw new Error("Gagal memverifikasi dokumen");
        }

        const data: VerificationResult = await response.json();
        setResult(data);
      } catch (err) {
        console.error("Verification error:", err);
        setError("Terjadi kesalahan saat memverifikasi dokumen. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyDocument();
  }, [token]);

  if (isLoading) return <LoadingState />;

  // ── Error state ─────────────────────────────────────────────────────
  if (error) {
    return (
      <PageShell>
        <div className="flex flex-col items-center px-8 py-12">
          <div className="mt-0 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-lg font-semibold text-base-black mb-2">Verifikasi Gagal</p>
            <p className="text-sm text-base-gray leading-relaxed">{error}</p>
            <div className="mt-8 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-base-gray">Hubungi kami jika masalah berlanjut</p>
              <p className="text-xs font-medium text-base-black mt-1">tu@fsm.undip.ac.id</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Invalid / Not Found ─────────────────────────────────────────────
  if (result && !result.valid) {
    const statusLabel =
      result.status === "NOT_FOUND"
        ? "Tidak Ditemukan"
        : result.status === "INVALID_TOKEN"
          ? "Token Tidak Valid"
          : "Kedaluwarsa";

    return (
      <PageShell>
        <div className="flex flex-col items-center px-8 py-12">
          <div className="mt-0 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-lg font-semibold text-base-black mb-1">Dokumen Tidak Valid</p>
            <span className="inline-block text-[11px] font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full mt-1">
              {statusLabel}
            </span>
            <p className="text-sm text-base-gray leading-relaxed mt-4">{result.message}</p>

            <div className="mt-8 pt-5 border-t border-gray-100 text-center space-y-1">
              <p className="text-xs text-base-gray">Jika Anda yakin dokumen ini asli, hubungi:</p>
              <p className="text-xs font-medium text-base-black">
                Fakultas Sains dan Matematika UNDIP
              </p>
              <p className="text-xs text-base-gray">tu@fsm.undip.ac.id · (024) 7474754</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Valid document — success ────────────────────────────────────────
  if (result && result.valid && result.data) {
    const { data } = result;

    return (
      <PageShell>
        <div className="flex flex-col">
          {/* Center: Status hero */}
          <div className="flex flex-col items-center pt-8 pb-5 px-8">
            <VerifiedIcon size={96} />

            <p className="text-lg font-semibold text-base-black mt-5">
              Dokumen Terverifikasi
            </p>
            <p className="text-xs text-base-gray mt-1">
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Details section */}
          <div className="mx-5 mb-4">
            <div className="bg-neutral-50/80 rounded-2xl px-5 py-4">
              {/* Nomor Surat */}
              <div className="flex items-start justify-between py-3 border-b border-gray-200/60">
                <span className="text-xs text-base-gray shrink-0 pt-0.5">Nomor Surat</span>
                <span className="text-sm font-semibold text-base-black text-right ml-4 wrap-break-word max-w-[60%]">
                  {data.nomorSurat}
                </span>
              </div>

              {/* Tanggal */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200/60">
                <span className="text-xs text-base-gray">Tanggal</span>
                <span className="text-sm font-medium text-base-black">{data.tanggalSurat}</span>
              </div>

              {/* Jenis */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200/60">
                <span className="text-xs text-base-gray">Jenis Dokumen</span>
                <span className="text-sm font-medium text-base-black">{data.jenisDocument}</span>
              </div>

              {/* Perihal */}
              <div className="flex items-start justify-between py-3 border-b border-gray-200/60">
                <span className="text-xs text-base-gray shrink-0 pt-0.5">Perihal</span>
                <span className="text-sm font-medium text-base-black text-right ml-4 max-w-[65%] leading-relaxed">
                  {data.perihal}
                </span>
              </div>

              {/* Penandatangan */}
              {data.penandatangan && data.penandatangan.length > 0 && (
                <div className="flex items-start justify-between py-3 border-b border-gray-200/60">
                  <span className="text-xs text-base-gray shrink-0 pt-1">Ditandatangani</span>
                  <div className="flex flex-col items-end gap-1.5 ml-4">
                    {data.penandatangan.map((signer, index) => (
                      <div key={index} className="flex flex-col items-end">
                        <p className="text-sm font-medium text-base-black text-right">{signer.nama}</p>
                        <p className="text-[11px] text-base-gray text-right">{signer.jabatan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pemohon */}
              {data.pemohon && (
                <div className="flex items-start justify-between py-3">
                  <span className="text-xs text-base-gray shrink-0 pt-0.5">Pemohon</span>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-base-black">{data.pemohon.nama}</p>
                    {data.pemohon.nim && (
                      <p className="text-[11px] text-base-gray">NIM: {data.pemohon.nim}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pb-6 pt-2 text-center">
            <p className="text-[11px] text-base-gray">E-Office FSM UNDIP · Verifikasi Dokumen Digital</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return null;
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerificationContent />
    </Suspense>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3079`;
  }

  return "http://localhost:3079";
}