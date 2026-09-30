"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  History,
  Hourglass,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Search,
  SlidersHorizontal,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { PromotionRun, RUN_STATUSES, STATUS_LABELS, RunScope } from "../promotion-types";
import { usePromotionRuns } from "../use-promotion-runs";

const formatTableDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

interface PromotionsHubProps {
  onNew: () => void;
  onOpenRun: (run: PromotionRun) => void;
}

const SCOPE_CONFIG: Record<
  RunScope,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  "whole-school": {
    label: "Whole school",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: <GraduationCap className="size-3.5" />,
  },
  "one-class": {
    label: "One class",
    bg: "bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50",
    text: "text-teal-700 dark:text-teal-300",
    icon: <GraduationCap className="size-3.5" />,
  },
  "multiple-classes": {
    label: "Multiple classes",
    bg: "bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50",
    text: "text-teal-700 dark:text-teal-300",
    icon: <Layers className="size-3.5" />,
  },
  "single-student": {
    label: "Single student",
    bg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50",
    text: "text-blue-700 dark:text-blue-300",
    icon: <GraduationCap className="size-3.5" />,
  },
  "custom-list": {
    label: "Custom list",
    bg: "bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700",
    text: "text-slate-700 dark:text-zinc-300",
    icon: <GraduationCap className="size-3.5" />,
  },
};

function StudentStack({
  count,
  studentIds,
  students,
}: {
  count: number;
  studentIds?: string[];
  students?: { id: string; name: string; avatar?: string | null; className?: string | null }[];
}) {
  if (count <= 0) {
    return <span className="text-[13px] text-slate-400 font-medium">0</span>;
  }

  const avatars = Array.from({ length: count }).map((_, i) => {
    const student = students?.[i];
    if (student) {
      return {
        src: student.avatar || undefined,
        name: student.name,
        className: student.className || "Class 2nd - A",
      };
    }
    return {
      name: `Student ${studentIds?.[i] ? `#${studentIds[i].slice(0, 5)}` : i + 1}`,
      className: "Class 2nd - A",
    };
  });

  return (
    <div className="flex items-center gap-2">
      <AvatarGroup
        avatars={avatars}
        maxVisible={5}
        size={28}
      />
      <span className="text-[13px] font-semibold text-slate-800 dark:text-zinc-100 ml-1">
        {count}
      </span>
    </div>
  );
}

