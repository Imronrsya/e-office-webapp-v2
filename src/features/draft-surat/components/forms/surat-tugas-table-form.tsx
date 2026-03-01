'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDraftSurat, SuratTugasTableFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
import { suratTugasTableTemplate } from '@/lib/templates/surat-tugas-table';
import { DatePicker } from "@/components/ui/date-picker";
import { format as formatDate, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SuratTugasTableFormProps {
  initialData?: Partial<SuratTugasTableFormData>;
}

export function SuratTugasTableForm({ initialData }: SuratTugasTableFormProps) {
  const { state, setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);

  // Use stored form data from context if available, otherwise use initialData prop
  const existingData = state.formData as SuratTugasTableFormData | null;

  const [formValues, setFormValues] = useState<SuratTugasTableFormData>({
    nomorSurat: existingData?.nomorSurat || initialData?.nomorSurat || '',
    dataMahasiswa: existingData?.dataMahasiswa || initialData?.dataMahasiswa || [{ nama: '', nim: '', prodi: '' }],
    keterangan: existingData?.keterangan || initialData?.keterangan || '',
    tanggalMulai: existingData?.tanggalMulai || initialData?.tanggalMulai || '',
    tanggalSelesai: existingData?.tanggalSelesai || initialData?.tanggalSelesai || '',
    namaLabel: existingData?.namaLabel || initialData?.namaLabel || 'Nama',
    nimLabel: existingData?.nimLabel || initialData?.nimLabel || 'NIM',
    prodiLabel: existingData?.prodiLabel || initialData?.prodiLabel || 'Prodi',
    customColumns: existingData?.customColumns || initialData?.customColumns || [],
  });

  // Date state for DatePicker components
  const [tanggalMulaiDate, setTanggalMulaiDate] = useState<Date | undefined>(undefined);
  const [tanggalSelesaiDate, setTanggalSelesaiDate] = useState<Date | undefined>(undefined);

  // Parse initial dates if available
  useEffect(() => {
    if (formValues.tanggalMulai && !tanggalMulaiDate) {
      try {
        const parsed = parse(formValues.tanggalMulai, "dd MMMM yyyy", new Date(), { locale: idLocale });
        if (!isNaN(parsed.getTime())) {
          setTanggalMulaiDate(parsed);
        }
      } catch (e) {
        console.error("Failed to parse start date:", e);
      }
    }
    if (formValues.tanggalSelesai && !tanggalSelesaiDate) {
      try {
        const parsed = parse(formValues.tanggalSelesai, "dd MMMM yyyy", new Date(), { locale: idLocale });
        if (!isNaN(parsed.getTime())) {
          setTanggalSelesaiDate(parsed);
        }
      } catch (e) {
        console.error("Failed to parse end date:", e);
      }
    }
  }, []); // Run once on mount

  const handleChange = (field: keyof SuratTugasTableFormData, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleMahasiswaChange = (index: number, field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      dataMahasiswa: prev.dataMahasiswa.map((mhs, i) =>
        i === index ? { ...mhs, [field]: value } : mhs
      ),
    }));
  };

  // Custom Columns Management
  const addCustomColumn = () => {
    const newColumn = {
      key: `custom_${Date.now()}`,
      label: '',
    };
    setFormValues(prev => ({
      ...prev,
      customColumns: [...(prev.customColumns || []), newColumn],
      // Add empty value for this column to all existing mahasiswa
      dataMahasiswa: prev.dataMahasiswa.map(mhs => ({
        ...mhs,
        [newColumn.key]: '',
      })),
    }));
  };

  const removeCustomColumn = (columnKey: string) => {
    setFormValues(prev => ({
      ...prev,
      customColumns: (prev.customColumns || []).filter(col => col.key !== columnKey),
      // Remove this column from all mahasiswa
      dataMahasiswa: prev.dataMahasiswa.map(mhs => {
        const { [columnKey]: removed, ...rest } = mhs;
        return rest as typeof mhs;
      }),
    }));
  };

  const updateCustomColumnLabel = (columnKey: string, newLabel: string) => {
    setFormValues(prev => ({
      ...prev,
      customColumns: (prev.customColumns || []).map(col =>
        col.key === columnKey ? { ...col, label: newLabel } : col
      ),
    }));
  };

  const addMahasiswa = () => {
    const newMahasiswa: any = { nama: '', nim: '', prodi: '' };
    // Add empty values for custom columns
    (formValues.customColumns || []).forEach(col => {
      newMahasiswa[col.key] = '';
    });
    setFormValues(prev => ({
      ...prev,
      dataMahasiswa: [...prev.dataMahasiswa, newMahasiswa],
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

              <div className="border-t pt-6 mt-6 pb-6 mb-6 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-4 text-base text-blue-900">🔒 Kolom Wajib (Mandatory) *</h4>
                <p className="text-sm text-blue-800 mb-4 font-medium">
                  Tiga kolom utama yang harus ada. Anda bisa mengubah label kolomnya sesuai kebutuhan Anda.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaLabel" className="text-sm font-semibold text-gray-700">Label Kolom 1 (Nama)</Label>
                    <Input
                      id="namaLabel"
                      value={formValues.namaLabel || 'Nama'}
                      onChange={(e) => handleChange('namaLabel', e.target.value)}
                      placeholder="Nama"
                      className="w-full border-2 border-blue-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nimLabel" className="text-sm font-semibold text-gray-700">Label Kolom 2 (NIM/ID)</Label>
                    <Input
                      id="nimLabel"
                      value={formValues.nimLabel || 'NIM'}
                      onChange={(e) => handleChange('nimLabel', e.target.value)}
                      placeholder="NIM"
                      className="w-full border-2 border-blue-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prodiLabel" className="text-sm font-semibold text-gray-700">Label Kolom 3 (Program)</Label>
                    <Input
                      id="prodiLabel"
                      value={formValues.prodiLabel || 'Prodi'}
                      onChange={(e) => handleChange('prodiLabel', e.target.value)}
                      placeholder="Prodi"
                      className="w-full border-2 border-blue-300"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Kolom Tambahan</h4>
                    <p className="text-sm text-muted-foreground">
                      Tambahkan kolom custom sesuai kebutuhan (opsional)
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomColumn}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Kolom
                  </Button>
                </div>

                {(formValues.customColumns && formValues.customColumns.length > 0) && (
                  <div className="space-y-2 mb-3">
                    {formValues.customColumns.map((col) => (
                      <div key={col.key} className="flex gap-2 items-center bg-blue-50 p-2 rounded">
                        <Input
                          value={col.label}
                          onChange={(e) => updateCustomColumnLabel(col.key, e.target.value)}
                          placeholder="Nama Kolom"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomColumn(col.key)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Data Pelaksana</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addMahasiswa}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Pelaksana
                  </Button>
                </div>

                {/* Header row showing column names */}
                <div className="grid gap-2 mb-2 px-2" style={{ gridTemplateColumns: `24px repeat(${3 + (formValues.customColumns?.length || 0)}, 1fr) auto` }}>
                  <div className="text-xs font-medium text-gray-500">No</div>
                  <div className="text-xs font-medium text-gray-500">{formValues.namaLabel || 'Nama'} *</div>
                  <div className="text-xs font-medium text-gray-500">{formValues.nimLabel || 'NIM'} *</div>
                  <div className="text-xs font-medium text-gray-500">{formValues.prodiLabel || 'Prodi'} *</div>
                  {formValues.customColumns?.map((col) => (
                    <div key={col.key} className="text-xs font-medium text-gray-500">{col.label || 'Kolom Custom'}</div>
                  ))}
                  <div></div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {formValues.dataMahasiswa.map((mhs, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-500 w-6 pt-2">
                        {index + 1}.
                      </div>
                      <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${3 + (formValues.customColumns?.length || 0)}, 1fr)` }}>
                        <Input
                          value={mhs.nama}
                          onChange={(e) => handleMahasiswaChange(index, 'nama', e.target.value)}
                          placeholder={formValues.namaLabel || "Nama"}
                          required
                        />
                        <Input
                          value={mhs.nim}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            handleMahasiswaChange(index, 'nim', val);
                          }}
                          placeholder={formValues.nimLabel || "NIM"}
                          maxLength={formValues.nimLabel?.toUpperCase() === 'NIP' ? 18 : 14}
                          required
                        />
                        <Input
                          value={mhs.prodi}
                          onChange={(e) => handleMahasiswaChange(index, 'prodi', e.target.value)}
                          placeholder={formValues.prodiLabel || "Prodi"}
                          required
                        />
                        {formValues.customColumns?.map((col) => (
                          <Input
                            key={col.key}
                            value={mhs[col.key] || ''}
                            onChange={(e) => handleMahasiswaChange(index, col.key, e.target.value)}
                            placeholder={col.label || 'Isi kolom'}
                          />
                        ))}
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
                      <Label htmlFor="tanggalMulai">Tanggal Mulai <span className="text-red-500">*</span></Label>
                      <DatePicker
                        value={tanggalMulaiDate}
                        onChange={(date) => {
                          setTanggalMulaiDate(date);
                          handleChange('tanggalMulai', date ? formatDate(date, "dd MMMM yyyy", { locale: idLocale }) : "");
                          // Reset tanggal selesai if it's before the new tanggal mulai
                          if (date && tanggalSelesaiDate && tanggalSelesaiDate < date) {
                            setTanggalSelesaiDate(undefined);
                            handleChange("tanggalSelesai", "");
                          }
                        }}
                        placeholder="Pilih tanggal mulai"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tanggalSelesai">Tanggal Selesai <span className="text-red-500">*</span></Label>
                      <DatePicker
                        value={tanggalSelesaiDate}
                        onChange={(date) => {
                          setTanggalSelesaiDate(date);
                          handleChange('tanggalSelesai', date ? formatDate(date, "dd MMMM yyyy", { locale: idLocale }) : "");
                        }}
                        placeholder="Pilih tanggal selesai"
                        fromDate={tanggalMulaiDate}
                      />
                    </div>
                  </div>
                </div>
              </div>

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
