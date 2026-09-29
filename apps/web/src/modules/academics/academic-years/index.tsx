"use client";

import { useMemo, useState } from "react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  Activity,
  Search,
  CalendarDays,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAcademicYears } from "../hooks/use-academic-years";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn, formatLocalDate, parseLocalDate } from "@/lib/utils";

function formatSessionDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM dd, yyyy");
}

function getDurationMonths(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return "—";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return `${Math.max(1, months)}mo`;
}

function parseTimestamp(val: any): number {
  if (!val) return 0;
  const t = new Date(val).getTime();
  return isNaN(t) ? 0 : t;
}

export function AcademicYearsScreen() {
  const { 
    academicYears, 
    isLoading, 
    createAcademicYear, 
    updateAcademicYear, 
    deleteAcademicYear, 
    setCurrentAcademicYear,
    isCreating,
    isUpdating,
  } = useAcademicYears();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"startDate" | "endDate" | "createdAt">("startDate");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "active",
    isCurrent: false
  });

  const handleOpenDialog = (year: any = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        name: year.name,
        startDate: year.startDate,
        endDate: year.endDate,
        status: year.status,
        isCurrent: year.isCurrent
      });
    } else {
      setEditingYear(null);
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        status: "active",
        isCurrent: false
      });
    }
    setRenameError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error("Start Date and End Date are required");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    try {
      if (editingYear) {
        await updateAcademicYear({ id: editingYear.id, input: formData });
        toast.success("Academic year updated successfully");
      } else {
        await createAcademicYear(formData);
        toast.success("Academic year created successfully");
      }
      setIsDialogOpen(false);
    } catch (error) {
      const err = error as { message?: string };
      if (err?.message?.includes("YEAR_IN_USE")) {
        setRenameError(err.message.replace(/^.*YEAR_IN_USE:\s*/, ""));
        return;
      }
      toast.error("Failed to save academic year");
    }
  };

  const handleDelete = async (id: string) => {
    const target = academicYears.find((y: any) => y.id === id);
    if (target?.isCurrent) {
      toast.error("The current academic session cannot be deleted");
      return;
    }
    if (confirm("Are you sure you want to delete this academic year?")) {
      try {
        await deleteAcademicYear(id);
        toast.success("Academic year deleted");
      } catch (error) {
        toast.error("Failed to delete academic year");
      }
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await setCurrentAcademicYear(id);
      toast.success("Current academic year updated");
    } catch (error) {
      toast.error("Failed to set current academic year");
    }
  };

  const currentYear = useMemo(() => {
    return academicYears.find((y: any) => y.isCurrent);
  }, [academicYears]);

  const activeCount = useMemo(() => {
    return academicYears.filter((y: any) => y.status === "active").length;
  }, [academicYears]);

  const filteredYears = useMemo(() => {
    return academicYears
      .filter((year: any) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!year.name.toLowerCase().includes(q)) return false;
        }
        if (typeFilter === "current" && !year.isCurrent) return false;
        if (typeFilter === "non-current" && year.isCurrent) return false;
        if (statusFilter !== "all" && year.status !== statusFilter) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === "endDate") {
          valA = parseTimestamp(a.endDate);
          valB = parseTimestamp(b.endDate);
        } else if (sortBy === "createdAt") {
          valA = parseTimestamp(a.createdAt);
          valB = parseTimestamp(b.createdAt);
        } else {
          valA = parseTimestamp(a.startDate);
          valB = parseTimestamp(b.startDate);
        }

        if (valA !== valB) {
          return sortDirection === "desc" ? valB - valA : valA - valB;
        }

        const nameA = String(a.name || "");
        const nameB = String(b.name || "");
        return sortDirection === "desc"
          ? nameB.localeCompare(nameA, undefined, { numeric: true })
          : nameA.localeCompare(nameB, undefined, { numeric: true });
      });
  }, [academicYears, searchQuery, typeFilter, statusFilter, sortBy, sortDirection]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            Academic Sessions
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage academic year sessions assigned to this school
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[#064E3B] hover:bg-[#047857] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="size-4" />
              <span>Assign Session</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[425px] rounded-2xl p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingYear ? "Edit Academic Session" : "New Academic Session"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Set the name and calendar duration for this academic session.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">Session Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. 2026-27" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs font-semibold">Start Date</Label>
                  <DatePicker 
                    date={parseLocalDate(formData.startDate)}
                    onChange={(d) => {
                      const formatted = formatLocalDate(d);
                      const currentEnd = parseLocalDate(formData.endDate);
                      const newEnd = d && currentEnd && d > currentEnd ? formatted : formData.endDate;
                      setFormData({ ...formData, startDate: formatted, endDate: newEnd });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs font-semibold">End Date</Label>
                  <DatePicker 
                    date={parseLocalDate(formData.endDate)}
                    onChange={(d) => setFormData({ ...formData, endDate: formatLocalDate(d) })}
                    disabled={(d) => {
                      const start = parseLocalDate(formData.startDate);
                      return start ? d < start : false;
                    }}
                  />
                </div>
              </div>
              {renameError && <p className="text-xs text-red-600 dark:text-red-400">{renameError}</p>}
              <DialogFooter className="pt-3">
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating} 
                  className="w-full bg-[#064E3B] hover:bg-[#047857] text-white rounded-xl font-semibold"
                >
                  {isCreating || isUpdating ? "Saving..." : (editingYear ? "Update Session" : "Create Session")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Sessions */}
        <div className="ink-kpi-tile rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              Total Sessions
            </p>
            <p className="mt-1.5 text-sm font-semibold font-[family-name:var(--font-lexend)] leading-tight text-[#0F172A] dark:text-zinc-100">
              {academicYears.length}
            </p>
          </div>
          <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Calendar className="size-4" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="ink-kpi-tile rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              Active
            </p>
            <p className="mt-1.5 text-sm font-semibold font-[family-name:var(--font-lexend)] leading-tight text-[#0F172A] dark:text-zinc-100">
              {activeCount}
            </p>
          </div>
          <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="size-4" />
          </div>
        </div>

        {/* Current Session */}
        <div className="ink-kpi-tile rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              Current Session
            </p>
            <p className="mt-1.5 text-sm font-semibold font-[family-name:var(--font-lexend)] leading-tight text-[#0F172A] dark:text-zinc-100 truncate">
              {currentYear?.name || "Not Set"}
            </p>
          </div>
          <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Check className="size-4" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 h-9 px-3 w-full sm:w-96 rounded-md border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0D1526] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-slate-400/20 focus-within:border-slate-300 dark:focus-within:border-zinc-700">
          <Search className="size-4 text-slate-400 shrink-0 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search sessions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 p-0 text-xs sm:text-[13px] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:ring-0"
          />
        </div>

        {/* All Sessions Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[140px] rounded-md text-xs sm:text-[13px] border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0D1526]">
            <SelectValue placeholder="All sessions" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="all">All sessions</SelectItem>
            <SelectItem value="current">Current only</SelectItem>
            <SelectItem value="non-current">Other sessions</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[120px] rounded-md text-xs sm:text-[13px] border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0D1526]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Field */}
        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
          <SelectTrigger className="h-9 w-[125px] rounded-md text-xs sm:text-[13px] border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0D1526]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="startDate">Start date</SelectItem>
            <SelectItem value="endDate">End date</SelectItem>
            <SelectItem value="createdAt">Created at</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction Toggle */}
        <button
          type="button"
          onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
          aria-label={sortDirection === "asc" ? "Sort ascending (click to sort descending)" : "Sort descending (click to sort ascending)"}
          title={sortDirection === "asc" ? "Ascending (click for descending)" : "Descending (click for ascending)"}
          className="size-9 rounded-md border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0D1526] hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="size-4 pointer-events-none"
            aria-hidden="true"
          >
            {/* Up arrow (Ascending) */}
            <path
              d="M5 12.5V3.5M5 3.5L2.5 6M5 3.5L7.5 6"
              stroke="currentColor"
              strokeWidth={sortDirection === "asc" ? "2" : "1.5"}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-colors duration-150",
                sortDirection === "asc"
                  ? "text-slate-900 dark:text-zinc-100"
                  : "text-slate-300 dark:text-zinc-600"
              )}
            />
            {/* Down arrow (Descending) */}
            <path
              d="M11 3.5V12.5M11 12.5L8.5 10M11 12.5L13.5 10"
              stroke="currentColor"
              strokeWidth={sortDirection === "desc" ? "2" : "1.5"}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-colors duration-150",
                sortDirection === "desc"
                  ? "text-slate-900 dark:text-zinc-100"
                  : "text-slate-300 dark:text-zinc-600"
              )}
            />
          </svg>
        </button>
      </div>

      {/* Sessions Data Table Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredYears.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CalendarDays className="size-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              No academic sessions found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? "Try clearing your search query or filters" : "Click 'Assign Session' above to add your first session"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredYears.map((year: any) => {
                  const duration = getDurationMonths(year.startDate, year.endDate);
                  const isCurrent = Boolean(year.isCurrent);
                  const isActive = year.status === "active";

                  return (
                    <tr key={year.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      {/* Session Name with Mint Calendar Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Calendar className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-zinc-100 leading-tight">
                              {year.name}
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                              {year.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-medium whitespace-nowrap">
                        {formatSessionDate(year.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-medium whitespace-nowrap">
                        {formatSessionDate(year.endDate)}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          {duration}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <span className="capitalize">{year.status}</span>
                        </span>
                      </td>

                      {/* Current Status / Button */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <Check className="size-3" />
                            <span>Current</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCurrent(year.id)}
                            className="text-xs font-medium text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer outline-none"
                          >
                            Set current
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDialog(year)}
                            aria-label={`Edit ${year.name}`}
                            className="size-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => !isCurrent && handleDelete(year.id)}
                            title={isCurrent ? "Current session cannot be deleted" : `Delete ${year.name}`}
                            aria-label={isCurrent ? "Current session cannot be deleted" : `Delete ${year.name}`}
                            className={cn(
                              "size-7 rounded-lg flex items-center justify-center transition-colors",
                              isCurrent
                                ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-40"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                            )}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-400 dark:text-zinc-500">
          Showing <span className="font-semibold text-slate-700 dark:text-zinc-300">{filteredYears.length}</span> session{filteredYears.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
