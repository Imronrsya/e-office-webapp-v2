import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
    <div className={`${poppins.variable} font-sans antialiased`}>
      {children}
    </div>
  );
}