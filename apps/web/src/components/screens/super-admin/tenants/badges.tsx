import { memo } from "react";
import { Crown, Sparkles, Zap, Shield } from "lucide-react";
import { SCHOOL_PLANS } from "@/lib/billing-constants";

export const TenantPlanBadge = memo(({ plan }: { plan: string }) => {
  const planMeta = SCHOOL_PLANS.find((p) => p.id === plan);
  const pId = (plan || "").toLowerCase();
  
  if (pId === "enterprise" || pId === "growth_plus") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50/90 text-blue-600 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50">
        <Crown className="size-3 text-blue-500" />
        Enterprise
      </span>
    );
  }

  if (pId === "standard" || pId === "growth" || pId === "professional") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50/90 text-amber-700 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
        <Sparkles className="size-3 text-amber-500" />
        Professional
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50/90 text-sky-700 border border-sky-200/50 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50">
      <Zap className="size-3 text-sky-500" />
      Starter
    </span>
  );
});

export const TenantStatusBadge = memo(({ status }: { status: string }) => {
  const s = (status || "").toLowerCase();

  if (s === "active" || s === "verified" || s === "enabled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50/90 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        Active
      </span>
    );
  }

  if (s === "trial" || s === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50/90 text-amber-700 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
        Trial
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50/90 text-rose-700 border border-rose-200/50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
      <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
      Suspended
    </span>
  );
});


