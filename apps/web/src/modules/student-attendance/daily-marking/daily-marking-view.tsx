"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { format, subDays } from "date-fns";
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export type DailyMarkingMode = "today" | "past-days";

export type ClassAttendanceStatus = "pending" | "marked" | "partial" | "off-day";

export interface ClassAttendanceRow {
  id: string;
  name: string;
  section: string;
  totalStudents: number;
  status: ClassAttendanceStatus;
  present?: number;
  absent?: number;
  unmarked?: number;
  markedBy?: string;
  rate?: number;
}

// 12 default classes matching the screenshot design
const DEFAULT_MOCK_CLASSES: ClassAttendanceRow[] = [
  { id: "cls-1", name: "Class 1st", section: "A", totalStudents: 25, status: "pending" },
  { id: "cls-2", name: "Class 2nd", section: "A", totalStudents: 24, status: "pending" },
  { id: "cls-3", name: "Class 3rd", section: "A", totalStudents: 24, status: "pending" },
  { id: "cls-4", name: "Class 4th", section: "A", totalStudents: 25, status: "pending" },
  { id: "cls-5", name: "Class 5th", section: "A", totalStudents: 25, status: "pending" },
  { id: "cls-6", name: "Class 6th", section: "A", totalStudents: 25, status: "pending" },
  { id: "cls-7", name: "Class 7th", section: "A", totalStudents: 25, status: "pending" },
  { id: "cls-8", name: "Class 8th", section: "A", totalStudents: 25, status: "pending" },
  { id: "cls-9", name: "Class 9th", section: "A", totalStudents: 26, status: "pending" },
  { id: "cls-10", name: "Class 10th", section: "A", totalStudents: 26, status: "pending" },
  { id: "cls-11", name: "Class 11th", section: "A", totalStudents: 28, status: "pending" },
  { id: "cls-12", name: "Class 12th", section: "A", totalStudents: 28, status: "pending" },
];

