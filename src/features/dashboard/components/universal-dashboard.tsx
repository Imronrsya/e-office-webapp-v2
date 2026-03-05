"use client";

import DynamicDashboard from "@/features/dashboard/components/dynamic-dashboard";

export function UniversalDashboard() {
    return (
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
            <DynamicDashboard />
        </div>
    );
}
