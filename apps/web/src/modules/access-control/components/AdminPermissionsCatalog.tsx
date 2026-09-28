"use client";

import { useMemo } from "react";
import { Check, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/use-app-store";
import { useCustomRoles } from "@/lib/graphql/hooks";
import { cn } from "@/lib/utils";
import {
  ACTION_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLE_TEMPLATES,
} from "./adminRoles/constants";

const ACTION_DESC: Record<string, string> = {
  view: "Open and read records",
  create: "Add new records",
  edit: "Change existing records",
  delete: "Remove records",
};

function parsePermissions(raw: string | Record<string, string[]>): Record<string, string[]> {
  if (typeof raw !== "string") return raw || {};
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

export function AdminPermissionsCatalog() {
  const { currentTenantId } = useAppStore();
  const { data: roles = [] } = useCustomRoles(currentTenantId || "");

  // How many of this school's live roles grant each module, and at what level.
  const grantedByRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const module of PERMISSION_MODULES) {
      map.set(
        module.key,
        roles.filter((role) => (parsePermissions(role.permissions)[module.key]?.length ?? 0) > 0)
          .length,
      );
    }
    return map;
  }, [roles]);

  const templatesFor = (moduleKey: string) =>
    ROLE_TEMPLATES.filter((t) => (t.permissions[moduleKey]?.length ?? 0) > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Permissions Catalog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every module a custom role can be granted, and the actions each one exposes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          `${PERMISSION_MODULES.length} modules`,
          `${PERMISSION_ACTIONS.length} actions`,
          `${PERMISSION_MODULES.length * PERMISSION_ACTIONS.length} grantable permissions`,
          `${ROLE_TEMPLATES.length} starter templates`,
        ].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Actions</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {PERMISSION_ACTIONS.map((action) => (
              <div
                key={action}
                className="flex items-start gap-2.5 rounded-xl border border-border/70 p-3"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Check className="size-3" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {ACTION_LABELS[action] ?? action}
                  </p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {ACTION_DESC[action]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-56">Module</TableHead>
                  <TableHead className="min-w-40">Code</TableHead>
                  <TableHead className="min-w-64">In starter templates</TableHead>
                  <TableHead className="whitespace-nowrap text-right">School roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_MODULES.map((module) => {
                  const templates = templatesFor(module.key);
                  const count = grantedByRole.get(module.key) ?? 0;
                  return (
                    <TableRow key={module.key}>
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                              module.iconBg,
                            )}
                          >
                            {module.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{module.label}</p>
                            {module.desc && (
                              <p className="text-[11px] leading-snug text-muted-foreground">
                                {module.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {module.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        {templates.length === 0 ? (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Minus className="size-3" />
                            None
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {templates.map((t) => (
                              <span
                                key={t.name}
                                className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  color: t.color,
                                  borderColor: `${t.color}55`,
                                  backgroundColor: `${t.color}14`,
                                }}
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            count === 0 ? "text-muted-foreground" : "text-foreground",
                          )}
                        >
                          {count}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        The catalogue is compiled into the app, not stored per tenant — a role grants a subset of
        these pairs, and unknown keys are dropped when a role is saved.
      </p>
    </div>
  );
}
