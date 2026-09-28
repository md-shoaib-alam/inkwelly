import { Plus, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import {
  PLAN_LABEL,
  type IntegrationProvider,
  type SchoolRow,
} from "./types";
import { StatusChip } from "./StatusChip";
import { ProviderIcon } from "./ProviderIcon";

const PLAN_TONE: Record<SchoolRow["plan"], StatusTone> = {
  basic: "neutral",
  standard: "info",
  premium: "warning",
};

const TENANT_TONE: Record<string, StatusTone> = {
  active: "positive",
  trial: "warning",
  suspended: "negative",
};

interface Props {
  schools: SchoolRow[];
  providers: IntegrationProvider[];
  onOpenConnection: (school: SchoolRow, providerId: string) => void;
  onOpenPicker: (school: SchoolRow) => void;
}

export function SchoolIntegrationTable({
  schools,
  providers,
  onOpenConnection,
  onOpenPicker,
}: Props) {
  const nameOf = (id: string) => providers.find((p) => p.id === id)?.name ?? id;

  if (schools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No school matches this search.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schools.map((school) => {
        const live = Object.values(school.connections);
        const address = (school.address ?? "").trim();
        return (
          <div
            key={school.tenantId}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-shadow hover:shadow-xs"
          >
            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
              {/* Identity */}
              <div className="flex min-w-0 items-start gap-3 lg:w-64 lg:shrink-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold">
                  {school.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={school.name}>
                    {school.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">/{school.slug}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge tone={PLAN_TONE[school.plan]} dot={false} className="text-[11px]">
                      {PLAN_LABEL[school.plan]}
                    </StatusBadge>
                    <StatusBadge
                      tone={TENANT_TONE[school.status] ?? "neutral"}
                      className="text-[11px]"
                    >
                      {school.status}
                    </StatusBadge>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="size-3" /> up to {school.maxStudents}
                    </span>
                  </div>
                  {address && (
                    <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" /> {address}
                    </p>
                  )}
                </div>
              </div>

              {/* Connections */}
              <div className="min-w-0 flex-1 border-t border-border pt-3 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                {live.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No third-party account connected. Everything below is available on this plan —
                    the school sets it up from its own Settings screen.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {live.map((record) => (
                      <button
                        key={record.provider}
                        type="button"
                        onClick={() => onOpenConnection(school, record.provider)}
                        className="group inline-flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-left transition-colors hover:border-foreground/30 hover:bg-accent"
                      >
                        <ProviderIcon
                          providerId={record.provider}
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                        <span className="text-xs font-medium">
                          {nameOf(record.provider)}
                        </span>
                        <StatusChip status={record.status} />
                        {!record.enabled && (
                          <span className="text-[10px] text-muted-foreground">disabled</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">
                    {live.length === 0
                      ? "Nothing to monitor"
                      : `${live.length} connection${live.length > 1 ? "s" : ""} · click one to view or edit`}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl text-xs"
                    onClick={() => onOpenPicker(school)}
                  >
                    <Plus className="size-3.5" /> Add integration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
