"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Receipt, CheckCircle2, XCircle } from "lucide-react";
import { SubscriptionRecord } from "./types";

interface HistoryTableProps {
  subscriptions: SubscriptionRecord[];
}

const formatSubscriptionDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function HistoryTable({ subscriptions }: HistoryTableProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
        <Receipt className="size-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No payment history</p>
        <p className="text-xs mt-1">
          Your past subscriptions will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile View: Vertical Cards */}
      <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {sub.planName}
                </p>
                {sub.period && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {sub.period.charAt(0).toUpperCase() + sub.period.slice(1)} Billing
                  </p>
                )}
              </div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">
                {sub.amount === 0 ? "Free" : `₹${sub.amount.toLocaleString()}`}
              </p>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 dark:text-zinc-400" suppressHydrationWarning>
                {formatSubscriptionDate(sub.createdAt)}
              </span>
              {sub.status === "active" ? (
                <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] shadow-none">
                  <CheckCircle2 className="size-3 mr-1" /> Active
                </Badge>
              ) : (
                <Badge className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] shadow-none">
                  <XCircle className="size-3 mr-1" /> Cancelled
                </Badge>
              )}
            </div>
            
            {sub.transactionId && (
              <div className="pt-1 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate">
                  ID: {sub.transactionId}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/80 dark:bg-zinc-800/50">
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">
                Plan
              </TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">
                Date
              </TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">
                Status
              </TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">
                Transaction ID
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  {sub.planName}
                  {sub.period && (
                    <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">
                      ({sub.period})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-700 dark:text-zinc-300">
                  {sub.amount === 0 ? (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      Free
                    </span>
                  ) : (
                    <span>₹{sub.amount.toLocaleString()}</span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-500 dark:text-zinc-400" suppressHydrationWarning>
                  {formatSubscriptionDate(sub.createdAt)}
                </TableCell>
                <TableCell>
                  {sub.status === "active" ? (
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs shadow-none">
                      <CheckCircle2 className="size-3 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-xs shadow-none">
                      <XCircle className="size-3 mr-1" /> Cancelled
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-zinc-400 dark:text-zinc-500 font-mono max-w-[140px] truncate">
                  {sub.transactionId || "–"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
