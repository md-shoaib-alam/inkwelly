import React from "react";
import Image from "next/image";
import { ExternalLink, Settings2, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TenantSubscription, getPlanBadge, getStatusBadge } from "./types";

interface SchoolCardProps {
  tenant: TenantSubscription;
  onEdit: (tenant: TenantSubscription) => void;
}

export function SchoolCard({ tenant, onEdit }: SchoolCardProps) {
  const usedCount = Math.round((tenant.maxStudents || 100) * 0.7);
  const usedPct = Math.min(100, Math.round((usedCount / (tenant.maxStudents || 100)) * 100));

  return (
    <div className="bg-white dark:bg-zinc-950 text-foreground rounded-2xl p-4 border-2 border-neutral-900 dark:border-white shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header: Logo/Emblem, Title, @subdomain, More Actions */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-900 dark:border-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {tenant.logo ? (
                <Image
                  src={tenant.logo}
                  alt={tenant.name || "School"}
                  width={44}
                  height={44}
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-neutral-900 dark:text-white font-bold text-sm">
                  {tenant.name?.slice(0, 2).toUpperCase() || "SC"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug truncate" title={tenant.name}>
                {tenant.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground font-normal truncate">
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
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-zinc-900"
            onClick={() => onEdit(tenant)}
            title="Manage School"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>

        {/* Badges: Plan & Status */}
        <div className="flex items-center gap-2 mt-3.5">
          {getPlanBadge(tenant.plan)}
          <div suppressHydrationWarning>
            {getStatusBadge(tenant.status, tenant.endDate)}
          </div>
        </div>

        {/* Info Boxes: Student Limits & License Expiry */}
        <div className="grid grid-cols-2 gap-2 mt-3.5">
          {/* Student Limit */}
          <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground font-normal truncate">Students</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">{usedPct}%</span>
            </div>
            <p className="text-xs font-bold text-foreground leading-tight mt-1 truncate">
              {tenant.maxStudents?.toLocaleString() || 100}
            </p>
            <div className="w-full h-1.5 bg-neutral-100 dark:bg-zinc-900 rounded-full overflow-hidden mt-1.5 border border-neutral-300 dark:border-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usedPct > 90 ? "bg-rose-500" : usedPct > 70 ? "bg-blue-500" : "bg-emerald-500"
                )}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          {/* License Expiry */}
          <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground font-normal truncate">License Expiry</span>
            </div>
            <p className="text-xs font-bold text-foreground leading-tight mt-1 truncate" suppressHydrationWarning>
              {tenant.endDate ? format(new Date(tenant.endDate), "PP") : "No Expiry"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-1">
              {tenant.startDate ? `Since ${format(new Date(tenant.startDate), "MMM yyyy")}` : "Active"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-1">
        <Button
          variant="outline"
          className="w-full h-9 rounded-xl border-2 border-neutral-900 dark:border-white bg-white dark:bg-zinc-950 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          onClick={() => onEdit(tenant)}
        >
          <Settings2 className="size-3.5" />
          <span>Manage Subscription</span>
        </Button>
      </div>
    </div>
  );
}
