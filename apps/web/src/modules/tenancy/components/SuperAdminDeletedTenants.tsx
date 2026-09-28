"use client";

import { useReducer } from "react";
import Image from "next/image";
import { 
  useTenants, 
  useRestoreTenant, 
  usePermanentDeleteTenant 
} from "@/lib/graphql/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2, 
  RotateCcw, 
  Trash2, 
  Calendar,
  Clock,
  Search
} from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const toSafeDate = (val: any): Date => {
  if (!val) return new Date();
  const date = new Date(val);
  if (!isNaN(date.getTime())) return date;
  // Attempt to parse numerical strings that new Date() might fail on natively
  const timestamp = Number(val);
  if (!isNaN(timestamp) && timestamp > 0) return new Date(timestamp);
  return new Date();
};

type State = {
  search: string;
  currentPage: number;
  isRestoring: boolean;
  isPurging: boolean;
  selectedTenant: any;
  restoreDialogOpen: boolean;
  purgeDialogOpen: boolean;
};

type Action =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_IS_RESTORING"; payload: boolean }
  | { type: "SET_IS_PURGING"; payload: boolean }
  | { type: "SET_SELECTED_TENANT"; payload: any }
  | { type: "SET_RESTORE_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_PURGE_DIALOG_OPEN"; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload, currentPage: 1 };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_IS_RESTORING":
      return { ...state, isRestoring: action.payload };
    case "SET_IS_PURGING":
      return { ...state, isPurging: action.payload };
    case "SET_SELECTED_TENANT":
      return { ...state, selectedTenant: action.payload };
    case "SET_RESTORE_DIALOG_OPEN":
      return { ...state, restoreDialogOpen: action.payload };
    case "SET_PURGE_DIALOG_OPEN":
      return { ...state, purgeDialogOpen: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  search: "",
  currentPage: 1,
  isRestoring: false,
  isPurging: false,
  selectedTenant: null,
  restoreDialogOpen: false,
  purgeDialogOpen: false,
};

