import { memo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
  cardBorder: string;
  trendText?: string;
  trendType?: "up" | "down" | "neutral";
}

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  cardBg,
  cardBorder,
  trendText,
  trendType = "neutral",
}: StatCardProps) {
  return (
    <div className={`rounded-xl p-2.5 sm:p-3.5 border ${cardBg} ${cardBorder} shadow-2xs transition-all duration-200`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`size-8 sm:size-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
            {title}
          </p>
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5 mt-0.5">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </span>
            {trendText && (
              <span
                className={`inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.2 rounded-full ${
                  trendType === "up"
                    ? "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-950/50"
                    : trendType === "down"
                    ? "text-rose-700 bg-rose-100/80 dark:text-rose-400 dark:bg-rose-950/50"
                    : "text-amber-800 bg-amber-100/80 dark:text-amber-400 dark:bg-amber-950/50"
                }`}
              >
                {trendType === "up" && <ArrowUp className="size-2 sm:size-2.5 mr-0.5 inline stroke-[2.5]" />}
                {trendType === "down" && <ArrowDown className="size-2 sm:size-2.5 mr-0.5 inline stroke-[2.5]" />}
                {trendType === "neutral" && <Minus className="size-2 sm:size-2.5 mr-0.5 inline stroke-[2.5]" />}
                {trendText}
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500/90 dark:text-slate-400/90 mt-0.5 font-normal truncate">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
});

interface TenantStatsProps {
  stats: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
}

export function TenantStats({ stats }: TenantStatsProps) {
  const [showStatsOnMobile, setShowStatsOnMobile] = useState(false);

  return (
    <div className="space-y-2.5 sm:space-y-0">
      {/* Mobile Toggle Button */}
      <div className="block sm:hidden">
        <button
          type="button"
          onClick={() => setShowStatsOnMobile((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="size-3.5" />
            </div>
            <span>Platform Overview ({stats.total} Schools)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{showStatsOnMobile ? "Hide" : "Show"}</span>
            {showStatsOnMobile ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </div>
        </button>
      </div>

      {/* 4 Stat Cards: Collapsible on Mobile, always visible in 4-column grid on desktop */}
      <div className={`${showStatsOnMobile ? "grid" : "hidden"} sm:grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5`}>
        <StatCard
          title="TOTAL SCHOOLS"
          value={stats.total}
          subtitle="All registered schools"
          icon={<Building2 className="size-4 sm:size-4.5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          cardBg="bg-blue-50/50 dark:bg-blue-950/15"
          cardBorder="border-blue-100 dark:border-blue-900/30"
          trendText="+20%"
          trendType="up"
        />
        <StatCard
          title="ACTIVE SCHOOLS"
          value={stats.active}
          subtitle="Currently active & operational"
          icon={<CheckCircle2 className="size-4 sm:size-4.5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          cardBg="bg-emerald-50/50 dark:bg-emerald-950/15"
          cardBorder="border-emerald-100 dark:border-emerald-900/30"
          trendText={stats.total > 0 ? `+${Math.round((stats.active / stats.total) * 100)}%` : "+25%"}
          trendType="up"
        />
        <StatCard
          title="TRIAL SCHOOLS"
          value={stats.trial}
          subtitle="In trial period"
          icon={<Clock className="size-4 sm:size-4.5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          cardBg="bg-amber-50/50 dark:bg-amber-950/15"
          cardBorder="border-amber-100 dark:border-amber-900/30"
          trendText="0%"
          trendType="neutral"
        />
        <StatCard
          title="SUSPENDED"
          value={stats.suspended}
          subtitle="Temporarily suspended"
          icon={<Ban className="size-4 sm:size-4.5 text-rose-600 dark:text-rose-400" />}
          iconBg="bg-rose-100 dark:bg-rose-900/40"
          cardBg="bg-rose-50/50 dark:bg-rose-950/15"
          cardBorder="border-rose-100 dark:border-rose-900/30"
          trendText={stats.suspended > 0 ? `+${stats.suspended}%` : "+0%"}
          trendType={stats.suspended > 0 ? "down" : "neutral"}
        />
      </div>
    </div>
  );
}
