"use client";

import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { yearSlugOf } from "@/lib/routing/academic-year-url";
import { shouldFlagOffSession } from "@/lib/routing/off-session";

/**
 * Viewport chrome for a screen that belongs to a past or future session: a rose
 * border on all four edges and a pill hung from the top centre.
 *
 * Nothing here is blocked. Browsing another session is legitimate, so the only
 * honest signal is one that cannot be mistaken for an error and cannot be
 * confused with the screen having broken — which is why it is drawn over the
 * whole viewport instead of inside the content column.
 *
 * `pointer-events-none` on the single wrapper, so no click anywhere on any screen
 * is ever intercepted, and one stacking layer rather than two.
 */
export function OffSessionNotice() {
  const { currentUser } = useAppStore();
  const { status, years, yearSlug } = useActiveAcademicYear();

  if (!currentUser) return null;

  const currentYearSlug = yearSlugOf(years.find((y: any) => y.isCurrent)?.name ?? "");

  if (
    !shouldFlagOffSession({
      role: currentUser.role,
      status,
      urlYearSlug: yearSlug,
      currentYearSlug,
    })
  )
    return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-0 z-[70] rounded-2xl border-[3px] border-rose-500"
    >
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-b-lg bg-rose-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
          <AlertTriangle className="size-3.5 shrink-0" />
          Not current session
        </span>
      </div>
    </div>
  );
}
