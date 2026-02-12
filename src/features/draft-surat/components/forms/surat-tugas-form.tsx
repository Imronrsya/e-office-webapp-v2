'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useDraftSurat, SuratTugasFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { suratTugasTemplate } from '@/lib/templates/surat-tugas';
import {
  suratTugasStaffSchema,
  type SuratTugasStaffFormData,
} from '@/lib/validators/surat-tugas-schema';

interface SuratTugasFormProps {
  initialData?: Partial<SuratTugasFormData>;
}

export function SuratTugasForm({ initialData }: SuratTugasFormProps) {
  const { state, setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);

  // Use stored form data from context if available, otherwise use initialData prop
  const existingData = state.formData as SuratTugasFormData | null;

  // Initialize React Hook Form with Zod validation
  const form = useForm<SuratTugasStaffFormData>({
    resolver: zodResolver(suratTugasStaffSchema),
    mode: 'onChange',
    defaultValues: {
      jenisSurat: existingData?.jenisSurat || initialData?.jenisSurat || 'tugas',
      jenisSuratText: existingData?.jenisSuratText || initialData?.jenisSuratText || 'SURAT TUGAS',
      nomorSurat: existingData?.nomorSurat || initialData?.nomorSurat || '',
      namaLengkap: existingData?.namaLengkap || initialData?.namaLengkap || '',
      nimNip: existingData?.nimNip || initialData?.nimNip || '',
      programStudi: existingData?.programStudi || initialData?.programStudi || '',
      keperluan: existingData?.keperluan || initialData?.keperluan || '',
      judulSurat: existingData?.judulSurat || initialData?.judulSurat || '',
    },
  });

  const formValues = form.watch();

  const handleJenisChange = (value: 'tugas' | 'keputusan') => {
    form.setValue('jenisSurat', value);
    form.setValue(
      'jenisSuratText',
      value === 'tugas' ? 'SURAT TUGAS' : 'SURAT KEPUTUSAN'
    );
  };

  const onSubmit = (data: SuratTugasStaffFormData) => {
    setFormData(data as SuratTugasFormData);
    nextStep();
  };

  const previewHtml = suratTugasTemplate(formValues as SuratTugasFormData);

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
            <CardTitle className="text-lg">Form Surat Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Judul Surat */}
                <FormField
                  control={form.control}
                  name="judulSurat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Judul Surat <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan judul surat"
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <FormField
                    control={form.control}
                    name="namaLengkap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nama Lengkap <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nama lengkap"
                            className="bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* NIM/NIP */}
                  <FormField
                    control={form.control}
                    name="nimNip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          NIM/NIP <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NIM (14 digit) atau NIP (18 digit)"
                            className="bg-white"
                            maxLength={18}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Program Studi */}
                <FormField
                  control={form.control}
                  name="programStudi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Studi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Informatika/Dosen Departemen..."
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Keperluan */}
                <FormField
                  control={form.control}
                  name="keperluan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Keperluan <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan keperluan surat ini"
                          className="bg-white min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Judul/Topik Kegiatan (opsional) */}
                <FormField
                  control={form.control}
                  name="nomorSurat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul/Topik Kegiatan</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jelaskan judul atau topik kegiatan"
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hidden fields for jenisSurat */}
                <input type="hidden" {...form.register('jenisSurat')} />
                <input type="hidden" {...form.register('jenisSuratText')} />

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
            </Form>
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
