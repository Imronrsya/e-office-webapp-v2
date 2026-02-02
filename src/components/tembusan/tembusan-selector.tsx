'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, X, User, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { userService, TembusanUser, TembusanRecipient } from '@/services/user.service';
import { cn } from '@/lib/utils';

interface TembusanSelectorProps {
  value: TembusanRecipient[];
  onChange: (recipients: TembusanRecipient[]) => void;
  submitter?: {
    id: string;
    name: string;
    nim?: string;
    nip?: string;
  };
  disabled?: boolean;
  className?: string;
}

export function TembusanSelector({
  value = [],
  onChange,
  submitter,
  disabled = false,
  className
}: TembusanSelectorProps) {
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
        const selectedIds = new Set(value.map(r => r.userId));
        const filtered = result.data.filter(user => {
          if (selectedIds.has(user.id)) return false;
          if (submitter && user.id === submitter.id) return false;
          if (selectedType !== 'all' && user.type !== selectedType) return false;
          return true;
        });
        setSearchResults(filtered);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, value, submitter, selectedType]);

  const handleSelectUser = useCallback((user: TembusanUser) => {
    const recipient = userService.userToRecipient(user);
    onChange([...value, recipient]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [value, onChange]);

  const handleRemoveRecipient = useCallback((userId: string) => {
    onChange(value.filter(r => r.userId !== userId));
  }, [value, onChange]);

  const isSubmitterIncluded = submitter != null;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Konfigurasi Tembusan
        </CardTitle>
        <CardDescription>
          Pilih akun yang akan menerima salinan surat setelah selesai diproses.
          Pengaju otomatis mendapatkan tembusan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submitter info (auto-included) */}
        {submitter && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <Check className="h-4 w-4" />
              Pengaju (Otomatis)
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-sm">{submitter.name}</p>
                <p className="text-xs text-muted-foreground">
                  {submitter.nim ? `NIM: ${submitter.nim}` : submitter.nip ? `NIP: ${submitter.nip}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Search Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tambah Penerima Tembusan</span>
            <Badge variant="outline" className="text-xs">
              {value.length} dipilih
            </Badge>
          </div>

          {/* Filter by type */}
          <div className="flex gap-2">
            {(['all', 'mahasiswa', 'pegawai'] as const).map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={selectedType === type ? 'default' : 'outline'}
                onClick={() => setSelectedType(type)}
                disabled={disabled}
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
              disabled={disabled}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && searchQuery.length >= 2 && (
            <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-64 overflow-hidden">
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
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          user.type === 'mahasiswa' ? 'bg-blue-100' : 'bg-purple-100'
                        )}>
                          <User className={cn(
                            "h-4 w-4",
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
        </div>

        {/* Selected Recipients */}
        {value.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Penerima Tembusan Terpilih:</span>
            <div className="flex flex-wrap gap-2">
              {value.map((recipient) => (
                <Badge
                  key={recipient.userId}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2"
                >
                  <User className="h-3 w-3" />
                  <span>{recipient.name}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(recipient.userId)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warning if no recipients */}
        {!isSubmitterIncluded && value.length === 0 && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Belum ada penerima tembusan yang dipilih</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
