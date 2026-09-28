"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  IndianRupee,
  FileDown,
  UserCog,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DashboardData, userChartConfig } from "./types";

interface StatusCardsProps {
  loading: boolean;
  data: DashboardData | undefined;
  onNavigate: (screen: string) => void;
}

// Visual colors matching reference image
const ROLE_COLORS: Record<string, string> = {
  Students: "#3B82F6", // bright blue
  Teachers: "#10B981", // emerald
  Parents: "#F59E0B",  // amber
  Admins: "#8B5CF6",   // purple
};

export function StatusCards({ loading, data, onNavigate }: StatusCardsProps) {
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const totalUsers = data?.users.total || 0;
  const userDistributionData = data
    ? [
        { name: "Students", value: data.users.students, fill: ROLE_COLORS.Students },
        { name: "Teachers", value: data.users.teachers, fill: ROLE_COLORS.Teachers },
        { name: "Parents", value: data.users.parents, fill: ROLE_COLORS.Parents },
        { name: "Admins", value: data.users.admins, fill: ROLE_COLORS.Admins },
      ]
    : [];

  const totalTenants = data?.tenants.total || 1;
  const activePct = Math.round(((data?.tenants.active ?? 0) / totalTenants) * 100);
  const trialPct = Math.round(((data?.tenants.trial ?? 0) / totalTenants) * 100);
  const suspendedPct = Math.round(((data?.tenants.suspended ?? 0) / totalTenants) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* 1. Tenant Status (3.5 cols on desktop) */}
      <Card className="lg:col-span-4 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm py-4 px-5 h-full flex flex-col justify-between">
        <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 className="size-3.5" />
              </div>
              Tenant Status
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Active, trial, and suspended schools
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("tenants")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 h-7 px-2"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex flex-col justify-between flex-1 gap-2.5 pt-2">
          {loading ? (
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-6 w-8 rounded-md" />
                    <Skeleton className="h-3 w-7 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Active */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white dark:bg-emerald-900/50 shadow-xs flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Active</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Operational</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {data?.tenants.active ?? 0}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">{activePct}%</p>
                </div>
              </div>

              {/* Trial */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white dark:bg-purple-900/50 shadow-xs flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Trial</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Evaluation</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {data?.tenants.trial ?? 0}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">{trialPct}%</p>
                </div>
              </div>

              {/* Suspended */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white dark:bg-rose-900/50 shadow-xs flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Suspended</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attention Required</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {data?.tenants.suspended ?? 0}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">{suspendedPct}%</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2. User Distribution (5 cols on desktop) */}
      <Card className="lg:col-span-5 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm py-4 px-5 h-full flex flex-col justify-between">
        <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="size-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Users className="size-3.5" />
              </div>
              User Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Breakdown by role across all schools
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            All Schools <ChevronDown className="size-3 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-1 flex flex-col justify-between flex-1">
          {loading || !recharts ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-2">
              {/* Left Donut Placeholder */}
              <div className="sm:col-span-6 flex items-center justify-center">
                <div className="relative size-[180px] rounded-full border-[18px] border-slate-100 dark:border-slate-800 flex items-center justify-center animate-pulse">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-6 w-14 rounded-md" />
                    <Skeleton className="h-2.5 w-16 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Right Role List Breakdown Skeleton */}
              <div className="sm:col-span-6 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded-xl shrink-0" />
                      <Skeleton className="h-3.5 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-8 rounded-md" />
                      <Skeleton className="h-4 w-7 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
              {/* Left Donut with center total */}
              <div className="sm:col-span-6 relative flex items-center justify-center">
                <ChartContainer config={userChartConfig} className="h-[190px] w-[190px]">
                  {(() => {
                    const { PieChart, Pie, Cell } = recharts;
                    return (
                      <PieChart>
                        <Pie
                          data={userDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {userDistributionData.map((item) => (
                            <Cell key={item.name} fill={item.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    );
                  })()}
                </ChartContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {totalUsers.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Total Users
                  </span>
                </div>
              </div>

              {/* Right Role List Breakdown - Styled with soft colored pill containers matching reference */}
              <div className="sm:col-span-6 space-y-2">
                {[
                  {
                    name: "Students",
                    count: data?.users.students ?? 0,
                    icon: "student",
                    bg: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-100/80 dark:border-blue-900/40 text-blue-600 dark:text-blue-400",
                    badgeBg: "bg-blue-100/70 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
                    iconBg: "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300",
                  },
                  {
                    name: "Teachers",
                    count: data?.users.teachers ?? 0,
                    icon: "teacher",
                    bg: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100/80 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400",
                    badgeBg: "bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300",
                    iconBg: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300",
                  },
                  {
                    name: "Parents",
                    count: data?.users.parents ?? 0,
                    icon: "parent",
                    bg: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-100/80 dark:border-amber-900/40 text-amber-600 dark:text-amber-400",
                    badgeBg: "bg-amber-100/70 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300",
                    iconBg: "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300",
                  },
                  {
                    name: "Admins",
                    count: data?.users.admins ?? 0,
                    icon: "admin",
                    bg: "bg-purple-50/80 dark:bg-purple-950/30 border-purple-100/80 dark:border-purple-900/40 text-purple-600 dark:text-purple-400",
                    badgeBg: "bg-purple-100/70 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300",
                    iconBg: "bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300",
                  },
                ].map((role) => {
                  const pct = totalUsers > 0 ? Math.round((role.count / totalUsers) * 100) : 0;
                  return (
                    <div
                      key={role.name}
                      className={`flex items-center justify-between px-3 py-2 rounded-2xl border ${role.bg} transition-all`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`size-7 rounded-xl flex items-center justify-center ${role.iconBg}`}>
                          {role.icon === "student" && (
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                              <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                          )}
                          {role.icon === "teacher" && (
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 3h20v14H2z" />
                              <path d="m8 21 4-4 4 4" />
                            </svg>
                          )}
                          {role.icon === "parent" && (
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          )}
                          {role.icon === "admin" && (
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                              <path d="m9 12 2 2 4-4" />
                            </svg>
                          )}
                        </div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {role.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {role.count.toLocaleString()}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${role.badgeBg}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Summary Bar matching reference image */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="size-4" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Total <span className="font-bold text-blue-600 dark:text-blue-400">{totalUsers.toLocaleString()}</span> users across all schools
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("users")}
              className="h-8 px-3 rounded-xl border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
            >
              <BarChart2 className="size-3.5" />
              View Details
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Quick Actions (3 cols on desktop) */}
      <Card className="lg:col-span-3 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm py-4 px-5 h-full flex flex-col justify-between">
        <CardHeader className="p-0 pb-1">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Zap className="size-4 text-emerald-500" /> Quick Actions
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Frequent administrative operations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex flex-col justify-between flex-1 gap-2 pt-2">
          <ActionButton
            icon={<Plus className="size-4 text-white" />}
            label="Add New School"
            sub="Register a new tenant"
            gradient="from-emerald-500 to-teal-600"
            onClick={() => onNavigate("tenants")}
          />
          <ActionButton
            icon={<IndianRupee className="size-4 text-white" />}
            label="View Billing"
            sub="Revenue & invoices"
            gradient="from-purple-500 to-indigo-600"
            onClick={() => onNavigate("billing")}
          />
          <ActionButton
            icon={<FileDown className="size-4 text-white" />}
            label="Export Report"
            sub="Download analytics"
            gradient="from-amber-500 to-orange-600"
            onClick={() => onNavigate("platform-analytics")}
          />
          <ActionButton
            icon={<UserCog className="size-4 text-white" />}
            label="Manage Users"
            sub="Platform staff"
            gradient="from-teal-500 to-cyan-600"
            onClick={() => onNavigate("users")}
          />
          <ActionButton
            icon={<ClipboardList className="size-4 text-white" />}
            label="Audit Logs"
            sub="Security & activity"
            gradient="from-slate-600 to-slate-800"
            onClick={() => onNavigate("audit-logs")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  sub,
  gradient,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full group flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 hover:bg-slate-100/80 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 transition-all text-left"
    >
      <div className="flex items-center gap-3">
        <div
          className={`size-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-xs`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">
            {label}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {sub}
          </p>
        </div>
      </div>
      <ChevronRight className="size-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