export function SuperAdminDeletedTenants() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search,
    currentPage,
    isRestoring,
    isPurging,
    selectedTenant,
    restoreDialogOpen,
    purgeDialogOpen,
  } = state;

  // Specifically fetch deleted records using the "deleted" filter key
  const { data, isLoading, refetch } = useTenants({
    status: "deleted",
    search: search || undefined,
    page: currentPage,
    limit: 50
  });

  const restoreMutation = useRestoreTenant();
  const purgeMutation = usePermanentDeleteTenant();

  const tenants = data?.tenants ?? [];

  const calculateDaysLeft = (deletedAtStr: string) => {
    if (!deletedAtStr) return 0;
    const deletedDate = toSafeDate(deletedAtStr);
    const expiryDate = addDays(deletedDate, 28);
    const days = differenceInDays(expiryDate, new Date());
    return Math.max(0, days);
  };

  const handleRestore = async () => {
    if (!selectedTenant) return;
    dispatch({ type: "SET_IS_RESTORING", payload: true });
    try {
      await restoreMutation.mutateAsync(selectedTenant.id);
      dispatch({ type: "SET_RESTORE_DIALOG_OPEN", payload: false });
      refetch();
    } catch (err) {
      // Hook handles toast
    } finally {
      dispatch({ type: "SET_IS_RESTORING", payload: false });
    }
  };

  const handlePurge = async () => {
    if (!selectedTenant) return;
    dispatch({ type: "SET_IS_PURGING", payload: true });
    try {
      await purgeMutation.mutateAsync(selectedTenant.id);
      dispatch({ type: "SET_PURGE_DIALOG_OPEN", payload: false });
      refetch();
    } catch (err) {
       // Hook handles toast
    } finally {
      dispatch({ type: "SET_IS_PURGING", payload: false });
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Banner - Recycle Bin */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 dark:border-sky-950/40 bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-sky-100/70 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-sky-900/30 px-4 sm:px-6 py-4 sm:py-5 shadow-xs">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Recycle Bin
            </h2>

            {/* Description — desktop only (inside card) */}
            <p className="hidden sm:block mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Schools slated for disposal. Data is fully retrievable for 28 days following deletion.
            </p>

            {/* Search — desktop only (inside card) */}
            <div className="hidden sm:flex relative mt-3 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search deleted schools..."
                className="pl-9 h-9 bg-white/95 dark:bg-zinc-900/95 border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-2xs text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 w-full"
                value={search}
                onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
              />
            </div>
          </div>

          {/* Right Side image — all sizes */}
          <div className="relative h-[68px] sm:h-20 md:h-24 aspect-[4/3] shrink-0 overflow-hidden">
            <Image
              src="/assets/super-admin/deltedtop.avif"
              alt="Recycle Bin"
              fill
              priority
              className="object-contain scale-110"
              sizes="(max-width: 640px) 90px, (max-width: 768px) 140px, 160px"
            />
          </div>
        </div>
      </div>

      {/* Search bar — mobile only, below hero */}
      <div className="relative sm:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
        <Input
          placeholder="Search deleted schools..."
          className="pl-9 h-9 w-full bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500"
          value={search}
          onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
        />
      </div>

      {/* Main Content Card: Deletion Queue */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100/80 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Trash2 className="size-4.5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Deletion Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Schools deleted and in their 28-day retention window.
            </p>
          </div>
        </div>

        {/* ── Mobile card list (< sm) ── */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-zinc-800/80">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                </div>
                <Skeleton className="h-3 w-44 rounded-md" />
                <div className="flex items-center gap-2 pt-0.5">
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                </div>
              </div>
            ))
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14">
              <div className="size-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400">
                <Building2 className="size-6 opacity-40" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Bin is empty</p>
              <p className="text-xs text-slate-400">No schools are currently slated for disposal.</p>
            </div>
          ) : (
            tenants.map((tenant: any) => {
              const deletedDate = toSafeDate(tenant.deletedAt || tenant.updatedAt);
              const daysLeft = calculateDaysLeft(tenant.deletedAt || tenant.updatedAt);
              const isUrgent = daysLeft <= 7;
              const estimatedExpiryDate = addDays(deletedDate, 28);

              return (
                <div key={tenant.id} className="p-4 space-y-3">
                  {/* School name + slug */}
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                      <Building2 className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{tenant.name}</div>
                      <div className="text-xs text-slate-400 truncate">/{tenant.slug}</div>
                    </div>
                    {/* Retention badge */}
                    <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                      isUrgent
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-800/50"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-800/50"
                    }`}>
                      <Clock className="size-3 shrink-0" />
                      {daysLeft}d left
                    </span>
                  </div>

                  {/* Deletion date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="size-3.5 shrink-0 text-slate-400" />
                    <span>Deleted: {tenant.deletedAt ? format(deletedDate, "MMM d, yyyy") : "Unknown"}</span>
                    <span className="text-slate-300 dark:text-zinc-700 mx-0.5">·</span>
                    <span>Purges {format(estimatedExpiryDate, "MMM d")}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 dark:text-emerald-300 dark:border-emerald-700/80 dark:bg-emerald-950/30 text-xs font-semibold rounded-lg"
                      onClick={() => {
                        dispatch({ type: "SET_SELECTED_TENANT", payload: tenant });
                        dispatch({ type: "SET_RESTORE_DIALOG_OPEN", payload: true });
                      }}
                    >
                      <RotateCcw className="size-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 gap-1.5 border-red-200 bg-red-50/60 hover:bg-red-100/80 text-red-600 dark:text-red-400 dark:border-red-900/60 dark:bg-red-950/30 text-xs font-semibold rounded-lg"
                      onClick={() => {
                        dispatch({ type: "SET_SELECTED_TENANT", payload: tenant });
                        dispatch({ type: "SET_PURGE_DIALOG_OPEN", payload: true });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Desktop table (sm+) ── */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
                <TableHead className="w-12 py-3.5 pl-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  #
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  School Details
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Deletion Event
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Retention Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right pr-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Reclamation Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/80 last:border-none">
                    <TableCell className="pl-5 py-3.5">
                      <Skeleton className="h-4 w-4 rounded-sm" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-xl shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400">
                        <Building2 className="size-6 opacity-40" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Bin is empty</p>
                      <p className="text-xs text-slate-400">No schools are currently slated for disposal.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant: any, idx: number) => {
                  const deletedDate = toSafeDate(tenant.deletedAt || tenant.updatedAt);
                  const daysLeft = calculateDaysLeft(tenant.deletedAt || tenant.updatedAt);
                  const isUrgent = daysLeft <= 7;
                  const estimatedExpiryDate = addDays(deletedDate, 28);

                  return (
                    <TableRow
                      key={tenant.id}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* # */}
                      <TableCell className="w-12 py-3 pl-5 text-xs font-semibold text-slate-400">
                        {idx + 1}
                      </TableCell>

                      {/* School Details */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                            <Building2 className="size-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                              {tenant.name}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              Slug: {tenant.slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Deletion Event */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          <Calendar className="size-3.5 text-slate-400 shrink-0" />
                          <span>
                            {tenant.deletedAt
                              ? format(deletedDate, "MMM d, yyyy HH:mm")
                              : "Unknown"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Retention Status */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              isUrgent
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full shrink-0 ${isUrgent ? "bg-rose-500" : "bg-amber-500"}`} />
                            {daysLeft} days left
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap">
                            (Est. {format(estimatedExpiryDate, "MMM d, yyyy")})
                          </span>
                        </div>
                      </TableCell>

                      {/* Reclamation Actions */}
                      <TableCell className="px-4 py-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7.5 px-2.5 gap-1.5 border-emerald-300/80 hover:border-emerald-400 dark:border-emerald-700/80 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/30 text-xs font-medium rounded-lg shadow-2xs transition-colors"
                            onClick={() => {
                              dispatch({ type: "SET_SELECTED_TENANT", payload: tenant });
                              dispatch({ type: "SET_RESTORE_DIALOG_OPEN", payload: true });
                            }}
                          >
                            <RotateCcw className="size-3" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7.5 px-2.5 gap-1.5 border-rose-200 hover:border-rose-300 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100/80 text-rose-600 dark:text-rose-400 dark:bg-rose-950/30 text-xs font-medium rounded-lg shadow-2xs transition-colors"
                            onClick={() => {
                              dispatch({ type: "SET_SELECTED_TENANT", payload: tenant });
                              dispatch({ type: "SET_PURGE_DIALOG_OPEN", payload: true });
                            }}
                          >
                            <Trash2 className="size-3" />
                            Delete Forever
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Restore Confirmation */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={(open) => dispatch({ type: "SET_RESTORE_DIALOG_OPEN", payload: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate this school?</AlertDialogTitle>
            <AlertDialogDescription>
              This reactivates {selectedTenant?.name} and restores access for all of its users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRestore(); }}
              disabled={isRestoring}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isRestoring ? "Restoring..." : "Reactivate School"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Confirmation */}
      <AlertDialog open={purgeDialogOpen} onOpenChange={(open) => dispatch({ type: "SET_PURGE_DIALOG_OPEN", payload: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Permanently delete this school?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>This permanently deletes {selectedTenant?.name} and all associated data:</p>
                <ul className="list-disc list-inside text-sm ml-2">
                  <li>Subscriptions and transaction records</li>
                  <li>User accounts</li>
                  <li>Gradebooks, attendance, and uploaded assets</li>
                </ul>
                <p className="font-bold mt-4 text-destructive">This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handlePurge(); }}
              disabled={isPurging}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPurging ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
