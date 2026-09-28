import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { revenueTrendConfig, MonthlyTrend } from "./types";

interface RevenueTrendsProps {
  loading: boolean;
  monthlyTrend: MonthlyTrend[];
}

export function RevenueTrends({ loading, monthlyTrend }: RevenueTrendsProps) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  return (
    <Card className="border rounded-xl bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Revenue Trend (12 Months)
            </CardTitle>
            <CardDescription className="mt-1">
              Monthly revenue, new subscriptions, and churned subscriptions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading || !recharts ? (
          <Skeleton className="h-[320px] w-full rounded-xl" />
        ) : (
          <ChartContainer
            config={revenueTrendConfig}
            className="h-[320px] w-full"
          >
            {(() => {
              const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } = recharts;
              return (
                <AreaChart
                  data={monthlyTrend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickMargin={12}
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickMargin={12}
                    tick={{ fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          if (name === "revenue")
                            return [
                              `₹${Number(value).toLocaleString()}`,
                              "Revenue",
                            ];
                          return [
                            value,
                            name === "newSubscriptions"
                              ? "New Subscriptions"
                              : "Churned",
                          ];
                        }}
                      />
                    }
                  />
                  <Legend content={<ChartLegendContent />} verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newSubscriptions"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="url(#newGradient)"
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="churned"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    fill="url(#churnGradient)"
                    strokeDasharray="3 3"
                  />
                </AreaChart>
              );
            })()}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
