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
  ArrowUpDown,
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
import { useAcademicYears } from "@/modules/academics/hooks/use-academic-years";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

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
      toast.error("Failed to save academic year");
    }
  };

  const handleDelete = async (id: string) => {
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
        const da = new Date(a.startDate || 0).getTime();
        const db = new Date(b.startDate || 0).getTime();
        return sortOrder === "desc" ? db - da : da - db;
      });
  }, [academicYears, searchQuery, typeFilter, statusFilter, sortOrder]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
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
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
              Total Sessions
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
              {academicYears.length}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar className="size-4.5" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
              Active
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
              {activeCount}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="size-4.5" />
          </div>
        </div>

        {/* Current Session */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
              Current Session
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1 truncate">
              {currentYear?.name || "Not Set"}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Check className="size-4.5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input 
            placeholder="Search sessions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 h-9.5 text-xs sm:text-sm rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526]"
          />
        </div>

        {/* All Sessions Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9.5 w-[130px] rounded-xl text-xs sm:text-sm border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526]">
            <SelectValue placeholder="All sessions" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All sessions</SelectItem>
            <SelectItem value="current">Current only</SelectItem>
            <SelectItem value="non-current">Other sessions</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9.5 w-[120px] rounded-xl text-xs sm:text-sm border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Start Date Sort */}
        <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
          <SelectTrigger className="h-9.5 w-[120px] rounded-xl text-xs sm:text-sm border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526]">
            <SelectValue placeholder="Start date" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="desc">Start date ↓</SelectItem>
            <SelectItem value="asc">Start date ↑</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
          aria-label="Toggle sort order"
          className="size-9.5 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] shrink-0"
        >
          <ArrowUpDown className="size-4 text-slate-500" />
        </Button>
      </div>

      {/* Sessions Data Table Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0D1526] overflow-hidden shadow-2xs">
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
                <tr className="bg-slate-50/70 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-800/80 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
                        <div className="flex items-center gap-3">
                          <div className="size-8.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Calendar className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-zinc-100 leading-tight">
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
                        {duration}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
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
                            onClick={() => handleDelete(year.id)}
                            aria-label={`Delete ${year.name}`}
                            className="size-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
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
