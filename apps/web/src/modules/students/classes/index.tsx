"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/use-app-store";
import { useClassesInfinite } from "@/lib/graphql/hooks/academic.hooks";
import type { ClassInfo } from "@/lib/types";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import { cn } from "@/lib/utils";

const PAGE = 100;

/**
 * Students -> Classes: how full is each class. The Academics screen of the same name
 * edits these rows; this one only reads them, which is why it is its own component
 * rather than a mode flag on that one.
 */
export function ClassRoster() {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const { currentTenantId } = useAppStore();
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [section, setSection] = useState("all");

  const { data, isLoading } = useClassesInfinite(currentTenantId || undefined, { limit: PAGE });

  const classes = useMemo(
    () => (data?.pages.flatMap((p) => p.classes) ?? []) as ClassInfo[],
    [data],
  );

  const grades = useMemo(() => [...new Set(classes.map((c) => c.grade))].sort(), [classes]);
  const sections = useMemo(() => [...new Set(classes.map((c) => c.section))].sort(), [classes]);

  const visible = useMemo(
    () =>
      classes.filter(
        (c) =>
          (grade === "all" || c.grade === grade) &&
          (section === "all" || c.section === section) &&
          (!search || `${c.name} ${c.grade} ${c.section}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [classes, grade, section, search],
  );

  // Every page is fetched before the totals are computed, because an aggregate over a
  // truncated list would print a wrong number with a straight face.
  const enrolled = classes.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
  const average = classes.length ? Math.round(enrolled / classes.length) : 0;

  // `enabled: !!tenantId` keeps `isLoading` false while the tenant is still resolving,
  // so the first paint would otherwise read "0 classes · 0 students".
  if (isLoading || (!currentTenantId && classes.length === 0)) return <ClassRosterSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">Classes</h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400">
            {classes.length} classes · {enrolled} students · avg {average} per class
          </p>
        </div>
        <Button variant="outline" onClick={() => push(tenantHref("academics/classes"))}>
          <Settings className="size-4" /> Manage
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search classes..." />
        </div>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All grades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All sections" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sections</SelectItem>
            {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Enrolled</th>
                <th className="px-4 py-3 font-medium">Capacity fill</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const fill = c.capacity > 0 ? Math.round(((c.studentCount ?? 0) / c.capacity) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                      {c.name} - {c.section}
                    </td>
                    <td className="px-4 py-3">{c.grade}</td>
                    <td className="px-4 py-3">{c.section}</td>
                    <td className="px-4 py-3">{c.classTeacher || "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5 text-slate-400" />{c.studentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              fill >= 100 ? "bg-rose-500" : fill >= 80 ? "bg-amber-500" : "bg-emerald-500",
                            )}
                            style={{ width: `${Math.min(fill, 100)}%` }}
                          />
                        </div>
                        <span className="text-[12px] tabular-nums text-slate-500 dark:text-zinc-400">{fill}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-zinc-400">
                    No classes match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ClassRosterSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
