"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

interface FeeAlert {
  id: string;
  studentName: string;
  type: string;
  dueDate: string;
  amount: number;
}

interface PerformanceSummary {
  name: string;
  avg: number;
  grade: string;
}

interface NoticeSidebarProps {
  notices: Notice[];
  overdueFees: FeeAlert[];
  performance: PerformanceSummary[];
}

const formatNoticeDateShort = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
};

export function NoticeSidebar({ notices, overdueFees, performance }: NoticeSidebarProps) {
  return (
    <div className="space-y-6 text-left">
      {/* Overdue Fee Alert */}
      {overdueFees.length > 0 && (
        <Card className="rounded-xl shadow-sm border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 shadow-none">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              <CardTitle className="text-sm font-semibold text-red-800">
                Fee Payment Overdue
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {overdueFees.slice(0, 3).map((fee) => (
              <div key={fee.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-red-900 dark:text-red-400 truncate max-w-[140px]">{fee.studentName}</p>
                  <p className="text-xs text-red-600 dark:text-red-500">
                    {fee.type} - Due: {fee.dueDate}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs shadow-none">
                  ₹{fee.amount}
                </Badge>
              </div>
            ))}
            {overdueFees.length > 3 && (
              <p className="text-xs text-red-500">+{overdueFees.length - 3} more overdue</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Notices */}
      <Card className="rounded-xl shadow-sm shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-amber-600" />
            <CardTitle className="text-sm font-semibold">Recent Notices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="max-h-72">
            <div className="space-y-3">
              {notices.slice(0, 5).map((notice) => (
                <div key={notice.id} className="space-y-1 group">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {notice.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] shadow-none ${
                        notice.priority === "urgent"
                          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : notice.priority === "important"
                            ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {notice.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notice.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                    {formatNoticeDateShort(notice.createdAt)}
                  </p>
                </div>
              ))}
              {notices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No notices at this time</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="rounded-xl shadow-sm shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-amber-600" />
            <CardTitle className="text-sm font-semibold">Performance Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {performance.map((student) => (
            <div key={student.name} className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                {student.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{student.avg}%</span>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold shadow-none ${
                    student.grade.startsWith("A")
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : student.grade.startsWith("B")
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {student.grade}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
