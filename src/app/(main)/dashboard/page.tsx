"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import PengajuDashboard from "@/features/dashboard/roles/pengaju-dashboard";
import KaprodiDashboard from "@/features/dashboard/roles/kaprodi-dashboard";
import AdminProdiDashboard from "@/features/dashboard/roles/admin-prodi-dashboard";
import KadepDashboard from "@/features/dashboard/roles/kadep-dashboard";
import AdminFakultasDashboard from "@/features/dashboard/roles/admin-fakultas-dashboard";
import ManajerTuDashboard from "@/features/dashboard/roles/manajer-tu-dashboard";
import DekanDashboard from "@/features/dashboard/roles/dekan-dashboard";
import WadekDashboard from "@/features/dashboard/roles/wadek-dashboard";
import SupervisorDashboard from "@/features/dashboard/roles/supervisor-dashboard";
import StafAkademikDashboard from "@/features/dashboard/roles/staf-akademik-dashboard";
import StafSdmDashboard from "@/features/dashboard/roles/staf-sdm-dashboard";
import UpaDashboard from "@/features/dashboard/roles/upa-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <DashboardSkeleton />;
  }

  // Normalize role to uppercase for comparison
  const userRole = user.role?.toUpperCase();

  // Routing berdasarkan role dari API backend
  switch (userRole) {
    // Lingkup Departemen (Tidak ada Surat Masuk/Keluar)
    case "MAHASISWA":
    case "DOSEN":
      return <PengajuDashboard />;

    case "KAPRODI":
      return <KaprodiDashboard />;

    case "ADMIN_PRODI":
      return <AdminProdiDashboard />;

    case "KADEP":
      return <KadepDashboard />;

    // Lingkup Fakultas (Semua punya Surat Masuk/Keluar)
    case "ADMIN_FAKULTAS":
      return <AdminFakultasDashboard />;

    case "DEKAN":
      return <DekanDashboard />;

    case "WADEK_1":
      return <WadekDashboard wadekNumber="1" />;

    case "WADEK_2":
      return <WadekDashboard wadekNumber="2" />;

    case "MANAJER_TU":
      return <ManajerTuDashboard />;

    case "SUPERVISOR_AKADEMIK":
      return <SupervisorDashboard bidang="Akademik" />;

    case "SUPERVISOR_SUMBER_DAYA":
      return <SupervisorDashboard bidang="Sumber Daya" />;

    case "STAF_AKADEMIK":
      return <StafAkademikDashboard />;

    case "STAF_SUMBER_DAYA":
      return <StafSdmDashboard />;

    // Lingkup UPA (Dashboard khusus)
    case "UPA":
      return <UpaDashboard />;

    default:
      return (
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-900">Role tidak dikenali</h2>
          <p className="text-gray-600 mt-2">Role: {user.role || "Tidak ada role"}</p>
          <p className="text-sm text-gray-500 mt-1">Silakan hubungi administrator</p>
        </div>
      );
  }
}

// Komponen Loading Sementara
function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Row 1: Button Skeleton */}
      <div>
        <Skeleton className="h-9 w-[320px] bg-zinc-200" />
      </div>

      {/* Row 2: Tabs + Filters Skeleton (sejajar) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs Skeleton */}
        <div className="flex">
          <Skeleton className="h-9 w-[160px] rounded-r-none bg-zinc-200" />
          <Skeleton className="h-9 w-[160px] rounded-l-none bg-zinc-200" />
        </div>

        {/* Filters Skeleton (right side) */}
        <div className="flex items-center gap-3 ml-auto">
          <Skeleton className="h-9 w-[180px] bg-zinc-200" />
          <Skeleton className="h-9 w-[160px] bg-zinc-200" />
          <Skeleton className="h-9 w-[200px] bg-zinc-200" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="bg-slate-50 border-b px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-[150px] bg-zinc-200" />
          <Skeleton className="h-4 w-[120px] bg-zinc-200" />
          <Skeleton className="h-4 w-[100px] bg-zinc-200" />
          <Skeleton className="h-4 w-[100px] bg-zinc-200" />
          <Skeleton className="h-4 w-[80px] bg-zinc-200" />
          <Skeleton className="h-4 w-[60px] ml-auto bg-zinc-200" />
        </div>
        {/* Data Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b last:border-0 flex gap-4 items-center">
            <Skeleton className="h-4 w-[150px] bg-zinc-200" />
            <Skeleton className="h-4 w-[120px] bg-zinc-200" />
            <Skeleton className="h-4 w-[100px] bg-zinc-200" />
            <Skeleton className="h-4 w-[100px] bg-zinc-200" />
            <Skeleton className="h-4 w-[80px] bg-zinc-200" />
            <Skeleton className="h-8 w-[70px] ml-auto bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}