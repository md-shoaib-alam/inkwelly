import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Shield,
  UserCircle,
  MoreVertical,
  Calendar,
  Sparkles,
} from "lucide-react";
import { StaffRecord, getInitials, avatarStyle, roleBadgeStyle, StaffViewMode } from "./types";
import { StatusBadge } from "@/components/ui/status-badge";

interface StaffTableProps {
  loading: boolean;
  staffList: StaffRecord[];
  filtered: StaffRecord[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (member: StaffRecord) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  viewMode?: StaffViewMode;
}

export function StaffTable({
  loading,
  staffList,
  filtered,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  deletingId,
  setDeletingId,
  viewMode = "table",
}: StaffTableProps) {
  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-24 text-center bg-card rounded-3xl border-2 border-dashed border-border">
        <div className="size-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
          <Users className="size-10" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">No staff members found</h3>
        <p className="text-sm font-medium text-muted-foreground mt-2 max-w-[280px] mx-auto leading-relaxed">
          {staffList.length === 0
            ? 'Start building your platform team by clicking "Add Staff" above.'
            : "No staff members match your search criteria. Try a different term."}
        </p>
      </div>
    );
  }

  const renderCard = (member: StaffRecord) => {
    const initials = getInitials(member.name);
    const roleColor = member.platformRole?.color;
    const hasApiColor = !!roleColor;
    const joinDate = member.createdAt
      ? new Date(member.createdAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : null;

    return (
      <div
        key={member.id}
        className="bg-white dark:bg-zinc-950 text-foreground rounded-2xl p-4 border-2 border-neutral-900 dark:border-white shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          {/* Top Header: Circular Emblem, Title, Sub-handle, More Menu */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-300 dark:border-neutral-700 overflow-hidden shadow-2xs">
                <AvatarFallback
                  className={`text-xs font-bold rounded-full ${!hasApiColor ? "bg-muted text-muted-foreground" : ""}`}
                  style={hasApiColor ? avatarStyle(roleColor) : undefined}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug truncate" title={member.name}>
                  {member.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate font-normal flex items-center gap-1">
                  <span className="text-muted-foreground/60 font-medium">@</span>
                  <span className="truncate">{member.email}</span>
                </p>
              </div>
            </div>

            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl text-xs">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(member)} className="text-xs">
                      <Pencil className="size-3.5 mr-2" />
                      Edit Staff
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive text-xs"
                        onClick={() => setDeletingId(member.id)}
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Badges: Role & Status */}
          <div className="flex items-center gap-2 mt-3">
            {member.platformRole ? (
              <Badge
                variant="outline"
                className="font-medium text-xs gap-1.5 h-6 px-2.5 shadow-2xs rounded-lg"
                style={roleBadgeStyle(member.platformRole.color)}
              >
                <Shield className="size-2.5" />
                {member.platformRole.name}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="font-medium text-xs gap-1.5 h-6 px-2.5 shadow-2xs rounded-lg text-muted-foreground border-border/80"
              >
                <UserCircle className="size-2.5" />
                No Role
              </Badge>
            )}
            <StatusBadge tone={member.isActive ? "positive" : "negative"}>
              {member.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>

          {/* Info Box: Phone & Joining info */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight truncate">
                  {member.phone || "Not Set"}
                </p>
                <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                  Contact Phone
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border-2 border-neutral-900 dark:border-white rounded-xl p-2.5 flex items-center gap-2 shadow-2xs">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight truncate">
                  {joinDate || "Member"}
                </p>
                <p className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                  Staff Access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-1">
          {canEdit && (
            <Button
              variant="outline"
              className="w-full h-9 rounded-xl border-2 border-neutral-900 dark:border-white bg-white dark:bg-zinc-950 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              onClick={() => onEdit(member)}
            >
              <Pencil className="size-3.5" />
              <span>Edit Staff Details</span>
            </Button>
          )}
        </div>

        {/* Delete confirmation dialog */}
        {canDelete && (
          <AlertDialog
            open={deletingId === member.id}
            onOpenChange={(open) => {
              if (!open) setDeletingId(null);
            }}
          >
            <AlertDialogContent className="rounded-2xl border-2 w-[calc(100%-2rem)] max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-semibold text-xl">
                  Delete Staff Member
                </AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-sm">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-foreground">{member.name}</span>?
                  This action cannot be undone and will revoke all access immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl font-medium border-2">
                  Keep Member
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium"
                  onClick={() => onDelete(member.id)}
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile View: Always Grid */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {filtered.map((member) => renderCard(member))}
      </div>

      {/* Desktop View: Grid or Table based on viewMode */}
      {viewMode === "grid" ? (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => renderCard(member))}
        </div>
      ) : (
        <Card className="hidden sm:block border-none shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-transparent">
                  <TableHead className="min-w-[220px] text-xs font-medium text-muted-foreground py-4 pl-6">Member</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium text-muted-foreground py-4">Contact Info</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs font-medium text-muted-foreground py-4">Platform Role</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground py-4">Status</TableHead>
                  {(canEdit || canDelete) && (
                    <TableHead className="w-[100px] text-right text-xs font-medium text-muted-foreground py-4 pr-6">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => {
                  const initials = getInitials(member.name);
                  const roleColor = member.platformRole?.color;
                  const hasApiColor = !!roleColor;

                  return (
                    <TableRow
                      key={member.id}
                      className="hover:bg-muted/50 transition-colors border-b last:border-none"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 shrink-0 shadow-sm rounded-xl">
                            <AvatarFallback
                              className={`text-xs font-bold rounded-xl ${!hasApiColor ? "bg-muted text-muted-foreground" : ""}`}
                              style={hasApiColor ? avatarStyle(roleColor) : undefined}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {member.name}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium truncate sm:hidden">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">
                              {member.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 opacity-60">
                            <Phone className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium truncate">
                              {member.phone || "\u2013"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell py-4">
                        {member.platformRole ? (
                          <Badge
                            variant="outline"
                            className="font-medium text-xs gap-1.5 h-6 px-2.5 shadow-sm"
                            style={roleBadgeStyle(member.platformRole.color)}
                          >
                            <Shield className="size-2.5" />
                            {member.platformRole.name}
                          </Badge>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 opacity-50">
                            <UserCircle className="size-3.5" />
                            No Role Assigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-4">
                        <StatusBadge tone={member.isActive ? "positive" : "negative"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </TableCell>

                      {(canEdit || canDelete) && (
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => onEdit(member)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <AlertDialog
                                open={deletingId === member.id}
                                onOpenChange={(open) => {
                                  if (!open) setDeletingId(null);
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeletingId(member.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-2">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-semibold text-xl">
                                      Delete Staff Member
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="font-medium text-sm">
                                      Are you sure you want to permanently delete{" "}
                                      <span className="font-semibold text-foreground">{member.name}</span>?
                                      This action cannot be undone and will revoke all access immediately.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="rounded-xl font-medium border-2">
                                      Keep Member
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium"
                                      onClick={() => onDelete(member.id)}
                                    >
                                      Confirm Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

            {!loading && filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground">
                  Directly managing <span className="text-foreground">{filtered.length}</span> platform personnel records
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid footer count (when in grid view on desktop or mobile) */}
      {!loading && filtered.length > 0 && viewMode === "grid" && (
        <div className="hidden sm:block py-2 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Directly managing <span className="text-foreground">{filtered.length}</span> platform personnel records
          </p>
        </div>
      )}

      {/* Mobile footer count */}
      {!loading && filtered.length > 0 && (
        <div className="sm:hidden py-2 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Directly managing <span className="text-foreground">{filtered.length}</span> platform personnel records
          </p>
        </div>
      )}
    </div>
  );
}
