"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";

interface SubmissionDetailProps {
  id: string;
}

export default function SubmissionDetail({ id }: SubmissionDetailProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Main Content */}
      <div className="md:col-span-2 space-y-6">
        {/* Document Preview */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-[8.5/11] border bg-gray-50 flex items-center justify-center">
              <p className="text-muted-foreground">Document Preview</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Pengaju Draf</p>
              <p className="font-medium">Deby S</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Diajukan</p>
              <p className="font-medium">Kamis, 12 September</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Lama Waktu</p>
              <p className="font-medium">10 hari (10 hari lalu)</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="space-y-2 pt-6">
            <Button className="w-full">Ubah Status</Button>
            <Button variant="outline" className="w-full">
              Tambahkan Komentar
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progres Permohonan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-sm">Selesai</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-sm">Pengajuan Dekan</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <p className="text-sm font-medium">
                  Menunggu permohonan supervisi kepegawaian (Awang Kurnia
                  Saputra)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                  M
                </div>
                <div className="flex-1">
                  <p className="font-medium">Muhammad Bhaeka mengajukan</p>
                  <p className="text-xs text-muted-foreground">25 Sep 24</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                  M
                </div>
                <div className="flex-1">
                  <p className="font-medium">Muhammad Bhaeka mengkomentar</p>
                  <p className="text-sm">
                    Mohon untuk menambahkan keterangan surat kembali dengan
                    draf tersebut!
                  </p>
                  <p className="text-xs text-muted-foreground">25 Sep 24</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lampiran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              <span>Surat Pengajuan.pdf</span>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span>Surat Keterangan.pdf</span>
              <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
