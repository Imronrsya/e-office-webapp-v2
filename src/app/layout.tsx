import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/providers/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Office FSM Undip",
  description: "Sistem Pengelolaan Surat Tugas & SK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} font-sans antialiased bg-base-gray-light`}>
        <Providers>
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}