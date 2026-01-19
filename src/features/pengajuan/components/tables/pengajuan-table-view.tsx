"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Copy, Search } from "lucide-react";
import Link from "next/link";

const mockData = [
  {
    id: "1",
    namaSurat:
      "SK - PENGANGKATAN SEBAGAI KOORDINATOR LABORATORIUM PADA FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TAHUN 2021",
    yangMengajukan: "Deby S\ndeby.s@staff.undip.ac.id",
    unit: "Sumber Daya",
    status: "Menunggu Verifikasi",
    progress: "95% / Menunggu verifikasi Koodinasan",
  },
  {
    id: "2",
    namaSurat:
      "SK - PENGANGKATAN SEBAGAI KOORDINATOR PADA FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TAHUN 2021",
    yangMengajukan: "Deby S\ndeby.s@staff.undip.ac.id",
    unit: "drafter",
    status: "Permohonan Dekan",
    progress: "50% / Ditolak Verifikator Koodinasan dan kode tidak dapat di duplikasi",
  },
  {
    id: "3",
    namaSurat:
      "SK - PENGANGKATAN SEBAGAI TIM VALIDASI FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TAHUN 2021",
    yangMengajukan: "Deby S\ndeby.s@staff.undip.ac.id",
    unit: "",
    status: "Menunggu Verifikasi",
    progress: "100% / Selesai Tercetak dan Dapat Diakses",
  },
];

export default function PengajuanTableView() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari pengajuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Surat</TableHead>
              <TableHead>Yang Mengajukan</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-md">
                  <p className="font-medium">{item.namaSurat}</p>
                </TableCell>
                <TableCell>
                  <div className="whitespace-pre-line text-sm">
                    {item.yangMengajukan}
                  </div>
                </TableCell>
                <TableCell>
                  {item.unit && (
                    <Badge variant="secondary">{item.unit}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge
                      variant={
                        item.status === "Menunggu Verifikasi"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {item.progress}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/pengajuan/${item.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="mr-1 h-4 w-4" />
                        Ubah
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      Ubah Status
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="mr-1 h-4 w-4" />
                      Duplikat
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
