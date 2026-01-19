"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatsCard() {
  const stats = [
    { label: "Semua", value: 71, color: "bg-blue-500" },
    { label: "Menunggu Verifikasi", value: 58, color: "bg-purple-500" },
    { label: "Permohonan Dekan", value: 9, color: "bg-pink-500" },
    { label: "Ditolak", value: 2, color: "bg-yellow-500" },
    { label: "Draf", value: 2, color: "bg-gray-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Surat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pie Chart Placeholder */}
          <div className="flex h-48 items-center justify-center">
            <div className="relative h-40 w-40 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <div className="absolute inset-4 rounded-full bg-white"></div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stat.color}`}></div>
                <span className="text-sm">
                  {stat.label}: {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
