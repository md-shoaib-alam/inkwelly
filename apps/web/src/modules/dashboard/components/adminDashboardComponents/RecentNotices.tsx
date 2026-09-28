"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const priorityColors: Record<string, string> = {
  normal: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  important:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const priorityBorders: Record<string, string> = {
  normal: "border-l-zinc-400 dark:border-l-zinc-500",
  important: "border-l-orange-500",
  urgent: "border-l-red-500",
};

function formatNoticeDate(createdAt: string | Date) {
  return new Date(createdAt).toLocaleDateString();
}

interface RecentNoticesProps {
  isLoading: boolean;
  data: any[];
}

export function RecentNotices({ isLoading, data }: RecentNoticesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="size-4 text-amber-50" />
          Recent Notices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={`notice-skel-${i}`} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {(data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notices yet</p>
            ) : (
              (data ?? []).map((notice) => (
                <div key={notice.id} className={`p-3 rounded-lg border border-l-4 ${priorityBorders[notice.priority] || priorityBorders.normal} bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{notice.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notice.content}</p>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${priorityColors[notice.priority] || priorityColors.normal}`}>{notice.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                    <span>{notice.authorName}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>{formatNoticeDate(notice.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
