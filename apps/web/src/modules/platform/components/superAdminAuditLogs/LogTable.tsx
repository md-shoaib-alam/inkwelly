import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  MoreHorizontal,
  Clock,
  Database,
  Activity,
  ScrollText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  AuditLog,
  ActionTypeCount,
  truncateJson,
  formatTimestamp
} from "./types";

interface LogTableProps {
  loading: boolean;
  logs: AuditLog[];
  totalLogs: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (val: string) => void;
  actionFilter: string;
  onActionFilterChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  tenantFilter: string;
  onTenantFilterChange: (val: string) => void;
  tenants: any[];
  actionTypes: ActionTypeCount[];
}

export function LogTable({
  loading,
  logs,
  totalLogs,
  page,
  totalPages,
  limit,
  onPageChange,
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  roleFilter,
  onRoleFilterChange,
  tenantFilter,
  onTenantFilterChange,
  tenants,
  actionTypes,
}: LogTableProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("DISABLE")) {
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    }
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("ENABLE") || act.includes("INVITE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("PATCH") || act.includes("CHANGE")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
    }
    if (act.includes("LOGIN") || act.includes("AUTH") || act.includes("VERIFY")) {
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800";
    }
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <PageHeader
        icon={<ScrollText />}
        title="Audit Logs"
        description="Monitor any changes made to your project, schema and content with audit logs."
      />

      {/* Filters Area */}
      {showFilters && (
        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row items-end gap-4">
          <div className="w-full space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">By Role</Label>
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger className="w-full bg-card border-border h-10">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">By Tenant</Label>
            <Select value={tenantFilter} onValueChange={onTenantFilterChange}>
              <SelectTrigger className="w-full bg-card border-border h-10">
                <SelectValue placeholder="Select Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Action</Label>
            <Select value={actionFilter} onValueChange={onActionFilterChange}>
              <SelectTrigger className="w-full bg-card border-border h-10">
                <SelectValue placeholder="Select Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((at) => (
                  <SelectItem key={at.action} value={at.action} className="capitalize">
                    {at.action.replace(/_/g, " ").toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 h-10 md:pt-1.5">
            <Button className="px-6 h-10 rounded-md shadow-sm">
              Apply
            </Button>
            <Button
              variant="outline"
              className="bg-card h-10"
              onClick={() => setShowFilters(false)}
            >
              Hide
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="overflow-x-auto">
            <Table className="w-full text-left">
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                  <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Operator</TableHead>
                  <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Email Address</TableHead>
                  <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Action</TableHead>
                  <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Timestamp</TableHead>
                  <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-none">
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28 rounded-md" />
                          <Skeleton className="h-3 w-16 rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Skeleton className="h-4 w-36 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Skeleton className="size-8 rounded-full ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            No audit events found matching current filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="w-full text-left">
                <TableHeader>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Operator</TableHead>
                    <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Email Address</TableHead>
                    <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Action</TableHead>
                    <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto">Timestamp</TableHead>
                    <TableHead className="font-semibold text-zinc-800 dark:text-zinc-200 py-3 px-4 h-auto text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      {/* Column 1: User Name with Avatar */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${log.user?.name || log.tenant?.name || 'Sys'}`} />
                            <AvatarFallback className="text-xs bg-zinc-100 text-zinc-500"><User className="size-3.5" /></AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {log.user?.name || (log.tenant ? `${log.tenant.name} (System)` : "Platform Admin")}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              @{log.tenant?.slug || "sysroot"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                          {log.user?.email || log.tenant?.email || "system@platform.dev"}
                        </Button>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-sm capitalize">
                        <Badge 
                          variant="outline" 
                          className={`font-medium px-2 py-0.5 rounded-md border ${getActionColor(log.action)}`}
                        >
                          {log.action.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatTimestamp(log.createdAt)}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          onClick={() => setSelectedLog(log)}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Control Bar */}
            <div className="px-4 py-3 border-t border-border">
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
                summary={`Displaying ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalLogs)} of ${totalLogs.toLocaleString()} records`}
              />
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg border-zinc-200 dark:border-zinc-800 sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-blue-600" />
              Audit Event Details
            </DialogTitle>
            <DialogDescription>
              Complete trace history and context dump for this transaction.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-5 pt-2">
              {/* Essential Context Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Clock className="size-3" /> Executed at
                  </span>
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {formatTimestamp(selectedLog.createdAt)}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Database className="size-3" /> Target module
                  </span>
                  <Badge variant="secondary" className="uppercase text-xs h-5 font-medium">
                    {selectedLog.resource}
                  </Badge>
                </div>
              </div>

              {/* Actor Meta Grid */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground border-b border-border pb-1.5 mb-2">
                  Operator & network context
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Operator name</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedLog.user?.name || (selectedLog.tenant ? `${selectedLog.tenant.name}` : "Platform Engine")}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Network IP</p>
                    <p className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {selectedLog.ipAddress || "Internal"}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Registered email</p>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                      {selectedLog.user?.email || selectedLog.tenant?.email || "sysadmin@platform.dev"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Payload Context */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Action Event Payload</span>
                   <Badge variant="outline" className="text-xs font-mono bg-muted">
                      {selectedLog.action}
                   </Badge>
                </div>
                <div className="relative bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 rounded-md p-3 overflow-hidden">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch {
                        return selectedLog.details;
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