export function DailyMarkingView({ mode }: { mode: DailyMarkingMode }) {
  const tenantHref = useTenantHref();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Date selection: today defaults to current date; past-days defaults to yesterday
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return mode === "today" ? today : subDays(today, 1);
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "marked" | "partial" | "pending" | "off-days">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "total">("name");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Fetch real school classes if available
  const { data: serverClasses = [] } = useQuery({
    queryKey: ["classes", "min"],
    queryFn: async () => {
      const res = await apiFetch("/api/classes?mode=min");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Hotkey ⌘K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Merge server classes with default mock classes to ensure rich display
  const rows: ClassAttendanceRow[] = useMemo(() => {
    if (serverClasses && serverClasses.length > 0) {
      return serverClasses.map((cls: any, idx: number) => {
        const defaultMock = DEFAULT_MOCK_CLASSES[idx % DEFAULT_MOCK_CLASSES.length];
        return {
          id: cls.id,
          name: cls.name || `Class ${idx + 1}`,
          section: cls.section || "A",
          totalStudents: cls.studentCount || cls.capacity || defaultMock.totalStudents || 25,
          status: "pending" as ClassAttendanceStatus,
        };
      });
    }
    return DEFAULT_MOCK_CLASSES;
  }, [serverClasses]);

  // Tab counts
  const counts = useMemo(() => {
    let marked = 0;
    let partial = 0;
    let pending = 0;
    let offDays = 0;

    rows.forEach((r) => {
      if (r.status === "marked") marked++;
      else if (r.status === "partial") partial++;
      else if (r.status === "off-day") offDays++;
      else pending++;
    });

    return {
      all: rows.length,
      marked,
      partial,
      pending,
      offDays,
    };
  }, [rows]);

  // Filter and sort rows
  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Filter by tab
    if (activeTab === "marked") {
      result = result.filter((r) => r.status === "marked");
    } else if (activeTab === "partial") {
      result = result.filter((r) => r.status === "partial");
    } else if (activeTab === "pending") {
      result = result.filter((r) => r.status === "pending");
    } else if (activeTab === "off-days") {
      result = result.filter((r) => r.status === "off-day");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.section.toLowerCase().includes(q) ||
          `${r.name} - ${r.section}`.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.name} ${a.section}`.localeCompare(`${b.name} ${b.section}`, undefined, { numeric: true });
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      if (sortBy === "total") {
        return b.totalStudents - a.totalStudents;
      }
      return 0;
    });

    return result;
  }, [rows, activeTab, searchQuery, sortBy]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const formattedSubtitleDate = format(selectedDate, "EEEE, d MMM yyyy");
  const formattedPickerDate = format(selectedDate, "EEE, MMM d, yyyy");

  return (
    <div className="space-y-4 px-1 py-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {mode === "today" ? "Today" : "Past days"}
          </h1>
          <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {formattedSubtitleDate} &nbsp;·&nbsp; {counts.marked} marked of {counts.all} classes
          </p>
        </div>

        {/* Date Picker Button: rendered only in past-days mode */}
        {mode === "past-days" && (
          <div className="flex items-center gap-2">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-slate-700 dark:text-zinc-200 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <CalendarIcon className="size-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>{formattedPickerDate}</span>
                  <ChevronDown className="size-3 text-slate-400 dark:text-zinc-500 ml-0.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) {
                      setSelectedDate(d);
                      setDatePickerOpen(false);
                    }
                  }}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer border select-none",
            activeTab === "all"
              ? "border-[#0D9488] bg-[#E6F4F1] text-[#0D9488] dark:bg-teal-950/40 dark:border-teal-500 dark:text-teal-200 font-semibold"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
          )}
        >
          <span>All</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
              activeTab === "all"
                ? "bg-[#0D9488] text-white"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            )}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("marked")}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer border select-none",
            activeTab === "marked"
              ? "border-[#0D9488] bg-[#E6F4F1] text-[#0D9488] dark:bg-teal-950/40 dark:border-teal-500 dark:text-teal-200 font-semibold"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
          )}
        >
          <span>Marked</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
              activeTab === "marked"
                ? "bg-[#0D9488] text-white"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            )}
          >
            {counts.marked}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("partial")}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer border select-none",
            activeTab === "partial"
              ? "border-[#0D9488] bg-[#E6F4F1] text-[#0D9488] dark:bg-teal-950/40 dark:border-teal-500 dark:text-teal-200 font-semibold"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
          )}
        >
          <span>Partial</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
              activeTab === "partial"
                ? "bg-[#0D9488] text-white"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            )}
          >
            {counts.partial}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer border select-none",
            activeTab === "pending"
              ? "border-[#0D9488] bg-[#E6F4F1] text-[#0D9488] dark:bg-teal-950/40 dark:border-teal-500 dark:text-teal-200 font-semibold"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
          )}
        >
          <span>Pending</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
              activeTab === "pending"
                ? "bg-[#0D9488] text-white"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            )}
          >
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("off-days")}
          className={cn(
            "rounded-full px-3 py-1 text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer border select-none",
            activeTab === "off-days"
              ? "border-[#0D9488] bg-[#E6F4F1] text-[#0D9488] dark:bg-teal-950/40 dark:border-teal-500 dark:text-teal-200 font-semibold"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
          )}
        >
          <span>Off-days</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
              activeTab === "off-days"
                ? "bg-[#0D9488] text-white"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            )}
          >
            {counts.offDays}
          </span>
        </button>
      </div>

      {/* Search & Sort Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes..."
            className="w-full h-8 pl-9 pr-10 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[12px] text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-teal-500/50 shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="inline-flex items-center rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Sort by dropdown */}
        <div className="relative">
          <Popover open={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-slate-700 dark:text-zinc-200 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="size-3 text-slate-500" />
                <span>
                  {sortBy === "name" && "Class name"}
                  {sortBy === "status" && "Status"}
                  {sortBy === "total" && "Total students"}
                </span>
                <ChevronDown className="size-3 text-slate-400 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="end">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("name");
                    setSortDropdownOpen(false);
                  }}
                  className={cn(
                    "text-left px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer",
                    sortBy === "name"
                      ? "bg-teal-50 text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-200"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  Class name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("status");
                    setSortDropdownOpen(false);
                  }}
                  className={cn(
                    "text-left px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer",
                    sortBy === "status"
                      ? "bg-teal-50 text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-200"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("total");
                    setSortDropdownOpen(false);
                  }}
                  className={cn(
                    "text-left px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer",
                    sortBy === "total"
                      ? "bg-teal-50 text-[#0D9488] dark:bg-teal-950/40 dark:text-teal-200"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  Total students
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Class
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Status
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Tally
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  %
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Marked By
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-zinc-400 text-[12px]">
                    No classes match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const targetHref = `${tenantHref("student-attendance/classes")}?classId=${encodeURIComponent(
                    row.id
                  )}&date=${dateStr}`;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      {/* Class */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-[13px] font-medium text-slate-900 dark:text-zinc-100">
                        {row.name} - {row.section}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {row.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                            <AlertCircle className="size-3 text-rose-500" />
                            Pending
                          </span>
                        )}
                        {row.status === "marked" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Marked
                          </span>
                        )}
                        {row.status === "partial" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                            <Clock className="size-3 text-amber-600" />
                            Partial
                          </span>
                        )}
                        {row.status === "off-day" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                            Off-day
                          </span>
                        )}
                      </td>

                      {/* Tally */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-[12px] text-slate-600 dark:text-zinc-300">
                        {row.status === "pending" && (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                              <span className="size-1.5 rounded-full bg-slate-400 inline-block" />
                              Total <span className="font-semibold">{row.totalStudents}</span>
                            </span>
                            <span className="text-slate-400 font-light text-[11px]">—</span>
                          </span>
                        )}
                        {row.status === "marked" && (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                              Total <span className="font-semibold">{row.totalStudents}</span>
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {row.present ?? row.totalStudents} Present · {row.absent ?? 0} Absent
                            </span>
                          </span>
                        )}
                        {row.status === "partial" && (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                              <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                              Total <span className="font-semibold">{row.totalStudents}</span>
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {row.present ?? 0} Present · {row.unmarked ?? 0} Left
                            </span>
                          </span>
                        )}
                        {row.status === "off-day" && <span className="text-slate-400 font-light text-[11px]">—</span>}
                      </td>

                      {/* % */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                        {row.rate !== undefined ? `${row.rate}%` : "—"}
                      </td>

                      {/* Marked By */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-[12px] text-slate-500 dark:text-zinc-400">
                        {row.markedBy || "—"}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-right">
                        {row.status === "marked" ? (
                          <a
                            href={targetHref}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-[11.5px] font-medium text-slate-700 dark:text-zinc-200 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <span>View</span>
                            <ArrowRight className="size-3" />
                          </a>
                        ) : (
                          <a
                            href={targetHref}
                            className="inline-flex items-center gap-1 rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white px-3 py-1 text-[11.5px] font-semibold shadow-sm transition-colors cursor-pointer"
                          >
                            <span>Mark</span>
                            <ArrowRight className="size-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
