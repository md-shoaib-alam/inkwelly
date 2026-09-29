"use client";

import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./card";
import { useTenantHref } from "../../hooks/use-tenant-href";
import type { StudentsActivityEntry } from "../../hooks/use-students-command-center";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * `updatedAt` is the only stamp a student row keeps, so this is "last touched" and not
 * an audit trail — it cannot say who changed a record or which field moved. Recent
 * enough to still be news reads as a day count; anything older reads as a date, because
 * "23d ago" tells you nothing you would act on.
 */
function when(entry: StudentsActivityEntry): string {
  if (entry.daysAgo <= 0) return "today";
  if (entry.daysAgo <= 7) return `${entry.daysAgo}d`;
  const parts = entry.at.split("-");
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return entry.at;
  return `${day} ${MONTHS[month - 1] ?? ""}`.trim();
}

export function RecentActivityCard({
  activity,
  loading,
}: {
  activity: StudentsActivityEntry[];
  loading: boolean;
}) {
  const router = useRouter();
  const tenantHref = useTenantHref();

  return (
    <Card title="Recent activity" bodyClassName="px-5 pb-5">
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded-md" />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <p className="py-4 text-[13px] text-slate-400 dark:text-zinc-500">
          No student record has been edited yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {activity.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => router.push(tenantHref(`list/${encodeURIComponent(a.id)}`))}
                className="w-full text-left flex items-center gap-2.5 rounded-lg px-1 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500 dark:text-zinc-400">
                  Profile updated ·{" "}
                  <span className="font-semibold text-slate-800 dark:text-zinc-100">{a.name}</span>{" "}
                  <span className="text-slate-400 dark:text-zinc-500">({a.className})</span>
                </span>
                <span className="shrink-0 text-[12px] tabular-nums text-slate-400 dark:text-zinc-500">
                  {when(a)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
