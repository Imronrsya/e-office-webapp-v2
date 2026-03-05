"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import TopNav from "@/components/layout/top-nav";

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when navigating
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

  // Listen for manual scroll-to-top events (e.g., re-clicking same sidebar link)
  useEffect(() => {
    const handleResetScroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    };
    window.addEventListener("reset-scroll", handleResetScroll);
    return () => window.removeEventListener("reset-scroll", handleResetScroll);
  }, []);

  return (
    <SidebarProvider defaultOpen={false} className="!bg-gray-100 !overflow-hidden">
      <TopNav />
      <AppSidebar />
      <div className="relative flex w-full flex-1 flex-col h-screen overflow-hidden">
        <main className="flex flex-1 flex-col px-2 pb-2 pt-[88px] overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
            <div ref={scrollRef} className="flex flex-1 flex-col overflow-auto">
              <div className="flex flex-1 flex-col p-6 min-h-0">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
