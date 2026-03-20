"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authService } from "@/services/auth.service";
import { useDepartemenList } from "@/hooks/useMasterData";
import { ProdiSelect } from "@/components/forms/ProdiSelect";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CompleteProfileModal() {
    const { user, checkSession } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        nim: "",
        nip: "",
        jabatan: "",
        noHp: "",
        departemenId: "",
        programStudiId: "",
        tahunMasuk: new Date().getFullYear().toString(),
    });

    const { data: departemenList, isLoading: isDeptsLoading } = useDepartemenList();

    // Roles grouping logic
    const isMahasiswa = user?.role === "MAHASISWA";
    const isPegawai = ["DOSEN", "STAF_AKADEMIK", "SUPERVISOR"].includes(user?.role || "");
    const needsProfile = (isMahasiswa || isPegawai) && !user?.profile;

    useEffect(() => {
        if (needsProfile) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [needsProfile]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            // Reset prodi when dept changes
            ...(field === "departemenId" ? { programStudiId: "" } : {}),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (isMahasiswa && (!formData.nim || !formData.tahunMasuk)) {
            toast.error("Mohon lengkapi NIM dan Tahun Masuk");
            return;
        }
        if (isPegawai && (!formData.nip || !formData.jabatan)) {
            toast.error("Mohon lengkapi NIP dan Jabatan");
            return;
        }
        if (!formData.departemenId || !formData.programStudiId || !formData.noHp) {
            toast.error("Mohon lengkapi data Departemen, Prodi, dan No HP");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await authService.updateProfile(formData);
            
            if (result.success) {
                toast.success("Profil berhasil diperbarui");
                // Refresh user context to sync profile state
                await checkSession();
                setIsOpen(false);
            } else {
                toast.error(result.message || "Gagal memperbarui profil");
            }
        } catch (error) {
            console.error("Profile update failed:", error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Do not allow closing if profile is incomplete
            if (!open && needsProfile) {
                toast.warning("Mohon lengkapi profil Anda terlebih dahulu");
                return;
            }
            setIsOpen(open);
        }}>
            <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Lengkapi Profil Anda</DialogTitle>
                    <DialogDescription>
                        Selamat datang di E-Office! Karena Anda baru pertama kali login via SSO, mohon lengkapi data profil Anda terlebih dahulu.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4">
                        {isMahasiswa && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="nim">NIM</Label>
                                    <Input
                                        id="nim"
                                        placeholder="Contoh: 24060121130001"
                                        value={formData.nim}
                                        onChange={(e) => handleInputChange("nim", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tahunMasuk">Tahun Masuk</Label>
                                    <Input
                                        id="tahunMasuk"
                                        type="number"
                                        placeholder="2024"
                                        value={formData.tahunMasuk}
                                        onChange={(e) => handleInputChange("tahunMasuk", e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {isPegawai && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="nip">NIP</Label>
                                    <Input
                                        id="nip"
                                        placeholder="Masukkan NIP Anda"
                                        value={formData.nip}
                                        onChange={(e) => handleInputChange("nip", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="jabatan">Jabatan</Label>
                                    <Input
                                        id="jabatan"
                                        placeholder={user?.role === "DOSEN" ? "Dosen" : "Staff Akademik"}
                                        value={formData.jabatan}
                                        onChange={(e) => handleInputChange("jabatan", e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="noHp">Nomor HP / WhatsApp</Label>
                            <Input
                                id="noHp"
                                placeholder="0812XXXXXXXX"
                                value={formData.noHp}
                                onChange={(e) => handleInputChange("noHp", e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="departemen">Departemen</Label>
                            <Select
                                value={formData.departemenId}
                                onValueChange={(v) => handleInputChange("departemenId", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isDeptsLoading ? "Memuat..." : "Pilih Departemen"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {departemenList?.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="prodi">Program Studi</Label>
                            <ProdiSelect
                                value={formData.programStudiId}
                                onChange={(v) => handleInputChange("programStudiId", v)}
                                filterDepartemen={formData.departemenId}
                                disabled={!formData.departemenId}
                                placeholder="Pilih Program Studi"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : "Simpan Profil"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
