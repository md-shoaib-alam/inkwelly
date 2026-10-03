"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { useAppStore } from "@/store/use-app-store";
import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";
import { useAttendanceCommandCenter } from "../hooks/use-attendance-command-center";
import { ClassDailyAttendanceView } from "./class-daily-attendance-view";
import { AcademicSessionBanner } from "./academic-session-banner";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function buildClassSlug(name: string, section: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${section.toLowerCase().trim()}`;
}

// Parse a "yyyy-MM-dd" query value as a local date. new Date("2026-09-29")
// would read it as UTC midnight and shift a day back for positive offsets.
function parseDateParam(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export type DailyMarkingMode = "today" | "past-days";

export type ClassAttendanceStatus = "pending" | "marked" | "partial" | "off-day";

export interface ClassAttendanceRow {
  id: string;
  /** DB slug (e.g. "class-1st-a") – used for URL matching and navigation */
  slug?: string;
  name: string;
  section: string;
  totalStudents: number;
  status: ClassAttendanceStatus;
  /** True only for rows backed by a real DB class. Mock/placeholder rows are
   *  false, so the marking screen neither loads nor posts against fake ids. */
  isReal?: boolean;
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantHref = useTenantHref();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { currentTenantId } = useAppStore();
  const { year, years, yearSlug } = useActiveAcademicYear();

  // Date selection: the ?date= query wins (set when a class is opened from the
  // past-days list); otherwise today defaults to now, past-days to yesterday.
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const fromUrl = parseDateParam(searchParams?.get("date"));
    if (fromUrl) return fromUrl;
    const today = new Date();
    return mode === "today" ? today : subDays(today, 1);
  });
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // The Past Days list reads the command center's `marking` array, which the server anchors
  // on `date` when one is given. Without it the list shows today's register no matter which
  // day is picked — the bug this fixes. Today mode has no picker, so it stays server-anchored.
  const { data: commandCenter } = useAttendanceCommandCenter(
    currentTenantId,
    yearSlug,
    null,
    mode === "past-days" ? dateStr : null,
  );

  // The session this screen is scoped to: the URL-matched year, else the
  // tenant's current year. Its date range drives the "Outside the academic
  // session" banner. Null when neither carries dates (no session configured).
  const session = useMemo(() => {
    const y =
      year?.startDate && year?.endDate
        ? year
        : (years || []).find((a: any) => a.isCurrent || a.isActive);
    return y?.startDate && y?.endDate
      ? { start: String(y.startDate), end: String(y.endDate) }
      : null;
  }, [year, years]);

  // The session range as local Date objects, for the calendar's selectable
  // bounds. Slicing to yyyy-MM-dd and rebuilding locally avoids the UTC-midnight
  // off-by-one that `new Date(iso)` introduces for positive offsets.
  const sessionRange = useMemo(() => {
    if (!session) return null;
    const toLocal = (iso: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
    };
    const start = toLocal(session.start);
    const end = toLocal(session.end);
    return start && end ? { start, end } : null;
  }, [session]);

  const markingMap = useMemo(() => {
    const byId = new Map<string, any>();
    const byName = new Map<string, any>();
    if (commandCenter?.marking) {
      for (const m of commandCenter.marking) {
        if (m.classId) byId.set(m.classId, m);
        if (m.label) {
          byName.set(m.label.toLowerCase().trim(), m);
          byName.set(m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), m);
        }
      }
    }
    return { byId, byName };
  }, [commandCenter]);

  // Re-sync when the URL date changes while this view stays mounted
  // (navigating between classes, or a fresh deep link).
  useEffect(() => {
    const fromUrl = parseDateParam(searchParams?.get("date"));
    if (fromUrl) setSelectedDate(fromUrl);
  }, [searchParams]);

  // Past-days opens on the last day the admin can actually record — the
  // session's end, or today when the session is still running — rather than a
  // bare "yesterday" that may sit outside the session. Applied once the session
  // range is known, and never over a date the URL already chose.
  const sessionDefaultApplied = useRef(false);
  useEffect(() => {
    if (mode !== "past-days" || sessionDefaultApplied.current) return;
    if (parseDateParam(searchParams?.get("date"))) return;
    if (!sessionRange) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(sessionRange.end > today ? today : sessionRange.end);
    sessionDefaultApplied.current = true;
  }, [mode, sessionRange, searchParams]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "marked" | "partial" | "pending" | "off-days">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "total">("name");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // The session name classes are stored under (e.g. "2025-2026"). Scoping the
  // class list to it is what keeps this screen from showing every year's
  // classes at once — the unscoped `mode=min` returned 60 rows here, many of
  // them empty, with duplicate "Class 1 - A" names across sessions.
  const sessionName =
    year?.name || (years || []).find((a: any) => a.isCurrent || a.isActive)?.name || "";

  // Fetch this session's real classes (each row carries a live studentCount).
  const { data: serverClasses = [] } = useQuery({
    queryKey: ["classes", "attendance-day", sessionName],
    enabled: !!sessionName,
    queryFn: async () => {
      const res = await apiFetch(`/api/classes?academicYear=${encodeURIComponent(sessionName)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.items ?? []);
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

  // Check if a class is active in the URL or query:
  // e.g. /student-attendance/today/class-1st-a or ?classSlug=... or ?classId=...
  const activeClassSlug = useMemo(() => {
    const regex = new RegExp(`students?-attendance\/${mode}\/([^\/\\?]+)`);
    const m = pathname ? pathname.match(regex) : null;
    const raw = m?.[1] ? decodeURIComponent(m[1]) : searchParams?.get("classSlug") || searchParams?.get("classId");
    return raw || null;
  }, [pathname, searchParams, mode]);

  // Merge server classes with default mock classes and command center status
  const rows: ClassAttendanceRow[] = useMemo(() => {
    const fromServer = !!serverClasses && serverClasses.length > 0;
    const sourceClasses =
      fromServer
        ? serverClasses.map((cls: any, idx: number) => {
            const defaultMock = DEFAULT_MOCK_CLASSES[idx % DEFAULT_MOCK_CLASSES.length];
            return {
              id: cls.id,
              slug: cls.slug as string | undefined,
              name: cls.name || `Class ${idx + 1}`,
              section: cls.section || "A",
              totalStudents: Number.isFinite(cls.studentCount)
                ? cls.studentCount
                : (cls.capacity || defaultMock.totalStudents || 25),
            };
          })
        : DEFAULT_MOCK_CLASSES;

    return sourceClasses.map((cls: any) => {
      const title = `${cls.name} - ${cls.section}`.toLowerCase().trim();
      const slugTitle = `${cls.name}-${cls.section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const m =
        markingMap.byId.get(cls.id) ||
        markingMap.byName.get(title) ||
        markingMap.byName.get(slugTitle) ||
        markingMap.byName.get(cls.name.toLowerCase().trim());

      let status: ClassAttendanceStatus = "pending";
      let present: number | undefined;
      let absent: number | undefined;
      let unmarked: number | undefined;
      let rate: number | undefined;
      let markedBy: string | undefined;

      if (m && m.marked) {
        status = m.studentsMarked >= cls.totalStudents ? "marked" : "partial";
        present = m.present;
        absent = m.absent;
        unmarked = Math.max(0, cls.totalStudents - m.studentsMarked);
        rate = m.rate;
        markedBy = m.teacherName || undefined;
      }

      return {
        id: cls.id,
        slug: cls.slug,
        name: cls.name,
        section: cls.section,
        totalStudents: cls.totalStudents,
        status,
        isReal: fromServer,
        present,
        absent,
        unmarked,
        rate,
        markedBy,
      };
    });
  }, [serverClasses, markingMap]);

  // Match active class row – use the real DB id so attendance API calls work
  const activeClassRow = useMemo(() => {
    if (!activeClassSlug) return null;
    const target = activeClassSlug.toLowerCase().trim();
    // 1. Match by DB slug field (most reliable)
    const byDbSlug = rows.find((r) => r.slug?.toLowerCase() === target);
    if (byDbSlug) return byDbSlug;
    // 2. Match by derived slug from name+section
    const bySlug = rows.find((r) => buildClassSlug(r.name, r.section) === target);
    if (bySlug) return bySlug;
    // 3. Match by raw id
    const byId = rows.find((r) => r.id === target);
    if (byId) return byId;
    // 4. Match by name-section joined slug variant
    const byName = rows.find(
      (r) => `${r.name}-${r.section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") === target
    );
    if (byName) return byName;
    // 5. Fallback: create a placeholder row. Not a real class, so the marking
    // screen shows seed students and skips the save instead of posting fake ids.
    return {
      id: target,
      slug: target,
      name: target
        .replace(/-([a-z])$/i, "")
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ") || target,
      section: target.split("-").slice(-1)[0]?.toUpperCase() || "A",
      totalStudents: 25,
      status: "pending" as ClassAttendanceStatus,
      isReal: false,
    };
  }, [activeClassSlug, rows]);

  // If a class is selected, show ClassDailyAttendanceView (matching Images 2 & 3)
  if (activeClassRow) {
    return (
      <ClassDailyAttendanceView
        classId={activeClassRow.id}
        className={activeClassRow.name}
        section={activeClassRow.section}
        selectedDate={selectedDate}
        isRealClass={!!activeClassRow.isReal}
        sessionStart={session?.start}
        sessionEnd={session?.end}
        onBack={() => {
          router.push(tenantHref(`student-attendance/${mode}`));
        }}
      />
    );
  }

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
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    if (d > today) return true;
                    if (sessionRange && (d < sessionRange.start || d > sessionRange.end)) return true;
                    return false;
                  }}
                  defaultMonth={
                    selectedDate && (!sessionRange || (selectedDate >= sessionRange.start && selectedDate <= sessionRange.end))
                      ? selectedDate
                      : sessionRange?.end
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <AcademicSessionBanner
        dateStr={dateStr}
        startDate={session?.start}
        endDate={session?.end}
      />

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
                  const classSlug = buildClassSlug(row.name, row.section);
                  const targetHref = `${tenantHref(`student-attendance/${mode}/${classSlug}`)}${
                    mode === "past-days" ? `?date=${dateStr}` : ""
                  }`;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => router.push(targetHref)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer group"
                    >
                      {/* Class */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-[13px] font-medium text-slate-900 dark:text-zinc-100 group-hover:text-[#0D9488] transition-colors">
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(targetHref);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-[11.5px] font-medium text-slate-700 dark:text-zinc-200 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <span>View</span>
                            <ArrowRight className="size-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(targetHref);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white px-3 py-1 text-[11.5px] font-semibold shadow-sm transition-colors cursor-pointer"
                          >
                            <span>Mark</span>
                            <ArrowRight className="size-3" />
                          </button>
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
