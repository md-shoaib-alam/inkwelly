"use client";


import { apiFetch } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  IndianRupee,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { StudentInfo, FeeRecord } from "@/lib/types";

const statusConfig: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  paid: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    text: "Paid",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  pending: {
    bg: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    text: "Pending",
    icon: <Clock className="size-3.5" />,
  },
  overdue: {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    text: "Overdue",
    icon: <AlertTriangle className="size-3.5" />,
  },
};

const typeIcons: Record<string, string> = {
  tuition: "📚",
  exam: "📝",
  library: "📖",
  transport: "🚌",
};

const formatFeeDate = (dateStr: string) => {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function StudentFees() {
  const { currentUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiFetch("/api/students/me");
        if (!res.ok) throw new Error("Failed to fetch student profile");
        const targetStudent = await res.json();
        
        setStudents([targetStudent]);

        if (targetStudent?.id) {
          const feesRes = await apiFetch(
            `/api/fees?studentId=${targetStudent.id}&limit=100`,
          );
          if (feesRes.ok) {
            const feesData = await feesRes.json();
            setFees(Array.isArray(feesData) ? feesData : (feesData.items || []));
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser?.email]);

  const summary = useMemo(() => {
    const total = fees.reduce((sum, f) => sum + f.amount, 0);
    const paid = fees
      .filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + f.paidAmount, 0);
    const pending = fees
      .filter((f) => f.status === "pending")
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    const overdue = fees
      .filter((f) => f.status === "overdue")
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    return { total, paid, pending, overdue };
  }, [fees]);

  const totalPages = Math.ceil(fees.length / ITEMS_PER_PAGE) || 1;

  const paginatedFees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return fees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [fees, currentPage]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-44" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="size-5 text-violet-600" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          My Fees
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <IndianRupee className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{summary.total.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-emerald-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{summary.paid.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-violet-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Clock className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                  ₹{summary.pending.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-red-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  ₹{summary.overdue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Table */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="size-4 text-violet-500" />
            Fee Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Due Date
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Paid</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <IndianRupee className="size-10 mx-auto mb-2 opacity-30" />
                      <p>No fee records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFees.map((fee) => {
                    const config =
                      statusConfig[fee.status] || statusConfig.pending;
                    return (
                      <TableRow
                        key={fee.id}
                        className="hover:bg-violet-50/30 dark:hover:bg-violet-900/20 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {typeIcons[fee.type] || "💰"}
                            </span>
                            <span className="font-medium text-sm capitalize">
                              {fee.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-medium">
                          ₹{fee.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground" suppressHydrationWarning>
                          {formatFeeDate(fee.dueDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          <span
                            className={
                              fee.paidAmount > 0
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            ₹{fee.paidAmount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`${config.bg} font-medium capitalize`}
                          >
                            {config.icon}
                            <span className="ml-1">{fee.status}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing {Math.min(fees.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to{" "}
                {Math.min(fees.length, currentPage * ITEMS_PER_PAGE)} of {fees.length} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
