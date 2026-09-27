import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CircleDot } from "lucide-react";
import type { GradeDistributionItem } from "./types";

interface GradeDistributionChartProps {
  recharts: typeof import("recharts") | null;
  pieData: Array<{ name: string; value: number; fill: string }>;
  gradeDistribution: GradeDistributionItem[];
  gradeColorMap: Record<string, string>;
  chartConfig: any;
}

export function GradeDistributionChart({
  recharts,
  pieData,
  gradeDistribution,
  gradeColorMap,
  chartConfig,
}: GradeDistributionChartProps) {
  return (
    <Card className="rounded-xl shadow-sm border-zinc-200/60 dark:border-zinc-800 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <CircleDot className="size-4 text-violet-500" />
          Grade Distribution
        </CardTitle>
        <CardDescription className="text-xs">
          Breakdown of terms letter grades
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pieData.length > 0 ? (
          <div className="flex items-center gap-6">
            {!recharts ? (
              <Skeleton className="size-[200px]" />
            ) : (
              <ChartContainer config={chartConfig} className="size-[200px]">
                {(() => {
                  const { PieChart, Pie, Cell } = recharts;
                  return (
                    <PieChart>
                      <ChartTooltip
                        content={<ChartTooltipContent nameKey="name" />}
                      />
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={entry.fill}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  );
                })()}
              </ChartContainer>
            )}
            <div className="flex flex-col gap-2">
              {gradeDistribution.map((g) => (
                <div key={g.grade} className="flex items-center gap-2 text-sm">
                  <div
                    className="size-3 rounded-sm"
                    style={{
                      backgroundColor: gradeColorMap[g.grade] || "#9ca3af",
                    }}
                  />
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {g.grade}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] ml-1 font-normal"
                  >
                    {g.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-zinc-400 dark:text-zinc-500 border-2 border-dashed rounded-xl border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-medium">No distribution data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
