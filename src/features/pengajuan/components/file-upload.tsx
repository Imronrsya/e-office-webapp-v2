"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText, Image, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
    maxSizeKB?: number;
    acceptedTypes?: string[];
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_KB = 5120; // 5MB

export function FileUpload({
    files,
    onFilesChange,
    maxFiles = 5,
    maxSizeKB = MAX_FILE_SIZE_KB,
    acceptedTypes = ACCEPTED_TYPES,
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handlePreview = (file: File) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPreviewFile(file);
    };

    const handleClosePreview = (open: boolean) => {
        if (!open) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setPreviewFile(null);
        }
    };

    const validateFile = useCallback(
        (file: File): string | null => {
            if (!acceptedTypes.includes(file.type)) {
                return `Format file tidak didukung. Gunakan PDF, JPG, atau PNG.`;
            }
            if (file.size > maxSizeKB * 1024) {
                return `Ukuran file melebihi ${maxSizeKB / 1024}MB.`;
            }
            return null;
        },
        [acceptedTypes, maxSizeKB]
    );

    const handleFiles = useCallback(
        (newFiles: FileList | File[]) => {
            setError(null);
            const fileArray = Array.from(newFiles);

            if (files.length + fileArray.length > maxFiles) {
                setError(`Maksimal ${maxFiles} file yang dapat diunggah.`);
                return;
            }

            const validFiles: File[] = [];
            for (const file of fileArray) {
                const error = validateFile(file);
                if (error) {
                    setError(error);
                    return;
                }
                validFiles.push(file);
            }

            onFilesChange([...files, ...validFiles]);
        },
        [files, maxFiles, onFilesChange, validateFile]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        },
        [handleFiles]
    );

    const removeFile = useCallback(
        (index: number) => {
            const newFiles = files.filter((_, i) => i !== index);
            onFilesChange(newFiles);
            setError(null);
        },
        [files, onFilesChange]
    );

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getFileIcon = (file: File) => {
        if (file.type === "application/pdf") {
            return <FileText className="h-5 w-5 text-red-500" />;
        }
        return <Image className="h-5 w-5 text-blue-500" />;
    };

    return (
        <div className="space-y-3">
            {/* Drop Zone */}
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                    dragActive
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400",
                    files.length >= maxFiles && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                    document.getElementById("file-upload-input")?.click()
                }
            >
                <input
                    id="file-upload-input"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={files.length >= maxFiles}
                />
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary">Klik untuk upload</span>{" "}
                    atau drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (Maks. 5MB per file, maks. {maxFiles} file)
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border group"
                        >
                            <div 
                                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                                onClick={() => handlePreview(file)}
                                title="Klik untuk melihat preview"
                            >
                                {getFileIcon(file)}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <Dialog open={!!previewFile} onOpenChange={handleClosePreview}>
                <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle className="truncate pr-8">
                            {previewFile?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 w-full h-full min-h-0 bg-gray-100 rounded-md overflow-hidden relative border">
                        {previewFile && previewUrl && (
                            previewFile.type === "application/pdf" ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain shadow-sm"
                                    />
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* File Counter */}
            <p className="text-xs text-gray-500 text-right">
                {files.length} / {maxFiles} file
            </p>
        </div>
    );
}
