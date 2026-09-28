"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceStatsProps {
  summaryCards: any[];
  loading: boolean;
  statusConfig: any;
}

export function AttendanceStats({ summaryCards, loading, statusConfig }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {summaryCards.map((card) => (
        <Card
          key={card.label}
          className={`border ${card.borderColor} shadow-sm`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </p>
                <div className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    card.count
                  )}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                {card.icon}
              </div>
            </div>
            {card.percentage && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusConfig[card.label.toLowerCase()]?.dot || "bg-blue-500"}`}
                    style={{ width: `${card.percentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-500">
                  {card.percentage}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
