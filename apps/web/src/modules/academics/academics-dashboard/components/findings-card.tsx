"use client";

import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/use-app-store";
import type { AcademicsFinding } from "../../hooks/use-academics-command-center";

const SEVERITY: Record<string, { label: string; chip: string; icon: string }> = {
  high: {
    label: "High",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  },
  medium: {
    label: "Medium",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  low: {
    label: "Low",
    chip: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
    icon: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

const ORDER = ["high", "medium", "low"];

export function FindingsCard({
  findings,
  loading,
}: {
  findings: AcademicsFinding[];
  loading: boolean;
}) {
  const router = useRouter();
  const slug = useAppStore((s) => s.currentTenantSlug);

  const sorted = [...findings].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity) || b.count - a.count,
  );
  const tally = ORDER.map((sev) => ({
    sev,
    n: findings.filter((f) => f.severity === sev).length,
  }));

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
        <span className="text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Data quality</span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          · {findings.length} open · {tally.map((t) => `${t.n} ${t.sev}`).join(" · ")}
        </span>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">No open findings</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Every class, offering and timetable slot checked here is consistent.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {sorted.map((f) => {
              const style = SEVERITY[f.severity] ?? SEVERITY.low;
              const target = slug ? `/${slug}/${f.screen}` : null;
              return (
                <li key={f.code}>
                  <button
                    type="button"
                    disabled={!target}
                    onClick={() => target && router.push(target)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors disabled:cursor-default"
                  >
                    <span
                      className={`size-8 rounded-lg grid place-items-center shrink-0 ${style?.icon ?? ""}`}
                    >
                      <AlertTriangle className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-slate-800 dark:text-zinc-100">
                        {f.title}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {f.detail}
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${style?.chip ?? ""}`}
                        >
                          {style?.label ?? f.severity}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 dark:text-zinc-500 truncate">
                          {f.code}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 flex items-center gap-1 pt-0.5">
                      <span className="text-[15px] font-semibold tabular-nums text-slate-800 dark:text-zinc-100">
                        {f.count.toLocaleString()}
                      </span>
                      {target && <ArrowUpRight className="size-3.5 text-slate-300 dark:text-zinc-600" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
