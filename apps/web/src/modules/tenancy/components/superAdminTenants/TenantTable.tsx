import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import {
  Building2,
  Globe,
  MoreVertical,
  Eye,
  Database,
  ShieldCheck,
  Shield,
  Edit,
  Ban,
  CheckCircle2,
  Trash2,
  GraduationCap,
  Users,
  UserCheck,
  ExternalLink,
  Settings2,
  Plug,
} from "lucide-react";
import { Tenant, ViewMode } from "./types";
import { TenantPlanBadge, TenantStatusBadge } from "./badges";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

// --- Helper Components ---

const TenantCard = memo(function TenantCard({
  tenant,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onManageData,
  onAddAdmin,
  onIntegrations,
}: {
  tenant: Tenant;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onManageData?: () => void;
  onAddAdmin: (tenant: Tenant) => void;
  onIntegrations: (tenant: Tenant) => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-950 text-foreground rounded-2xl p-4 border-2 border-neutral-900 dark:border-white shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header: Emblem, Title, /slug, More Menu */}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                title="School Actions"
              >
                <Settings2 className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
              <DropdownMenuItem onClick={onView} className="text-xs">
                <Eye className="size-3.5 mr-2" />
                Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onManageData} className="text-xs">
                <Database className="size-3.5 mr-2" />
                Manage Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddAdmin(tenant)} className="text-xs">
                <ShieldCheck className="size-3.5 mr-2" />
                Create Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onIntegrations(tenant)} className="text-xs">
                <Plug className="size-3.5 mr-2" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="text-xs">
                <Edit className="size-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleStatus} className="text-xs">
                {tenant.status === "active" ? (
                  <>
                    <Ban className="size-3.5 mr-2" />
                    Suspend
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive text-xs"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges: Plan & Status */}
        <div className="flex items-center gap-2 mt-3.5">
          <TenantPlanBadge plan={tenant.plan} />
          <TenantStatusBadge status={tenant.status} />
        </div>

        {/* Stats Row: Students, Teachers, Parents */}
        <div className="grid grid-cols-3 gap-2 mt-3.5">
          <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
            <Users className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                {tenant.studentCount ? Number(tenant.studentCount).toLocaleString() : 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                Students
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
            <GraduationCap className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                {tenant.teacherCount ? Number(tenant.teacherCount).toLocaleString() : 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                Teachers
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
            <UserCheck className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                {tenant.parentCount ? Number(tenant.parentCount).toLocaleString() : 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                Parents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-4 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full h-9 rounded-xl border-2 border-neutral-900 dark:border-white bg-white dark:bg-zinc-950 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-foreground font-semibold text-xs transition-colors shadow-2xs"
            onClick={onView}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            className="w-full h-9 rounded-xl border-2 border-neutral-900 dark:border-white bg-white dark:bg-zinc-950 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-foreground font-semibold text-xs transition-colors shadow-2xs"
            onClick={onManageData}
          >
            Live Data
          </Button>
        </div>

        <Button
          className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors border-2 border-neutral-900 dark:border-white"
          onClick={() => onAddAdmin(tenant)}
        >
          <Shield className="size-4 stroke-[2.2]" />
          <span>Add School Admin</span>
        </Button>
      </div>
    </div>
  );
});

// --- Main Table Component ---

interface TenantTableProps {
  tenants: Tenant[];
  loading: boolean;
  viewMode: ViewMode;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onToggleStatus: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onManageData: (tenant: Tenant) => void;
  onAddAdmin: (tenant: Tenant) => void;
  onIntegrations: (tenant: Tenant) => void;
}

export function TenantTable({
  tenants,
  loading,
  viewMode,
  currentPage,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onManageData,
  onAddAdmin,
  onIntegrations,
}: TenantTableProps) {
  if (loading && tenants.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[220px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <Card className="py-20 text-center border-dashed border-2 rounded-2xl">
        <CardContent className="space-y-3">
          <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
            <Building2 className="size-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="font-semibold text-base text-foreground">No schools found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-xs">
            Try adjusting your filters or search query to find the school you are looking for.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onView={() => onView(tenant)}
              onEdit={() => onEdit(tenant)}
              onToggleStatus={() => onToggleStatus(tenant)}
              onDelete={() => onDelete(tenant)}
              onManageData={() => onManageData(tenant)}
              onAddAdmin={onAddAdmin}
              onIntegrations={onIntegrations}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <DataTablePagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            summary={`Page ${currentPage} of ${totalPages}`}
            className="pt-3 border-t border-border"
          />
        )}
      </div>
    );
  }

  const commonClasses = "text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5";
  const cellClasses = "py-3 text-xs font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
              <TableHead className="w-12 text-xs font-semibold text-slate-500 dark:text-slate-400 py-3.5 pl-5">#</TableHead>
              <TableHead className={commonClasses}>School Name</TableHead>
              <TableHead className={commonClasses}>Plan</TableHead>
              <TableHead className={commonClasses}>Students</TableHead>
              <TableHead className={commonClasses}>Status</TableHead>
              <TableHead className={commonClasses}>Revenue</TableHead>
              <TableHead className={`${commonClasses} text-right pr-4`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant, idx) => (
              <TableRow
                key={tenant.id}
                className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* # */}
                <TableCell className="w-12 py-3 pl-5 text-xs font-semibold text-slate-400">
                  {(currentPage - 1) * 25 + idx + 1}
                </TableCell>

                <TableCell className={cellClasses}>
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center overflow-hidden border shrink-0">
                      <img src={tenant.logo || "/test.webp"} alt={tenant.name} className="size-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{tenant.name}</p>
                      <p className="text-[11px] text-muted-foreground">/{tenant.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cellClasses}>
                  <TenantPlanBadge plan={tenant.plan} />
                </TableCell>
                <TableCell className={cellClasses}>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">{tenant.studentCount} / {tenant.maxStudents}</p>
                    <div className="h-1 w-20 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, (tenant.studentCount / tenant.maxStudents) * 100)}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cellClasses}>
                  <TenantStatusBadge status={tenant.status} />
                </TableCell>
                <TableCell className={cellClasses}>
                  <span className="font-semibold text-xs text-foreground">
                    ₹{tenant.totalRevenue.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-right pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer text-xs"
                      >
                        •••
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs rounded-xl">
                      <DropdownMenuItem onClick={() => onView(tenant)} className="text-xs">
                        <Eye className="size-3.5 mr-2" /> Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManageData(tenant)} className="text-xs">
                        <Database className="size-3.5 mr-2" /> Manage Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddAdmin(tenant)} className="text-xs">
                        <ShieldCheck className="size-3.5 mr-2" /> Create Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onIntegrations(tenant)} className="text-xs">
                        <Plug className="size-3.5 mr-2" /> Integrations
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(tenant)} className="text-xs">
                        <Edit className="size-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onToggleStatus(tenant)} className="text-xs">
                        {tenant.status === "active" ? (
                          <>
                            <Ban className="size-3.5 mr-2" /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3.5 mr-2" /> Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive text-xs" onClick={() => onDelete(tenant)}>
                        <Trash2 className="size-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <DataTablePagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            summary={`Showing ${tenants.length} schools`}
          />
        </div>
      )}
    </div>
  );
}
