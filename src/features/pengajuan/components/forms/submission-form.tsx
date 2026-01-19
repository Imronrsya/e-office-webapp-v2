"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubmissionForm() {
  const [poinMenetapkan, setPoinMenetapkan] = useState(false);
  const [menimbangItems, setMenimbangItems] = useState<string[]>([]);
  const [mengingat, setMengingat] = useState<string[]>([]);
  const [menetapkan, setMenetapkan] = useState<string[]>([]);
  const [salinan, setSalinan] = useState<string[]>([]);

  const addArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => [...prev, ""]);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        <button className="flex items-center gap-2 border-b-2 border-black px-4 py-2 font-medium">
          <FileText className="h-4 w-4" />
          Surat Keputusan
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          Surat Tugas
        </button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Judul */}
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input placeholder="Masukkan Judul Surat" />
          </div>

          {/* Menimbang */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Menimbang</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addArrayItem(setMenimbangItems)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {menimbangItems.map((_, index) => (
              <Textarea
                key={index}
                placeholder="Masukkan Data Menimbang"
                className="mt-2"
              />
            ))}
          </div>

          {/* Mengingat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mengingat</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addArrayItem(setMengingat)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Menetapkan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Menetapkan</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addArrayItem(setMenetapkan)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Poin Menetapkan Lebih dari Satu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Poin Menetapkan Lebih dari Satu?</Label>
              <Switch
                checked={poinMenetapkan}
                onCheckedChange={setPoinMenetapkan}
              />
            </div>
            {poinMenetapkan && (
              <div className="space-y-2">
                <Input placeholder="Masukkan Data Menetapkan" />
                <Input placeholder="Masukkan & Poin Mengingat" />
              </div>
            )}
          </div>

          {/* Salinan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Salinan</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addArrayItem(setSalinan)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lampiran */}
          <div className="space-y-2">
            <Label>Lampiran</Label>
            <div className="flex items-center gap-2 rounded-md border border-dashed p-4">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Pilih Berkas
              </Button>
              <p className="text-sm text-muted-foreground">
                Pilih hingga 10 berkas, dengan maksimal ukuran 10 MB per berkas.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select defaultValue="draft">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draf</SelectItem>
                <SelectItem value="submitted">Diajukan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button>Batal</Button>
            <Button variant="outline">Simpan</Button>
            <Button variant="outline">Simpan dan Ajukan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
