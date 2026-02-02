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
import { Pencil, Trash2 } from "lucide-react";

const mockUsers = [
  {
    id: "1",
    name: "Deby",
    email: "deby.s@staff.undip.ac.id",
    unit: "UPA",
    jabatan: "Drafter",
  },
  {
    id: "2",
    name: "Urni Arifanti",
    email: "urni.a@staff.undip.ac.id",
    unit: "Akademik",
    jabatan: "Verifikator Akademik",
  },
  {
    id: "3",
    name: "Lilis Maryuni",
    email: "lilis.m@staff.undip.ac.id",
    unit: "Manajer",
    jabatan: "Verifikator Akhir",
  },
  {
    id: "4",
    name: "Awang Kurnia Saputra",
    email: "awang@staff.undip.ac.id",
    unit: "Sumber Daya",
    jabatan: "Verifikator Sumber Daya",
  },
  {
    id: "5",
    name: "Kusworo Adi",
    email: "kusworo@lecturer.undip.ac.id",
    unit: "Dekan",
    jabatan: "Dekan",
  },
];

export default function UserTable() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.unit}</TableCell>
                <TableCell>{user.jabatan}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Pencil className="mr-1 h-4 w-4" />
                      Ubah
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-1 h-4 w-4" />
                      Hapus
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
