"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DetailSuratInfoProps {
    jenisSurat: string;
    kategoriSurat?: string | null;
    judulSurat: string;
    keperluan: string;
    isStaffCreated?: boolean;
}

function InfoRow({ 
    label, 
    value, 
    showSeparator = true 
}: { 
    label: string; 
    value: string; 
    showSeparator?: boolean 
}) {
    return (
        <>
            <div className="py-3">
                <p className="text-sm text-zinc-400 leading-6">{label}</p>
                <p className="text-sm text-black leading-6">{value || "-"}</p>
            </div>
            {showSeparator && <Separator className="bg-zinc-400" />}
        </>
    );
}

function formatKategori(kategori: string | null | undefined): string {
    if (!kategori) return '-';
    const map: Record<string, string> = {
        AKADEMIK: 'Akademik',
        SUMBER_DAYA: 'Sumber Daya',
        UMUM: 'Umum',
    };
    return map[kategori] || kategori;
}

export function DetailSuratInfo({ jenisSurat, kategoriSurat, judulSurat, keperluan, isStaffCreated }: DetailSuratInfoProps) {
    const jenisSuratLabel = jenisSurat === 'SURAT_TUGAS' 
        ? 'Surat Tugas' 
        : jenisSurat === 'SURAT_KEPUTUSAN' 
            ? 'Surat Keputusan' 
            : jenisSurat === 'SURAT_TUGAS_TABEL'
                ? 'Surat Tugas (Tabel)'
                : jenisSurat;

    return (
        <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <h3 className="text-sm font-bold text-black mb-4">Detail Surat</h3>
                
                <InfoRow 
                    label="Tipe Surat" 
                    value={jenisSuratLabel} 
                />
                <InfoRow 
                    label="Jenis Surat" 
                    value={formatKategori(kategoriSurat)} 
                />
                <InfoRow 
                    label="Judul Surat" 
                    value={judulSurat} 
                    showSeparator={!isStaffCreated}
                />
                {!isStaffCreated && (
                    <InfoRow 
                        label="Keperluan" 
                        value={keperluan} 
                        showSeparator={false}
                    />
                )}
            </CardContent>
        </Card>
    );
}
