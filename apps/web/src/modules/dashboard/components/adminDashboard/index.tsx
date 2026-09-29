"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { differenceInDays } from "date-fns";
import { TriangleAlert } from "lucide-react";
import { useAppStore, type AppUser } from "@/store/use-app-store";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import { hasPermission } from "@/lib/permissions";
import { FavoritesStrip } from "./FavoritesStrip";
import { ModuleGrid } from "./ModuleGrid";
import { gridModuleCards, type ModuleCard } from "./moduleCatalogue";
import { useModuleFavorites } from "./useModuleFavorites";

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null;
  const expiry = new Date(endDate);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, now);
}

function isCardVisible(card: ModuleCard, currentUser: AppUser | null) {
  if (!card.permModule) return true;
  return hasPermission(currentUser, card.permModule, "view");
}

export function AdminDashboard() {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const {
    currentUser,
    currentTenantId,
    currentTenantSlug,
    setCurrentScreen,
  } = useAppStore();

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    push(tenantHref(screen));
  };

  // Subscription state is read here rather than in the screens it warns about, because the
  // launcher replaced the only dashboard variant that used to surface it.
  const { data: resolvedTenant } = useTenantResolution(currentTenantSlug || undefined);
  const daysRemaining = getDaysRemaining(resolvedTenant?.endDate);
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const { pinned, togglePin, clearAll } = useModuleFavorites();

  const visibleCards = useMemo(
    () => gridModuleCards.filter((card) => isCardVisible(card, currentUser)),
    [currentUser],
  );

  // Pinned order wins, but a card that lost permission or was removed from the catalogue
  // disappears from the strip instead of rendering a dead slot.
  const favoriteCards = useMemo(() => {
    const byId = new Map(visibleCards.map((card) => [card.id, card]));
    return pinned
      .map((id) => byId.get(id))
      .filter((card): card is ModuleCard => !!card && card.screen !== null);
  }, [pinned, visibleCards]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {(isExpired || isExpiringSoon) && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2 text-sm leading-5 ${
            isExpired
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          }`}
        >
          <TriangleAlert className="size-5 shrink-0" />
          <p className="flex-1">
            {isExpired
              ? "The school's subscription has expired. Renew to keep notices, receipts and reports available."
              : `The school's subscription expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`}
          </p>
          <button
            type="button"
            onClick={() => navigateTo("school-subscription")}
            className="shrink-0 rounded-lg bg-white/70 px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-current"
          >
            Manage plan
          </button>
        </div>
      )}

      <FavoritesStrip
        cards={favoriteCards}
        onNavigate={navigateTo}
        onUnpin={togglePin}
        onClearAll={clearAll}
      />

      <ModuleGrid
        cards={visibleCards}
        pinned={pinned}
        onTogglePin={togglePin}
        onNavigate={navigateTo}
      />
    </div>
  );
}

export { DashboardSkeleton, AdminDashboardSkeleton } from "./DashboardSkeleton";

