import { Users, Lock, ExternalLink } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import {
  CATEGORY_LABEL,
  COST_MODEL_LABEL,
  PLAN_LABEL,
  type IntegrationProvider,
  type ProviderCategory,
  type SchoolRow,
} from "./types";
import { providerIcon } from "./ProviderIcon";

const COST_TONE: Record<string, StatusTone> = {
  "one-time": "positive",
  metered: "warning",
  licence: "info",
  commercial: "neutral",
  included: "neutral",
};

interface Props {
  providers: IntegrationProvider[];
  schools: SchoolRow[];
}

export function ProviderCatalog({ providers, schools }: Props) {
  const configurable = providers.filter((p) => !p.builtIn);
  const categories = Array.from(new Set(configurable.map((p) => p.category)));

  const connectedCount = (id: string) =>
    schools.filter((s) => s.connections[id]?.status === "connected").length;

  return (
    <div className="space-y-6">
      {categories.map((category: ProviderCategory) => {
        const inCategory = configurable.filter((p) => p.category === category);
        return (
          <section key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABEL[category]}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {inCategory.map((p) => {
                const used = connectedCount(p.id);
                const offered = p.offered !== false;
                const Icon = providerIcon(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col rounded-2xl border border-border bg-card p-4 shadow-2xs ${offered ? "" : "opacity-70"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{p.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{p.vendor}</p>
                        </div>
                      </div>
                      <StatusBadge tone={COST_TONE[p.costModel] ?? "neutral"} dot={false} className="shrink-0 text-[10px]">
                        {COST_MODEL_LABEL[p.costModel]}
                      </StatusBadge>
                    </div>

                    <p className="mt-2.5 text-xs text-muted-foreground">{p.summary}</p>

                    {offered ? (
                      <div className="mt-3 space-y-1 text-[11px]">
                        <p>
                          <span className="text-muted-foreground">Who pays: </span>
                          <span className="font-medium">{p.whoPays}</span>
                        </p>
                        <p className="text-muted-foreground">{p.costNote}</p>
                      </div>
                    ) : (
                      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <Lock className="mt-px size-3 shrink-0" /> {p.notOfferedReason}
                      </p>
                    )}

                    {p.setupNote && (
                      <p className="mt-2.5 rounded-xl border border-dashed border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
                        {p.setupNote}
                      </p>
                    )}

                    {p.docs.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                        {p.docs.map((doc) => (
                          <a
                            key={doc.url}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                          >
                            <ExternalLink className="size-3 shrink-0" />
                            {doc.label}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                      <span className="min-w-0 truncate">
                        {p.minPlan === "any" ? "All plans" : `${PLAN_LABEL[p.minPlan]}+`} · set up by{" "}
                        {p.setupOwner === "platform" ? "us" : "school admin"}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 font-medium text-foreground">
                        <Users className="size-3" /> {used} school{used === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
