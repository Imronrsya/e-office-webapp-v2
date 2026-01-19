import StatsCard from "@/features/dashboard/components/stats-card";
import RecentActivity from "@/features/dashboard/components/recent-activity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dasbor</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <StatsCard />
        <RecentActivity />
      </div>
    </div>
  );
}
