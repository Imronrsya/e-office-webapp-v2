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
import { useState } from "react";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic
    console.log("Reset password for:", email);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lupa Kata Sandi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Apabila anda lupa kata sandi anda, harap menghubungi admin dengan
            kontak dibawah ini
          </p>
          <div className="space-y-2">
            <p className="text-sm">Azra Muhammad Bhaekarenga - UP2TI</p>
            <p className="text-sm">
              08515282663 / muhammad.bhaeka@students.undip.ac.id
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Masuk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
