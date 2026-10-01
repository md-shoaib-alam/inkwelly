"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpDown, Eye, GraduationCap, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { useModulePermissions } from "@/modules/access-control/hooks/use-permissions";
import { useClassesFiltered } from "@/lib/graphql/hooks";
import { defaultClassFilters, formatClassLevelLabel } from "@/lib/class-options";
import type { ClassInfo } from "@/lib/types";
import { useTenantHref } from "../hooks/use-tenant-href";
import { RosterTable } from "../students/adminStudents/RosterTable";
import { ColumnsPopover } from "../students/adminStudents/ColumnsPopover";
import { Pagination } from "../students/adminStudents/Pagination";
import { StudentDialog } from "../students/adminStudents/StudentDialog";
import { StudentProfileView } from "../students/adminStudents/profile/StudentProfileView";
import { DEFAULT_TAB, type ProfileTabId } from "../students/adminStudents/profile/tabs";
import { studentRefOf } from "../students/student-ref";
import { DEFAULT_VISIBLE, ROSTER_COLUMNS, type RosterRow } from "../students/adminStudents/columns";
import type { StudentFormData, StudentInfo } from "../students/adminStudents/types";
import { ClassSwitcher } from "./ClassSwitcher";
import { RosterTableSkeleton } from "./RosterTableSkeleton";

// The switcher is one popover, and no school sections itself into hundreds of
// classes; the server caps a page at 100 either way.
const SWITCHER_LIMIT = 100;

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "rollNumber", label: "Roll no." },
  { value: "admissionNo", label: "Admission no." },
  { value: "dateOfBirth", label: "DOB" },
  { value: "createdAt", label: "Newest" },
];

const emptyFormData: StudentFormData = {
  name: "",
  email: "",
  username: "",
  password: "",
  phone: "",
  rollNumber: "",
  classId: "",
  gender: "male",
  dateOfBirth: "",
  bloodGroup: "",
  house: "",
  transportEnabled: false,
  routeId: "",
  pickupPoint: "",
};

const toFormData = (s: StudentInfo): StudentFormData => ({
  ...emptyFormData,
  name: s.name,
  email: s.email,
  username: s.username ?? "",
  phone: s.phone || "",
  rollNumber: s.rollNumber,
  classId: s.classId || "",
  gender: s.gender || "male",
  dateOfBirth: s.dateOfBirth || "",
  bloodGroup: s.bloodGroup || "",
  house: s.house || "",
  transportEnabled: !!s.transport,
  routeId: s.transport?.routeId || "",
  pickupPoint: s.transport?.pickupPoint || "",
});

/**
 * Students -> Classes -> one class. The list screen answers "how full is every
 * class"; this one answers "who is in this class", so it carries the roster the
 * All Students screen carries — same columns, same popover — with the class
 * fixed and the school's other classes one click away in the header.
 */
export function ClassDetail({ classRef }: { classRef: string }) {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const { currentTenantId } = useAppStore();

  const { data, isLoading } = useClassesFiltered(
    currentTenantId || undefined,
    defaultClassFilters(),
    1,
    SWITCHER_LIMIT,
  );
  const classes = (data?.classes ?? []) as ClassInfo[];

  // Slug first, id second: the readable name is what the address bar shows, and an
  // older link or a class whose slug was never filled in still has to resolve.
  const cls = classes.find((c) => c.slug === classRef) ?? classes.find((c) => c.id === classRef);

  if (isLoading && classes.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
        <RosterTableSkeleton />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">
            No class called "{classRef}"
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400">
            It may have been renamed or removed. Every class this school has is one click away.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => push(tenantHref("classes"))}
          className="h-10 px-3.5 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs"
        >
          <ArrowLeft className="size-4 text-slate-400 dark:text-zinc-500" /> All classes
        </Button>
      </div>
    );
  }

  const openClass = (next: ClassInfo) => push(tenantHref(`classes/${next.slug ?? next.id}`));

  return (
    <div className="space-y-4">
      <ClassHeader cls={cls} classes={classes} total={data?.total ?? classes.length} onPick={openClass} />
      {/* Remount on switch so the page, search and sort never follow a class across. */}
      <ClassStudents key={cls.id} cls={cls} />
    </div>
  );
}

