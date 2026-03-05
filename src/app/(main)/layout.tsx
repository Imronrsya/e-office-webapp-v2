import { MainLayoutClient } from "@/components/layout/main-layout-client";
import "../globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}