'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDraftSurat, SuratTugasFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { suratTugasTemplate } from '@/lib/templates/surat-tugas';

interface SuratTugasFormProps {
  initialData?: Partial<SuratTugasFormData>;
}

export function SuratTugasForm({ initialData }: SuratTugasFormProps) {
  const { setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);

  const [formValues, setFormValues] = useState<SuratTugasFormData>({
    jenisSurat: initialData?.jenisSurat || 'tugas',
    jenisSuratText: initialData?.jenisSuratText || 'SURAT TUGAS',
    nomorSurat: initialData?.nomorSurat || '',
    namaLengkap: initialData?.namaLengkap || '',
    nimNip: initialData?.nimNip || '',
    programStudi: initialData?.programStudi || '',
    keperluan: initialData?.keperluan || '',
    judulSurat: initialData?.judulSurat || '',
  });

  const handleChange = (field: keyof SuratTugasFormData, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleJenisChange = (value: 'tugas' | 'keputusan') => {
    setFormValues(prev => ({
      ...prev,
      jenisSurat: value,
      jenisSuratText: value === 'tugas' ? 'SURAT TUGAS' : 'SURAT KEPUTUSAN',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData(formValues);
    nextStep();
  };

  const previewHtml = suratTugasTemplate(formValues);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surat Tugas</h2>
          <p className="text-muted-foreground mt-1">
            Isi data surat tugas untuk kegiatan mahasiswa/dosen
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {showPreview ? 'Sembunyikan' : 'Lihat'} Preview
        </Button>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Surat Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jenisSurat">Jenis Surat</Label>
                  <Select
                    value={formValues.jenisSurat}
                    onValueChange={(value) => handleJenisChange(value as 'tugas' | 'keputusan')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis surat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tugas">Surat Tugas</SelectItem>
                      <SelectItem value="keputusan">Surat Keputusan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomorSurat">Nomor Surat</Label>
                  <Input
                    id="nomorSurat"
                    value={formValues.nomorSurat}
                    onChange={(e) => handleChange('nomorSurat', e.target.value)}
                    placeholder="xxx/UN7.F8/TU/2025"
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Data Yang Ditugaskan</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                    <Input
                      id="namaLengkap"
                      value={formValues.namaLengkap}
                      onChange={(e) => handleChange('namaLengkap', e.target.value)}
                      placeholder="Nama lengkap mahasiswa/dosen"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nimNip">NIM/NIP</Label>
                      <Input
                        id="nimNip"
                        value={formValues.nimNip}
                        onChange={(e) => handleChange('nimNip', e.target.value)}
                        placeholder="NIM atau NIP"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="programStudi">Program Studi/Jabatan</Label>
                      <Input
                        id="programStudi"
                        value={formValues.programStudi}
                        onChange={(e) => handleChange('programStudi', e.target.value)}
                        placeholder="Informatika/Dosen Departemen..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Detail Penugasan</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keperluan">Keperluan Tugas</Label>
                    <Input
                      id="keperluan"
                      value={formValues.keperluan}
                      onChange={(e) => handleChange('keperluan', e.target.value)}
                      placeholder="Mengikuti Lomba/Menjadi Panitia/dll"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judulSurat">Judul/Nama Kegiatan</Label>
                    <Input
                      id="judulSurat"
                      value={formValues.judulSurat}
                      onChange={(e) => handleChange('judulSurat', e.target.value)}
                      placeholder="Nama kegiatan atau acara"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button type="submit">
                  Lanjut
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {showPreview && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Preview Surat</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] overflow-auto bg-gray-100">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white"
                  title="Preview Surat Tugas"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
