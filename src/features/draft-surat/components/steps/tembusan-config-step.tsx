'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDraftSurat, TembusanRecipient } from '../../context/draft-surat-context';
import { userService, TembusanUser } from '@/services/user.service';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  User, 
  Users, 
  Loader2, 
  Check, 
  AlertCircle,
  UserPlus,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TembusanConfigStep() {
  const { state, setTembusan, nextStep, prevStep } = useDraftSurat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TembusanUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'mahasiswa' | 'pegawai'>('all');

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const result = await userService.searchUsers(searchQuery);
      if (result.success && result.data) {
        // Filter out already selected users and submitter
        const selectedIds = new Set(state.tembusan.map(r => r.userId));
        const filtered = result.data.filter(user => {
          if (selectedIds.has(user.id)) return false;
          if (state.submitterInfo && user.id === state.submitterInfo.id) return false;
          if (selectedType !== 'all' && user.type !== selectedType) return false;
          return true;
        });
        setSearchResults(filtered);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, state.tembusan, state.submitterInfo, selectedType]);

  const handleSelectUser = useCallback((user: TembusanUser) => {
    const recipient = userService.userToRecipient(user);
    setTembusan([...state.tembusan, recipient]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [state.tembusan, setTembusan]);

  const handleRemoveRecipient = useCallback((userId: string) => {
    setTembusan(state.tembusan.filter(r => r.userId !== userId));
  }, [state.tembusan, setTembusan]);

  const handleSubmit = () => {
    // Tembusan is optional, proceed to next step
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Konfigurasi Penerima Surat</h2>
          <p className="text-muted-foreground mt-1">
            Pilih akun yang akan dapat mengakses dan mendownload surat
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          <Users className="w-4 h-4 mr-2" />
          {state.tembusan.length + (state.submitterInfo ? 1 : 0)} penerima
        </Badge>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Catatan:</strong> Akun yang dipilih di sini akan dapat <strong>mengakses dan mendownload surat</strong> setelah surat selesai diproses.<br/>
          Untuk menambahkan tembusan yang <strong>tertulis di surat</strong> (seperti "Arsip", "Pertinggal"), itu dapat dilakukan saat editing draft oleh staf/supervisor.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Search and Add */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Tambah Penerima
            </CardTitle>
            <CardDescription>
              Cari dan pilih pengguna yang akan menerima tembusan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter by type */}
            <div className="flex gap-2">
              {(['all', 'mahasiswa', 'pegawai'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={selectedType === type ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type)}
                >
                  {type === 'all' ? 'Semua' : type === 'mahasiswa' ? 'Mahasiswa' : 'Pegawai'}
                </Button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results */}
            {showResults && searchQuery.length >= 2 && (
              <Card className="shadow-lg border-2">
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {isSearching ? 'Mencari...' : 'Tidak ada hasil ditemukan'}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left transition-colors"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            user.type === 'mahasiswa' ? 'bg-blue-100' : 'bg-purple-100'
                          )}>
                            <User className={cn(
                              "h-5 w-5",
                              user.type === 'mahasiswa' ? 'text-blue-700' : 'text-purple-700'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.type === 'mahasiswa' 
                                ? `${user.identifier} • ${user.programStudi || 'Mahasiswa'}`
                                : `${user.jabatan || 'Pegawai'} • NIP: ${user.identifier}`
                              }
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {user.type === 'mahasiswa' ? 'Mahasiswa' : 'Pegawai'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {searchQuery.length < 2 && searchQuery.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Ketik minimal 2 karakter untuk mencari...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Selected Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Penerima Tembusan
            </CardTitle>
            <CardDescription>
              Penerima yang akan mendapatkan salinan surat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Submitter (Auto-included) */}
            {state.submitterInfo && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                    <Check className="h-4 w-4" />
                    Pengaju (Otomatis)
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{state.submitterInfo.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {state.submitterInfo.nim 
                          ? `NIM: ${state.submitterInfo.nim}` 
                          : state.submitterInfo.nip 
                            ? `NIP: ${state.submitterInfo.nip}` 
                            : 'Pengaju Surat'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Selected Recipients */}
            {state.tembusan.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {state.tembusan.map((recipient, index) => (
                    <div
                      key={recipient.userId}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-blue-700">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{recipient.name}</p>
                        {recipient.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {recipient.description}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRecipient(recipient.userId)}
                        className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Belum ada penerima tambahan</p>
                <p className="text-xs">Cari dan pilih pengguna dari kolom sebelah</p>
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>Daftar tembusan akan ditampilkan di bagian kiri bawah surat.</p>
                <p className="mt-1">Penerima tembusan dapat melihat dan mengunduh surat setelah selesai diproses.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <Button onClick={handleSubmit}>
          Lanjut - Penandatangan
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
