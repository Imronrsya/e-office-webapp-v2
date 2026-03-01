'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDraftSurat } from '../../context/draft-surat-context';
import { ChevronLeft, ChevronRight, Plus, Trash2, User } from 'lucide-react';

// Use proper role constants that match backend ROLES
const JABATAN_OPTIONS = [
  { value: 'DEKAN', label: 'Dekan' },
  { value: 'WADEK_1', label: 'Wakil Dekan I' },
  { value: 'WADEK_2', label: 'Wakil Dekan II' },
  { value: 'KADEP', label: 'Ketua Departemen' },
  { value: 'KAPRODI', label: 'Ketua Program Studi' },
];

export function SignerConfigStep() {
  const { state, addSigner, removeSigner, updateSigner, nextStep, prevStep } = useDraftSurat();

  const handleAddSigner = () => {
    if (state.signers.length >= 4) {
      alert('Maksimal 4 penandatangan');
      return;
    }
    addSigner();
  };

  const handleSubmit = () => {
    if (state.signers.length === 0) {
      alert('Tambahkan minimal 1 penandatangan');
      return;
    }

    // Validate all signers have required fields
    const invalidSigner = state.signers.find(s => !s.name || !s.role);
    if (invalidSigner) {
      alert('Lengkapi data semua penandatangan (nama dan jabatan wajib diisi)');
      return;
    }

    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Konfigurasi Penandatangan</h2>
          <p className="text-muted-foreground mt-1">
            Tambahkan pejabat yang akan menandatangani surat ini
          </p>
        </div>
        <Button onClick={handleAddSigner} disabled={state.signers.length >= 4}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Penandatangan
        </Button>
      </div>

      {state.signers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Penandatangan</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Tambahkan pejabat yang akan menandatangani surat ini. Maksimal 4 penandatangan.
            </p>
            <Button onClick={handleAddSigner}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Penandatangan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.signers.map((signer, index) => (
            <Card key={signer.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                        ${signer.color === 'blue' ? 'bg-blue-500' : ''}
                        ${signer.color === 'emerald' ? 'bg-emerald-500' : ''}
                        ${signer.color === 'purple' ? 'bg-purple-500' : ''}
                        ${signer.color === 'amber' ? 'bg-amber-500' : ''}
                        ${signer.color === 'rose' ? 'bg-rose-500' : ''}
                        ${signer.color === 'cyan' ? 'bg-cyan-500' : ''}
                      `}
                    >
                      {index + 1}
                    </div>
                    <CardTitle className="text-base">Penandatangan {index + 1}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSigner(signer.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Awalan/Keterangan (Opsional)</Label>
                  <Textarea
                    value={signer.prefix}
                    onChange={(e) => updateSigner(signer.id, { prefix: e.target.value })}
                    placeholder="Contoh: Mengetahui,"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jabatan *</Label>
                  <Select
                    value={signer.role}
                    onValueChange={(value) => updateSigner(signer.id, { role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {JABATAN_OPTIONS.map((jabatan) => (
                        <SelectItem key={jabatan.value} value={jabatan.value}>
                          {jabatan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nama Lengkap *</Label>
                  <Input
                    value={signer.name}
                    onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                    placeholder="Dr. Nama Lengkap, S.Si., M.T."
                  />
                </div>

                <div className="space-y-2">
                  <Label>NIP</Label>
                  <Input
                    value={signer.nip}
                    onChange={(e) => updateSigner(signer.id, { nip: e.target.value })}
                    placeholder="NIP. 197403171998021001"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep} className="text-base-black font-medium">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <Button onClick={handleSubmit} disabled={state.signers.length === 0}>
          Lanjut - Atur Posisi TTD
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
