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

  // Fungsi validasi NIP - mengembalikan pesan error atau string kosong jika valid
  const getNIPError = (nip: string): string => {
    if (!nip || nip.trim() === '') {
      return 'NIP harus diisi!';
    }
    
    if (!/^\d+$/.test(nip)) {
      return 'NIP harus berupa angka!';
    }
    
    if (nip.length !== 18) {
      return `NIP harus tepat 18 karakter (saat ini: ${nip.length} karakter)`;
    }
    
    return '';
  };

  // Fungsi validasi NIM - mengembalikan pesan error atau string kosong jika valid
  const getNIMError = (nim: string): string => {
    if (!nim || nim.trim() === '') {
      return 'NIM harus diisi!';
    }
    
    if (!/^\d+$/.test(nim)) {
      return 'NIM harus berupa angka!';
    }
    
    if (nim.length !== 14) {
      return `NIM harus tepat 14 karakter (saat ini: ${nim.length} karakter)`;
    }
    
    return '';
  };

  // Hitung error NIP/NIM secara langsung dari state (tidak pakai useEffect)
  const nipError = !isPengajuMahasiswa ? getNIPError(formValues.nimMahasiswa) : '';
  const nimError = isPengajuMahasiswa ? getNIMError(formValues.nimMahasiswa) : '';

  // Fungsi validasi Nama - mengembalikan pesan error atau string kosong jika valid
  const getNamaError = (nama: string, label: string = 'Nama'): string => {
    if (!nama || nama.trim() === '') {
      return `${label} harus diisi!`;
    }
    
    if (nama.length > 100) {
      return `${label} maksimal 100 karakter (saat ini: ${nama.length} karakter)`;
    }
    
    // Tidak boleh mengandung angka
    if (/\d/.test(nama)) {
      return `${label} tidak boleh mengandung angka!`;
    }
    
    // Hanya huruf, spasi, dan tanda baca , . - ' yang diperbolehkan
    if (!/^[a-zA-Z\s,.'-]+$/.test(nama)) {
      return `${label} hanya boleh berisi huruf dan tanda baca (, . - ')`;
    }
    
    // Tidak boleh spasi ganda
    if (/\s{2,}/.test(nama)) {
      return `${label} tidak boleh memiliki spasi ganda!`;
    }
    
    return '';
  };

  // Hitung error Nama secara langsung dari state
  const namaError = getNamaError(formValues.namaMahasiswa, isPengajuMahasiswa ? 'Nama Mahasiswa' : 'Nama Dosen');
  const namaTujuanError = getNamaError(formValues.namaTujuan, 'Nama Tujuan');

  // Fungsi validasi Keperluan - mengembalikan pesan error atau string kosong jika valid
  const getKeperluanError = (keperluan: string): string => {
    if (!keperluan || keperluan.trim() === '') {
      return 'Keperluan harus diisi!';
    }
    
    if (keperluan.trim().length < 5) {
      return `Keperluan minimal 5 karakter (saat ini: ${keperluan.trim().length} karakter)`;
    }
    
    if (keperluan.length > 150) {
      return `Keperluan maksimal 150 karakter (saat ini: ${keperluan.length} karakter)`;
    }
    
    // Tidak boleh hanya berisi angka
    if (/^\d+$/.test(keperluan.trim())) {
      return 'Keperluan tidak boleh hanya berisi angka!';
    }
    
    return '';
  };

  // Hitung error Keperluan secara langsung dari state
  const keperluanError = getKeperluanError(formValues.keperluan);

  // Fungsi validasi Jabatan Tujuan - required
  const getJabatanTujuanError = (jabatan: string): string => {
    if (!jabatan || jabatan.trim() === '') {
      return 'Jabatan Tujuan harus diisi!';
    }
    
    if (jabatan.length > 150) {
      return `Jabatan Tujuan maksimal 150 karakter (saat ini: ${jabatan.length} karakter)`;
    }
    
    return '';
  };

  // Hitung error Jabatan Tujuan secara langsung dari state
  const jabatanTujuanError = getJabatanTujuanError(formValues.jabatanTujuan);

  // Fungsi validasi Alamat Tujuan - required
  const getAlamatTujuanError = (alamat: string): string => {
    if (!alamat || alamat.trim() === '') {
      return 'Alamat Tujuan harus diisi!';
    }
    
    if (alamat.length > 300) {
      return `Alamat Tujuan maksimal 300 karakter (saat ini: ${alamat.length} karakter)`;
    }
    
    return '';
  };

  // Hitung error Alamat Tujuan secara langsung dari state
  const alamatTujuanError = getAlamatTujuanError(formValues.alamatTujuan);

  // Fungsi validasi Judul Kegiatan/Proposal - required
  const getJudulKegiatanError = (judul: string): string => {
    if (!judul || judul.trim() === '') {
      return 'Judul Kegiatan/Proposal harus diisi!';
    }
    
    if (judul.trim().length < 5) {
      return `Judul minimal 5 karakter (saat ini: ${judul.trim().length} karakter)`;
    }
    
    if (judul.length > 150) {
      return `Judul maksimal 150 karakter (saat ini: ${judul.length} karakter)`;
    }
    
    // Tidak boleh hanya berisi angka
    if (/^\d+$/.test(judul.trim())) {
      return 'Judul tidak boleh hanya berisi angka!';
    }
    
    // Tidak boleh ada enter (newline)
    if (/[\r\n]/.test(judul)) {
      return 'Judul tidak boleh mengandung enter/baris baru!';
    }
    
    return '';
  };

  // Hitung error Judul Kegiatan secara langsung dari state
  const judulAcaraError = getJudulKegiatanError(formValues.judulAcara);

  // Fungsi validasi Lokasi Kegiatan - required
  const getLokasiKegiatanError = (lokasi: string): string => {
    if (!lokasi || lokasi.trim() === '') {
      return 'Lokasi Kegiatan harus diisi!';
    }
    
    if (lokasi.trim().length < 5) {
      return `Lokasi minimal 5 karakter (saat ini: ${lokasi.trim().length} karakter)`;
    }
    
    if (lokasi.length > 150) {
      return `Lokasi maksimal 150 karakter (saat ini: ${lokasi.length} karakter)`;
    }
    
    // Tidak boleh hanya berisi angka
    if (/^\d+$/.test(lokasi.trim())) {
      return 'Lokasi tidak boleh hanya berisi angka!';
    }
    
    // Tidak boleh ada enter (newline)
    if (/[\r\n]/.test(lokasi)) {
      return 'Lokasi tidak boleh mengandung enter/baris baru!';
    }
    
    return '';
  };

  // Hitung error Lokasi Kegiatan secara langsung dari state
  const lokasiAcaraError = getLokasiKegiatanError(formValues.lokasiAcara);

  // Fungsi validasi Perihal - sama seperti Keperluan (required, 5-150 chars, not numbers only)
  const getPerihalError = (perihal: string): string => {
    if (!perihal || perihal.trim() === '') {
      return 'Perihal harus diisi!';
    }
    
    if (perihal.trim().length < 5) {
      return `Perihal minimal 5 karakter (saat ini: ${perihal.trim().length} karakter)`;
    }
    
    if (perihal.length > 150) {
      return `Perihal maksimal 150 karakter (saat ini: ${perihal.length} karakter)`;
    }
    
    // Tidak boleh hanya berisi angka
    if (/^\d+$/.test(perihal.trim())) {
      return 'Perihal tidak boleh hanya berisi angka!';
    }
    
    return '';
  };

  // Hitung error Perihal secara langsung dari state
  const perihalError = getPerihalError(formValues.perihal);

  // Fungsi validasi Nomor Surat - required, max 50 chars
  const getNomorSuratError = (nomorSurat: string): string => {
    if (!nomorSurat || nomorSurat.trim() === '') {
      return 'Nomor Surat harus diisi!';
    }
    
    if (nomorSurat.length > 50) {
      return `Nomor Surat maksimal 50 karakter (saat ini: ${nomorSurat.length} karakter)`;
    }
    
    return '';
  };

  // Hitung error Nomor Surat secara langsung dari state
  const nomorSuratError = getNomorSuratError(formValues.nomorSurat);

  // Fungsi validasi Tanggal Surat - required (harus diisi)
  const getTanggalSuratError = (tanggalSurat: string): string => {
    if (!tanggalSurat || tanggalSurat.trim() === '') {
      return 'Tanggal Surat harus diisi!';
    }
    
    return '';
  };

  // Hitung error Tanggal Surat secara langsung dari state
  const tanggalSuratError = getTanggalSuratError(formValues.tanggalSurat);

  const handleChange = (field: keyof SuratPengantarFormData, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Perihal sebelum submit
    if (perihalError) {
      return; // Jangan lanjut jika perihal tidak valid
    }
    
    // Validasi Nomor Surat sebelum submit
    if (nomorSuratError) {
      return; // Jangan lanjut jika nomor surat tidak valid
    }
    
    // Validasi Tanggal Surat sebelum submit
    if (tanggalSuratError) {
      return; // Jangan lanjut jika tanggal surat tidak valid
    }
    
    // Validasi Keperluan sebelum submit
    if (keperluanError) {
      return; // Jangan lanjut jika keperluan tidak valid
    }
    
    // Validasi Jabatan Tujuan sebelum submit
    if (jabatanTujuanError) {
      return; // Jangan lanjut jika jabatan tujuan tidak valid
    }
    
    // Validasi Alamat Tujuan sebelum submit
    if (alamatTujuanError) {
      return; // Jangan lanjut jika alamat tujuan tidak valid
    }
    
    // Validasi Judul Kegiatan sebelum submit
    if (judulAcaraError) {
      return; // Jangan lanjut jika judul kegiatan tidak valid
    }
    
    // Validasi Lokasi Kegiatan sebelum submit
    if (lokasiAcaraError) {
      return; // Jangan lanjut jika lokasi kegiatan tidak valid
    }
    
    // Validasi Nama sebelum submit
    if (namaError) {
      return; // Jangan lanjut jika nama tidak valid
    }
    
    // Validasi Nama Tujuan sebelum submit
    if (namaTujuanError) {
      return; // Jangan lanjut jika nama tujuan tidak valid
    }
    
    // Validasi NIM/NIP sebelum submit
    if (isPengajuMahasiswa && nimError) {
      return; // Jangan lanjut jika NIM tidak valid
    }
    if (!isPengajuMahasiswa && nipError) {
      return; // Jangan lanjut jika NIP tidak valid
    }
    
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
                  <Label htmlFor="nomorSurat">Nomor Surat <span className="text-red-500">*</span></Label>
                  <Input
                    id="nomorSurat"
                    value={formValues.nomorSurat}
                    onChange={(e) => handleChange('nomorSurat', e.target.value)}
                    placeholder="xxx/UN7.F8.1/AK/2025"
                    required
                    className={nomorSuratError ? 'border-red-500' : ''}
                  />
                  {nomorSuratError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {nomorSuratError}
                    </p>
                  )}
                  {!nomorSuratError && formValues.nomorSurat && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <span>✓</span> Nomor Surat valid
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalSurat">Tanggal Surat <span className="text-red-500">*</span></Label>
                  <Input
                    id="tanggalSurat"
                    value={formValues.tanggalSurat}
                    onChange={(e) => handleChange('tanggalSurat', e.target.value)}
                    placeholder="25 Juni 2025"
                    required
                    className={tanggalSuratError ? 'border-red-500' : ''}
                  />
                  {tanggalSuratError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="font-medium">⚠</span> {tanggalSuratError}
                    </p>
                  )}
                  {!tanggalSuratError && formValues.tanggalSurat && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <span>✓</span> Tanggal Surat valid
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perihal">Perihal <span className="text-red-500">*</span></Label>
                <Input
                  id="perihal"
                  value={formValues.perihal}
                  onChange={(e) => handleChange('perihal', e.target.value)}
                  placeholder="Permohonan Izin Magang Mandiri"
                  required
                  className={perihalError ? 'border-red-500' : ''}
                />
                {perihalError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {perihalError}
                  </p>
                )}
                {!perihalError && formValues.perihal && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span>✓</span> Perihal valid
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Tujuan Surat</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaTujuan">Nama Penerima <span className="text-red-500">*</span></Label>
                    <Input
                      id="namaTujuan"
                      value={formValues.namaTujuan}
                      onChange={(e) => handleChange('namaTujuan', e.target.value)}
                      placeholder="Nama pejabat/instansi tujuan"
                      required
                      className={namaTujuanError ? 'border-red-500' : ''}
                    />
                    {namaTujuanError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {namaTujuanError}
                      </p>
                    )}
                    {!namaTujuanError && formValues.namaTujuan && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <span>✓</span> Nama Tujuan valid
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jabatanTujuan">Jabatan Penerima <span className="text-red-500">*</span></Label>
                    <Input
                      id="jabatanTujuan"
                      value={formValues.jabatanTujuan}
                      onChange={(e) => handleChange('jabatanTujuan', e.target.value)}
                      placeholder="Kepala Dinas/Direktur/dll"
                      required
                      className={jabatanTujuanError ? 'border-red-500' : ''}
                    />
                    {jabatanTujuanError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {jabatanTujuanError}
                      </p>
                    )}
                    {!jabatanTujuanError && formValues.jabatanTujuan && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <span>✓</span> Jabatan Tujuan valid
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamatTujuan">Alamat Tujuan <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="alamatTujuan"
                      value={formValues.alamatTujuan}
                      onChange={(e) => handleChange('alamatTujuan', e.target.value)}
                      placeholder="Alamat lengkap instansi tujuan"
                      rows={2}
                      required
                      className={alamatTujuanError ? 'border-red-500' : ''}
                    />
                    {alamatTujuanError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {alamatTujuanError}
                      </p>
                    )}
                    {!alamatTujuanError && formValues.alamatTujuan && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <span>✓</span> Alamat Tujuan valid
                      </p>
                    )}
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
                      className={keperluanError ? "border-red-500 focus-visible:ring-red-500" : ""}
                      required
                    />
                    {keperluanError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {keperluanError}
                      </p>
                    )}
                    {!keperluanError && formValues.keperluan && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <span>✓</span> Keperluan valid
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="namaMahasiswa">{isPengajuMahasiswa ? "Nama Mahasiswa" : "Nama Dosen"}</Label>
                      <Input
                        id="namaMahasiswa"
                        value={formValues.namaMahasiswa}
                        onChange={(e) => handleChange('namaMahasiswa', e.target.value)}
                        placeholder={isPengajuMahasiswa ? "Nama lengkap mahasiswa" : "Nama lengkap dosen"}
                        className={namaError ? "border-red-500 focus-visible:ring-red-500" : ""}
                        required
                      />
                      {namaError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {namaError}
                        </p>
                      )}
                      {!namaError && formValues.namaMahasiswa && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <span>✓</span> {isPengajuMahasiswa ? 'Nama Mahasiswa' : 'Nama Dosen'} valid
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nimMahasiswa">{isPengajuMahasiswa ? "NIM" : "NIP"}</Label>
                      <Input
                        id="nimMahasiswa"
                        value={formValues.nimMahasiswa}
                        onChange={(e) => handleChange('nimMahasiswa', e.target.value)}
                        placeholder={isPengajuMahasiswa ? "24060122xxxxxx" : "198501152010121001"}
                        className={(isPengajuMahasiswa && nimError) || (!isPengajuMahasiswa && nipError) ? "border-red-500 focus-visible:ring-red-500" : ""}
                        required
                      />
                      {/* Validasi NIM untuk Mahasiswa */}
                      {isPengajuMahasiswa && nimError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {nimError}
                        </p>
                      )}
                      {isPengajuMahasiswa && !nimError && formValues.nimMahasiswa && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <span>✓</span> NIM valid
                        </p>
                      )}
                      {/* Validasi NIP untuk Dosen */}
                      {!isPengajuMahasiswa && nipError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {nipError}
                        </p>
                      )}
                      {!isPengajuMahasiswa && !nipError && formValues.nimMahasiswa && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <span>✓</span> NIP valid
                        </p>
                      )}
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
                    <Label htmlFor="judulAcara">Judul Proposal/Kegiatan <span className="text-red-500">*</span></Label>
                    <Input
                      id="judulAcara"
                      value={formValues.judulAcara}
                      onChange={(e) => {
                        // Filter out newlines
                        const filtered = e.target.value.replace(/[\r\n]/g, '');
                        handleChange('judulAcara', filtered);
                      }}
                      placeholder="Judul proposal atau keterangan kegiatan"
                      className={judulAcaraError ? 'border-red-500' : ''}
                    />
                    {judulAcaraError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {judulAcaraError}
                      </p>
                    )}
                    {!judulAcaraError && formValues.judulAcara && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <span>✓</span> Judul valid
                      </p>
                    )}
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
                      <Label htmlFor="lokasiAcara">Lokasi <span className="text-red-500">*</span></Label>
                      <Input
                        id="lokasiAcara"
                        value={formValues.lokasiAcara}
                        onChange={(e) => {
                          // Filter out newlines
                          const filtered = e.target.value.replace(/[\r\n]/g, '');
                          handleChange('lokasiAcara', filtered);
                        }}
                        placeholder="Nama instansi/lokasi"
                        className={lokasiAcaraError ? 'border-red-500' : ''}
                      />
                      {lokasiAcaraError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {lokasiAcaraError}
                        </p>
                      )}
                      {!lokasiAcaraError && formValues.lokasiAcara && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <span>✓</span> Lokasi valid
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button type="submit" disabled={!!perihalError || !!nomorSuratError || !!tanggalSuratError || !!keperluanError || !!namaError || !!namaTujuanError || !!jabatanTujuanError || !!alamatTujuanError || !!judulAcaraError || !!lokasiAcaraError || (isPengajuMahasiswa && !!nimError) || (!isPengajuMahasiswa && !!nipError)}>
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
