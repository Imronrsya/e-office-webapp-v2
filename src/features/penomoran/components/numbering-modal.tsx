"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NomoringModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NomoringModal({ open, onClose }: NomoringModalProps) {
  const [isManual, setIsManual] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambahkan Nomor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tanggal Surat Ini</Label>
            <Input type="date" />
          </div>

          <div className="space-y-2">
            <Label>Nomor</Label>
            <Input placeholder="Pilih Nomor" disabled={!isManual} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Kode surat manual?</Label>
              <Switch checked={isManual} onCheckedChange={setIsManual} />
            </div>
          </div>

          {isManual && (
            <div className="space-y-2">
              <Label>Kode surat</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kode surat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sk">SK</SelectItem>
                  <SelectItem value="st">ST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button className="w-full">Tambah Nomor</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