function ClassHeader({
  cls,
  classes,
  total,
  onPick,
}: {
  cls: ClassInfo;
  classes: ClassInfo[];
  total: number;
  onPick: (cls: ClassInfo) => void;
}) {
  const { push } = useRouter();
  const tenantHref = useTenantHref();
  const [counts, setCounts] = useState<{ classId: string; boys: number; girls: number; students: number } | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);

  // The split is a count over the class, not a tally of the visible page, so it asks
  // the database and reads only the totals back. Each result is stamped with the class
  // it describes, so a superseded response can never paint the previous class's
  // numbers — and a request that was aborted or failed shows no number at all, because
  // a zero here would look exactly like a class with nobody in it.
  useEffect(() => {
    if (!cls.id) return;
    const controller = new AbortController();

    const count = (gender?: string) => {
      const url = `/api/student-roster?classId=${cls.id}&limit=1${gender ? `&gender=${gender}` : ""}`;
      return apiFetch(url, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`count failed (${res.status})`);
          return res.json();
        })
        .then((data) => Number(data?.totalItems ?? 0))
        .catch((err: unknown) => {
          if ((err as Error)?.name === "AbortError") return null;
          throw err;
        });
    };

    Promise.all([count(), count("male"), count("female")])
      .then(([students, boys, girls]) => {
        if (controller.signal.aborted) return;
        if (students === null || boys === null || girls === null) {
          setFailedFor(cls.id);
          return;
        }
        setCounts({ classId: cls.id, students, boys, girls });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedFor(cls.id);
      });

    return () => controller.abort();
  }, [cls.id]);

  const shown = counts?.classId === cls.id ? counts : null;
  const countFailed = failedFor === cls.id;

  const actions = [
    { label: "Admission", tail: `admissions?classId=${cls.id}`, icon: UserPlus },
    { label: "Change class", tail: `class-change?classId=${cls.id}`, icon: ArrowLeft },
    { label: "Promote", tail: `promotion/new?classId=${cls.id}`, icon: GraduationCap },
    { label: "Bulk update", tail: `bulk-update?classId=${cls.id}`, icon: Users },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[17px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">
            {cls.name} - {cls.section}
          </h1>
          <ClassSwitcher
            classes={classes}
            classCount={total}
            currentId={cls.id}
            onPick={onPick}
            onAllClasses={() => push(tenantHref("classes"))}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => push(tenantHref("classes"))}
          className="ml-auto h-9 px-3 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs"
        >
          All classes <ArrowRight className="size-4 text-slate-400 dark:text-zinc-500" />
        </Button>
      </div>

      <p className="text-[13px] text-slate-500 dark:text-zinc-400">
        <span className="font-semibold text-slate-700 dark:text-zinc-200">{formatClassLevelLabel(cls.classLevel)}</span>
        {" · Section "}
        <span className="font-semibold text-slate-700 dark:text-zinc-200">{cls.section}</span>
        {" · "}
        {shown ? (
          <>
            <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-200">{shown.students}</span>
            {" students · "}
            <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-200">{shown.boys}</span>
            {" boys / "}
            <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-200">{shown.girls}</span>
            {" girls"}
          </>
        ) : countFailed ? (
          <span>student counts unavailable</span>
        ) : (
          <span className="tabular-nums">counting students…</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {actions.map(({ label, tail, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            onClick={() => push(tenantHref(tail))}
            className="h-9 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-medium shadow-2xs"
          >
            <Icon className="size-4 text-slate-400 dark:text-zinc-500" /> {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ClassStudents({ cls }: { cls: ClassInfo }) {
  const { currentTenantId } = useAppStore();
  const { canEdit, canDelete } = useModulePermissions("students");

  const [rows, setRows] = useState<RosterRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [reloadTick, setReloadTick] = useState(0);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => DEFAULT_VISIBLE);

  const [viewing, setViewing] = useState<StudentInfo | null>(null);
  // The profile tab is local here: the class URL already carries the class, and this
  // screen is not addressable per student, so there is nothing to put in the address bar.
  const [profileTab, setProfileTab] = useState<ProfileTabId>(DEFAULT_TAB);
  const [editing, setEditing] = useState<StudentInfo | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(emptyFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  const activeColumns = useMemo(
    () => ROSTER_COLUMNS.filter((c) => visibleCols.has(c.key)),
    [visibleCols],
  );

  useEffect(() => {
    if (!currentTenantId) return;
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      classId: cls.id,
      page: String(page),
      limit: String(itemsPerPage),
      sort,
      dir: sortDir,
    });
    if (search.trim()) params.set("search", search.trim());

    apiFetch(`/api/student-roster?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setRows(data.items ?? []);
        setTotalItems(data.totalItems ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoading(false);
        toast.error(err.message || "Failed to load the class roster");
      });

    return () => controller.abort();
  }, [currentTenantId, cls.id, search, sort, sortDir, page, itemsPerPage, reloadTick]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleSave = () => {
    if (!editing) return;
    if (!formData.name.trim() || !formData.rollNumber.trim() || !formData.classId) {
      toast.error("Name, Roll Number, and Class are required");
      return;
    }
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    toast.promise(
      (async () => {
        setSubmitting(true);
        try {
          const payload: Record<string, any> = {
            id: editing.id,
            name: formData.name.trim(),
            rollNumber: formData.rollNumber.trim(),
            classId: formData.classId,
            gender: formData.gender || "male",
            transportEnabled: Boolean(formData.transportEnabled),
          };
          if (formData.email?.trim()) payload.email = formData.email.trim();
          if (formData.phone?.trim()) payload.phone = formData.phone.trim();
          if (formData.dateOfBirth?.trim()) payload.dateOfBirth = formData.dateOfBirth.trim();
          if (formData.bloodGroup?.trim()) payload.bloodGroup = formData.bloodGroup.trim();
          if (formData.transportEnabled && formData.routeId?.trim()) {
            payload.routeId = formData.routeId.trim();
            if (formData.pickupPoint?.trim()) payload.pickupPoint = formData.pickupPoint.trim();
          }

          const res = await apiFetch("/api/students", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to update student");
          }
          setDialogOpen(false);
          reload();
          return "Student details updated";
        } finally {
          setSubmitting(false);
        }
      })(),
      {
        loading: "Updating student details...",
        success: (msg) => msg,
        error: (err: any) => err.message,
      },
    );
  };

  if (viewing) {
    return (
      <div className="space-y-6">
        <StudentProfileView
          studentRef={studentRefOf(viewing)}
          tab={profileTab}
          onTabChange={setProfileTab}
          onBack={() => setViewing(null)}
          backLabel="class roster"
          canEdit={canEdit}
          onEdit={() => {
            setViewing(null);
            setEditing(viewing);
            setFormData(toFormData(viewing));
            setDialogOpen(true);
          }}
        />
        <StudentDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) setDialogOpen(false);
          }}
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
          onSubmit={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          id="search_class_students"
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name..."
          delay={400}
          className="w-full sm:w-64"
          inputClassName="h-9 sm:h-10"
        />
        <div className="flex items-center gap-1 sm:ml-auto">
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 sm:w-40 h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title={sortDir === "asc" ? "Sorted A→Z — click for Z→A" : "Sorted Z→A — click for A→Z"}
          >
            <ArrowUpDown className="size-4 text-slate-500" />
          </Button>
          <ColumnsPopover visible={visibleCols} onChange={setVisibleCols} />
        </div>
      </div>

      {!canEdit && !canDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Read-only mode: you have view permission only for this module.
          </span>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <RosterTableSkeleton />
          ) : (
            <RosterTable
              rows={rows}
              columns={activeColumns}
              onView={(s) => {
                setProfileTab(DEFAULT_TAB);
                setViewing(s);
              }}
            />
          )}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onLimitChange={(limit) => {
              setItemsPerPage(limit);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false);
        }}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        onSubmit={handleSave}
      />
    </div>
  );
}
