"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, Plus, FilePlus, Users, Building2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { BuatSuratDialog } from "@/features/dashboard/components/buat-surat-dialog";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tembusan",
    href: "/tembusan",
    icon: Mail,
  },
];

// Menu untuk SUPERADMIN: urutan Dashboard → Manajemen Pengguna → Pengaturan Departemen → Tembusan
const superAdminMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Manajemen Pengguna",
    href: "/pengguna",
    icon: Users,
  },
  {
    title: "Pengaturan Departemen",
    href: "/pengaturan",
    icon: Building2,
  },
  {
    title: "Tembusan",
    href: "/tembusan",
    icon: Mail,
  },
];

// Roles that show "Ajukan Surat" button
const PENGAJU_ROLES = ["MAHASISWA", "DOSEN", "PENGAJU"];
// Roles that show "Buat Surat" button (opens dialog)
const STAFF_ROLES = ["STAF_AKADEMIK", "STAF_SUMBER_DAYA"];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [buatSuratDialogOpen, setBuatSuratDialogOpen] = useState(false);

  const role = user?.role?.toUpperCase() || "";
  const showAjukanSurat = PENGAJU_ROLES.includes(role);
  const showBuatSurat = STAFF_ROLES.includes(role);
  const isSuperAdmin = role === "SUPERADMIN";

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="top-18 border-none bg-gray-100"
      >
        <SidebarContent className="overflow-hidden bg-gray-100 pt-4">
          {/* Action Button: Ajukan Surat / Buat Surat */}
          {(showAjukanSurat || showBuatSurat) && (
            <SidebarGroup className="px-2 py-0">
              <SidebarGroupContent>
                {showAjukanSurat && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/pengajuan/buat"
                        onClick={(e) => {
                          if (pathname === "/pengajuan/buat") {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent("reset-scroll"));
                          }
                        }}
                        className="flex h-8 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary text-primary-foreground shadow-md transition-[width,height,padding] duration-200 hover:bg-primary/90 hover:shadow-lg group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
                      >
                        <Plus className="size-4 shrink-0" />
                        <span className="text-sm font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden">
                          Ajukan Surat
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Ajukan Surat</TooltipContent>
                  </Tooltip>
                )}
                {showBuatSurat && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setBuatSuratDialogOpen(true)}
                        className="flex h-8 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-primary text-primary-foreground shadow-md transition-[width,height,padding] duration-200 hover:bg-primary/90 hover:shadow-lg group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
                      >
                        <FilePlus className="size-4 shrink-0" />
                        <span className="text-sm font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden">
                          Buat Surat
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Buat Surat</TooltipContent>
                  </Tooltip>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {(showAjukanSurat || showBuatSurat) && (
            <SidebarSeparator className="mx-2" />
          )}

          {/* Navigation Menu */}
          <SidebarGroup className="px-2 py-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {/* Render items berdasarkan role: superAdmin atau regular */}
                {(isSuperAdmin ? superAdminMenuItems : menuItems).map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        size="default"
                        className={cn(
                          "rounded-full transition-colors duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                            : "text-sidebar-foreground hover:bg-gray-200 hover:text-base-black"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4 shrink-0" />
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* BuatSuratDialog rendered outside Sidebar to avoid portal/z-index issues */}
      {showBuatSurat && (
        <BuatSuratDialog
          open={buatSuratDialogOpen}
          onOpenChange={setBuatSuratDialogOpen}
          userRole={role}
        />
      )}
    </>
  );
}
