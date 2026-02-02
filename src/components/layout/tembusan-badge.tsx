"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { tembusanService } from "@/services/tembusan.service";

interface TembusanBadgeProps {
  className?: string;
}

export function TembusanBadge({ className }: TembusanBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await tembusanService.getUnreadCount();
        if (response.success && response.data) {
          setUnreadCount(response.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <Link href="/tembusan" className={className}>
      <Button variant="ghost" size="sm" className="relative">
        <Mail className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
