import { useState } from "react";
import Image from "next/image";
import { Globe, Users, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { STAT_CARDS } from "./types";

interface UserHeaderProps {
  totalCount: number;
  roleCountsMap: Record<string, number>;
}

export function UserHeader({ totalCount, roleCountsMap }: UserHeaderProps) {
  const [showStatsOnMobile, setShowStatsOnMobile] = useState(false);

  const getCount = (key: string) => {
    if (key === "total") return totalCount;
    if (key === "admin") {
      return (roleCountsMap["admin"] ?? 0) + (roleCountsMap["super_admin"] ?? 0);
    }
    return roleCountsMap[key] ?? 0;
  };

  return (
    <div className="space-y-4">
      {/* Hero Banner with allusers.png illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-100/90 dark:border-blue-900/40 px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-indigo-300/15 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Copy */}
          <div className="max-w-md min-w-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
              <Users className="size-3 text-blue-600 dark:text-blue-400" />
              <span>User Directory</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
              All Users. Multi-School Access.
            </h3>

            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
              Search, inspect, and manage accounts, roles, and schools across your platform.
            </p>
          </div>

          {/* Right 3D Illustration */}
          <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
            <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
              <Image
                src="/assets/super-admin/allusers.avif"
                alt="All Users"
                fill
                priority
                className="object-contain scale-125 drop-shadow-md"
                sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Title & Cross-Tenant View Header */}
      <div className="hidden sm:flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            User Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage and monitor all users across all tenant schools
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-border bg-card hover:bg-muted/50 text-foreground rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium shadow-2xs transition-colors shrink-0 cursor-default"
        >
          <Globe className="size-3.5 text-muted-foreground" />
          <span>Cross-Tenant View</span>
        </button>
      </div>

      {/* Mobile Toggle Button for Stats Cards */}
      <div className="flex sm:hidden items-center justify-between">
        <button
          type="button"
          onClick={() => setShowStatsOnMobile((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="size-3.5" />
            </div>
            <span>User Overview Stats ({totalCount.toLocaleString()} Total)</span>
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

      {/* 6 Metric Stat Cards */}
      <div className={`${showStatsOnMobile ? "grid" : "hidden"} sm:grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3`}>
        {STAT_CARDS.map((stat) => {
          const count = getCount(stat.key);
          const Icon = stat.icon;

          return (
            <div
              key={stat.key}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-2xs flex flex-col justify-between"
            >
              {/* Top Row: Icon + Label */}
              <div className="flex items-center gap-2">
                <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                  <Icon className="size-3.5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {stat.label}
                </span>
              </div>

              {/* Middle Row: Count + Trend Pill */}
              <div className="flex items-baseline gap-1.5 mt-2.5">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {count.toLocaleString()}
                </span>
                <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  {stat.trend}
                </span>
              </div>

              {/* Bottom Row: Subtext + Mini Sparkline */}
              <div className="flex items-end justify-between mt-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground font-normal truncate">
                  {stat.subtext}
                </span>

                {/* Mini SVG wave sparkline */}
                <div className="w-12 h-5 shrink-0 -mb-0.5 ml-1 opacity-80">
                  <svg viewBox="0 0 60 26" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id={stat.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stat.stroke} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={stat.stroke} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 20 Q 14 8, 28 16 T 60 6 L 60 26 L 0 26 Z"
                      fill={`url(#${stat.gradientId})`}
                    />
                    <path
                      d="M 0 20 Q 14 8, 28 16 T 60 6"
                      fill="none"
                      stroke={stat.stroke}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