export function PromotionsHub({ onNew, onOpenRun }: PromotionsHubProps) {
  const { data, isLoading, refresh } = usePromotionRuns();
  const [statusFilter, setStatusFilter] = useState<"all" | PromotionRun["status"]>("all");
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("all");

  const runs = data.items;
  const counts = data.counts;
  const total = RUN_STATUSES.reduce((sum, s) => sum + counts[s], 0);

  const sessions = useMemo(() => {
    const names = new Set<string>();
    runs.forEach((r) => {

      if (r.fromSession) names.add(r.fromSession);
      if (r.toSession) names.add(r.toSession);
    });
    return Array.from(names).sort().reverse();
  }, [runs]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return runs.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (sessionFilter !== "all" && r.fromSession !== sessionFilter && r.toSession !== sessionFilter)
        return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.fromSession.toLowerCase().includes(q) ||
        (r.toSession ?? "").toLowerCase().includes(q)
      );
    });
  }, [runs, statusFilter, sessionFilter, search]);

  const handleDelete = (run: PromotionRun) => {
    toast.promise(
      (async () => {
        const res = await apiFetch("/api/promotions/runs", {
          method: "DELETE",
          body: JSON.stringify({ id: run.id }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to discard draft");
      })(),
      {
        loading: "Discarding draft...",
        success: () => {
          refresh();
          return "Draft discarded";
        },
        error: (err: Error) => err.message,
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            Promotion management
          </h1>
          <p className="mt-1 text-[13px] text-[#64748B] dark:text-zinc-400">
            Updated just now · {runs.length > 0 ? `${runs.length} runs this school` : "No runs yet"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Split/grouped Action Button */}
          <div className="inline-flex rounded-lg shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={onNew}
              className="inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white px-3.5 h-9 text-[13px] font-medium transition-colors border-r border-[#0F766E]/40"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              New promotion
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-2 h-9 transition-colors inline-flex items-center justify-center"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onNew}>
                  <Plus className="size-4 mr-2" />
                  New promotion run
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <SlidersHorizontal className="size-4 mr-2" />
                  Promotion rules · Soon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs"
                aria-label="More promotion actions"
              >
                <MoreHorizontal className="size-4 text-slate-600 dark:text-zinc-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onNew}>
                <Plus className="size-4 mr-2" />
                New promotion run
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <SlidersHorizontal className="size-4 mr-2" />
                Promotion rules · Soon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 5 Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Drafts */}
        <div
          onClick={() => setStatusFilter(statusFilter === "draft" ? "all" : "draft")}
          className={`cursor-pointer rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-all shadow-2xs ${
            statusFilter === "draft"
              ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
              : "border-slate-200/90 dark:border-zinc-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
            <Pencil className="size-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Drafts</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {counts.draft}
          </div>
          <p className="mt-1 text-[11.5px] text-[#64748B] dark:text-zinc-400">
            {counts.draft > 0 ? `${counts.draft} awaiting submission` : "No unfinished drafts"}
          </p>
          <div className="mt-3 flex items-end gap-1.5 h-6">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isActive = idx < Math.min(counts.draft, 10);
              return (
                <span
                  key={idx}
                  className={`w-2.5 rounded-xs transition-all ${
                    isActive
                      ? "h-6 bg-slate-400 dark:bg-slate-400"
                      : "h-3 bg-slate-200/80 dark:bg-slate-800/80"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* 2. Pending */}
        <div
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          className={`cursor-pointer rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-all shadow-2xs ${
            statusFilter === "pending"
              ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
              : "border-slate-200/90 dark:border-zinc-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
            <Hourglass className="size-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Pending</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {counts.pending}
          </div>
          <p className="mt-1 text-[11.5px] text-[#64748B] dark:text-zinc-400">
            {counts.pending > 0 ? `${counts.pending} in queue` : "Inbox is empty"}
          </p>
          <div className="mt-3 flex items-end gap-1.5 h-6">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isActive = idx < Math.min(counts.pending, 10);
              return (
                <span
                  key={idx}
                  className={`w-2.5 rounded-xs transition-all ${
                    isActive
                      ? "h-6 bg-amber-400 dark:bg-amber-500"
                      : "h-3 bg-slate-200/80 dark:bg-slate-800/80"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* 3. Executing */}
        <div
          onClick={() => setStatusFilter(statusFilter === "executing" ? "all" : "executing")}
          className={`cursor-pointer rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-all shadow-2xs ${
            statusFilter === "executing"
              ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
              : "border-slate-200/90 dark:border-zinc-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
            <RotateCw className="size-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Executing</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {counts.executing}
          </div>
          <p className="mt-1 text-[11.5px] text-[#64748B] dark:text-zinc-400">
            {counts.executing > 0 ? `${counts.executing} in progress` : "No active commits"}
          </p>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: counts.executing > 0 ? "50%" : "0%" }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>0%</span>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* 4. Completed */}
        <div
          onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
          className={`cursor-pointer rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-all shadow-2xs ${
            statusFilter === "completed"
              ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
              : "border-slate-200/90 dark:border-zinc-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
            <Trophy className="size-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Completed</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {counts.completed}
          </div>
          <p className="mt-1 text-[11.5px] text-[#64748B] dark:text-zinc-400">
            {counts.completed > 0 ? `${counts.completed} successful` : "Nothing completed yet"}
          </p>
          <div className="mt-3 flex items-end gap-1.5 h-6">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isActive = idx < Math.min(counts.completed, 10);
              return (
                <span
                  key={idx}
                  className={`w-2.5 rounded-xs transition-all ${
                    isActive
                      ? "h-6 bg-emerald-500 dark:bg-emerald-400"
                      : "h-3 bg-slate-200/80 dark:bg-slate-800/80"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* 5. Reversed */}
        <div
          onClick={() => setStatusFilter(statusFilter === "reversed" ? "all" : "reversed")}
          className={`cursor-pointer rounded-xl border bg-white dark:bg-zinc-900 p-4 transition-all shadow-2xs ${
            statusFilter === "reversed"
              ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
              : "border-slate-200/90 dark:border-zinc-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
            <History className="size-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Reversed</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {counts.reversed}
          </div>
          <p className="mt-1 text-[11.5px] text-[#64748B] dark:text-zinc-400">
            {counts.reversed > 0 ? `${counts.reversed} rollbacks` : "Nothing reversed"}
          </p>
          <div className="mt-3 flex items-end gap-1.5 h-6">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isActive = idx < Math.min(counts.reversed, 10);
              return (
                <span
                  key={idx}
                  className={`w-2.5 rounded-xs transition-all ${
                    isActive
                      ? "h-6 bg-rose-500 dark:bg-rose-400"
                      : "h-3 bg-slate-200/80 dark:bg-slate-800/80"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
            statusFilter === "all"
              ? "bg-[#CCFBF1] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#99F6E4] dark:border-teal-800 shadow-2xs"
              : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
          }`}
        >
          <span>All</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
              statusFilter === "all"
                ? "bg-[#0D9488] text-white"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
            }`}
          >
            {total}
          </span>
        </button>

        {RUN_STATUSES.map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                isActive
                  ? "bg-[#CCFBF1] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#99F6E4] dark:border-teal-800 shadow-2xs"
                  : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
              }`}
            >
              <span>{STATUS_LABELS[s]}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                  isActive
                    ? "bg-[#0D9488] text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}
              >
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-56 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search runs by id or session..."
            className="pl-9 pr-9 h-9 text-[12.5px] rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 placeholder:text-slate-400 shadow-2xs"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-400 border border-slate-200/60 dark:border-zinc-700 pointer-events-none">
            ⌘K
          </span>
        </div>

        <Button
          variant="outline"
          className="h-9 px-3 text-[12.5px] text-slate-600 dark:text-zinc-300 rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs gap-1.5 hover:bg-slate-50"
        >
          <CalendarDays className="size-4 text-slate-400" />
          Any time
          <ChevronDown className="size-3.5 text-slate-400 ml-0.5" />
        </Button>

        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-auto h-9 px-3 text-[12.5px] text-slate-700 dark:text-zinc-200 font-medium rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs gap-1 hover:bg-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sessions</SelectItem>
            {sessions.map((y) => (
              <SelectItem key={y} value={y}>
                From session: {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="h-9 px-3 text-[12.5px] text-slate-600 dark:text-zinc-300 rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs gap-1.5 hover:bg-slate-50"
        >
          <SlidersHorizontal className="size-3.5 text-slate-400" />
          More filters
        </Button>
      </div>

      {/* Main Roster / Runs Table matching reference screenshot */}
      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          /* Empty state matching the reference screenshot */
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3.5">
            <div className="size-11 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-500 dark:text-zinc-400">
              <GraduationCap className="size-5" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">
                No promotion runs
              </p>
              <p className="text-[12.5px] text-slate-500 dark:text-zinc-400 max-w-sm">
                Start a new promotion to move students into the next session.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/60">
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    SCOPE
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    TRANSITION
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    STUDENTS
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    EFFECTIVE
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    STATUS
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    CREATED
                  </th>
                  <th className="py-3 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {visible.map((r) => {
                  const scopeMeta = SCOPE_CONFIG[r.scope] ?? SCOPE_CONFIG["whole-school"];
                  const effectiveText = r.effectiveDate
                    ? formatTableDate(r.effectiveDate)
                    : formatTableDate(r.createdAt);
                  const createdText = formatTableDate(r.createdAt);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => r.status === "draft" && onOpenRun(r)}
                      className="group hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      {/* SCOPE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${scopeMeta.bg} ${scopeMeta.text}`}
                        >
                          {scopeMeta.icon}
                          {scopeMeta.label}
                        </span>
                      </td>

                      {/* TRANSITION */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[13px] text-slate-700 dark:text-zinc-200">
                        <span className="font-medium">{r.fromSession || "2026-27"}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="font-medium text-slate-600 dark:text-zinc-300">
                          {r.toSession || "2027-28"}
                        </span>
                      </td>

                      {/* STUDENTS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StudentStack
                          count={r.studentCount || (r.studentIds?.length ?? 0)}
                          studentIds={r.studentIds}
                          students={r.students}
                        />
                      </td>

                      {/* EFFECTIVE */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[13px] text-slate-600 dark:text-zinc-300">
                        {effectiveText}
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700">
                          <span className="size-1.5 rounded-full bg-slate-500" />
                          <span className="capitalize">{r.status}</span>
                        </div>
                      </td>

                      {/* CREATED */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[13px] text-slate-500 dark:text-zinc-400">
                        {createdText}
                      </td>

                      {/* ACTION BUTTON */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.status === "draft" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenRun(r)}
                              className="h-8 px-3 rounded-lg border-slate-200 dark:border-zinc-700 text-[12.5px] font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-slate-50 shadow-2xs gap-1"
                            >
                              Resume
                              <ChevronRight className="size-3 text-slate-400" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-8 px-3 rounded-lg border-slate-200 dark:border-zinc-700 text-[12.5px] font-medium text-slate-400 bg-white dark:bg-zinc-900 shadow-2xs"
                            >
                              View
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                aria-label="More options"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {r.status === "draft" ? (
                                <>
                                  <DropdownMenuItem onSelect={() => onOpenRun(r)}>
                                    <Plus className="size-4 mr-2" />
                                    Continue draft
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onSelect={() => handleDelete(r)}
                                  >
                                    Discard draft
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem disabled>Only drafts can be changed</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

