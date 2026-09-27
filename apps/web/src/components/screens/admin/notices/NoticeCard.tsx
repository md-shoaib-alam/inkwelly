"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { NoticeInfo } from "@/lib/types";

const priorityConfig: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300", text: "Normal", border: "border-l-zinc-400 dark:border-l-zinc-500" },
  important: { bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400", text: "Important", border: "border-l-orange-500" },
  urgent: { bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", text: "Urgent", border: "border-l-red-500" },
};

const roleConfig: Record<string, string> = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  teacher: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  student: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  parent: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  all: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
};

interface NoticeCardProps {
  notice: NoticeInfo;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (n: NoticeInfo) => void;
  onDelete: (id: string) => void;
  formatNoticeDate: (d: string) => string;
  deleting: boolean;
}

export function NoticeCard({
  notice,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  formatNoticeDate,
  deleting,
}: NoticeCardProps) {
  const priority = priorityConfig[notice.priority] || priorityConfig.normal;
  const roleClass = roleConfig[notice.targetRole] || roleConfig.all;

  return (
    <Card className={`border-l-4 ${priority.border} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {notice.title}
              </h3>
              <Badge variant="outline" className={`text-[10px] font-medium capitalize ${priority.bg}`}>
                {priority.text}
              </Badge>
              <Badge variant="outline" className={`text-[10px] font-medium capitalize ${roleClass}`}>
                {notice.targetRole}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {notice.content}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="size-3" />
                <span>{notice.authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span suppressHydrationWarning>{formatNoticeDate(notice.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                onClick={() => onEdit(notice)}
                title="Edit"
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{notice.title}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(notice.id)}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
