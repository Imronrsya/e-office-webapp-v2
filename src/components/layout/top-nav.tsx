"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Settings, PenTool } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRoleLabel } from "@/lib/role-mapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// TembusanBadge removed from navbar - tembusan is accessible via sidebar

export default function TopNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  // Roles yang bisa mengakses manajemen tanda tangan
  const SIGNATURE_MANAGEMENT_ROLES = ['KAPRODI', 'KADEP', 'DEKAN', 'WADEK_1', 'WADEK_2'];
  const canManageSignature = user?.role && SIGNATURE_MANAGEMENT_ROLES.includes(user.role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-gray-100">
      <div className="flex items-center justify-between py-2 sm:py-3 pr-2">
        {/* Kiri: Hamburger (aligned with sidebar icons) + Logo & Institusi */}
        <div className="flex items-center">
          <div className="flex w-12 shrink-0 items-center justify-center">
            <button
              onClick={toggleSidebar}
              className="flex size-8 items-center justify-center rounded-full text-base-gray transition-colors hover:bg-gray-200 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <Menu className="size-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2">
            <div className="relative h-9 w-8 sm:h-12 sm:w-10 overflow-hidden shrink-0">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo-undip.svg`}
                alt="Logo Universitas Diponegoro"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col justify-center">
              <span className="text-sm font-bold leading-tight text-base-black">
                Fakultas Sains dan Matematika
              </span>
              <span className="text-sm font-normal leading-tight text-base-black">
                Universitas Diponegoro
              </span>
            </div>
            <span className="sm:hidden text-xs font-bold leading-tight text-base-black">
              FSM UNDIP
            </span>
          </div>
        </div>

        {/* Tengah: Navigation links (SUPERADMIN only) - Dihapus sesuai permintaan */}

        {/* Kanan: Tembusan Badge & User Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Profile Dropdown */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                id="user-menu-button"
                suppressHydrationWarning
                className="flex cursor-pointer items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white p-1.5 sm:p-2 pr-2 sm:pr-3 transition-colors hover:bg-gray-50 focus:outline-none"
              >
                {loading || !user ? (
                  <>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-200 animate-pulse" />
                    <div className="hidden sm:flex flex-col gap-1">
                      <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                    </div>
                    <ChevronDown className="size-4 text-gray-400" />
                  </>
                ) : (
                  <>
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-gray-200 bg-white">
                      <AvatarImage
                        src={user?.image || `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/default-avatar.svg`}
                        alt={user?.name || "User Avatar"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs sm:text-sm">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-bold text-black">
                        {user?.name || ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user?.role ? getRoleLabel(user.role) : ""}
                      </span>
                    </div>
                    <ChevronDown
                      className={`size-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"
                        }`}
                    />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56">

              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  setDropdownOpen(false);
                  router.push("/pengaturan/profil");
                }}
              >
                <Settings className="size-4" />
                <span className="font-medium">Pengaturan</span>
              </DropdownMenuItem>

              {canManageSignature && (
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={() => {
                    setDropdownOpen(false);
                    router.push("/pengaturan/tanda-tangan");
                  }}
                >
                  <PenTool className="size-4" />
                  <span className="font-medium">Kelola Tanda Tangan</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 text-logout focus:bg-logout/10 focus:text-logout"
                onSelect={(e) => {
                  e.preventDefault();
                  setDropdownOpen(false);
                  setShowLogoutDialog(true);
                }}
              >
                <LogOut className="size-4" />
                <span className="font-medium">Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AlertDialog Konfirmasi Logout */}
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin keluar dari sistem? Anda perlu masuk
                  kembali untuk mengakses aplikasi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoggingOut}>
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-logout text-logout-foreground hover:bg-logout-hover"
                >
                  {isLoggingOut ? "Sedang keluar..." : "Ya, Keluar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}