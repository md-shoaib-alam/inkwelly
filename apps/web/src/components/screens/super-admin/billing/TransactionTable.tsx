import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, CalendarDays, IndianRupee } from "lucide-react";
import { statusConfig, paymentMethodConfig, planBadgeConfig } from "./types";
import { format, startOfToday, startOfYesterday, endOfYesterday, subDays, endOfToday } from "date-fns";
import { useSubscriptions } from "@/lib/graphql/hooks";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

type DateRangeOption = 'today' | 'yesterday' | 'week' | 'all';

const formatTxDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch (e) {
    return dateStr;
  }
};

const formatTxTime = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "HH:mm");
  } catch (e) {
    return "";
  }
};

export function TransactionTable() {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRangeOption>('today');
  const limit = 10;

  const dateParams = useMemo(() => {
    const now = new Date();
    switch(dateRange) {
      case 'today':
        return {
          startDate: startOfToday().toISOString(),
          endDate: endOfToday().toISOString()
        };
      case 'yesterday':
        return {
          startDate: startOfYesterday().toISOString(),
          endDate: endOfYesterday().toISOString()
        };
      case 'week':
        return {
          startDate: subDays(startOfToday(), 7).toISOString(),
          endDate: endOfToday().toISOString()
        };
      default:
        return {};
    }
  }, [dateRange]);

  const { data, isLoading: loading } = useSubscriptions({
    page,
    limit,
    ...dateParams
  });

  const handleRangeChange = (range: DateRangeOption) => {
    setDateRange(range);
    setPage(1);
  };

  const subscriptions = data?.subscriptions || [];
  const totalPages = data?.totalPages || 1;

  const totalCount = data?.total ?? 0;

  const startEntry = (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <Card className="border rounded-xl bg-card animate-in fade-in duration-500">
      <CardHeader className="pb-2 space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="size-4 text-emerald-600" /> Transaction History
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5 mt-0.5">
            {totalCount} payment records
          </CardDescription>
        </div>

        <div className="flex items-center bg-muted p-0.5 rounded-lg w-fit shrink-0">
          {(['all', 'today', 'yesterday', 'week'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => handleRangeChange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                dateRange === range
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === 'week' ? '7 Days' : range}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30%] text-xs font-medium text-muted-foreground">School / Parent</TableHead>
                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground text-center">Plan</TableHead>
                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground text-center">Status</TableHead>
                <TableHead className="w-[10%] text-xs font-medium text-muted-foreground text-center">Method</TableHead>
                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Receipt className="size-8 mb-2 opacity-20" />
                      <span className="text-sm font-medium">No transactions found for this period</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => {
                  const st = statusConfig[sub.status] || statusConfig.active;
                  const meth = paymentMethodConfig[sub.paymentMethod] || paymentMethodConfig.card;
                  const planCfg = planBadgeConfig[sub.planName] || planBadgeConfig.Basic;

                  return (
                    <TableRow key={sub.id} className="hover:bg-muted/50 transition-colors h-14">
                      <TableCell>
                        <div className="font-semibold text-sm truncate max-w-[180px]">{sub.tenant?.name || "Unknown School"}</div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          Paid by {sub.parent?.user?.name || "System"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${planCfg.bg} ${planCfg.text} ${planCfg.border} text-xs font-medium`}
                        >
                          {sub.planName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        <div className="flex items-center justify-end">
                          <IndianRupee className="size-3.5 mr-0.5" />
                          {sub.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border} text-xs font-medium mx-auto`}>
                          <div className={`size-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium ${meth.color}`}>
                          {meth.icon}
                          <span className="hidden md:inline">{meth.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" suppressHydrationWarning>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium text-foreground">
                            {formatTxDate(sub.createdAt)}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            {formatTxTime(sub.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={totalCount > 0 ? `Showing ${startEntry}–${endEntry} of ${totalCount}` : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}
