import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Activity,
  ShieldCheck,
  Circle
} from "lucide-react";
import {
  ActionTypeCount,
  getActionCategory,
  categoryColors,
  categoryIcons
} from "./types";

interface LogStatsProps {
  loading: boolean;
  totalLogs: number;
  actionTypes: ActionTypeCount[];
}

export function LogStats({ loading, totalLogs, actionTypes }: LogStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border rounded-xl bg-card shadow-2xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <Skeleton className="h-3.5 w-18 rounded-md" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border rounded-xl bg-card transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <FileText className="size-4 text-teal-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Total events</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalLogs.toLocaleString()}</p>
          </CardContent>
        </Card>

        {actionTypes.slice(0, 4).map((at) => (
          <Card key={at.action} className="border rounded-xl bg-card transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                  <Activity className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {at.action.replace(/_/g, " ")}
                </p>
              </div>
              <p className="text-2xl font-bold text-foreground">{at.count.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {actionTypes.length > 4 && (
        <Card className="border rounded-xl bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-teal-600" />
              Categorical trace distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {actionTypes.map((at) => {
                const category = getActionCategory(at.action);
                const iconChar = categoryIcons[category];
                return (
                  <Badge
                    key={at.action}
                    variant="outline"
                    className={`${categoryColors[category] || ""} px-3 py-1.5 text-xs font-medium border-2 border-transparent rounded-xl shadow-sm`}
                  >
                    {iconChar && iconChar !== "\u26AA" ? (
                      <span className="mr-2 text-xs">{iconChar}</span>
                    ) : (
                      <Circle className="size-3 mr-2" />
                    )}
                    {at.action.replace(/_/g, " ")}
                    <span className="ml-2 opacity-60">[{at.count}]</span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
