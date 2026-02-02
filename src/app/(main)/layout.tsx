import TopNav from "@/components/layout/top-nav";
import "../globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-primary-base">
      {/* Navigasi Tetap di Atas */}
      <TopNav />

      {/* Konten Utama */}
      <main className="mx-auto w-full max-w-[1440px] px-8 pb-6 pt-28">
        {children}
      </main>
    </div>
  );
}