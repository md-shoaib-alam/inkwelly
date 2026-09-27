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
} from "@/components/ui/chart";
import { BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";
import { planRevenueConfig } from "./types";

interface DistributionChartsProps {
  loading: boolean;
  planChartData: any[];
  methodChartData: any[];
  statusChartData: any[];
}

const tooltipContentStyle = {
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--card-foreground)',
  boxShadow: 'none',
};

export function DistributionCharts({
  loading,
  planChartData,
  methodChartData,
  statusChartData,
}: DistributionChartsProps) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue by Plan */}
      <Card className="border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-emerald-600" /> Revenue by Plan
          </CardTitle>
          <CardDescription>
            Active revenue and subscription count per plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !recharts ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <ChartContainer
              config={planRevenueConfig}
              className="h-[240px] w-full"
            >
              {(() => {
                const { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid } = recharts;
                return (
                  <BarChart
                    data={planChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tick={{ fill: "var(--muted-foreground)" }}
                      tickFormatter={(v) =>
                        `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="plan"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={70}
                      tick={{ fill: "var(--foreground)" }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const d = item.payload as any;
                            return [
                              `₹${d.revenue.toLocaleString()} (${d.count} subs)`,
                              d.plan,
                            ];
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={28}
                    >
                      {planChartData.map((entry, i) => {
                        const planColors: Record<string, string> = {
                          Basic: "var(--chart-4)",
                          Standard: "var(--chart-5)",
                          Premium: "var(--chart-1)",
                        };
                        return (
                          <Cell
                            key={entry.plan}
                            fill={planColors[entry.plan] || "var(--chart-2)"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                );
              })()}
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Distribution */}
      <Card className="border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChartIcon className="size-4 text-emerald-600" /> Payment Methods
          </CardTitle>
          <CardDescription>
            Preferred methods by revenue volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !recharts ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <div className="h-[240px] min-h-[240px] w-full">
              {(() => {
                const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip: RTooltip } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={methodChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="revenue"
                        nameKey="method"
                        stroke="none"
                      >
                        {methodChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RTooltip
                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                        contentStyle={tooltipContentStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status Distribution */}
      <Card className="border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-emerald-600" /> Status Distribution
          </CardTitle>
          <CardDescription>
            Lifecycle of all subscription records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !recharts ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <div className="h-[240px] min-h-[240px] w-full">
              {(() => {
                const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip: RTooltip } = recharts;
                return (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                        stroke="none"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RTooltip
                        formatter={(value: number) => `${value} subscriptions`}
                        contentStyle={tooltipContentStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
