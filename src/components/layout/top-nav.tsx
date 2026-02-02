"use client";

import Image from "next/image";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TembusanBadge } from "./tembusan-badge";

export default function TopNav() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 bg-gray-100 shadow-sm">
      <div className="mx-auto max-w-[1440px] px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Kiri: Logo & Institusi */}
          <div className="flex items-center gap-3">
            {/* Logo Undip (SVG) */}
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
              <span className="text-sm font-bold leading-tight text-primary-base">
                Fakultas Sains dan Matematika
              </span>
              <span className="text-sm font-normal leading-tight text-primary-base">
                Universitas Diponegoro
              </span>
            </div>
          </div>

          {/* Kanan: Tembusan Badge & User Profile */}
          <div className="flex items-center gap-4">
            {/* Tembusan Badge */}
            {user && <TembusanBadge />}

            {/* User Profile */}
            <div
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 pr-4 transition hover:bg-gray-50"
              onClick={logout}
              title="Klik untuk Logout"
            >
            {loading || !user ? (
              <>
                <div className="h-10 w-10 rounded-full bg-zinc-200 animate-pulse" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-10 w-10 bg-zinc-300">
                  <AvatarImage src={user?.image || "https://placehold.co/48x48"} />
                  <AvatarFallback className="bg-primary-base text-white">
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
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}