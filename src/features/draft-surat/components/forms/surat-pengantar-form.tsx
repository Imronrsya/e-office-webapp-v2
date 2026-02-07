'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDraftSurat, SuratPengantarFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { generateSuratPengantarHTML as suratPengantarTemplate } from '@/lib/templates/surat-pengantar';

interface SuratPengantarFormProps {
  initialData?: Partial<SuratPengantarFormData>;
  isPengajuMahasiswa?: boolean;
}

export function SuratPengantarForm({ initialData, isPengajuMahasiswa = true }: SuratPengantarFormProps) {
  const { state, setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);

  // Use stored form data from context if available, otherwise use initialData prop
  const existingData = state.formData as SuratPengantarFormData | null;

  const [formValues, setFormValues] = useState<SuratPengantarFormData>({
    nomorSurat: existingData?.nomorSurat || initialData?.nomorSurat || '',
    tanggalSurat: existingData?.tanggalSurat || initialData?.tanggalSurat || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    perihal: existingData?.perihal || initialData?.perihal || 'Permohonan Izin Magang Mandiri',
    namaTujuan: existingData?.namaTujuan || initialData?.namaTujuan || '',
    jabatanTujuan: existingData?.jabatanTujuan || initialData?.jabatanTujuan || '',
    alamatTujuan: existingData?.alamatTujuan || initialData?.alamatTujuan || '',
    keperluan: existingData?.keperluan || initialData?.keperluan || 'Magang Mandiri',
    namaMahasiswa: existingData?.namaMahasiswa || initialData?.namaMahasiswa || '',
    nimMahasiswa: existingData?.nimMahasiswa || initialData?.nimMahasiswa || '',
    programStudi: existingData?.programStudi || initialData?.programStudi || 'Informatika',
    departemen: existingData?.departemen || initialData?.departemen || 'Informatika',
    judulAcara: existingData?.judulAcara || initialData?.judulAcara || '',
    tanggalMulai: existingData?.tanggalMulai || initialData?.tanggalMulai || '',
    lokasiAcara: existingData?.lokasiAcara || initialData?.lokasiAcara || '',
    durasiAcara: existingData?.durasiAcara || initialData?.durasiAcara || '',
  });

  const handleChange = (field: keyof SuratPengantarFormData, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData(formValues);
    nextStep();
  };

  const previewHtml = suratPengantarTemplate({ ...formValues, isPengajuMahasiswa });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surat Pengantar</h2>
          <p className="text-muted-foreground mt-1">
            Isi data surat pengantar untuk permohonan izin magang/penelitian
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
            <CardTitle className="text-lg">Data Surat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorSurat">Nomor Surat</Label>
                  <Input
                    id="nomorSurat"
                    value={formValues.nomorSurat}
                    onChange={(e) => handleChange('nomorSurat', e.target.value)}
                    placeholder="xxx/UN7.F8.1/AK/2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalSurat">Tanggal Surat</Label>
                  <Input
                    id="tanggalSurat"
                    value={formValues.tanggalSurat}
                    onChange={(e) => handleChange('tanggalSurat', e.target.value)}
                    placeholder="25 Juni 2025"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perihal">Perihal</Label>
                <Input
                  id="perihal"
                  value={formValues.perihal}
                  onChange={(e) => handleChange('perihal', e.target.value)}
                  placeholder="Permohonan Izin Magang Mandiri"
                  required
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Tujuan Surat</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaTujuan">Nama Penerima</Label>
                    <Input
                      id="namaTujuan"
                      value={formValues.namaTujuan}
                      onChange={(e) => handleChange('namaTujuan', e.target.value)}
                      placeholder="Nama pejabat/instansi tujuan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jabatanTujuan">Jabatan Penerima</Label>
                    <Input
                      id="jabatanTujuan"
                      value={formValues.jabatanTujuan}
                      onChange={(e) => handleChange('jabatanTujuan', e.target.value)}
                      placeholder="Kepala Dinas/Direktur/dll"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamatTujuan">Alamat Tujuan</Label>
                    <Textarea
                      id="alamatTujuan"
                      value={formValues.alamatTujuan}
                      onChange={(e) => handleChange('alamatTujuan', e.target.value)}
                      placeholder="Alamat lengkap instansi tujuan"
                      rows={2}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">{isPengajuMahasiswa ? "Data Mahasiswa" : "Data Dosen"}</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keperluan">Jenis Kegiatan</Label>
                    <Input
                      id="keperluan"
                      value={formValues.keperluan}
                      onChange={(e) => handleChange('keperluan', e.target.value)}
                      placeholder="Magang Mandiri/Kerja Praktik/dll"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="namaMahasiswa">{isPengajuMahasiswa ? "Nama Mahasiswa" : "Nama Dosen"}</Label>
                      <Input
                        id="namaMahasiswa"
                        value={formValues.namaMahasiswa}
                        onChange={(e) => handleChange('namaMahasiswa', e.target.value)}
                        placeholder={isPengajuMahasiswa ? "Nama lengkap mahasiswa" : "Nama lengkap dosen"}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nimMahasiswa">{isPengajuMahasiswa ? "NIM" : "NIP"}</Label>
                      <Input
                        id="nimMahasiswa"
                        value={formValues.nimMahasiswa}
                        onChange={(e) => handleChange('nimMahasiswa', e.target.value)}
                        placeholder={isPengajuMahasiswa ? "24060122xxxxxx" : "198501152010121001"}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="programStudi">Program Studi</Label>
                      <Input
                        id="programStudi"
                        value={formValues.programStudi}
                        onChange={(e) => handleChange('programStudi', e.target.value)}
                        placeholder="Informatika"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departemen">Departemen</Label>
                      <Input
                        id="departemen"
                        value={formValues.departemen}
                        onChange={(e) => handleChange('departemen', e.target.value)}
                        placeholder="Informatika"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judulAcara">Judul Proposal/Kegiatan</Label>
                    <Textarea
                      id="judulAcara"
                      value={formValues.judulAcara}
                      onChange={(e) => handleChange('judulAcara', e.target.value)}
                      placeholder="Judul proposal atau keterangan kegiatan"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tanggalMulai">Tanggal Pelaksanaan</Label>
                      <Input
                        id="tanggalMulai"
                        value={formValues.tanggalMulai}
                        onChange={(e) => handleChange('tanggalMulai', e.target.value)}
                        placeholder="1 Juli s.d. 31 Agustus 2025"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lokasiAcara">Lokasi</Label>
                      <Input
                        id="lokasiAcara"
                        value={formValues.lokasiAcara}
                        onChange={(e) => handleChange('lokasiAcara', e.target.value)}
                        placeholder="Nama instansi/lokasi"
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
                  title="Preview Surat Pengantar"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
