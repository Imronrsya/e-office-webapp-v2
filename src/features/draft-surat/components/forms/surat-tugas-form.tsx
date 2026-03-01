'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDraftSurat, SuratTugasFormData } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Eye, ClipboardList, ChevronsUpDown, Check, Search } from 'lucide-react';
import { suratTugasTemplate } from '@/lib/templates/surat-tugas';
import {
  suratTugasStaffSchema,
  type SuratTugasStaffFormData,
} from '@/lib/validators/surat-tugas-schema';
import { cn } from '@/lib/utils';

// Program Studi list for FSM UNDIP
const PROGRAM_STUDI_LIST = [
  "S1 Matematika",
  "S2 Matematika",
  "S1 Biologi",
  "S1 Bioteknologi",
  "S2 Biologi",
  "S1 Fisika",
  "S2 Fisika",
  "Profesi Fisikawan Medik",
  "S1 Kimia",
  "S2 Kimia",
  "S1 Statistika",
  "S1 Informatika",
];

interface SuratTugasFormProps {
  initialData?: Partial<SuratTugasFormData>;
}

export function SuratTugasForm({ initialData }: SuratTugasFormProps) {
  const { state, setFormData, nextStep, prevStep } = useDraftSurat();
  const [showPreview, setShowPreview] = useState(false);
  const [prodiOpen, setProdiOpen] = useState(false);
  const [prodiSearch, setProdiSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filter program studi list based on search
  const filteredProdiList = PROGRAM_STUDI_LIST.filter((prodi) =>
    prodi.toLowerCase().includes(prodiSearch.toLowerCase())
  );

  // Focus search input when popover opens
  useEffect(() => {
    if (prodiOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setProdiSearch('');
    }
  }, [prodiOpen]);

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
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Form Surat Tugas
            </CardTitle>
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

                {/* Program Studi - Searchable Dropdown */}
                <FormField
                  control={form.control}
                  name="programStudi"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Program Studi</FormLabel>
                      <Popover open={prodiOpen} onOpenChange={setProdiOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={prodiOpen}
                              className={cn(
                                "w-full justify-between bg-white font-normal h-9",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Pilih program studi..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom" avoidCollisions={false}>
                          {/* Search Input */}
                          <div className="flex items-center border-b px-3 py-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              ref={searchInputRef}
                              placeholder="Cari program studi..."
                              value={prodiSearch}
                              onChange={(e) => setProdiSearch(e.target.value)}
                              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                          </div>
                          {/* List */}
                          <div className="max-h-[200px] overflow-y-auto p-1">
                            {filteredProdiList.length === 0 ? (
                              <p className="py-4 text-center text-sm text-muted-foreground">
                                Program studi tidak ditemukan.
                              </p>
                            ) : (
                              filteredProdiList.map((prodi) => (
                                <button
                                  key={prodi}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(prodi);
                                    setProdiOpen(false);
                                  }}
                                  className={cn(
                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                    field.value === prodi && "bg-accent text-accent-foreground"
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === prodi ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {prodi}
                                </button>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
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
