"use client";

import { useSidebar } from "@/components/ui/sidebar";

/**
 * Bridge hook that connects to shadcn's SidebarProvider context.
 * Returns null if used outside a SidebarProvider (safe fallback).
 * Used by components like BottomNav that need sidebar state optionally.
 */
export function useSidebarOptional() {
  try {
    const context = useSidebar();
    return {
      isOpen: context.open,
      toggle: context.toggleSidebar,
      state: context.state,
    };
  } catch {
    return null;
  }
}
