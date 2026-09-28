"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldCheck,
  UserRound,
  Wand2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/use-app-store";
import { useCustomRoles } from "@/lib/graphql/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RoleRecord } from "./adminRoles/types";

const TILE_TONES = {
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  slate: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
} as const;

type Tone = keyof typeof TILE_TONES;

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Lock;
  tone: Tone;
}) {
  return (
    <Card className="min-w-50 shrink-0 lg:min-w-0 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </div>
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TILE_TONES[tone])}>
            <Icon className="size-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A card that answers its own click. Without `onOpen` it is a read-only notice, which is
 * how the reference draws the seeded state — greyed, with no action attached.
 */
function QuickAction({
  icon: Icon,
  title,
  description,
  tone,
  onOpen,
  pill,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
  tone: Tone;
  onOpen?: () => void;
  pill?: string;
}) {
  const body = (
    <>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TILE_TONES[tone])}>
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
        {pill && (
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <Wand2 className="size-3" />
            {pill}
          </span>
        )}
      </span>
    </>
  );

  const face =
    "flex w-full items-start gap-3 rounded-xl border bg-card p-5 text-left shadow-sm transition-shadow dark:bg-card";

  if (!onOpen) {
    return (
      <div role="note" className={cn(face, "opacity-75")}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      className={cn(face, "outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/50")}
    >
      {body}
    </button>
  );
}

export function AdminIamDashboard() {
  const { push } = useRouter();
  const { currentTenantId, currentTenantSlug, currentUser, setCurrentScreen } = useAppStore();

  const { data: roles = [], isLoading } = useCustomRoles(currentTenantId || "");

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    const tid =
      currentTenantSlug || currentTenantId || currentUser?.tenantSlug || currentUser?.tenantId;
    push(tid ? `/${tid}/${screen}` : `/${screen}`);
  };

  const assignments = useMemo(
    () => roles.reduce((sum, role) => sum + (role.userCount ?? 0), 0),
    [roles],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-8">
        <Skeleton className="h-9 w-80 max-w-full" />
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 min-w-50 shrink-0 lg:min-w-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const seeded = roles.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Identity &amp; Access Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage roles, permissions, and employee access assignments.
        </p>
      </div>

      {/* This copy has no seeded system roles, so every customRoles row is a custom one.
          TOTAL equalling CUSTOM is the true state, not a missing number. */}
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-2 lg:pb-0 scrollbar-none">
        <StatTile label="Total roles" value={roles.length} icon={ShieldCheck} tone="emerald" />
        <StatTile label="System roles" value={0} icon={Lock} tone="blue" />
        <StatTile label="Custom roles" value={roles.length} icon={KeyRound} tone="emerald" />
        <StatTile label="Assignments" value={assignments} icon={UserRound} tone="slate" />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            icon={Fingerprint}
            title="Security & Transaction PIN"
            description="PIN rules for fee collection, location checks and security activity."
            tone="emerald"
            onOpen={() => toast("Security & Transaction PIN is coming soon")}
          />
          <QuickAction
            icon={ShieldCheck}
            title="Manage Roles"
            description="Create, edit, and configure custom roles."
            tone="blue"
            onOpen={() => navigateTo("roles")}
          />
          <QuickAction
            icon={UserRound}
            title="Role Assignments"
            description="Assign or revoke roles from employees."
            tone="emerald"
            onOpen={() => toast("Role Assignments is coming soon")}
          />
          <QuickAction
            icon={Wand2}
            title="Seed Default Roles"
            description={
              seeded
                ? "Default roles already seeded."
                : "No custom roles exist for this school yet."
            }
            tone="slate"
            pill={seeded ? "Already seeded" : "Seeding soon"}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Roles</h2>
          <button
            type="button"
            onClick={() => navigateTo("roles")}
            className="flex items-center gap-0.5 rounded text-xs font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            View all
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {roles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <ShieldCheck className="size-6 opacity-80" />
              </div>
              <p className="text-sm font-semibold text-foreground">No roles yet</p>
              <p className="mt-1 max-w-sm text-center text-xs">
                Create a custom role to grant staff access to specific modules.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {roles.slice(0, 6).map((role: RoleRecord) => (
                  <li key={role.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Lock className="size-3.5" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {role.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Custom
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
