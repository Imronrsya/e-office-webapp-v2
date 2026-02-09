"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TembusanBadge } from "./tembusan-badge";

export default function TopNav() {
  const { user, loading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 bg-gray-100 shadow-sm">
      <div className="mx-auto max-w-[1440px] px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Kiri: Logo & Institusi */}
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-10 overflow-hidden">
              <Image
                src="/logo-undip.svg"
                alt="Logo Universitas Diponegoro"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold leading-tight text-base-black">
                Fakultas Sains dan Matematika
              </span>
              <span className="text-sm font-normal leading-tight text-base-black">
                Universitas Diponegoro
              </span>
            </div>
          </div>

          {/* Kanan: Tembusan Badge & User Profile Dropdown */}
          <div className="flex items-center gap-3">
            {user && <TembusanBadge />}

            {/* Profile Dropdown */}
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  id="user-menu-button"
                  suppressHydrationWarning
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 pr-3 transition-colors hover:bg-gray-50 focus:outline-none"
                >
                  {loading || !user ? (
                    <>
                      <div className="h-10 w-10 rounded-full bg-zinc-200 animate-pulse" />
                      <div className="flex flex-col gap-1">
                        <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                      </div>
                      <ChevronDown className="size-4 text-gray-400" />
                    </>
                  ) : (
                    <>
                      <Avatar className="h-10 w-10 bg-zinc-300">
                        <AvatarImage src={user?.image || "https://placehold.co/48x48"} />
                        <AvatarFallback className="bg-base-black text-base-white">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-black">
                          {user?.name || ""}
                        </span>
                        <span className="text-xs capitalize text-gray-500">
                          {user?.role ? user.role.toLowerCase().replace(/_/g, " ") : ""}
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

              <DropdownMenuContent align="end" sideOffset={8} className="w-48">
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
      </div>
    </header>
  );
}