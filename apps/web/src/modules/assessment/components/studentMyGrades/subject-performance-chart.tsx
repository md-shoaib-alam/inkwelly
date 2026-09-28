import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";

interface SubjectPerformanceChartProps {
  recharts: typeof import("recharts") | null;
  latestExam: {
    data: Array<{ subject: string; marks: number; fill: string }>;
    label: string;
  };
  chartConfig: any;
}

export function SubjectPerformanceChart({
  recharts,
  latestExam,
  chartConfig,
}: SubjectPerformanceChartProps) {
  return (
    <Card className="rounded-xl shadow-sm border-zinc-200/60 dark:border-zinc-800 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <BarChart3 className="size-4 text-violet-500" />
          Subject Performance
        </CardTitle>
        <CardDescription className="text-xs">
          {latestExam.label
            ? `Latest Term: ${latestExam.label}`
            : "Academic records summary"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {latestExam.data.length > 0 ? (
          !recharts ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              {(() => {
                const { BarChart, Bar, XAxis, YAxis, Cell } = recharts;
                return (
                  <BarChart
                    data={latestExam.data}
                    layout="horizontal"
                    margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                  >
                    <XAxis
                      type="category"
                      dataKey="subject"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      height={40}
                    />
                    <YAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="marks" radius={[4, 4, 0, 0]} barSize={32}>
                      {latestExam.data.map((entry, index) => (
                        <Cell key={entry.subject} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                );
              })()}
            </ChartContainer>
          )
        ) : (
          <div className="h-[260px] flex items-center justify-center text-zinc-400 dark:text-zinc-500 border-2 border-dashed rounded-xl border-zinc-100 dark:border-zinc-800">
            <p className="text-sm">No subject chart data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
