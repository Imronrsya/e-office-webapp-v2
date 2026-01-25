"use client";

import { UniversalDashboard } from "@/features/dashboard/components/universal-dashboard";

interface WadekDashboardProps {
  wadekNumber: string;
}

export default function WadekDashboard({ wadekNumber }: WadekDashboardProps) {
  return <UniversalDashboard />;
}
