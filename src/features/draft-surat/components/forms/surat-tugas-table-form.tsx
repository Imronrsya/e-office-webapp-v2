'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDraftSurat, SuratTugasTableFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
import { suratTugasTableTemplate } from '@/lib/templates/surat-tugas-table';

interface SuratTugasTableFormProps {
  initialData?: Partial<SuratTugasTableFormData>;
}

export function SuratTugasTableForm({ initialData }: SuratTugasTableFormProps) {
  const { setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);

  const [formValues, setFormValues] = useState<SuratTugasTableFormData>({
    nomorSurat: initialData?.nomorSurat || '',
    dataMahasiswa: initialData?.dataMahasiswa || [{ nama: '', nim: '', prodi: '' }],
    keterangan: initialData?.keterangan || '',
    tanggalMulai: initialData?.tanggalMulai || '',
    tanggalSelesai: initialData?.tanggalSelesai || '',
  });

  const handleChange = (field: keyof SuratTugasTableFormData, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleMahasiswaChange = (index: number, field: 'nama' | 'nim' | 'prodi', value: string) => {
    setFormValues(prev => ({
      ...prev,
      dataMahasiswa: prev.dataMahasiswa.map((mhs, i) =>
        i === index ? { ...mhs, [field]: value } : mhs
      ),
    }));
  };

  const addMahasiswa = () => {
    setFormValues(prev => ({
      ...prev,
      dataMahasiswa: [...prev.dataMahasiswa, { nama: '', nim: '', prodi: '' }],
    }));
  };

  const removeMahasiswa = (index: number) => {
    if (formValues.dataMahasiswa.length <= 1) return;
    setFormValues(prev => ({
      ...prev,
      dataMahasiswa: prev.dataMahasiswa.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData(formValues);
    nextStep();
  };

  const previewHtml = suratTugasTableTemplate(formValues);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surat Tugas (Tabel)</h2>
          <p className="text-muted-foreground mt-1">
            Surat tugas dengan daftar peserta dalam bentuk tabel
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

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Daftar Mahasiswa</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addMahasiswa}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {formValues.dataMahasiswa.map((mhs, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-500 w-6 pt-2">
                        {index + 1}.
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          value={mhs.nama}
                          onChange={(e) => handleMahasiswaChange(index, 'nama', e.target.value)}
                          placeholder="Nama"
                          required
                        />
                        <Input
                          value={mhs.nim}
                          onChange={(e) => handleMahasiswaChange(index, 'nim', e.target.value)}
                          placeholder="NIM"
                          required
                        />
                        <Input
                          value={mhs.prodi}
                          onChange={(e) => handleMahasiswaChange(index, 'prodi', e.target.value)}
                          placeholder="Prodi"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMahasiswa(index)}
                        disabled={formValues.dataMahasiswa.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Detail Penugasan</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keterangan">Keterangan Tugas</Label>
                    <Input
                      id="keterangan"
                      value={formValues.keterangan}
                      onChange={(e) => handleChange('keterangan', e.target.value)}
                      placeholder="Komisi Pengawas Etik Kaderisasi"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                      <Input
                        id="tanggalMulai"
                        value={formValues.tanggalMulai}
                        onChange={(e) => handleChange('tanggalMulai', e.target.value)}
                        placeholder="1 Agustus 2025"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
                      <Input
                        id="tanggalSelesai"
                        value={formValues.tanggalSelesai}
                        onChange={(e) => handleChange('tanggalSelesai', e.target.value)}
                        placeholder="31 Desember 2025"
                        required
                      />
                    </div>
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
                  title="Preview Surat Tugas Tabel"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
