"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RecentActivity() {
  const users = [
    { name: "Drafter", count: 2 },
    { name: "Verifikator", count: 5 },
    { name: "Dekan", count: 1 },
    { name: "Operator", count: 2 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pengguna</CardTitle>
        <Link href="/pengguna" className="text-sm text-blue-600 hover:underline">
          Lihat Selengkapnya
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {users.map((user) => (
            <div
              key={user.name}
              className="rounded-lg border p-4 text-center"
            >
              <p className="text-2xl font-bold">{user.count}</p>
              <p className="text-sm text-muted-foreground">{user.name} pengguna</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
