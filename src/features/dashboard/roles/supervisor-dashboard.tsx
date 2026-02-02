"use client";

import { UniversalDashboard } from "@/features/dashboard/components/universal-dashboard";

interface SupervisorDashboardProps {
  bidang: string;
}

export default function SupervisorDashboard({ bidang }: SupervisorDashboardProps) {
  return <UniversalDashboard />;
}
