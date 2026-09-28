import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Lock, Plug, Trash2, AlertTriangle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CATEGORY_LABEL,
  COST_MODEL_LABEL,
  PLAN_LABEL,
  formatStamp,
  resolveStatus,
  type Connection,
  type IntegrationProvider,
  type SchoolRow,
} from "./types";
import { providerIcon } from "./ProviderIcon";
import { StatusChip } from "./StatusChip";
import { useDeleteConnection, useSaveConnection } from "./hooks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: SchoolRow | null;
  /** null = the "add integration" picker, otherwise the detail view for that provider. */
  providerId: string | null;
  providers: IntegrationProvider[];
  onPickProvider: (providerId: string) => void;
}

const STATUS_OPTIONS = [
  { value: "connected", label: "Connected" },
  { value: "pending", label: "Pending (waiting on approval)" },
  { value: "error", label: "Failing" },
];

function DocsList({ provider }: { provider: IntegrationProvider }) {
  if (provider.docs.length === 0) {
    return (
      <p className="flex items-start gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" />
        No public API reference for this vendor. Onboarding is commercial — credentials are issued
        after the agreement is signed.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Vendor documentation
      </p>
      <div className="space-y-1.5">
        {provider.docs.map((doc) => (
          <a
            key={doc.url}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="min-w-0 truncate">{doc.label}</span>
          </a>
        ))}
      </div>
      {provider.setupNote && (
        <p className="mt-2.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">{provider.setupNote}</p>
      )}
    </div>
  );
}

function DetailRow({ provider, connection }: { provider: IntegrationProvider; connection?: Connection }) {
  const stored = useMemo(() => {
    const map: Record<string, { value?: string | null; filled?: boolean }> = {};
    for (const f of connection?.fields ?? []) map[f.key] = f;
    return map;
  }, [connection]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{provider.name}</p>
          <p className="truncate text-xs text-muted-foreground">{connection?.accountLabel || provider.vendor}</p>
        </div>
        <StatusChip status={connection?.status ?? "available"} />
      </div>

      {connection?.lastError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          <span>{connection.lastError}</span>
        </div>
      )}

      <Separator className="my-4" />

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Connection details
      </p>
      <div className="space-y-2">
        {provider.fields.map((f) => {
          const value = stored[f.key];
          return (
            <div key={f.key} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="flex items-center gap-1.5 font-mono">
                {f.sensitive && <Lock className="size-3 text-muted-foreground" />}
                {f.sensitive ? (
                  value?.filled ? (
                    <span className="text-muted-foreground">stored</span>
                  ) : (
                    <span className="italic text-muted-foreground/70">not set</span>
                  )
                ) : value?.value ? (
                  <span>{value.value}</span>
                ) : (
                  <span className="italic text-muted-foreground/70">not set</span>
                )}
              </span>
            </div>
          );
        })}
        {provider.fields.length === 0 && (
          <p className="text-xs text-muted-foreground">Nothing to configure per school.</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Connected on</p>
          <p className="font-medium">{formatStamp(connection?.connectedAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last sync</p>
          <p className="font-medium">{formatStamp(connection?.lastSyncAt)}</p>
        </div>
      </div>
    </div>
  );
}

function EditForm({
  provider,
  connection,
  school,
  onDone,
  onCancel,
}: {
  provider: IntegrationProvider;
  connection?: Connection;
  school: SchoolRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const save = useSaveConnection();
  const [status, setStatus] = useState(connection?.status ?? "pending");
  const [accountLabel, setAccountLabel] = useState(connection?.accountLabel ?? "");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of provider.fields) {
      const stored = connection?.fields.find((cf) => cf.key === f.key);
      initial[f.key] = f.sensitive ? "" : (stored?.value ?? "");
    }
    return initial;
  });

  const submit = () => {
    const missing = provider.fields.find((f) => f.required && !f.sensitive && !values[f.key]?.trim());
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    save.mutate(
      {
        tenantId: school.tenantId,
        provider: provider.id,
        payload: {
          status,
          accountLabel: accountLabel.trim() || null,
          // Secrets left blank are omitted entirely so the stored value survives.
          fields: Object.fromEntries(
            Object.entries(values).filter(([key, v]) => {
              const field = provider.fields.find((f) => f.key === key);
              return !(field?.sensitive && v === "");
            }),
          ),
        },
      },
      {
        onSuccess: () => {
          toast.success(`${provider.name} saved for ${school.name}`);
          onDone();
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="int-status" className="text-xs">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as Connection["status"])}>
          <SelectTrigger id="int-status" className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="int-label" className="text-xs">Account label</Label>
        <Input
          id="int-label"
          value={accountLabel}
          onChange={(e) => setAccountLabel(e.target.value)}
          placeholder="What this connection is, e.g. sender ID or company name"
          className="h-9 text-xs"
        />
      </div>

      {provider.fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={`int-${f.key}`} className="flex items-center gap-1.5 text-xs">
            {f.label}
            {f.sensitive && <Lock className="size-3 text-muted-foreground" />}
          </Label>
          {f.type === "select" ? (
            <Select
              value={values[f.key] ?? ""}
              onValueChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            >
              <SelectTrigger id={`int-${f.key}`} className="h-9 text-xs">
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {(f.options ?? []).map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`int-${f.key}`}
              type={f.type === "secret" ? "password" : "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={
                f.sensitive
                  ? connection?.fields.find((cf) => cf.key === f.key)?.filled
                    ? "Stored — leave blank to keep it"
                    : "Enter once, never shown again"
                  : f.placeholder
              }
              className="h-9 text-xs"
            />
          )}
          {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
        </div>
      ))}

      <div className="flex gap-2">
        <Button size="sm" className="h-8 flex-1 rounded-xl text-xs" onClick={submit} disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-3.5 animate-spin" />} Save connection
        </Button>
        <Button size="sm" variant="outline" className="h-8 flex-1 rounded-xl text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ProviderOption({
  provider,
  school,
  onPick,
}: {
  provider: IntegrationProvider;
  school: SchoolRow;
  onPick: () => void;
}) {
  const connection = school.connections[provider.id];
  const status = resolveStatus(school, provider, connection?.status);
  const usable = status === "available" || status === "connected" || status === "pending" || status === "error";
  const Icon = providerIcon(provider.id);

  return (
    <button
      type="button"
      disabled={!usable}
      onClick={onPick}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        usable ? "border-border hover:border-foreground/30 hover:bg-accent" : "cursor-not-allowed border-border opacity-60"
      }`}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{provider.name}</p>
          <StatusChip status={status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{provider.summary}</p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {CATEGORY_LABEL[provider.category]} ·{" "}
          {provider.minPlan === "any" ? "any plan" : `${PLAN_LABEL[provider.minPlan]}+`} ·{" "}
          {COST_MODEL_LABEL[provider.costModel]}
        </p>
        {status === "locked" && (
          <p className="mt-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Upgrade this school to {PLAN_LABEL[provider.minPlan]} to offer it.
          </p>
        )}
        {status === "not-offered" && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">{provider.notOfferedReason}</p>
        )}
      </div>
    </button>
  );
}

export function ConnectionSheet({
  open,
  onOpenChange,
  school,
  providerId,
  providers,
  onPickProvider,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const remove = useDeleteConnection();

  const provider = providers.find((p) => p.id === providerId);
  const isDetail = !!(school && provider);
  const connection = school && provider ? school.connections[provider.id] : undefined;
  const builtIn = providers.filter((p) => p.builtIn);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setConfirmingDelete(false);
    }
  }, [open, providerId, school?.tenantId]);

  const startEdit = () => {
    setEditing(true);
    setConfirmingDelete(false);
  };

  const doRemove = () => {
    if (!school || !provider) return;
    remove.mutate(
      { tenantId: school.tenantId, provider: provider.id },
      {
        onSuccess: () => {
          toast.success(`${provider.name} disconnected from ${school.name}`);
          onPickProvider("");
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-base">
            {isDetail ? provider!.name : "Add an integration"}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {school ? `${school.name} · ${PLAN_LABEL[school.plan]} plan` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4 pb-8">
          {!school ? null : !isDetail ? (
            <div className="space-y-2">
              {providers
                .filter((p) => !p.builtIn)
                .map((p) => (
                  <ProviderOption
                    key={p.id}
                    provider={p}
                    school={school}
                    onPick={() => {
                      setEditing(!school.connections[p.id]);
                      onPickProvider(p.id);
                    }}
                  />
                ))}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onPickProvider("")}
              >
                ← Choose a different integration
              </Button>

              {!editing && (
                <>
                  <DetailRow provider={provider!} connection={connection} />
                  <DocsList provider={provider!} />
                </>
              )}

              {editing ? (
                <EditForm
                  provider={provider!}
                  connection={connection}
                  school={school}
                  onDone={() => setEditing(false)}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 flex-1 rounded-xl text-xs" onClick={startEdit}>
                    {connection ? "Edit details" : "Set up"}
                  </Button>
                  {connection && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl border-red-200 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() => setConfirmingDelete(true)}
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </Button>
                  )}
                </div>
              )}

              {confirmingDelete && !editing && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Disconnect {provider!.name} for {school.name}? Stored credentials are deleted
                    with it.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 rounded-xl text-xs"
                      onClick={doRemove}
                      disabled={remove.isPending}
                    >
                      {remove.isPending && <Loader2 className="size-3.5 animate-spin" />} Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-xl text-xs"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Keep it
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Credentials are stored encrypted and are never sent back to the browser after saving
                — only whether each one is filled.
              </p>
            </>
          )}

          {!isDetail && builtIn.length > 0 && (
            <>
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Already live for every school
              </p>
              <div className="flex flex-wrap gap-1.5">
                {builtIn.map((p) => {
                  const Icon = providerIcon(p.id);
                  return (
                    <Badge key={p.id} variant="outline" className="gap-1.5 text-[11px]">
                      <Icon className="size-3" /> {p.name}
                    </Badge>
                  );
                })}
              </div>
            </>
          )}

          {!isDetail && (
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <Plug className="size-3" />
              {providers.length} providers tracked in total.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
