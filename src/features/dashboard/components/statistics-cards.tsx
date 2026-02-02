"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, Hourglass } from "lucide-react";
import type { DashboardStatistics } from "../types";

interface StatisticsCardsProps {
  statistics: DashboardStatistics | null;
  loading?: boolean;
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function StatisticsCards({ statistics, loading }: StatisticsCardsProps) {
  if (loading || !statistics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-slate-50">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: StatCard[] = [
    {
      label: "Total Surat",
      value: statistics.total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Menunggu Aksi",
      value: statistics.pending ?? 0,
      icon: Hourglass,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Sedang Diproses",
      value: statistics.waiting ?? 0,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Selesai",
      value: statistics.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className={`${card.bgColor} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
