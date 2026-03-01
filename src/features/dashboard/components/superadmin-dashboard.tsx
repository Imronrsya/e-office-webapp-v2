"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, TrendingUp, ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/services/dashboardStats.service";
import { listDepartments, type DepartmentItem } from "@/services/departmentSettings.service";
import { ROLE_LABELS } from "@/lib/role-mapper";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ROLE_ORDER = [
  "MAHASISWA",
  "DOSEN",
  "KAPRODI",
  "ADMIN_PRODI",
  "KADEP",
  "ADMIN_FAKULTAS",
  "DEKAN",
  "WADEK_1",
  "WADEK_2",
  "MANAJER_TU",
  "SUPERVISOR_AKADEMIK",
  "SUPERVISOR_SUMBER_DAYA",
  "STAF_AKADEMIK",
  "STAF_SUMBER_DAYA",
  "UPA",
  "SUPERADMIN"
];

export function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, deptsData] = await Promise.all([
          getDashboardStats(),
          listDepartments()
        ]);
        setStats(statsData);
        setDepartments(deptsData);
      } catch (error) {
        toast.error("Gagal memuat statistik dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
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
            <div className="p-6 space-y-3">
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
            <div className="p-6 space-y-3">
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

  // Calculate unique roles for KPI
  const uniqueRolesCount = stats?.users.byRole.length || 0;

  return (
    <section aria-label="Dashboard Super Admin" className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start sm:items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-zinc-800 rounded-sm" />
          <h1 className="text-2xl font-bold text-black">
            Dashboard Super Admin
          </h1>
        </div>
      </div>

      {/* 4 KPI Cards - Simetris dan Modern */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Pengguna
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.users.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Departemen
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.departments.totalDepartments || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Program Studi
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.departments.totalProdi || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Role Aktif
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {uniqueRolesCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Panels - Symmetrical 2 Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel 1: Pengguna */}
        <Card className="shadow-sm border-slate-200 bg-neutral-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-200">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              Manajemen Pengguna
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex text-base-black border-base-black hover:bg-neutral-100"
              onClick={() => router.push("/pengguna")}
            >
              Kelola Pengguna
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            {/* Scrollable container for roles if there are many */}
            <div className="space-y-3 max-h-[224px] overflow-y-auto pr-2 custom-scrollbar">
              {stats?.users.byRole
                .sort((a, b) => {
                  const indexA = ROLE_ORDER.indexOf(a.role);
                  const indexB = ROLE_ORDER.indexOf(b.role);
                  // If role not in array, push to bottom
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                })
                .map((roleStat) => (
                  <div
                    key={roleStat.role}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="font-medium text-slate-700">
                        {ROLE_LABELS[roleStat.role] || roleStat.role}
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-semibold bg-slate-100 text-slate-700">
                      {roleStat.count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-200 sm:hidden">
            <Button
              variant="outline"
              className="w-full text-base-black border-base-black hover:bg-neutral-100"
              onClick={() => router.push("/pengguna")}
            >
              Kelola Pengguna
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Panel 2: Departemen */}
        <Card className="shadow-sm border-slate-200 bg-neutral-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-200">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              Pengaturan Departemen
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex text-base-black border-base-black hover:bg-neutral-100"
              onClick={() => router.push("/pengaturan")}
            >
              Kelola Departemen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-3 max-h-[224px] overflow-y-auto pr-2 custom-scrollbar">
              {departments
                .filter((dept) => dept.code !== "FSM")
                .map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="font-medium text-slate-700">
                        {dept.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-semibold bg-slate-100 text-slate-700">
                      {dept.programStudi.length} Prodi
                    </Badge>
                  </div>
                ))}
              {departments.filter((dept) => dept.code !== "FSM").length === 0 && (
                <div className="text-center text-sm text-slate-500 py-4">
                  Belum ada departemen
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-200 sm:hidden">
            <Button
              variant="outline"
              className="w-full text-base-black border-base-black hover:bg-neutral-100"
              onClick={() => router.push("/pengaturan")}
            >
              Kelola Departemen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
