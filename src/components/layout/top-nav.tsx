"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2 } from "lucide-react";

const navItems = [
  { label: "Dasbor", href: "/dashboard" },
  { label: "Pengguna", href: "/pengguna" },
  { label: "Pengajuan", href: "/pengajuan" },
  { label: "Nomor", href: "/nomor" },
  { label: "Pengaturan", href: "/pengaturan" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">
              Fakultas Sains dan Matematika
            </h1>
            <p className="text-xs text-muted-foreground">
              Universitas Diponegoro
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm transition-colors rounded-md ${
                  isActive
                    ? "font-medium border-b-2 border-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar>
                <AvatarFallback className="bg-black text-white">
                  M
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">Muhammad Bhaeka</p>
                <p className="text-xs text-muted-foreground">Operator</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
