"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@heroui/react";
import { Users, User } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface TembusanItem {
    name: string;
    description?: string; // Legacy fallback
    email?: string;
    role?: string;
    userId?: string;
}

interface TembusanCardProps {
    tembusanList: TembusanItem[];
}

// ============================================================================
// PAGE SIZE OPTIONS
// ============================================================================

const PAGE_SIZE_OPTIONS = [3, 5, 10];

// ============================================================================
// COMPONENT
// ============================================================================

export function TembusanCard({ tembusanList }: TembusanCardProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(3);

    // Normalize tembusan list — resolve __PENGAJU__ marker and filter manual entries
    const normalizedList = useMemo(() => {
        if (!tembusanList || tembusanList.length === 0) return [];
        return tembusanList
            .filter(item => item.userId && item.userId.trim() !== '') // Hilangkan jika diketik manual
            .map((item) => {
                if (item.userId === "__PENGAJU__" || item.name === "__PENGAJU__") {
                    return {
                        ...item,
                        name: item.name !== "__PENGAJU__" ? item.name : "Pengaju Surat",
                        description: item.description || "Akses & download surat",
                    };
                }
                return item;
            });
    }, [tembusanList]);

    // Don't render if no tembusan
    if (normalizedList.length === 0) return null;

    // Pagination calculations
    const totalPages = Math.ceil(normalizedList.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentItems = normalizedList.slice(startIndex, endIndex);

    // Reset page when pageSize changes
    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1);
    };

    return (
        <Card className="bg-neutral-50 border-zinc-400 rounded-xl overflow-hidden">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-black flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Tembusan Dalam Sistem ({normalizedList.length})
                    </h3>

                    {/* Page size dropdown */}
                    {normalizedList.length > 3 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6D6D6D]">Tampilkan</span>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="text-xs border border-[#E1DFE0] rounded-md px-2 py-1 bg-white text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Tembusan list */}
                <div className="space-y-2">
                    {currentItems.map((item, index) => (
                        <div
                            key={`${item.userId || item.name}-${startIndex + index}`}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E1DFE0]"
                        >
                            {/* Avatar icon */}
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-zinc-500" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-sm font-bold text-[#2B2B2B] truncate leading-tight mb-0.5">
                                    {item.name}
                                </p>
                                {item.email && (
                                    <p className="text-xs text-[#00609B] truncate leading-tight mb-0.5">
                                        {item.email}
                                    </p>
                                )}
                                {(item.role || item.description) && (
                                    <p className="text-xs text-[#6D6D6D] truncate leading-tight">
                                        {item.role || item.description}
                                    </p>
                                )}
                            </div>

                            {/* Index number */}
                            <span className="text-xs text-[#6D6D6D] flex-shrink-0">
                                {startIndex + index + 1}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Pagination — same component as dashboard */}
                {totalPages > 1 && (
                    <div className="flex w-full justify-end pt-3">
                        <Pagination
                            isCompact
                            showControls
                            page={page}
                            total={totalPages}
                            onChange={setPage}
                            size="sm"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
