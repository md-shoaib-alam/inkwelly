"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PromotionsHub } from "./promotions-hub";
import { PromotionWizard } from "./promotions-new";
import { findRun, usePromotionRuns } from "./use-promotion-runs";
import { useTenantHref } from "../hooks/use-tenant-href";

/**
 * Two screens, two addresses. `new` is a detail segment — parseRoute resolves
 * `/students/promotion/new` back to this screen — so the path decides which half
 * renders, and a refresh or a pasted link lands where the user left the wizard.
 */
export function StudentsPromotions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantHref = useTenantHref();
  const { data, isLoading } = usePromotionRuns();

  const wizard = /\/new(\/|$)/.test(pathname);
  const run = wizard ? findRun(data.items, searchParams.get("run")) : null;

  if (!wizard) {
    return (
      <PromotionsHub
        onNew={() => router.push(tenantHref("students/promotion/new"))}
        onOpenRun={(r) =>
          router.push(tenantHref(`students/promotion/new?run=${encodeURIComponent(r.id)}`))
        }
      />
    );
  }

  // A run id that is not in the list is either still loading or no longer there;
  // opening the wizard blank would silently drop the draft the user asked for.
  if (searchParams.get("run") && !run && isLoading) return null;

  return (
    <PromotionWizard
      key={run?.id ?? "new"}
      run={run}
      onExit={() => router.push(tenantHref("students/promotion"))}
    />
  );
}
