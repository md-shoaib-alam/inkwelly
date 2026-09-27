"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ResultsSummaryProps {
  total: number;
  pass: number;
  fail: number;
  pending: number;
}

export function ResultsSummary({ total, pass, fail, pending }: ResultsSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Students</p>
          <p className="text-xl font-bold">{total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Passed</p>
          <p className="text-xl font-bold text-emerald-600">{pass}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
          <p className="text-xl font-bold text-red-600">{fail}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-xs text-amber-600 dark:text-amber-400">Pending</p>
          <p className="text-xl font-bold text-amber-600">{pending}</p>
        </CardContent>
      </Card>
    </div>
  );
}
