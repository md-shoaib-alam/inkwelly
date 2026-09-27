import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  Users, 
  UserCheck, 
  School, 
  IndianRupee
} from "lucide-react";
import { TenantInfo, planColors, statusColors } from "./types";

interface DetailHeaderProps {
  tenant: TenantInfo | undefined;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
  onBack: () => void;
}

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  max?: number;
  pct?: number;
  barColor: string;
  iconBg: string;
  iconColor: string;
  cardBorder: string;
  isCurrency?: boolean;
  currencyValue?: number;
}

function MiniStat({
  icon,
  label,
  value,
  max,
  pct,
  barColor,
  iconBg,
  iconColor,
  cardBorder,
  isCurrency,
  currencyValue,
}: MiniStatProps) {
  const percentage = pct ?? (max && max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0);

  return (
    <div className={`rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border ${cardBorder} shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-start gap-3.5">
        <div className={`size-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            {isCurrency ? (
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <IndianRupee className="size-4 mr-0.5" />
                {(currencyValue || 0).toLocaleString()}
              </span>
            ) : (
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {value.toLocaleString()}{" "}
                {max !== undefined && (
                  <span className="text-xs font-normal text-slate-400">/ {max.toLocaleString()}</span>
                )}
              </p>
            )}
          </div>
          {isCurrency && (
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Total revenue generated
            </p>
          )}
        </div>
      </div>

      {!isCurrency && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}

export function DetailHeader({
  tenant,
  tenantName,
  tenantSlug,
  tenantPlan,
  onBack,
}: DetailHeaderProps) {
  const statusCfg = statusColors[tenant?.status || ""] || statusColors.inactive;
  const planCfg = planColors[tenant?.plan || ""] || planColors.basic;

  const studentCount = tenant?.studentCount ?? 0;
  const maxStudents = tenant?.maxStudents ?? 500;

  const teacherCount = tenant?.teacherCount ?? 0;
  const maxTeachers = tenant?.maxTeachers ?? 50;

  const parentCount = tenant?.parentCount ?? 0;
  const maxParents = tenant?.maxParents ?? 300;

  const classCount = tenant?._count?.classes ?? 0;
  const maxClasses = tenant?.maxClasses ?? 30;

  const totalRevenue = tenant?.totalRevenue ?? 0;

  return (
    <div className="space-y-5">
      {/* Top row: Back button, Title & badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 h-9 font-semibold transition-all border border-slate-200/80 dark:border-slate-800 shadow-2xs"
            onClick={onBack}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Back to Schools
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {tenant?.name || tenantName}
            </h1>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              @{tenant?.slug || tenantSlug}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${planCfg.bg} ${planCfg.text} ${planCfg.border} capitalize font-medium text-xs px-2.5 py-0.5 rounded-full`}
          >
            {tenant?.plan || tenantPlan} Plan
          </Badge>
          <Badge
            variant="outline"
            className={`${statusCfg.bg} ${statusCfg.text} border-transparent capitalize font-medium text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5`}
          >
            <div className={`size-1.5 rounded-full ${statusCfg.text.replace('text-', 'bg-')}`} />
            {tenant?.status || "unknown"}
          </Badge>
        </div>
      </div>

      {/* 5 Top Stat Cards matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Students: Red/Coral */}
        <MiniStat
          icon={<GraduationCap className="size-5" />}
          label="Students"
          value={studentCount}
          max={maxStudents}
          barColor="bg-rose-500"
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          iconColor="text-rose-500"
          cardBorder="border-rose-100 dark:border-rose-950/30"
        />

        {/* Teachers: Blue */}
        <MiniStat
          icon={<Users className="size-5" />}
          label="Teachers"
          value={teacherCount}
          max={maxTeachers}
          barColor="bg-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600"
          cardBorder="border-blue-100 dark:border-blue-950/30"
        />

        {/* Parents: Green */}
        <MiniStat
          icon={<UserCheck className="size-5" />}
          label="Parents"
          value={parentCount}
          max={maxParents}
          barColor="bg-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-500"
          cardBorder="border-emerald-100 dark:border-emerald-950/30"
        />

        {/* Classes: Purple */}
        <MiniStat
          icon={<School className="size-5" />}
          label="Classes"
          value={classCount}
          max={maxClasses}
          barColor="bg-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-950/40"
          iconColor="text-purple-600"
          cardBorder="border-purple-100 dark:border-purple-950/30"
        />

        {/* Revenue: Amber */}
        <MiniStat
          icon={<IndianRupee className="size-5" />}
          label="Revenue"
          value={totalRevenue}
          isCurrency
          currencyValue={totalRevenue}
          barColor="bg-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600"
          cardBorder="border-amber-100 dark:border-amber-950/30"
        />
      </div>
    </div>
  );
}
