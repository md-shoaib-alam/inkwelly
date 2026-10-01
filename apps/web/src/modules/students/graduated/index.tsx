"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { GraduationCap, Loader2, Users } from "lucide-react";
import { apiFetch, fetchAllStudents } from "@/lib/api";
import { useAcademicYears } from "@/modules/academics/hooks/use-academic-years";

interface PromotionRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  fromClassName: string;
  academicYear: string;
  createdAt: string;
}

interface RosterStudent {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
}

const numericLevel = (level: string) => {
  const n = parseInt(String(level).replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? -1 : n;
};

export function StudentsGraduated() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [year, setYear] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "min", "graduated"],
    queryFn: async () => {
      const res = await apiFetch("/api/classes?mode=min");
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.items ?? [];
    },
  });

  const { academicYears: yearRows } = useAcademicYears();

  const { data: graduations } = useQuery<{ items: PromotionRecord[] }>({
    queryKey: ["graduations"],
    queryFn: async () => {
      const res = await apiFetch("/api/promotions?type=graduation&limit=50");
      if (!res.ok) return { items: [] };
      return res.json();
    },
  });
  const graduationRows = graduations?.items ?? [];

  const { data: roster = [], isFetching: rosterLoading } = useQuery<RosterStudent[]>({
    queryKey: ["students", "min", "graduated", classId],
    queryFn: () => fetchAllStudents({ classId, status: "active" }),
    enabled: Boolean(classId),
  });

  // The newest session leads the picker, and an empty cohort still gets a default.
  const yearOptions = useMemo(
    () => yearRows.map((y: any) => y.name).filter(Boolean).sort().reverse(),
    [yearRows],
  );
  const activeYear = yearOptions.includes(year) ? year : yearOptions[0] ?? "";

  // Opening a class pre-selects its whole roster — graduating is a batch act — so
  // only the students the user unchecks are stored, and a refetch can't reset them.
  const [unpicked, setUnpicked] = useState<Set<string>>(new Set());
  const selected = useMemo(
    () => new Set(roster.filter((s) => !unpicked.has(s.id)).map((s) => s.id)),
    [roster, unpicked],
  );

  const selectAll = () => setUnpicked(new Set());
  const selectNone = () => setUnpicked(new Set(roster.map((s) => s.id)));
  const toggleOne = (id: string) =>
    setUnpicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const graduate = () => {
    if (!classId || !activeYear || selected.size === 0) return;
    setSubmitting(true);
    const promise = (async () => {
      const res = await apiFetch("/api/promotions", {
        method: "POST",
        body: JSON.stringify({
          graduation: true,
          fromClassId: classId,
          academicYear: activeYear,
          remarks: remarks || undefined,
          studentIds: Array.from(selected),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Graduation failed");
    })();
    toast.promise(promise, {
      loading: "Graduating students...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["graduations"] });
        queryClient.invalidateQueries({ queryKey: ["students", "min", "graduated"] });
        setRemarks("");
        return "Students graduated successfully";
      },
      error: (err: Error) => err.message,
    });
    promise.finally(() => setSubmitting(false));
  };

  const sortedClasses = [...classes].sort((a, b) => numericLevel(b.classLevel) - numericLevel(a.classLevel));

  return (
    <div className="space-y-6">
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="size-4 text-violet-500" />
            Quick Graduate / Pass-Out
          </CardTitle>
          <CardDescription>
            Select a class and mark students as graduated (passed out from school). Use this for
            students in the final/highest class.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class *</label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class to graduate from" />
                </SelectTrigger>
                <SelectContent>
                  {sortedClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}-{c.section}
                      {typeof c.studentCount === "number" ? `, ${c.studentCount} students` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year *</label>
              <Select value={activeYear} onValueChange={setYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <Textarea
              placeholder="e.g. Batch of 2025, Passed out with distinction"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
            />
          </div>

          {classId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4" />
                  <span>Select students to graduate</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectNone}>
                    Clear
                  </Button>
                </div>
              </div>
              <div data-lenis-prevent className="max-h-72 overflow-y-auto overscroll-contain rounded-lg border bg-card">
                {rosterLoading && roster.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">Loading roster…</p>
                ) : roster.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">No active students in this class.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selected.size === roster.length && roster.length > 0}
                            onCheckedChange={(checked) =>
                              checked ? selectAll() : selectNone()
                            }
                          />
                        </TableHead>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Roll No.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((s, i) => (
                        <TableRow key={s.id} className={selected.has(s.id) ? "bg-violet-50/50 dark:bg-violet-900/20" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(s.id)}
                              onCheckedChange={() => toggleOne(s.id)}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">{s.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">#{s.rollNumber}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={graduate}
            disabled={submitting || !classId || !activeYear || selected.size === 0}
          >
            {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <GraduationCap className="size-4 mr-2" />}
            {submitting ? "Graduating..." : `Graduate ${selected.size} Student(s)`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Graduation History</CardTitle>
          <CardDescription>
            {graduationRows.length} record{graduationRows.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {graduationRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="size-10 mb-2 opacity-30" />
              <p className="text-sm">No graduation records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Roll No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="hidden md:table-cell">Academic Year</TableHead>
                    <TableHead className="w-28 text-center">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Graduated On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {graduationRows.map((grad) => (
                    <TableRow key={grad.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-semibold shrink-0">
                            {grad.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{grad.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        #{grad.rollNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {grad.fromClassName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {grad.academicYear}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 font-medium"
                        >
                          <GraduationCap className="size-3.5" />
                          <span className="ml-1">Graduated</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" suppressHydrationWarning>
                        {new Date(grad.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
