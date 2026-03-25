"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface SignatureUploadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export function SignatureUpload({ onSignatureChange }: SignatureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan PNG atau JPG.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      setFileName(file.name);
      onSignatureChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    onSignatureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-4">
        {preview ? (
          <div className="relative w-full">
            <div className="border-2 border-zinc-200 rounded-lg p-4 bg-white">
              <img
                src={preview}
                alt="Signature Preview"
                className="max-h-32 mx-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-zinc-500 truncate max-w-[200px]">
                {fileName}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Hapus
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="signature-upload"
            className={`flex flex-col items-center justify-center w-full h-[160px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
              <Upload className={`w-10 h-10 mb-3 ${isDragging ? "text-blue-500" : "text-zinc-400"}`} />
              <p className={`mb-2 text-sm ${isDragging ? "text-blue-600" : "text-zinc-500"}`}>
                <span className="font-semibold">Klik untuk upload</span> atau
                drag & drop
              </p>
              <p className="text-xs text-zinc-400">PNG atau JPG (Maks. 2MB)</p>
            </div>
            <Input
              ref={fileInputRef}
              id="signature-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      <div className="text-xs text-zinc-400 text-center">
        <p>Tips: Gunakan gambar tanda tangan dengan background transparan (PNG) untuk hasil terbaik</p>
      </div>
    </div>
  );
}
