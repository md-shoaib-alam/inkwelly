"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import { PRIORITY_CONFIG, ROLE_CONFIG, ROLE_LABELS } from "./constants";
import type { NoticeInfo } from "@/lib/types";

interface NoticeListProps {
  notices: NoticeInfo[];
  isSearching: boolean;
}

const formatNoticeDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

export function NoticeList({ notices, isSearching }: NoticeListProps) {
  if (notices.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm shadow-none">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Megaphone className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notices found</p>
          <p className="text-sm">
            {isSearching
              ? "Try adjusting your search or filter."
              : "There are no notices at the moment."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => {
        const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.normal;
        const roleClass = ROLE_CONFIG[notice.targetRole] || ROLE_CONFIG.all;
        const roleLabel = ROLE_LABELS[notice.targetRole] || notice.targetRole;

        return (
          <Card
            key={notice.id}
            className={`border-l-4 ${priority.border} hover:shadow-md transition-shadow rounded-xl shadow-none`}
          >
            <CardContent className="p-4 sm:p-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {notice.title}
                    </h3>
                    <Badge variant="outline" className={`text-[10px] font-medium shadow-none ${priority.bg}`}>
                      {priority.icon}
                      <span className="ml-1">{priority.text}</span>
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] font-medium capitalize shadow-none ${roleClass}`}>
                      {roleLabel}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {notice.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      By{" "}
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">
                        {notice.authorName}
                      </span>
                    </span>
                    <span suppressHydrationWarning>
                      {formatNoticeDate(notice.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
