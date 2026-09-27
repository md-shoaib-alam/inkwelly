import React from "react";
import Image from "next/image";
import { ExternalLink, Settings2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TenantSubscription, getPlanBadge, getStatusBadge } from "./types";

interface SchoolTableProps {
  isLoading: boolean;
  tenants: TenantSubscription[];
  currentPage: number;
  itemsPerPage: number;
  onEdit: (tenant: TenantSubscription) => void;
}

export function SchoolTable({
  isLoading,
  tenants,
  currentPage,
  itemsPerPage,
  onEdit,
}: SchoolTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/80">
            <TableHead className="w-12 pl-6 py-3.5">
              <input type="checkbox" className="rounded border-slate-300 text-blue-600 size-3.5" />
            </TableHead>
            <TableHead className="w-10 text-xs font-semibold text-muted-foreground">#</TableHead>
            <TableHead className="min-w-[200px] text-xs font-semibold text-muted-foreground">School Name</TableHead>
            <TableHead className="w-28 text-xs font-semibold text-muted-foreground">Current Plan</TableHead>
            <TableHead className="w-28 text-xs font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="w-36 text-xs font-semibold text-muted-foreground">Expiry Date</TableHead>
            <TableHead className="w-48 text-xs font-semibold text-muted-foreground">Student Limit</TableHead>
            <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <TableRow key={i} className="border-b border-border/80 last:border-none">
                <TableCell className="pl-6 py-3.5">
                  <Skeleton className="size-3.5 rounded-sm" />
                </TableCell>
                <TableCell className="py-3.5">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                </TableCell>
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-xl shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3.5">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </TableCell>
                <TableCell className="py-3.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell className="py-3.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                </TableCell>
                <TableCell className="py-3.5">
                  <div className="space-y-1.5 w-32">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="pr-6 py-3.5 text-right">
                  <Skeleton className="h-7 w-16 rounded-lg ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : tenants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                No schools found.
              </TableCell>
            </TableRow>
          ) : (
            tenants.map((tenant, idx) => {
              const usedCount = Math.round((tenant.maxStudents || 100) * 0.7);
              const usedPct = Math.min(100, Math.round((usedCount / (tenant.maxStudents || 100)) * 100));

              return (
                <TableRow key={tenant.id} className="hover:bg-muted/30 transition-colors border-b border-border/70 last:border-none">
                  <TableCell className="pl-6 py-3.5">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 size-3.5" />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {tenant.logo ? (
                          <Image
                            src={tenant.logo}
                            alt={tenant.name || "School"}
                            width={32}
                            height={32}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {tenant.name?.slice(0, 2).toUpperCase() || "SC"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground leading-tight truncate">{tenant.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-normal leading-tight truncate">
                            /{tenant.slug || "school"}
                          </span>
                          {tenant.slug && (
                            <a
                              href={`https://schoolconnect.in/${tenant.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`https://schoolconnect.in/${tenant.slug}`}
                              className="text-muted-foreground/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
                            >
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">{getPlanBadge(tenant.plan)}</TableCell>
                  <TableCell className="py-3.5" suppressHydrationWarning>
                    {getStatusBadge(tenant.status, tenant.endDate)}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs text-muted-foreground font-medium" suppressHydrationWarning>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="whitespace-nowrap">{tenant.endDate ? format(new Date(tenant.endDate), "PP") : "No expiry"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="w-36 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] leading-tight">
                        <span className="font-bold text-foreground">{tenant.maxStudents?.toLocaleString() || 100}</span>
                        <span className="text-muted-foreground font-semibold text-[10px]">{usedPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            usedPct > 90 ? "bg-rose-500" : usedPct > 70 ? "bg-blue-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(tenant)}
                      className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold border-border hover:bg-muted/60 cursor-pointer shadow-2xs"
                    >
                      <Settings2 className="size-3.5 text-muted-foreground" />
                      <span>Manage</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
