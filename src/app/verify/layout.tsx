import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikasi Dokumen - E-Office FSM UNDIP",
  description: "Verifikasi keaslian dokumen surat tugas dan surat keputusan dari Fakultas Sains dan Matematika UNDIP",
};

/**
 * Layout untuk halaman verifikasi PUBLIC
 * TIDAK menggunakan AuthProvider karena halaman ini bisa diakses tanpa login
 */
export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
