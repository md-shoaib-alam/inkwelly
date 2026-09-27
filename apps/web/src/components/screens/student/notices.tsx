"use client";


import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, User, Tag, Clock } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  priority: string;
  authorName: string;
  createdAt: string;
}

const ROLE_FILTER = ["all", "student"];

const priorityConfig: Record<string, { bg: string; label: string }> = {
  urgent: {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 dark:text-red-400 border-red-200 dark:border-red-800",
    label: "Urgent",
  },
  high: {
    bg: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    label: "High",
  },
  normal: {
    bg: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    label: "Normal",
  },
  low: {
    bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    label: "Low",
  },
};

const formatNoticeDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/notices")
      .then((res) => res.json())
      .then((data: Notice[]) => {
        const filtered = Array.isArray(data)
          ? data.filter((n) => ROLE_FILTER.includes(n.targetRole))
          : [];
        setNotices(filtered);
      })
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const urgentCount = notices.filter((n) => n.priority === "urgent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            School Notices
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {notices.length} notices{" "}
            {urgentCount > 0 ? `• ${urgentCount} urgent` : ""}
          </p>
        </div>
        {urgentCount > 0 && (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 dark:text-red-400 border-red-200 dark:border-red-800 gap-1 self-start">
            <Bell className="size-3.5" />
            {urgentCount} Urgent
          </Badge>
        )}
      </div>

      {/* Urgent Banner */}
      {urgentCount > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="size-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                Urgent Notices
              </span>
            </div>
            <div className="space-y-2">
              {notices
                .filter((n) => n.priority === "urgent")
                .slice(0, 3)
                .map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-lg"
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-3 shrink-0" suppressHydrationWarning>
                      {formatNoticeDate(n.createdAt)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notice Cards */}
      {notices.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-16 text-center">
            <Bell className="size-12 mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No notices
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Your school hasn&apos;t posted any notices yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notices.map((notice) => {
            const config =
              priorityConfig[notice.priority] || priorityConfig.normal;
            return (
              <Card
                key={notice.id}
                className={`rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                  notice.priority === "urgent"
                    ? "border-red-200 dark:border-red-800"
                    : "border-zinc-100 dark:border-zinc-800"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {notice.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${config.bg}`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-3 leading-relaxed">
                    {notice.content}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-50 dark:border-zinc-800 pt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {notice.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="size-3" />
                        {notice.targetRole === "all"
                          ? "Everyone"
                          : notice.targetRole}
                      </span>
                    </div>
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="size-3" />
                      {formatNoticeDate(notice.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
