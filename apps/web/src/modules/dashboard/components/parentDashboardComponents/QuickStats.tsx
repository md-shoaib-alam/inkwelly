"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Bell, IndianRupee } from "lucide-react";

interface QuickStatsProps {
  childrenCount: number;
  noticeCount: number;
  pendingFees: number;
}

export function QuickStats({ childrenCount, noticeCount, pendingFees }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <Card className="col-span-2 sm:col-span-1 rounded-xl shadow-sm shadow-none">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 shrink-0">
            <Users className="size-6 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground font-medium">Total Children</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{childrenCount}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 rounded-xl shadow-sm shadow-none">
        <CardContent className="p-3 sm:p-4 flex flex-col items-center sm:items-start sm:flex-row gap-2 sm:gap-4 text-center sm:text-left">
          <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 w-fit shrink-0">
            <Bell className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">Active Notices</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{noticeCount}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 rounded-xl shadow-sm shadow-none">
        <CardContent className="p-3 sm:p-4 flex flex-col items-center sm:items-start sm:flex-row gap-2 sm:gap-4 text-center sm:text-left">
          <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 dark:bg-red-900/30 w-fit shrink-0">
            <IndianRupee className="size-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">Pending Fees</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              ₹{pendingFees.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
