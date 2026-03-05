"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { SuperAdminDashboard } from "@/features/dashboard/components/superadmin-dashboard";
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
  const [cachedRole, setCachedRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user-role");
    }
    return null;
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem("user-role");
    if (role && role !== cachedRole) {
      setCachedRole(role);
    }
  }, [cachedRole]);

  // Hindari SSR mismatch dengan menunggu komponen di-mount di klien
  if (!isMounted) {
    return <div className="bg-transparent" />; // Spacer kosong sebentar
  }

  if (loading || !user) {
    if (cachedRole === "SUPERADMIN" || user?.role === "SUPERADMIN") {
      return <SuperadminSkeleton />;
    }
    return <DashboardSkeleton />;
  }

  // Normalize role to uppercase for comparison
  const userRole = user.role?.toUpperCase();

  // Routing berdasarkan role dari API backend
  switch (userRole) {
    // Super Admin
    case "SUPERADMIN":
      return <SuperAdminDashboard />;

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

// Komponen Loading Sementara (Untuk Semua Role Selain Super Admin)
function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Row 1: Button Skeleton */}
      <div>
        <Skeleton className="h-9 w-[320px]" />
      </div>

      {/* Row 2: Tabs + Filters Skeleton (sejajar) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs Skeleton */}
        <div className="flex">
          <Skeleton className="h-9 w-[160px] rounded-r-none" />
          <Skeleton className="h-9 w-[160px] rounded-l-none" />
        </div>

        {/* Filters Skeleton (right side) */}
        <div className="flex items-center gap-3 ml-auto z-10">
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[200px]" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="bg-slate-50 border-b px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px] ml-auto" />
        </div>
        {/* Data Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b last:border-0 flex gap-4 items-center">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-8 w-[70px] ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Komponen Loading Khusus Super Admin
function SuperadminSkeleton() {
  return (
    <section aria-label="Dashboard Super Admin" className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-black rounded-sm" />
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Super Admin
          </h1>
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white shadow-sm">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 Panel Skeletons (Assymetric like the real page) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Manajemen Pengguna Skeleton */}
        <div className="rounded-xl border bg-white shadow-sm flex flex-col">
          <div className="flex flex-row items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>

        {/* Pengaturan Departemen Skeleton */}
        <div className="rounded-xl border bg-white shadow-sm flex flex-col">
          <div className="flex flex-row items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-52" />
            </div>
            <Skeleton className="h-9 w-44 rounded-md" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}