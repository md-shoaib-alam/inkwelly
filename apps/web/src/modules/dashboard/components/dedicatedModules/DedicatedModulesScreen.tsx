"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { differenceInDays } from "date-fns";
import {
  TriangleAlert,
  Search,
  Sparkles,
  Calendar,
  ChevronDown,
  Sun,
  Moon,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useAppStore, type AppUser } from "@/store/use-app-store";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import { hasPermission } from "@/lib/permissions";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { useTheme } from "next-themes";
import { yearSlugOf } from "@/lib/routing/academic-year-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  gridModuleCards,
  TINT_CLASSES,
  type ModuleCard,
} from "../adminDashboard/moduleCatalogue";
import { cn } from "@/lib/utils";

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

const SECTION_ORDER = [
  "People & Attendance",
  "Teaching & Learning",
  "Fees & Finance",
  "Student Life",
  "Campus & Operations",
  "Communication & Tools",
  "Administration",
];

export function DedicatedModulesScreen() {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const {
    currentUser,
    currentTenantSlug,
    currentTenantName,
    currentTenantLogo,
    setCurrentScreen,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { years, year, yearSlug, setActiveYear } = useActiveAcademicYear();

  // The "/" chip promises a keyboard shortcut; wire it so pressing / focuses search,
  // unless the user is already typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable === true;
      if (typing) return;
      e.preventDefault();
      document.getElementById("iwm-search-input")?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayYearName = useMemo(() => {
    if (year?.name) return year.name;
    const active = years?.find((y: any) => y.is_active || y.isActive);
    if (active?.name) return active.name;
    if (years?.[0]?.name) return years[0].name;
    return "2026-27";
  }, [year, years]);

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    push(tenantHref(screen));
  };

  const { data: resolvedTenant } = useTenantResolution(currentTenantSlug || undefined);
  const daysRemaining = getDaysRemaining(resolvedTenant?.endDate);
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const schoolName = resolvedTenant?.name || currentTenantName || "School Portal";
  const schoolLogo = resolvedTenant?.logo || currentTenantLogo;

  // Filter cards by permissions and search query
  const visibleCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return gridModuleCards
      .filter((card) => isCardVisible(card, currentUser))
      .filter((card) => {
        if (!q) return true;
        return (
          card.title.toLowerCase().includes(q) ||
          card.subtitle.toLowerCase().includes(q) ||
          (card.category && card.category.toLowerCase().includes(q))
        );
      });
  }, [currentUser, searchQuery]);

  // Group into sections
  const groupedCards = useMemo(() => {
    const groups: Record<string, ModuleCard[]> = {};
    visibleCards.forEach((card) => {
      const cat = card.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(card);
    });
    return groups;
  }, [visibleCards]);

  const orderedCategories = useMemo(() => {
    const defined = SECTION_ORDER.filter((cat) => groupedCards[cat]?.length);
    const extra = Object.keys(groupedCards).filter(
      (cat) => !SECTION_ORDER.includes(cat) && groupedCards[cat]?.length
    );
    return [...defined, ...extra];
  }, [groupedCards]);

  const initials = useMemo(() => {
    if (!currentUser?.name) return "AD";
    const parts = currentUser.name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return currentUser.name.slice(0, 2).toUpperCase();
  }, [currentUser?.name]);

  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="iwm">
      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <header className="iwm-topbar">
        {/* Left: School brand & name (div.iwm-brand) */}
        <div className="iwm-brand">
          <div className="iwm-brand-badge">
            {schoolLogo ? (
              <img src={schoolLogo} alt={schoolName} />
            ) : (
              <GraduationCap className="size-5 text-[#071f1b]" />
            )}
          </div>
          <span className="iwm-brand-name">{schoolName}</span>
        </div>

        {/* Right: Search, Ask AI, Session, Theme, User */}
        <div className="iwm-topbar-right">
          {/* Search modules (.iwm-search with transition width & active state) */}
          <div
            className="iwm-search"
            data-active={searchFocused || searchQuery.length > 0}
            onClick={() => {
              const inputEl = document.getElementById("iwm-search-input");
              inputEl?.focus();
            }}
          >
            <Search className="size-4 shrink-0" style={{ color: "#f9dd86" }} />
            <input
              id="iwm-search-input"
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#f4f1e4] hover:bg-white/20 cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span className="iwm-search-shortcut">/</span>
            )}
          </div>

          {/* Ask AI Button */}
          <button
            type="button"
            className="iwm-ask-ai"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-ai-chat"));
            }}
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span>Ask AI</span>
          </button>

          {/* Academic Session Selector button.ink-pill-btn (123.17 x 40, padding: 0 12px 0 14px) */}
          {years && years.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ink-pill-btn select-none !h-[40px] !px-[14px] !rounded-full !bg-white/[0.08] !border-white/15 !text-[#f4f1e4] hover:!bg-white/[0.14] outline-none cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="size-4 text-[#f4f1e4]/70 shrink-0" />
                  <span className="font-semibold text-[13px]">{displayYearName}</span>
                  <ChevronDown className="size-3.5 text-[#f4f1e4]/50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-xl border border-white/10 bg-[#0c2a25] p-1.5 text-white shadow-xl"
              >
                {years.map((y: any) => {
                  const isSelected = year
                    ? yearSlugOf(y.name) === yearSlug
                    : y.name === displayYearName;
                  return (
                    <DropdownMenuItem
                      key={y.id || y.name}
                      onClick={() => setActiveYear(yearSlugOf(y.name))}
                      className={cn(
                        "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10",
                        isSelected && "bg-white/15 font-bold text-white"
                      )}
                    >
                      {y.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ink-pill-btn select-none !h-[40px] !px-[14px] !rounded-full !bg-white/[0.08] !border-white/15 !text-[#f4f1e4] flex items-center gap-2">
              <Calendar className="size-4 text-[#f4f1e4]/70 shrink-0" />
              <span className="font-semibold text-[13px]">{displayYearName}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            className="iwm-icon-btn !size-[40px] !rounded-full"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          {/* User Avatar - button.ink-account-btn > span.ink-avatar-ring (42 x 42) > span.ink-avatar */}
          <button
            type="button"
            className="ink-account-btn"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-signed-in-devices"));
            }}
            title={currentUser?.name || "Account"}
            aria-label="Account settings"
          >
            <span className="ink-avatar-ring">
              <span className="ink-avatar">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.name || "Avatar"}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
            </span>
          </button>
        </div>
      </header>

      {/* ── Content Canvas with Rounded Top Edges (cream in light, emerald in dark) ── */}
      <main className="iwm-body-canvas">
        {/* Subscription Banner if expiring */}
        {(isExpired || isExpiringSoon) && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm ${
              isExpired
                ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
            }`}
          >
            <TriangleAlert className="size-5 shrink-0" />
            <p className="flex-1 font-medium">
              {isExpired
                ? "The school's subscription has expired. Renew to keep notices, receipts and reports available."
                : `The school's subscription expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`}
            </p>
            <button
              type="button"
              onClick={() => navigateTo("school-subscription")}
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#14312a] shadow-xs"
            >
              Manage plan
            </button>
          </div>
        )}

        {/* Modules Section Categories */}
        {orderedCategories.length === 0 ? (
          <div className="space-y-4 pt-2">
            {/* No matches card matching screenshot */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#142e27]">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Search className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#d6ebe3]">
                    No modules match &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-[#6b9e8a]">
                    Try a shorter word, like &ldquo;fee&rdquo; or &ldquo;exam&rdquo;.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer px-3 py-1.5 dark:text-[#c8ddd6] dark:hover:text-white"
              >
                Clear search
              </button>
            </div>

            {/* AI Connect card */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#142e27]">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#b97f1f] dark:text-[#f9dd86]">
                    AI CONNECT
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 dark:text-[#d6ebe3]">
                    Ask ChatGPT, Claude & more{" "}
                    <span className="text-[#b97f1f] dark:text-[#f9dd86]">about your school.</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-[#6b9e8a]">
                    Instant answers on fees, attendance and students — only with the access you allow.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigateTo("ai-connect")}
                  className="flex items-center gap-1.5 rounded-full bg-linear-to-b from-[#f9dc82] to-[#edb449] px-4 py-2 text-xs font-bold text-[#14312a] shadow-xs hover:shadow-md cursor-pointer transition-all"
                >
                  <span>Open AI Connect</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          orderedCategories.map((category) => {
            const categoryCards = groupedCards[category];
            if (!categoryCards || categoryCards.length === 0) return null;

            return (
              <section
                key={category}
                className="iwm-section"
                aria-label={category}
              >
                <h2 className="iwm-section-title">{category}</h2>
                <div className="iwm-grid">
                  {categoryCards.map((card) => {
                    const isComingSoon = card.screen === null;
                    const tintStyle =
                      TINT_CLASSES[isComingSoon ? "slate" : card.tint];

                    return (
                      <a
                        key={card.id}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isComingSoon && card.screen) {
                            navigateTo(card.screen);
                          }
                        }}
                        role="button"
                        tabIndex={isComingSoon ? -1 : 0}
                        aria-disabled={isComingSoon}
                        className={cn("iwm-card", isComingSoon && "is-disabled")}
                      >
                        {/* Icon Box */}
                        <div className={cn("iwm-icon-box", tintStyle)}>
                          <card.icon className="size-5" />
                        </div>

                        {/* Title & Subtitle */}
                        <div className="iwm-content">
                          <h3 className="iwm-title">{card.title}</h3>
                          <p className="iwm-subtitle">
                            {isComingSoon ? "Coming soon" : card.subtitle}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="iwm-arrow" />
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
