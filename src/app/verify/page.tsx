"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, Shield, FileText, Calendar, User, Building2, Loader2 } from "lucide-react";

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
// LOADING COMPONENT
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Memverifikasi Dokumen...</h2>
        <p className="text-gray-500">Mohon tunggu sebentar</p>
      </div>
    </div>
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
        // Panggil API backend untuk verifikasi
        // API URL dinamis berdasarkan origin atau environment
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/verification/verify?token=${encodeURIComponent(token)}`);
        
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

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state (no token or fetch error)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Verifikasi Gagal</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="text-sm text-gray-400">
            <p>Silakan hubungi:</p>
            <p className="font-medium">Fakultas Sains dan Matematika UNDIP</p>
            <p>tu@fsm.undip.ac.id</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid/Not Found document
  if (result && !result.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          {/* Header with Warning */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-14 h-14 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">
              DOKUMEN TIDAK VALID
            </h1>
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              {result.status === "NOT_FOUND" ? "Tidak Ditemukan" : 
               result.status === "INVALID_TOKEN" ? "Token Tidak Valid" : 
               "Kedaluwarsa"}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
            <p className="text-red-800 font-medium">{result.message}</p>
          </div>

          {/* Action Info */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-600 text-sm mb-3">
              Jika Anda yakin dokumen ini asli, silakan hubungi:
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-gray-800">Fakultas Sains dan Matematika UNDIP</p>
              <p className="text-gray-600">📧 tu@fsm.undip.ac.id</p>
              <p className="text-gray-600">📞 (024) 7474754</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              E-Office FSM UNDIP - Sistem Verifikasi Dokumen Digital
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Valid document
  if (result && result.valid && result.data) {
    const { data } = result;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-lg w-full">
          {/* Header with Success Badge */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <CheckCircle2 className="w-14 h-14 text-green-600" />
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">
              DOKUMEN ASLI
            </h1>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Terverifikasi
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-6">
            <p className="text-green-800 font-medium text-sm">{result.message}</p>
          </div>

          {/* Document Details */}
          <div className="space-y-4">
            {/* Nomor Surat */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nomor Surat</p>
                  <p className="font-semibold text-gray-800 break-words">{data.nomorSurat}</p>
                </div>
              </div>
            </div>

            {/* Tanggal & Jenis */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Tanggal</span>
                </div>
                <p className="font-medium text-gray-800 text-sm">{data.tanggalSurat}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Jenis</span>
                </div>
                <p className="font-medium text-gray-800 text-sm">{data.jenisDocument}</p>
              </div>
            </div>

            {/* Perihal */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Perihal</p>
              <p className="font-medium text-gray-800">{data.perihal}</p>
            </div>

            {/* Penandatangan */}
            {data.penandatangan && data.penandatangan.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Ditandatangani Oleh</p>
                <div className="space-y-2">
                  {data.penandatangan.map((signer, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{signer.nama}</p>
                        <p className="text-xs text-gray-500">{signer.jabatan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pemohon */}
            {data.pemohon && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pemohon</p>
                    <p className="font-medium text-gray-800">{data.pemohon.nama}</p>
                    {data.pemohon.nim && (
                      <p className="text-xs text-gray-500">NIM: {data.pemohon.nim}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>Diverifikasi pada {new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              E-Office FSM UNDIP - Sistem Verifikasi Dokumen Digital
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
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

/**
 * Get API URL dynamically
 * Supports both client-side and server-side
 */
function getApiUrl(): string {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Client-side: use window.location to get the host
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Backend API runs on port 3079
    return `${protocol}//${hostname}:3079`;
  }
  
  // Fallback
  return 'http://localhost:3079';
}
