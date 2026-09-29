"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { academicYearUrl } from "@/lib/routing/academic-year-url";
import { qualifyAdminTail } from "@/components/layout/sidebar/screen-owners";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { IndianRupee, AlertTriangle, Eye, BellRing, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FeeSummary, FeeTypeBreakdown, feeBreakdownConfig } from "./types";
import { SummaryCardSkeleton, ChartSkeleton, TableSkeleton } from "./SummaryComponents";
import { Pagination } from "@/components/shared/pagination";

type OverdueRow = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
};

const OVERDUE_PAGE_SIZE = 10;

export function FeeReport() {
  const router = useRouter();
  const { currentUser, currentTenantSlug } = useAppStore();
  const { yearSlug, routeModule } = useActiveAcademicYear();
  // An overdue row opens the student's profile on the Students screen. The link is built
  // with the session in it, the way that screen builds its own, so it resolves in one
  // hop instead of landing on a year-less URL that has to be redirected.
  const studentProfileUrl = (ref: string) => {
    const slug =
      currentTenantSlug || currentUser?.tenantSlug || currentUser?.tenantId || "";
    const tail = `list/${encodeURIComponent(ref)}`;
    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
    return academicYearUrl(slug, yearSlug, isAdmin ? qualifyAdminTail(tail, routeModule) : tail);
  };
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);
  const [summary, setSummary] = useState<FeeSummary>({ totalFees: 0, collected: 0, pending: 0 });
  const [recordCount, setRecordCount] = useState(0);
  const [typeBreakdown, setTypeBreakdown] = useState<FeeTypeBreakdown[]>([]);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [overdueRows, setOverdueRows] = useState<OverdueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overduePage, setOverduePage] = useState(1);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [confirmReminders, setConfirmReminders] = useState(false);

  // The button is a two-step arm/confirm because one click pushes to every
  // parent in the school with an overdue fee.
  useEffect(() => {
    if (!confirmReminders) return;
    const t = setTimeout(() => setConfirmReminders(false), 8000);
    return () => clearTimeout(t);
  }, [confirmReminders]);

  const sendFeeReminders = async () => {
    if (!confirmReminders) {
      setConfirmReminders(true);
      return;
    }
    setConfirmReminders(false);
    setSendingReminders(true);
    try {
      const res = await apiFetch("/api/reports/fees/reminders", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to send reminders (${res.status})`);
      toast.success(
        `Reminders queued for ${data.sent} student${data.sent === 1 ? "" : "s"} with overdue fees`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await apiFetch("/api/reports/fees");
        if (!res.ok) throw new Error("Failed to fetch fees");
        const data = await res.json();
        setSummary(data.summary);
        setRecordCount(data.summary.recordCount);
        setTypeBreakdown(data.typeBreakdown);
        setOverdueTotal(data.overdue.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  useEffect(() => {
    async function fetchOverdue() {
      const res = await apiFetch(
        `/api/reports/fees?limit=${OVERDUE_PAGE_SIZE}&page=${overduePage}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setOverdueRows(data.overdue.items);
      setOverdueTotal(data.overdue.total);
    }
    fetchOverdue();
  }, [overduePage]);

  const displayedOverdue = overdueRows;
  const overdueTotalPages = Math.max(1, Math.ceil(overdueTotal / OVERDUE_PAGE_SIZE));


  const collectionPct =
    summary.totalFees > 0
      ? ((summary.collected / summary.totalFees) * 100).toFixed(1)
      : "0";

  const summaryCards = [
    {
      label: "Total Fees",
      value: `₹${summary.totalFees.toLocaleString()}`,
      icon: <IndianRupee className="size-5 text-violet-600" />,
      color:
        "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
      sub: `${recordCount} records`,
    },
    {
      label: "Collected",
      value: `₹${summary.collected.toLocaleString()}`,
      icon: <IndianRupee className="size-5 text-emerald-600" />,
      color:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      sub: `${collectionPct}% collection rate`,
    },
    {
      label: "Pending",
      value: `₹${summary.pending.toLocaleString()}`,
      icon: <AlertTriangle className="size-5 text-amber-600" />,
      color:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      sub: `${overdueTotal} overdue`,
    },
  ];

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
        <CardContent className="p-6 text-center text-red-600 dark:text-red-400">
          <IndianRupee className="size-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Failed to load fee report</p>
          <p className="text-sm mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          summaryCards.map((card) => (
            <Card key={card.label} className={`border ${card.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.sub}
                    </p>
                  </div>
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center ${card.color}`}
                  >
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Breakdown by Type</CardTitle>
          <CardDescription>
            Collected vs pending amounts grouped by fee type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !recharts ? (
            <ChartSkeleton />
          ) : typeBreakdown.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IndianRupee className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No fee data available</p>
            </div>
          ) : (
            <ChartContainer
              config={feeBreakdownConfig}
              className="h-[300px] w-full"
            >
              {(() => {
                const { BarChart, Bar, XAxis, YAxis, CartesianGrid } = recharts;
                return (
                  <BarChart data={typeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(v: string) =>
                        v.charAt(0).toUpperCase() + v.slice(1)
                      }
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="collected"
                      fill="var(--color-collected)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="pending"
                      fill="var(--color-pending)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                );
              })()}
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600" />
                Urgent: Overdue Student Fees
              </CardTitle>
              <CardDescription className="text-amber-700/70 dark:text-amber-400/70">
                Records where due date has passed but payment is incomplete
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
              onClick={sendFeeReminders}
              disabled={sendingReminders || overdueTotal === 0}
            >
              {sendingReminders ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <BellRing className="size-4 mr-2" />
              )}
              {sendingReminders
                ? "Sending…"
                : confirmReminders
                  ? "Confirm: notify parents"
                  : "Send payment reminders"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : overdueTotal === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No overdue records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50/30 dark:bg-amber-900/5 hover:bg-amber-50/30 dark:hover:bg-amber-900/5">
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedOverdue.map((f) => (
                      <TableRow key={f.id} className="border-amber-100 dark:border-amber-900/20">
                        <TableCell className="font-medium">
                          {f.studentName}
                        </TableCell>
                        <TableCell className="capitalize">{f.type}</TableCell>
                        <TableCell className="text-red-600 dark:text-red-400 font-medium">
                          {f.dueDate}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ₹{(f.amount - f.paidAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0"
                            aria-label={`View ${f.studentName}'s profile`}
                            onClick={() => router.push(studentProfileUrl(f.studentId))}
                          >
                            <Eye className="size-4 opacity-50" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {overdueTotalPages > 1 && (
                <div className="p-4 border-t border-amber-100 dark:border-amber-900/20">
                  <Pagination
                    currentPage={overduePage}
                    totalPages={overdueTotalPages}
                    totalItems={overdueTotal}
                    itemsPerPage={10}
                    onPageChange={(page) => setOverduePage(page)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
