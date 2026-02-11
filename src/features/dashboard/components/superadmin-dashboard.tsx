"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, TrendingUp, ArrowRight } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/services/dashboardStats.service";
import { ROLE_LABELS } from "@/lib/role-mapper";
import { toast } from "sonner";

export function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
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
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Dashboard Super Admin" className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard Super Admin
        </h1>
        <p className="text-sm text-slate-500">
          Kelola pengguna dan departemen dalam sistem E-Office
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Statistics Card */}
        <Card
          className="group cursor-pointer border-slate-200 bg-white transition-all duration-200 hover:border-blue-300 hover:shadow-lg"
          onClick={() => router.push("/pengguna")}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Manajemen Pengguna
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Kelola akun dan hak akses pengguna
                </CardDescription>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Total Users */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">
                  {stats?.users.total || 0}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Total Pengguna
                </span>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  Distribusi Role
                </span>
              </div>
              <div className="space-y-2">
                {stats?.users.byRole
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6)
                  .map((roleStat) => (
                    <div
                      key={roleStat.role}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-600">
                        {ROLE_LABELS[roleStat.role] || roleStat.role}
                      </span>
                      <Badge variant="secondary" className="font-semibold">
                        {roleStat.count}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors group-hover:bg-blue-100">
              <span>Kelola Pengguna</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics Card */}
        <Card
          className="group cursor-pointer border-slate-200 bg-white transition-all duration-200 hover:border-emerald-300 hover:shadow-lg"
          onClick={() => router.push("/pengaturan")}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Pengaturan Departemen
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Kelola struktur akademik fakultas
                </CardDescription>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Department & Prodi Count */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-3xl font-bold text-slate-900">
                  {stats?.departments.totalDepartments || 0}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  Departemen
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-3xl font-bold text-slate-900">
                  {stats?.departments.totalProdi || 0}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  Program Studi
                </div>
              </div>
            </div>

            {/* Member Statistics */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  Anggota Terdaftar
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2.5 text-sm">
                  <span className="font-medium text-slate-600">Mahasiswa</span>
                  <Badge variant="secondary" className="font-semibold">
                    {stats?.departments.totalMahasiswa || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2.5 text-sm">
                  <span className="font-medium text-slate-600">Pegawai</span>
                  <Badge variant="secondary" className="font-semibold">
                    {stats?.departments.totalPegawai || 0}
                  </Badge>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors group-hover:bg-emerald-100">
              <span>Kelola Departemen</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
