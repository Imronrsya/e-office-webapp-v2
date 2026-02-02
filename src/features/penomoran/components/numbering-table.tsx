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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NomoringModal from "./numbering-modal";

const mockData = [
  {
    id: "1",
    namaSurat:
      "SK - PENGANGKATAN SEBAGAI KOORDINATO LABORATORIUM PADA FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TAHUN 2021",
    status: "Semua",
  },
  {
    id: "2",
    namaSurat:
      "SK - PENGANGKATAN SEBAGAI KOORDINATO PADA FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TAH",
    status: "Semua",
  },
  {
    id: "3",
    namaSurat:
      "SK - PENGANGKATAN SEBAGAI TIM VALIDASI FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TAHUN 2021",
    status: "Semua",
  },
];

export default function NomoringTable() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-4 p-6">
        <div className="flex gap-2 border-b pb-4">
          <Button variant="default" size="sm">
            Semua
          </Button>
          <Button variant="ghost" size="sm">
            Belum Dibonomi
          </Button>
          <Button variant="ghost" size="sm">
            Sudah Dibonomi
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Surat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-md font-medium">
                  {item.namaSurat}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItem(item.id)}
                  >
                    Tambahkan Nomor
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NomoringModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
