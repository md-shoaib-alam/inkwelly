"use client";

import { Card } from "@/components/ui/card";
import { IndianRupee, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface FeeSummaryProps {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export function FeeSummary({ total, paid, pending, overdue }: FeeSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Total Fees - Always full width on mobile/tablet, 1/4 on desktop */}
      <Card className="lg:col-span-1 relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-br from-white to-zinc-50/10 dark:from-zinc-950 dark:to-zinc-900/5 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-zinc-500/30 dark:hover:border-zinc-500/20 transition-all duration-300 group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-500/5 dark:bg-zinc-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider block">Total Fees</span>
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 text-zinc-600 dark:text-zinc-400">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 block tracking-tight">
            ₹{total.toLocaleString()}
          </span>
        </div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-1.5 font-medium border-t pt-2 border-zinc-100 dark:border-zinc-900">
          <span className="inline-block size-1.5 rounded-full bg-zinc-500" />
          Overall fee structure
        </div>
      </Card>

      {/* Other Cards Row - Scrollable on mobile, Grid on desktop */}
      <div className="lg:col-span-3 flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:pb-0 scrollbar-hide">
        {/* Paid Amount */}
        <Card className="min-w-[240px] sm:min-w-0 relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-br from-white to-emerald-50/10 dark:from-zinc-950 dark:to-emerald-950/5 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider block">Paid Amount</span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block tracking-tight">
              ₹{paid.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-1.5 font-medium border-t pt-2 border-zinc-100 dark:border-zinc-900">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Total settled payments
          </div>
        </Card>

        {/* Pending */}
        <Card className="min-w-[240px] sm:min-w-0 relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-br from-white to-amber-50/10 dark:from-zinc-950 dark:to-amber-950/5 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 dark:bg-amber-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider block">Pending</span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Clock className="size-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 block tracking-tight">
              ₹{pending.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-1.5 font-medium border-t pt-2 border-zinc-100 dark:border-zinc-900">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
            Awaiting payment
          </div>
        </Card>

        {/* Overdue */}
        <Card className="min-w-[240px] sm:min-w-0 relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-br from-white to-red-50/10 dark:from-zinc-950 dark:to-red-950/5 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-red-500/30 dark:hover:border-red-500/20 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 dark:bg-red-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider block">Overdue</span>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-red-600 dark:text-red-400 block tracking-tight">
              ₹{overdue.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-1.5 font-medium border-t pt-2 border-zinc-100 dark:border-zinc-900">
            <span className="inline-block size-1.5 rounded-full bg-red-500" />
            Passed due date
          </div>
        </Card>
      </div>
    </div>
  );
}
