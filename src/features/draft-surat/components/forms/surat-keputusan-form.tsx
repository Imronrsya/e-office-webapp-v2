'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useDraftSurat, SuratKeputusanFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
import { suratKeputusanTemplate } from '@/lib/templates/surat-keputusan';

interface SuratKeputusanFormProps {
  initialData?: Partial<SuratKeputusanFormData>;
}

export function SuratKeputusanForm({ initialData }: SuratKeputusanFormProps) {
  const { state, setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);

  // Use stored form data from context if available, otherwise use initialData prop
  const existingData = state.formData as SuratKeputusanFormData | null;

  const [formValues, setFormValues] = useState<SuratKeputusanFormData>({
    nomorSurat: existingData?.nomorSurat || initialData?.nomorSurat || '',
    tentang: existingData?.tentang || initialData?.tentang || '',
    menimbang: existingData?.menimbang || initialData?.menimbang || [''],
    mengingat: existingData?.mengingat || initialData?.mengingat || [''],
    menetapkan: existingData?.menetapkan || initialData?.menetapkan || '',
    keputusan: existingData?.keputusan || initialData?.keputusan || [{ label: 'KESATU', content: '' }],
    tanggalDitetapkan: existingData?.tanggalDitetapkan || initialData?.tanggalDitetapkan || '',
    lampiran: existingData?.lampiran ?? initialData?.lampiran ?? false,
    dataPeserta: existingData?.dataPeserta || initialData?.dataPeserta || [{ nama: '', nim: '' }],
  });

  const handleChange = (field: keyof SuratKeputusanFormData, value: string | boolean) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'menimbang' | 'mengingat', index: number, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addArrayItem = (field: 'menimbang' | 'mengingat') => {
    setFormValues(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'menimbang' | 'mengingat', index: number) => {
    if (formValues[field].length <= 1) return;
    setFormValues(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleKeputusanChange = (index: number, field: 'label' | 'content', value: string) => {
    setFormValues(prev => ({
      ...prev,
      keputusan: prev.keputusan.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addKeputusan = () => {
    const labels = ['KESATU', 'KEDUA', 'KETIGA', 'KEEMPAT', 'KELIMA', 'KEENAM', 'KETUJUH'];
    const nextLabel = labels[formValues.keputusan.length] || `KE-${formValues.keputusan.length + 1}`;
    setFormValues(prev => ({
      ...prev,
      keputusan: [...prev.keputusan, { label: nextLabel, content: '' }],
    }));
  };

  const removeKeputusan = (index: number) => {
    if (formValues.keputusan.length <= 1) return;
    setFormValues(prev => ({
      ...prev,
      keputusan: prev.keputusan.filter((_, i) => i !== index),
    }));
  };

  const handlePesertaChange = (index: number, field: 'nama' | 'nim', value: string) => {
    setFormValues(prev => ({
      ...prev,
      dataPeserta: prev.dataPeserta.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addPeserta = () => {
    setFormValues(prev => ({
      ...prev,
      dataPeserta: [...prev.dataPeserta, { nama: '', nim: '' }],
    }));
  };

  const removePeserta = (index: number) => {
    if (formValues.dataPeserta.length <= 1) return;
    setFormValues(prev => ({
      ...prev,
      dataPeserta: prev.dataPeserta.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData(formValues);
    nextStep();
  };

  const previewHtml = suratKeputusanTemplate(formValues);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surat Keputusan Dekan</h2>
          <p className="text-muted-foreground mt-1">
            Buat surat keputusan dekan untuk kegiatan/acara
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
        <Card className="max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Data Surat Keputusan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorSurat">Nomor Surat</Label>
                  <Input
                    id="nomorSurat"
                    value={formValues.nomorSurat}
                    onChange={(e) => handleChange('nomorSurat', e.target.value)}
                    placeholder="xxx/UN7.F8/HK/IX/2025"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tentang">Tentang</Label>
                <Textarea
                  id="tentang"
                  value={formValues.tentang}
                  onChange={(e) => handleChange('tentang', e.target.value)}
                  placeholder="KEGIATAN ... OLEH HIMPUNAN MAHASISWA ... FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO"
                  rows={3}
                  required
                />
              </div>

              {/* Menimbang Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Menimbang</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('menimbang')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-2">
                  {formValues.menimbang.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm font-medium text-gray-500 pt-2 w-6">
                        {String.fromCharCode(97 + index)}.
                      </span>
                      <Textarea
                        value={item}
                        onChange={(e) => handleArrayChange('menimbang', index, e.target.value)}
                        placeholder="bahwa ..."
                        rows={2}
                        className="flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('menimbang', index)}
                        disabled={formValues.menimbang.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mengingat Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Mengingat</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('mengingat')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-2">
                  {formValues.mengingat.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm font-medium text-gray-500 pt-2 w-6">
                        {index + 1}.
                      </span>
                      <Textarea
                        value={item}
                        onChange={(e) => handleArrayChange('mengingat', index, e.target.value)}
                        placeholder="Undang-Undang Nomor ..."
                        rows={2}
                        className="flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('mengingat', index)}
                        disabled={formValues.mengingat.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Menetapkan */}
              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="menetapkan">Menetapkan</Label>
                  <Textarea
                    id="menetapkan"
                    value={formValues.menetapkan}
                    onChange={(e) => handleChange('menetapkan', e.target.value)}
                    placeholder="KEPUTUSAN DEKAN FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO TENTANG ..."
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Keputusan Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Keputusan</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addKeputusan}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-3">
                  {formValues.keputusan.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                      <Input
                        value={item.label}
                        onChange={(e) => handleKeputusanChange(index, 'label', e.target.value)}
                        placeholder="KESATU"
                        className="w-24"
                        required
                      />
                      <Textarea
                        value={item.content}
                        onChange={(e) => handleKeputusanChange(index, 'content', e.target.value)}
                        placeholder="Isi keputusan..."
                        rows={2}
                        className="flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeputusan(index)}
                        disabled={formValues.keputusan.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lampiran Toggle */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lampiran">Sertakan Lampiran</Label>
                    <p className="text-sm text-muted-foreground">
                      Tambahkan daftar peserta/panitia sebagai lampiran
                    </p>
                  </div>
                  <Switch
                    id="lampiran"
                    checked={formValues.lampiran}
                    onCheckedChange={(checked) => handleChange('lampiran', checked)}
                  />
                </div>
              </div>

              {/* Data Peserta (if lampiran enabled) */}
              {formValues.lampiran && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Daftar Peserta/Panitia</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addPeserta}>
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {formValues.dataPeserta.map((peserta, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <Input
                          value={peserta.nama}
                          onChange={(e) => handlePesertaChange(index, 'nama', e.target.value)}
                          placeholder="Nama"
                          className="flex-1"
                          required
                        />
                        <Input
                          value={peserta.nim}
                          onChange={(e) => handlePesertaChange(index, 'nim', e.target.value)}
                          placeholder="NIM"
                          className="w-40"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePeserta(index)}
                          disabled={formValues.dataPeserta.length <= 1}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={prevStep} className="text-base-black font-medium">
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
                  title="Preview Surat Keputusan"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
