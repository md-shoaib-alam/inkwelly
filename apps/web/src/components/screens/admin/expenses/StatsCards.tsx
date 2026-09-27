"use client";

import { TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    totalExpenses?: number;
    thisMonthExpenses?: number;
    categoryWiseExpenses?: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
    }>;
  } | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <TrendingDown className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-800 dark:text-rose-300">Total Expenses</p>
              <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                ₹{(stats?.totalExpenses || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">This Month</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ₹{(stats?.thisMonthExpenses || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader className="py-3 px-6 border-b">
            <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="py-4 flex items-center gap-4 overflow-x-auto no-scrollbar">
            {stats?.categoryWiseExpenses?.map((c: any) => (
              <div 
                key={c.categoryId} 
                className="flex flex-col items-center min-w-[100px] p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border"
              >
                <span className="text-xs text-muted-foreground truncate w-full text-center">
                  {c.categoryName}
                </span>
                <span className="text-sm font-bold">₹{c.amount.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
