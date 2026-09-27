import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck,
  Mail,
  Clock,
  Pencil,
  Trash2,
  LockKeyhole,
  MoreVertical,
  Calendar,
  Shield,
} from "lucide-react";
import { AdminRecord, getInitials, formatDate, AdminViewMode } from "./types";
import { StatusBadge } from "@/components/ui/status-badge";

interface AdminTableProps {
  admins: AdminRecord[];
  filteredAdmins: AdminRecord[];
  loading: boolean;
  rootAdminId: string | null;
  onEdit: (admin: AdminRecord) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  viewMode?: AdminViewMode;
}

export function AdminTable({
  admins,
  filteredAdmins,
  loading,
  rootAdminId,
  onEdit,
  onDelete,
  deletingId,
  setDeletingId,
  viewMode = "table",
}: AdminTableProps) {
  const renderCard = (admin: AdminRecord) => {
    const isRoot = admin.id === rootAdminId;
    const initials = getInitials(admin.name);
    const createdDate = formatDate(admin.createdAt);

    return (
      <div
        key={admin.id}
        className="bg-white dark:bg-zinc-950 text-foreground rounded-2xl p-4 border-2 border-neutral-900 dark:border-white shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          {/* Top Header: Circular Emblem, Title, Sub-handle, More Menu */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-300 dark:border-neutral-700 overflow-hidden shadow-2xs">
                <AvatarFallback className="text-xs font-bold rounded-full bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug truncate" title={admin.name}>
                    {admin.name}
                  </h3>
                  {isRoot && (
                    <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] gap-1 px-1.5 py-0 shadow-none font-semibold">
                      <LockKeyhole className="size-2.5" />
                      Root Owner
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate font-normal flex items-center gap-1">
                  <span className="text-muted-foreground/60 font-medium">@</span>
                  <span className="truncate">{admin.email}</span>
                </p>
              </div>
            </div>

            {!isRoot ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl text-xs">
                  <DropdownMenuItem onClick={() => onEdit(admin)} className="text-xs">
                    <Pencil className="size-3.5 mr-2" />
                    Edit Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive text-xs"
                    onClick={() => setDeletingId(admin.id)}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="p-1.5 text-muted-foreground/40" title="Root owner cannot be modified">
                <LockKeyhole className="size-4" />
              </div>
            )}
          </div>

          {/* Badges: Role & Status */}
          <div className="flex items-center gap-2 mt-3">
            <Badge
              variant="outline"
              className="font-medium text-xs gap-1.5 h-6 px-2.5 shadow-2xs rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            >
              <Shield className="size-2.5" />
              Super Admin
            </Badge>
            <StatusBadge tone={admin.isActive ? "positive" : "negative"}>
              {admin.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>

          {/* Info Box: Email & Created info */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight truncate">
                  Platform
                </p>
                <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                  Full Access
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight truncate">
                  {createdDate}
                </p>
                <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                  Member Since
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-1">
          {!isRoot ? (
            <Button
              variant="outline"
              className="w-full h-9 rounded-xl border-2 border-neutral-900 dark:border-white bg-white dark:bg-zinc-950 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              onClick={() => onEdit(admin)}
            >
              <Pencil className="size-3.5" />
              <span>Edit Account</span>
            </Button>
          ) : (
            <div className="w-full h-9 rounded-xl border-2 border-neutral-900/40 dark:border-white/40 bg-neutral-100 dark:bg-zinc-900 text-muted-foreground font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-not-allowed">
              <LockKeyhole className="size-3.5" />
              <span>Protected Root Account</span>
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        {!isRoot && (
          <AlertDialog
            open={deletingId === admin.id}
            onOpenChange={(open) => {
              if (!open) setDeletingId(null);
            }}
          >
            <AlertDialogContent className="rounded-2xl border-2 w-[calc(100%-2rem)] max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-semibold text-xl">
                  Delete Super Admin
                </AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-sm">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">{admin.name}</strong>? This action
                  cannot be undone and they will lose all platform access.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel
                  className="rounded-xl font-medium border-2"
                  onClick={() => setDeletingId(null)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
                  onClick={() => onDelete(admin.id)}
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Responsive: On mobile always show cards; on desktop show grid or table depending on viewMode */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-border shadow-2xs space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-36 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="size-6 rounded-md" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <Skeleton className="h-11 rounded-xl" />
                  <Skeleton className="h-11 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile Cards Skeleton */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-border shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-36 rounded-md" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Skeleton */}
            <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border">
                    <TableHead className="min-w-[250px] font-semibold text-xs py-3.5 pl-6">Name</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">Email</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">Status</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">Created</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold text-xs py-3.5 pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-b last:border-none">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-full shrink-0" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="h-4 w-40 rounded-md" />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </TableCell>
                      <TableCell className="pr-6 py-3.5 text-right">
                        <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    );
  }

  if (filteredAdmins.length === 0) {
    return (
      <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border p-6 shadow-2xs">
        <ShieldCheck className="size-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="font-bold text-base text-foreground">No super admin accounts found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          {admins.length === 0
            ? "Create your first super admin account to get started."
            : "No administrators match your search or status filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile View: Always Grid */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {filteredAdmins.map((admin) => renderCard(admin))}
      </div>

      {/* Desktop View: Grid or Table based on viewMode */}
      {viewMode === "grid" ? (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmins.map((admin) => renderCard(admin))}
        </div>
      ) : (
        <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border">
                <TableHead className="min-w-[250px] font-semibold text-xs py-3.5 pl-6">Name</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Email</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Status</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Created</TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-xs py-3.5 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => {
                const isRoot = admin.id === rootAdminId;
                return (
                  <TableRow
                    key={admin.id}
                    className="hover:bg-muted/50 transition-colors border-b last:border-none"
                  >
                    <TableCell className="pl-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0 shadow-2xs">
                          <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                            {getInitials(admin.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-foreground truncate">
                              {admin.name}
                            </p>
                            {isRoot && (
                              <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs gap-1 px-1.5 py-0 shadow-none font-medium">
                                <LockKeyhole className="size-3" />
                                Root Owner
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate sm:hidden font-medium">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate font-medium text-foreground">
                          {admin.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <StatusBadge tone={admin.isActive ? "positive" : "negative"}>
                        {admin.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="size-3.5" />
                        {formatDate(admin.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3.5">
                      {isRoot ? (
                        <div className="flex items-center justify-end gap-1 opacity-40 cursor-not-allowed" title="Root owner cannot be modified">
                          <Button variant="ghost" size="icon" className="size-8" disabled>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" disabled>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                            onClick={() => onEdit(admin)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <AlertDialog
                            open={deletingId === admin.id}
                            onOpenChange={(open) => {
                              if (!open) setDeletingId(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() => setDeletingId(admin.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-semibold text-xl">
                                  Delete Super Admin
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-medium text-sm">
                                  Are you sure you want to delete{" "}
                                  <strong className="text-foreground">{admin.name}</strong>? This action
                                  cannot be undone and they will lose all platform access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel
                                  className="rounded-xl font-medium border-2"
                                  onClick={() => setDeletingId(null)}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
                                  onClick={() => onDelete(admin.id)}
                                >
                                  Delete Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {!loading && filteredAdmins.length > 0 && (
            <div className="px-6 py-3 border-t border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground">
                Showing <span className="text-foreground">{filteredAdmins.length}</span> of <span className="text-foreground">{admins.length}</span> super admin{admins.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

